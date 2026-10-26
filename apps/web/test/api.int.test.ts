import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BlockedResult, CreateRunCreated, HealthResponse, MeResponse, RunResponse } from '@dse/schema';
import { tables } from '@dse/pipeline/db';
import { CompositeMeter, decryptSecret, RedisBudgetMeter, RunJobData } from '@dse/pipeline/queue';
import { resolveViewer } from '../lib/entitlements';
import { POST as createRun } from '../app/api/runs/route';
import { GET as getRun } from '../app/api/runs/[id]/route';
import { POST as cancel } from '../app/api/runs/[id]/cancel/route';
import { GET as me } from '../app/api/me/route';
import { GET as health } from '../app/api/health/route';
import { POST as unpublish } from '../app/api/admin/runs/[id]/unpublish/route';
import { POST as showcaseRun } from '../app/api/admin/showcase/run/route';
import { POST as showcaseContent } from '../app/api/admin/showcase/content/route';
import { GET as exportRoute } from '../app/api/runs/[id]/export/[...format]/route';
import { ADMIN_TOKEN, params, request, startHarness, type Harness } from './helpers/harness';

// The pre-check and the routes, with no worker running: every created run stays queued.

const CLEAN = 'http://localhost:4100/sites/clean/';
const KEY = 'sk-ant-api03-test-key-0123456789abcdefghijklmnopqrstuvwxyz';
let h: Harness;
let ipSeq = 0;
const freshIp = () => `198.51.100.${++ipSeq}`;

const privateResolver = async (host: string) => (host === 'rebind.example.com' ? ['93.184.216.34', '10.0.0.7'] : host === 'public.example.com' ? ['93.184.216.34'] : []);

beforeAll(async () => {
  h = await startHarness({ resolver: privateResolver, env: { DSE_VISITOR_RUNS_PER_DAY: '2', DSE_GLOBAL_DAILY_BUDGET_USD: '2', DSE_WORST_CASE_RUN_USD: '0.6' } });
});

afterAll(async () => {
  await h.close();
});

beforeEach(async () => {
  await h.redis.flushdb();
  await h.db.delete(tables.runs);
});

async function post(body: unknown, init: Parameters<typeof request>[1] = {}) {
  const res = await createRun(request('/api/runs', { ...init, body }));
  return { res, json: res.status === 200 || res.status === 400 || res.status === 429 ? await res.json() : null };
}

const queuedRows = async () => (await h.db.select().from(tables.runs)).length;
const jobCount = async () => (await h.queue.getJobCounts('wait', 'prioritized', 'delayed', 'active')) as Record<string, number>;
const totalJobs = async () => Object.values(await jobCount()).reduce((a, b) => a + b, 0);

