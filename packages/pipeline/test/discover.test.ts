import { mkdtempSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Page } from 'playwright';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { LocalStorage, MemoryRunContext } from '../src/context';
import type { RunBrowserContext } from '../src/crawl/browser';
import { classLists, darkThemeScan, dismissConsent, extractLinks, titleAndH1, type FoundLink } from '../src/crawl/page-scripts';
import type { Throttle } from '../src/crawl/throttle';
import { BlockedError } from '../src/errors';
import { ModelClient } from '../src/models/client';
import { CANDIDATE_CAP, discover, FINGERPRINT_CAP, SITEMAP_URL_CAP } from '../src/stages/discover';
import { select } from '../src/stages/select';

// Discovery against a local site, with the browser's start page stood in by a fake page.

type Route = { status?: number; type?: string; body: string };
let server: Server;
let origin = '';
let port = 0;
let routes: Record<string, Route> = {};
let fetched: string[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    fetched.push(path);
    const r = routes[path] ?? (path.endsWith('-does-not-exist') ? routes['*404'] : undefined) ?? { status: 404, body: '<html><body><main><p>Nothing at this address.</p></main></body></html>' };
    res.writeHead(r.status ?? 200, { 'content-type': r.type ?? 'text/html' }).end(r.body);
  });
  await new Promise<void>((r) => server.listen(0, r));
  port = (server.address() as AddressInfo).port;
  origin = `http://localhost:${port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));
beforeEach(() => {
  routes = {};
  fetched = [];
});

const passThrough = { run: (_host: string, fn: () => Promise<unknown>) => fn(), setInterval: () => {} } as unknown as Throttle;

function fakeBrowser(links: FoundLink[], opts: { goto?: () => Promise<unknown>; refused?: RunBrowserContext['refused']; url?: () => string } = {}): RunBrowserContext {
  const html = '<html><head><title>Home</title></head><body><header><nav></nav></header><main><h1>Home</h1></main></body></html>';
  const answers = new Map<unknown, unknown>([
    [extractLinks, links],
    [titleAndH1, { title: 'Home', h1: 'Home' }],
    [classLists, []],
    [darkThemeScan, { found: false, crossOrigin: [] }],
    [dismissConsent, null],
  ]);
  const page = {
    setViewportSize: async () => {},
    setDefaultTimeout: () => {},
    goto: opts.goto ?? (async () => ({ status: () => 200, text: async () => html, request: () => ({ redirectedFrom: () => null }) })),
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    evaluate: async (fn: unknown) => (answers.has(fn) ? answers.get(fn) : true),
    url: opts.url ?? (() => `${origin}/`),
    content: async () => html,
  } as unknown as Page;
  return { context: { newPage: async () => page } as unknown as RunBrowserContext['context'], refused: opts.refused ?? [], close: async () => {} };
}

function ctx(startedAt?: string) {
  const dir = mkdtempSync(join(tmpdir(), 'dse-discover-'));
  const url = `${origin}/`;
  return new MemoryRunContext(
    'discovert1',
    { url, include: [], pageCap: 12, viewports: ['desktop'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [`localhost:${port}`], timeoutMs: 360_000, keepIntermediate: false, byo: false },
    new ModelClient({ mode: 'replay', recordingsDir: dir }),
    new LocalStorage(dir),
    { id: 'discovert1', url, host: `localhost:${port}`, status: 'running', createdAt: new Date().toISOString(), startedAt, pipelineVersion: '1.0.0', viewports: ['desktop'] },
  );
}

const sitemap = (locs: string[]) => ({ type: 'application/xml', body: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs.map((l) => `<url><loc>${l}</loc></url>`).join('')}</urlset>` });
const link = (href: string, where: FoundLink['where'] = 'body'): FoundLink => ({ href, where });
const run = (links: FoundLink[], sleep?: (ms: number) => Promise<void>, browser = fakeBrowser(links)) => discover(ctx(), { browser, throttle: passThrough, sleep });

