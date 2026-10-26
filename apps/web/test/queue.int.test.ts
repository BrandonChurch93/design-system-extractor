import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateRunCreated, MeResponse, RunDocumentComplete, RunResponse } from '@dse/schema';
import { tables } from '@dse/pipeline/db';
import { loadRun } from '../../../packages/mcp/src/index';
import { POST as createRun } from '../app/api/runs/route';
import { GET as getRun } from '../app/api/runs/[id]/route';
import { POST as cancel } from '../app/api/runs/[id]/cancel/route';
import { GET as me } from '../app/api/me/route';
import { GET as exportRoute } from '../app/api/runs/[id]/export/[...format]/route';
import { GET as capture } from '../app/api/runs/[id]/pages/[pageId]/capture/route';
import { GET as og } from '../app/api/runs/[id]/og/route';
import { ensureFixtureServer, params, request, SITES_PORT, startBlockingSites, startHarness, until, type Harness } from './helpers/harness';

// Runs through the queue: the route enqueues, the worker takes the job, the poller reads the row.

const CLEAN = 'http://localhost:4100/sites/clean/';
let h: Harness;
let fixtures: { close(): void } | null;
let sites: Server;

beforeAll(async () => {
  fixtures = await ensureFixtureServer();
  sites = await startBlockingSites();
  h = await startHarness({ env: { DSE_VISITOR_RUNS_PER_DAY: '2' } });
  h.startWorker();
}, 120_000);

afterAll(async () => {
  await h?.close();
  fixtures?.close();
  sites?.close();
});

async function post(url: string, init: { ip: string; cookie: string }) {
  return CreateRunCreated.parse(await (await createRun(request('/api/runs', { ...init, body: { url } }))).json());
}

async function poll(id: string): Promise<{ res: Response; body: RunResponse }> {
  const res = await getRun(request(`/api/runs/${id}`), params({ id }));
  return { res, body: RunResponse.parse(await res.json()) };
}

const terminal = (s: string) => ['complete', 'blocked', 'failed', 'cancelled'].includes(s);

describe('a fixture run through the queue', () => {
  let id: string;
  const seen: { status: string; tokens: boolean; components: boolean }[] = [];
  let last: RunResponse;

  beforeAll(async () => {
    ({ id } = await post(CLEAN, { ip: '203.0.113.50', cookie: 'visitorQQQQQQQQQ' }));
    last = await until(
      async () => {
        const { res, body } = await poll(id);
        seen.push({ status: body.status, tokens: Boolean(body.document.tokens?.colors), components: Boolean(body.document.components) });
        if (!terminal(body.status)) expect(res.headers.get('cache-control')).toBe('no-store');
        return terminal(body.status) ? body : null;
      },
      300_000,
      200,
    );
  }, 320_000);

  it('goes from queued or running to complete with a document that validates', () => {
    expect(last.status).toBe('complete');
    const doc = RunDocumentComplete.parse(last.document);
    expect(doc.components.length).toBeGreaterThan(10);
    expect(doc.stats).toMatchObject({ colors: 9, typeStyles: 9 });
    expect(seen.some((s) => s.status === 'running')).toBe(true);
  });

  it('serves partial documents mid-run: tokens land before components', () => {
    const firstTokens = seen.findIndex((s) => s.tokens);
    const firstComponents = seen.findIndex((s) => s.components);
    expect(firstTokens).toBeGreaterThan(-1);
    expect(firstComponents).toBeGreaterThan(firstTokens);
    expect(seen.some((s) => s.status === 'running' && s.tokens && !s.components)).toBe(true);
  });

  it('mirrors the document into the row and the page table, and logs every stage', async () => {
    const [row] = await h.db.select().from(tables.runs);
    expect(row).toMatchObject({ status: 'complete', stats: last.document.stats, frameworkHint: null });
    expect(row!.durationMs).toBeGreaterThan(0);
    const pages = await h.db.select().from(tables.runPages);
    expect(pages.map((p) => p.id).sort()).toEqual((last.document.pages ?? []).map((p) => p.id).sort());
    expect(pages.every((p) => p.status === 'captured' && p.captureDesktopKey)).toBe(true);
    expect([...new Set(last.events.map((e) => e.stage))]).toEqual(['queue', 'discover', 'select', 'capture', 'tokens', 'components', 'previews', 'checks', 'drift', 'exports', 'done']);
  });

  it('caches the finished run publicly and answers 304 to its ETag', async () => {
    const { res } = await poll(id);
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600, stale-while-revalidate=86400');
    const again = await getRun(request(`/api/runs/${id}`, { headers: { 'if-none-match': res.headers.get('etag')! } }), params({ id }));
    expect(again.status).toBe(304);
  });

  it('keeps the visitor count spent and releases the reservation', async () => {
    const left = MeResponse.parse(await (await me(request('/api/me', { ip: '203.0.113.50', cookie: 'visitorQQQQQQQQQ' }))).json());
    expect(left.runsLeft).toBe(1);
    expect((await h.counters.budget()).reservedCents).toBeCloseTo(0, 6);
  });

  it('serves every export, a component prompt and the zip', async () => {
    for (const f of ['tokens.css', 'tokens.json', 'tailwind.tokens.js', 'tokens.w3c.json', 'design-system.md', 'prompt.md']) {
      const res = await exportRoute(request(`/api/runs/${id}/export/${f}`), params({ id, format: [f] }));
      expect(res.status, f).toBe(200);
      expect(res.headers.get('content-disposition')).toBe(`attachment; filename="${f}"`);
      expect((await res.text()).length).toBeGreaterThan(100);
    }
    const raw = await exportRoute(request(`/api/runs/${id}/export/tokens.css?set=raw`), params({ id, format: ['tokens.css'] }));
    expect(await raw.text()).toContain('raw set');
    const cid = last.document.components![0]!.id;
    const comp = await exportRoute(request(`/api/runs/${id}/export/component/${cid}/prompt.md`), params({ id, format: ['component', cid, 'prompt.md'] }));
    expect(comp.status).toBe(200);
    expect(await comp.text()).toContain(`Source: http://localhost:3000/r/${id}`);
    const zip = await exportRoute(request(`/api/runs/${id}/export/all.zip`), params({ id, format: ['all.zip'] }));
    expect(zip.headers.get('content-type')).toBe('application/zip');
    expect(Buffer.from(await zip.arrayBuffer()).subarray(0, 2).toString()).toBe('PK');
    expect((await exportRoute(request(`/api/runs/${id}/export/nope.txt`), params({ id, format: ['nope.txt'] }))).status).toBe(404);
  });

  it('redirects a page capture to its stored image', async () => {
    const page = last.document.pages![0]!;
    const res = await capture(request(`/api/runs/${id}/pages/${page.id}/capture?viewport=mobile`), params({ id, pageId: page.id }));
    expect(res.status).toBe(302);
    const img = await fetch(res.headers.get('location')!);
    expect(img.headers.get('content-type')).toBe('image/png');
  });

  it('draws the Open Graph image once and keeps it', async () => {
    const res = await og(request(`/api/runs/${id}/og`), params({ id }));
    expect(res.headers.get('content-type')).toBe('image/png');
    const png = Buffer.from(await res.arrayBuffer());
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    expect(await h.storage.get(`runs/${id}/og.png`)).not.toBeNull();
  });

  it('is what the MCP server loads with --run', async () => {
    const server = createServer(async (req, res) => {
      const m = /^\/api\/runs\/([0-9a-z]{10})$/.exec(req.url ?? '');
      if (!m) return void res.writeHead(404).end();
      const r = await getRun(new Request(`http://localhost${req.url}`), params({ id: m[1]! }));
      res.writeHead(r.status, Object.fromEntries(r.headers)).end(Buffer.from(await r.arrayBuffer()));
    });
    await new Promise<void>((ok) => server.listen(4412, ok));
    try {
      const { doc, runUrl } = await loadRun(['--run', id, '--app-url', 'http://localhost:4412']);
      expect(runUrl).toBe(`http://localhost:4412/r/${id}`);
      expect(doc.components).toHaveLength(last.document.components!.length);
    } finally {
      server.close();
    }
  });
});