describe('POST /api/runs pre-check', () => {
  it('answers 400 with the validation line when the body fails the schema', async () => {
    for (const body of [{}, { url: 42 }, { url: CLEAN, extra: true }, { url: CLEAN, include: Array(6).fill(CLEAN) }]) {
      const { res, json } = await post(body, { ip: freshIp() });
      expect(res.status).toBe(400);
      expect(json).toEqual({ error: 'Something about that request was not right. Try again.' });
    }
    expect(await queuedRows()).toBe(0);
  });

  it('security · rate limits five per minute per IP with Retry-After', async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) expect((await post({ url: 'ftp://nope' }, { ip })).res.status).toBe(200);
    const { res, json } = await post({ url: CLEAN }, { ip });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect(Number(res.headers.get('retry-after'))).toBeLessThanOrEqual(60);
    expect(json).toEqual({ error: 'Too many requests. Try again in a minute.' });
    expect((await post({ url: 'ftp://nope' }, { ip: freshIp() })).res.status).toBe(200);
  });

  it('security · blocks invalid and private addresses before anything is enqueued or counted', async () => {
    const cases: [string, string][] = [
      ['ftp://example.com/', 'invalid-url'],
      ['https://user:pw@example.com/', 'invalid-url'],
      ['http://10.0.0.1/', 'private-address'],
      ['http://169.254.169.254/latest/meta-data/', 'private-address'],
      ['http://[::1]/', 'private-address'],
      ['http://localhost:8080/', 'private-address'],
      ['https://printer.local/', 'private-address'],
      ['https://public.example.com:8443/', 'private-address'],
      ['https://rebind.example.com/', 'private-address'],
      ['https://nowhere.example.com/', 'invalid-url'],
    ];
    for (const [url, reason] of cases) {
      const { res, json } = await post({ url }, { ip: freshIp() });
      expect(res.status, url).toBe(200);
      const blocked = BlockedResult.parse(json);
      expect(blocked.blocked, url).toBe(reason);
      expect(blocked.runsLeft).toBe(2);
    }
    expect(await queuedRows()).toBe(0);
    expect(await totalJobs()).toBe(0);
  });

  it('blocks added pages on another site', async () => {
    const { json } = await post({ url: CLEAN, include: ['https://public.example.com/pricing'] }, { ip: freshIp() });
    expect(BlockedResult.parse(json)).toMatchObject({ blocked: 'invalid-url', detail: { reason: 'an added page is on another site' } });
  });

  it('creates a queued run, counts it, reserves the worst case and sets the visitor cookie', async () => {
    const ip = freshIp();
    const { res, json } = await post({ url: CLEAN, include: ['http://localhost:4100/sites/clean/pricing/#x'] }, { ip });
    const created = CreateRunCreated.parse(json);
    expect(created.runsLeft).toBe(1);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toMatch(/^dse_v=[0-9A-Za-z_-]{16}; Path=\/; Max-Age=31536000; HttpOnly; SameSite=Lax$/);
    const [row] = await h.db.select().from(tables.runs);
    expect(row).toMatchObject({ id: created.id, status: 'queued', host: 'localhost:4100', pageCap: 12, byoKey: false, priority: 0, includeUrls: ['http://localhost:4100/sites/clean/pricing/'] });
    expect(new Date(row!.retentionUntil!).getTime() - new Date(row!.createdAt).getTime()).toBe(90 * 86_400_000);
    const job = await h.queue.getJob(created.id);
    expect(RunJobData.parse(job!.data)).toEqual({ runId: created.id, counted: { visitorKey: expect.stringContaining('cap:visitor:'), ipKey: expect.stringContaining('cap:ip:') } });
    expect((await h.counters.budget()).reservedCents).toBeCloseTo(60, 6);
    // A client that refuses cookies keeps the identity the cookie would have carried.
    const again = await post({ url: CLEAN }, { ip });
    expect(again.res.headers.get('set-cookie')).toBe(cookie);
    expect(CreateRunCreated.parse(again.json).runsLeft).toBe(0);
  });

  it('blocks a visitor at the cap with the run limit detail; nothing is enqueued', async () => {
    const ip = freshIp();
    const cookie = 'visitorAAAAAAAAA';
    for (let i = 0; i < 2; i++) CreateRunCreated.parse((await post({ url: CLEAN }, { ip, cookie })).json);
    const before = await totalJobs();
    const blocked = BlockedResult.parse((await post({ url: CLEAN }, { ip, cookie })).json);
    expect(blocked).toMatchObject({ blocked: 'visitor-cap', detail: { used: 2, budget: 2, runsToday: 2 }, runsLeft: 0 });
    expect(await totalJobs()).toBe(before);
    expect((await h.counters.counts(cookie, resolveViewer(request('/', { ip, cookie }), h.encryptionKey).ipHash)).visitor).toBe(2);
  });

  it('counts a shared address up to six across visitors', async () => {
    const ip = freshIp();
    const ipHash = resolveViewer(request('/', { ip }), h.encryptionKey).ipHash;
    for (let i = 0; i < 5; i++) await h.counters.count(`visitor${i}AAAAAAAAA`.slice(0, 16), ipHash);
    CreateRunCreated.parse((await post({ url: CLEAN }, { ip, cookie: 'visitorYYYYYYYYY' })).json);
    expect(BlockedResult.parse((await post({ url: CLEAN }, { ip, cookie: 'visitorZZZZZZZZZ' })).json)).toMatchObject({ blocked: 'visitor-cap', runsLeft: 0 });
  });

  it('blocks on the budget before enqueue: spent plus reserved plus a worst case must fit', async () => {
    await h.counters.addSpend(1.45);
    const blocked = BlockedResult.parse((await post({ url: CLEAN }, { ip: freshIp() })).json);
    expect(blocked.blocked).toBe('budget');
    expect(blocked.detail).toMatchObject({ used: 1.45, budget: 2, runsToday: 0 });
    expect(await queuedRows()).toBe(0);
    expect(await totalJobs()).toBe(0);
    // 1.40 spent + 0.60 worst case is exactly the budget: allowed, and its reservation then blocks the next.
    await h.redis.flushdb();
    await h.counters.addSpend(1.4);
    CreateRunCreated.parse((await post({ url: CLEAN }, { ip: freshIp() })).json);
    expect(BlockedResult.parse((await post({ url: CLEAN }, { ip: freshIp() })).json).blocked).toBe('budget');
  });

  it('lets a BYO key past the budget and the visitor cap, sealing the key in the job', async () => {
    const ip = freshIp();
    const cookie = 'visitorBBBBBBBBB';
    for (let i = 0; i < 2; i++) CreateRunCreated.parse((await post({ url: CLEAN }, { ip, cookie })).json);
    await h.counters.addSpend(5);
    const created = CreateRunCreated.parse((await post({ url: CLEAN }, { ip, cookie, key: KEY })).json);
    expect(created.runsLeft).toBeNull();
    const row = (await h.db.select().from(tables.runs)).find((r) => r.id === created.id)!;
    expect(row).toMatchObject({ byoKey: true, pageCap: 40 });
    const data = RunJobData.parse((await h.queue.getJob(created.id))!.data);
    expect(data.counted).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain(KEY);
    expect(decryptSecret(data.byoKeyCiphertext!, h.encryptionKey)).toBe(KEY);
    expect(JSON.stringify(row)).not.toContain(KEY);
    // A malformed key is ignored: the caps apply as without one.
    expect(BlockedResult.parse((await post({ url: CLEAN }, { ip, cookie, key: 'not-a-key' })).json).blocked).toBe('visitor-cap');
  });

  it('blocks everyone, key or not, when more than twenty runs are queued', async () => {
    for (let i = 0; i < 21; i++) CreateRunCreated.parse((await post({ url: CLEAN }, { ip: freshIp(), key: KEY })).json);
    for (const key of [undefined, KEY]) {
      const blocked = BlockedResult.parse((await post({ url: CLEAN }, { ip: freshIp(), key })).json);
      expect(blocked).toMatchObject({ blocked: 'busy', detail: { queued: 21 } });
    }
  });
});