describe('sitemaps and the candidate cap', () => {
  it('reads 2,000 sitemap URLs, keeps same-host ones, caps at 300 by source then shortest path, and fingerprints 60', async () => {
    const offHost = Array.from({ length: 50 }, (_, i) => `https://elsewhere.example/x${i}`);
    const own = Array.from({ length: 2050 }, (_, i) => `${origin}/p${i}`);
    routes['/sitemap.xml'] = sitemap([...offHost, ...own]);
    const header = [1, 2, 3].map((n) => link(`/a-much-longer-header-path-${n}`, 'header'));
    const out = await run([...header, link('/b')]);

    expect(out.sitemapUrls).toBe(SITEMAP_URL_CAP);
    const paths = out.candidates.map((c) => c.path);
    expect(paths).toHaveLength(CANDIDATE_CAP);
    expect(paths.filter((p) => p.startsWith('/a-much-longer'))).toHaveLength(3);
    expect(paths).toContain('/');
    // The synthetic missing page is always kept; sitemap outranks body; among sitemap URLs the 295 shortest stay.
    expect(out.candidates.filter((c) => c.source === 'synthetic')).toHaveLength(1);
    expect(paths).not.toContain('/b');
    expect(paths).toEqual(expect.arrayContaining(['/p0', '/p99', '/p294']));
    expect(paths).not.toContain('/p295');
    expect(paths.some((p) => p.startsWith('/p1000'))).toBe(false);
    expect(out.candidates.some((c) => c.url.includes('elsewhere'))).toBe(false);
    // Once 2,000 URLs are read, the other sitemap names are not even fetched.
    expect(fetched).not.toContain('/sitemap_index.xml');
    const pageFetches = fetched.filter((p) => /^\/(p\d|a-much|b$)/.test(p));
    expect(pageFetches.length).toBeLessThanOrEqual(FINGERPRINT_CAP);
    expect(pageFetches.length).toBeGreaterThan(0);
  });
});

describe('candidate rules', () => {
  it('keeps a query only when its path is new and drops every path robots.txt disallows', async () => {
    routes['/robots.txt'] = { type: 'text/plain', body: 'User-agent: *\nDisallow: /secret\n' };
    routes['/sitemap.xml'] = sitemap([`${origin}/secret/from-sitemap`, `${origin}/plans`]);
    const out = await run([link('/pricing', 'header'), link('/pricing?plan=pro', 'header'), link('/search?q=shoes'), link('/secret', 'nav'), link('/secret/deeper')]);
    const paths = out.candidates.map((c) => c.path);
    expect(paths).toEqual(expect.arrayContaining(['/', '/pricing', '/search?q=shoes', '/plans']));
    expect(paths).not.toContain('/pricing?plan=pro');
    expect(paths.filter((p) => p.startsWith('/secret'))).toEqual([]);
    expect(fetched.filter((p) => p.startsWith('/secret'))).toEqual([]);
  });

  it('groups /blog/{slug} at 10 or more members, /docs/{anything} and /products/{slug} by path', async () => {
    const blog = Array.from({ length: 10 }, (_, i) => link(`/blog/post-${i}`));
    const news = Array.from({ length: 9 }, (_, i) => link(`/news/item-${i}`));
    const out = await run([...blog, ...news, link('/docs/start/install'), link('/docs/api'), link('/products/kettle'), link('/products/teapot')]);
    const group = (name: string) => out.candidates.filter((c) => c.templateGroup === name);
    expect(group('blog').map((c) => c.templateSize)).toEqual([10]);
    expect(group('docs').map((c) => c.templateSize)).toEqual([2]);
    expect(group('products').map((c) => c.templateSize)).toEqual([2]);
    expect(out.candidates.filter((c) => c.path.startsWith('/news/'))).toHaveLength(9);
    expect(group('news')).toEqual([]);
  });

  it('stops fingerprinting at its share of the time budget and groups the rest by path only', async () => {
    const late = ctx(new Date(Date.now() - 360_000 * 0.2).toISOString());
    const blog = Array.from({ length: 12 }, (_, i) => link(`/blog/post-${i}`));
    const out = await discover(late, { browser: fakeBrowser([...blog, link('/pricing', 'header')]), throttle: passThrough });
    expect(fetched.filter((p) => p.startsWith('/blog') || p === '/pricing')).toEqual([]);
    expect(out.candidates.find((c) => c.templateGroup === 'blog')?.templateSize).toBe(12);
    expect(late.events.map((e) => e.message)).toContain('crawl · fingerprints · 0 of 14 fetched in the time budget · the rest grouped by path');
  });
});