describe('runs that end early', () => {
  it('a login wall ends blocked: login with a one-page document, and gives the run back', async () => {
    const who = { ip: '203.0.113.51', cookie: 'visitorLLLLLLLLL' };
    const { id } = await post(`http://localhost:${SITES_PORT}/walled/`, who);
    const body = await until(async () => {
      const b = (await poll(id)).body;
      return terminal(b.status) ? b : null;
    });
    expect(body.status).toBe('blocked');
    expect(body.document.blockedReason).toBe('login');
    expect(body.document.pages).toHaveLength(1);
    expect(body.document.blockedDetail).toMatchObject({ redirectedTo: expect.stringContaining('/walled/login') });
    expect(body.document.tokens?.colors?.length).toBeGreaterThan(0);
    expect(body.document.components).toBeDefined();
    expect(MeResponse.parse(await (await me(request('/api/me', who))).json()).runsLeft).toBe(2);
  });

  it('a site that blocks the crawler refunds the visitor, who can run again at the cap', async () => {
    const who = { ip: '203.0.113.52', cookie: 'visitorBOTBOTBOT' };
    const { id } = await post(`http://localhost:${SITES_PORT}/bot/`, who);
    const body = await until(async () => {
      const b = (await poll(id)).body;
      return terminal(b.status) ? b : null;
    });
    expect(body.status).toBe('blocked');
    expect(body.document.blockedReason).toBe('bot');
    expect(MeResponse.parse(await (await me(request('/api/me', who))).json()).runsLeft).toBe(2);
  });

  it('cancelling a running run stops it between pages and refunds it', async () => {
    const who = { ip: '203.0.113.53', cookie: 'visitorCANCELCAN' };
    const { id } = await post(CLEAN, who);
    await until(async () => {
      const b = (await poll(id)).body;
      return b.status === 'running' && b.events.some((e) => e.stage === 'select');
    });
    const res = await cancel(request(`/api/runs/${id}/cancel`, { method: 'POST', ...who }), params({ id }));
    expect(await res.json()).toEqual({ id, status: 'cancelling' });
    const body = await until(async () => {
      const b = (await poll(id)).body;
      return terminal(b.status) ? b : null;
    });
    expect(body.status).toBe('cancelled');
    expect(body.document.components).toBeUndefined();
    expect(MeResponse.parse(await (await me(request('/api/me', who))).json()).runsLeft).toBe(2);
    expect(await h.redis.exists(`cancel:${id}`)).toBe(0);
  });
});
