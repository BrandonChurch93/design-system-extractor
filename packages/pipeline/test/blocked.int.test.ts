import { mkdtempSync, readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { launchBrowser } from '../src/crawl/browser';
import { ModelClient } from '../src/models/client';
import { runPipeline } from '../src/run';

// A server that answers like sites that block, wall or refuse the crawler, with recorded bodies.
const port = 4199;
const recorded = (f: string) => readFileSync(resolve(import.meta.dirname, 'fixtures/blocked', f), 'utf8');
let server: Server;
let browser: Browser;
const hits: string[] = [];

function serve() {
  return createServer((req, res) => {
    const path = new URL(req.url ?? '/', `http://localhost:${port}`).pathname;
    hits.push(path);
    if (path === '/robots.txt') {
      res.writeHead(200, { 'content-type': 'text/plain' }).end('User-agent: *\nDisallow: /robots-site/\n');
      return;
    }
    if (path === '/bot' || path.startsWith('/bot/')) {
      res.writeHead(403, { 'content-type': 'text/html' }).end(recorded('cloudflare-403.html'));
      return;
    }
    if (path === '/walled' || path.startsWith('/walled/')) {
      if (path === '/walled/login') {
        res.writeHead(200, { 'content-type': 'text/html' }).end(recorded('login.html').replaceAll('href="/', 'href="/walled/'));
        return;
      }
      res.writeHead(302, { location: `/walled/login?next=${encodeURIComponent(path)}` }).end();
      return;
    }
    if (path === '/offsite' || path === '/offsite/') {
      res.writeHead(302, { location: `http://127.0.0.1:${port}/elsewhere/` }).end();
      return;
    }
    if (path.startsWith('/robots-site')) {
      res.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html><title>Should never be fetched</title>');
      return;
    }
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  }).listen(port);
}

function ctxFor(url: string) {
  const dir = mkdtempSync(join(tmpdir(), 'dse-blocked-'));
  return new MemoryRunContext(
    'blockedtst',
    { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)', allowPrivateHosts: [`localhost:${port}`, `127.0.0.1:${port}`, 'localhost:4198'], timeoutMs: 120_000, keepIntermediate: false, byo: false },
    new ModelClient({ mode: 'replay', recordingsDir: dir }),
    new LocalStorage(dir),
    { id: 'blockedtst', url, host: `localhost:${port}`, status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'] },
  );
}

const instant = async () => {};

beforeAll(async () => {
  server = serve();
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
  server?.close();
});

describe('blocked states', () => {
  it('blocks a bot challenge after two retries and keeps the attempt log', async () => {
    const ctx = ctxFor(`http://localhost:${port}/bot/`);
    const out = await runPipeline(ctx, { browser, through: 'capture', sleep: instant });
    expect(out).toMatchObject({ status: 'blocked', reason: 'bot' });
    const detail = (out as { detail: { attempts: { status: number; marker?: string; retries: number }[] } }).detail;
    expect(detail.attempts.map((a) => [a.status, a.marker, a.retries])).toEqual([
      [403, 'challenge-platform', 0],
      [403, 'challenge-platform', 1],
      [403, 'challenge-platform', 2],
    ]);
    expect(ctx.document).toMatchObject({ status: 'blocked', blockedReason: 'bot' });
  }, 120_000);

  it('obeys robots.txt and never fetches a disallowed start page', async () => {
    hits.length = 0;
    const ctx = ctxFor(`http://localhost:${port}/robots-site/`);
    const out = await runPipeline(ctx, { browser, through: 'capture', sleep: instant });
    expect(out).toMatchObject({ status: 'blocked', reason: 'robots' });
    expect((out as { detail: { robots?: string } }).detail.robots).toContain('Disallow: /robots-site/');
    expect(hits.filter((h) => h.startsWith('/robots-site'))).toEqual([]);
  }, 120_000);

  it('ends a login-walled site blocked, with a complete one-page document', async () => {
    const ctx = ctxFor(`http://localhost:${port}/walled/`);
    const out = await runPipeline(ctx, { browser, through: 'capture', sleep: instant });
    expect(out).toMatchObject({ status: 'blocked', reason: 'login' });
    expect((out as { detail: { redirectedTo?: string } }).detail.redirectedTo).toContain('/walled/login');
    expect(ctx.document.pages).toHaveLength(1);
    expect(ctx.document.pages![0]!.status).toBe('captured');
  }, 180_000);

  it('reports an address that refuses connections as unreachable', async () => {
    const ctx = ctxFor('http://localhost:4198/');
    const out = await runPipeline(ctx, { browser, through: 'capture', sleep: instant });
    expect(out).toMatchObject({ status: 'blocked', reason: 'unreachable' });
    expect((out as { detail: { reason: string } }).detail.reason).toMatch(/could not connect|did not resolve|no answer/);
  }, 120_000);

  it('blocks a start page that redirects to another host', async () => {
    const ctx = ctxFor(`http://localhost:${port}/offsite/`);
    const out = await runPipeline(ctx, { browser, through: 'capture', sleep: instant });
    expect(out).toMatchObject({ status: 'blocked', reason: 'invalid-url' });
    expect((out as { detail: { reason: string } }).detail.reason).toBe('redirected off-site');
  }, 60_000);

  it('refuses a private address before any fetch', async () => {
    const ctx = ctxFor('http://169.254.169.254/latest/meta-data/');
    const out = await runPipeline(ctx, { browser, through: 'capture', sleep: instant });
    expect(out).toMatchObject({ status: 'blocked', reason: 'private-address' });
  }, 60_000);
});