describe('the synthetic missing page', () => {
  const synthetic = async (route: Route) => {
    routes['*404'] = route;
    const out = await run([link('/pricing', 'header')]);
    return out.candidates.find((c) => c.source === 'synthetic');
  };

  it('keeps it when the site answers 404 or a soft-404 page', async () => {
    expect(await synthetic({ status: 404, body: '<html><body><h1>Gone</h1></body></html>' })).toMatchObject({ reason: 'empty-state', fetchFailed: false });
    expect(await synthetic({ status: 200, body: '<html><body><h1>Sorry, that page does not exist</h1></body></html>' })).toMatchObject({ reason: 'empty-state' });
  });

  it('drops it when the site answers like a real page or not with HTML', async () => {
    expect(await synthetic({ status: 200, body: '<html><body><h1>Welcome to our store</h1></body></html>' })).toBeUndefined();
    expect(await synthetic({ status: 404, type: 'application/json', body: '{"error":"missing"}' })).toBeUndefined();
  });
});

describe('the start page', () => {
  it('retries a network failure after 1 s, 3 s and 8 s, then blocks as unreachable', async () => {
    const slept: number[] = [];
    let tries = 0;
    const browser = fakeBrowser([], {
      goto: async () => {
        tries++;
        throw new Error('net::ERR_CONNECTION_REFUSED at http://localhost');
      },
    });
    const err = await run([], async (ms) => void slept.push(ms), browser).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BlockedError);
    expect((err as BlockedError).reason).toBe('unreachable');
    expect(slept).toEqual([1000, 3000, 8000]);
    expect(tries).toBe(4);
  });

  it('never retries a 4xx start page', async () => {
    const slept: number[] = [];
    let tries = 0;
    const browser = fakeBrowser([], {
      goto: async () => {
        tries++;
        return { status: () => 404, text: async () => '<html><body><h1>Missing</h1></body></html>', request: () => ({ redirectedFrom: () => null }) };
      },
    });
    await run([], async (ms) => void slept.push(ms), browser);
    expect([tries, slept]).toEqual([1, []]);
  });

  it('blocks with private-address when the start page redirected to a private address', async () => {
    const browser = fakeBrowser([], {
      goto: async () => {
        throw new Error('net::ERR_BLOCKED_BY_CLIENT');
      },
      refused: [{ url: 'http://10.0.0.1/', reason: 'private-address' }],
    });
    const err = await run([], async () => {}, browser).catch((e: unknown) => e);
    expect((err as BlockedError).reason).toBe('private-address');
  });
});

describe('hash routers', () => {
  it('detects a hash router from its links and selects home only', async () => {
    const c = ctx();
    const out = await discover(c, { browser: fakeBrowser([link('#/pricing', 'nav'), link('#/docs', 'nav'), link('#/about', 'nav'), link('/real')]), throttle: passThrough });
    expect(out.hashRouter).toBe(true);
    const picked = await select(c, out);
    expect(picked.pages.map((p) => p.path)).toEqual(['/']);
    expect(c.events.map((e) => e.message)).toContain('select · hash router, home only');
  });
});

describe('a redirect to the same site with www.', () => {
  it('is followed and the www. host becomes the canonical origin of every candidate', async () => {
    const www = `http://www.localhost:${port}`;
    const instant = async () => {};
    const out = await run([link('/pricing', 'header'), link('/docs')], instant, fakeBrowser([link('/pricing', 'header'), link('/docs')], { url: () => `${www}/` }));
    const urls = out.candidates.filter((c) => c.source !== 'synthetic').map((c) => c.url);
    expect(urls.length).toBeGreaterThan(1);
    expect(urls.every((u) => u.startsWith(`${www}/`))).toBe(true);
  });
});