describe('the budget meter', () => {
  it('adds each model call to the day in fractional cents, behind every meter that must allow it', async () => {
    const meter = new CompositeMeter([new RedisBudgetMeter(h.counters)]);
    expect(await meter.allowLive()).toEqual({ ok: true });
    await meter.add(0.0123, 'colors');
    await meter.add(0.0004, 'select');
    expect((await h.counters.budget()).usedCents).toBeCloseTo(1.27, 9);
    const refusing = new CompositeMeter([new RedisBudgetMeter(h.counters), { allowLive: async () => ({ ok: false, reason: 'cap' }), add: async () => {} }]);
    expect(await refusing.allowLive()).toEqual({ ok: false, reason: 'cap' });
  });
});

describe('GET /api/runs/{id} while queued', () => {
  it('serves the queued document with queuePosition, no-store and an ETag', async () => {
    const a = CreateRunCreated.parse((await post({ url: CLEAN }, { ip: freshIp() })).json);
    const b = CreateRunCreated.parse((await post({ url: CLEAN }, { ip: freshIp() })).json);
    const res = await getRun(request(`/api/runs/${b.id}`), params({ id: b.id }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = RunResponse.parse(await res.json());
    expect(body).toMatchObject({ id: b.id, status: 'queued', isShowcase: false, queuePosition: 1, events: [] });
    expect(RunResponse.parse(await (await getRun(request(`/api/runs/${a.id}`), params({ id: a.id }))).json()).queuePosition).toBe(0);
    const etag = res.headers.get('etag')!;
    const again = await getRun(request(`/api/runs/${b.id}`, { headers: { 'if-none-match': etag } }), params({ id: b.id }));
    expect(again.status).toBe(304);
  });

  it('answers 404 for an unknown or malformed id', async () => {
    for (const id of ['zzzzzzzzzz', '../../etc', 'ABCDEFGHIJ']) expect((await getRun(request(`/api/runs/${id}`), params({ id }))).status).toBe(404);
  });

  it('has no exports until the run has tokens', async () => {
    const a = CreateRunCreated.parse((await post({ url: CLEAN }, { ip: freshIp() })).json);
    expect((await exportRoute(request(`/api/runs/${a.id}/export/tokens.css`), params({ id: a.id, format: ['tokens.css'] }))).status).toBe(409);
  });
});

describe('POST /api/runs/{id}/cancel on a queued run', () => {
  it('cancels from the creating browser only, takes the job off the queue and refunds', async () => {
    const ip = freshIp();
    const cookie = 'visitorCCCCCCCCC';
    const created = CreateRunCreated.parse((await post({ url: CLEAN }, { ip, cookie })).json);
    const other = await cancel(request(`/api/runs/${created.id}/cancel`, { method: 'POST', ip, cookie: 'visitorDDDDDDDDD' }), params({ id: created.id }));
    expect(other.status).toBe(403);
    const res = await cancel(request(`/api/runs/${created.id}/cancel`, { method: 'POST', ip, cookie }), params({ id: created.id }));
    expect(await res.json()).toEqual({ id: created.id, status: 'cancelled' });
    expect(await h.queue.getJob(created.id)).toBeUndefined();
    const body = RunResponse.parse(await (await getRun(request(`/api/runs/${created.id}`), params({ id: created.id }))).json());
    expect(body.status).toBe('cancelled');
    expect(body.events.map((e) => e.message)).toEqual(['done · cancelled']);
    const meRes = MeResponse.parse(await (await me(request('/api/me', { ip, cookie }))).json());
    expect(meRes.runsLeft).toBe(2);
    expect((await h.counters.budget()).reservedCents).toBeCloseTo(0, 6);
    expect((await cancel(request(`/api/runs/${created.id}/cancel`, { method: 'POST', ip, cookie }), params({ id: created.id }))).status).toBe(409);
  });
});

describe('GET /api/me and /api/health', () => {
  it('reports the visitor allowance and when it resets', async () => {
    const ip = freshIp();
    CreateRunCreated.parse((await post({ url: CLEAN }, { ip, cookie: 'visitorEEEEEEEEE' })).json);
    const body = MeResponse.parse(await (await me(request('/api/me', { ip, cookie: 'visitorEEEEEEEEE' }))).json());
    expect(body.runsLeft).toBe(1);
    expect(body.runsPerDay).toBe(2);
    expect(Date.parse(body.resetsAt)).toBeGreaterThan(Date.now());
  });

  it('reports the worker alive only with a fresh heartbeat, and the queue and the budget', async () => {
    CreateRunCreated.parse((await post({ url: CLEAN }, { ip: freshIp() })).json);
    let body = HealthResponse.parse(await (await health()).json());
    expect(body).toMatchObject({ ok: true, worker: { alive: false, queueDepth: 1 }, budget: { remaining: 1.4 } });
    await h.counters.heartbeat(new Date(Date.now() - 50_000));
    expect(HealthResponse.parse(await (await health()).json()).worker.alive).toBe(false);
    await h.counters.heartbeat();
    body = HealthResponse.parse(await (await health()).json());
    expect(body.worker.alive).toBe(true);
  });
});

describe('admin routes', () => {
  const admin = { authorization: `Bearer ${ADMIN_TOKEN}` };

  it('security · refuse requests without the token', async () => {
    for (const headers of [{}, { authorization: 'Bearer wrong' }, { authorization: ADMIN_TOKEN }] as Record<string, string>[]) {
      expect((await showcaseRun(request('/api/admin/showcase/run', { body: { url: CLEAN }, headers }))).status).toBe(401);
      expect((await showcaseContent(request('/api/admin/showcase/content', { body: {}, headers }))).status).toBe(401);
      expect((await unpublish(request('/api/admin/runs/zzzzzzzzzz/unpublish', { method: 'POST', headers }), params({ id: 'zzzzzzzzzz' }))).status).toBe(401);
    }
  });

  it('enqueues a showcase run at priority 10, past the budget, and unpublishes a run to 404', async () => {
    await h.counters.addSpend(5);
    const res = await showcaseRun(request('/api/admin/showcase/run', { body: { url: CLEAN }, headers: admin }));
    const created = CreateRunCreated.parse(await res.json());
    const row = (await h.db.select().from(tables.runs))[0]!;
    expect(row).toMatchObject({ id: created.id, priority: 10, retentionUntil: null });
    const job = await h.queue.getJob(created.id);
    expect(job!.opts.priority).toBe(90);
    const un = await unpublish(request(`/api/admin/runs/${created.id}/unpublish`, { method: 'POST', headers: admin }), params({ id: created.id }));
    expect(un.status).toBe(200);
    expect((await getRun(request(`/api/runs/${created.id}`), params({ id: created.id }))).status).toBe(404);
  });

  it('stores valid showcase content and refuses the rest', async () => {
    const content = { generatedAt: '2026-10-26T00:00:00.000Z', appUrl: 'https://design-system-extractor.vercel.app', entries: [] };
    expect((await showcaseContent(request('/api/admin/showcase/content', { body: { nope: 1 }, headers: admin }))).status).toBe(400);
    const res = await showcaseContent(request('/api/admin/showcase/content', { body: content, headers: admin }));
    expect(await res.json()).toEqual({ stored: 'showcase/showcase.json', entries: 0, removed: 0 });
    expect(JSON.parse((await h.storage.get('showcase/showcase.json'))!.toString())).toEqual(content);
  });

  it('lists exactly the content runs, takes the rest out, and refuses a run that is not complete', async () => {
    const doc = (id: string) => ({ id, url: CLEAN, host: 'localhost:4100', status: 'complete', createdAt: '2026-01-01T00:00:00.000Z', pipelineVersion: '1.0.0', viewports: ['desktop'] });
    const base = { url: CLEAN, host: 'localhost:4100', status: 'complete' as const, visitorId: 'visitorSHOWCASE', pageCap: 12, pipelineVersion: '1.0.0' };
    await h.db.insert(tables.runs).values([
      { ...base, id: 'listnew001', document: doc('listnew001'), retentionUntil: '2027-01-01T00:00:00.000Z' },
      { ...base, id: 'liststale1', document: doc('liststale1'), retentionUntil: null, isShowcase: true },
      { ...base, id: 'listopen01', document: { ...doc('listopen01'), status: 'running' }, status: 'running' as const },
    ]);
    const entry = (runId: string) => ({ runId, url: `https://design-system-extractor.vercel.app/r/${runId}`, host: 'localhost:4100', name: 'Tidewater', category: 'SaaS', order: 1, stats: { colors: 9, typeStyles: 9, spacingSteps: 11, components: 27, checksPassed: 43, checksApplicable: 45 }, palette: [{ value: '#0B1F3A', share: 1 }] });
    const content = (ids: string[]) => ({ generatedAt: '2026-10-26T00:00:00.000Z', appUrl: 'https://design-system-extractor.vercel.app', entries: ids.map(entry) });

    const refused = await showcaseContent(request('/api/admin/showcase/content', { body: content(['listnew001', 'listopen01']), headers: admin }));
    expect(refused.status).toBe(400);
    const listing = async () => Object.fromEntries((await h.db.select().from(tables.runs)).map((r) => [r.id, { isShowcase: r.isShowcase, kept: r.retentionUntil === null }]));
    expect(await listing()).toMatchObject({ listnew001: { isShowcase: false, kept: false }, liststale1: { isShowcase: true, kept: true } });

    const res = await showcaseContent(request('/api/admin/showcase/content', { body: content(['listnew001']), headers: admin }));
    expect(await res.json()).toEqual({ stored: 'showcase/showcase.json', entries: 1, removed: 1 });
    expect(await listing()).toMatchObject({ listnew001: { isShowcase: true, kept: true }, liststale1: { isShowcase: false, kept: false } });
  });
});
