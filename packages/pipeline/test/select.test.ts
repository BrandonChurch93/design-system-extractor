import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { CandidateSource, DiscoverOutput, PageCandidate, RunConfig } from '@dse/schema';
import { MemoryRunContext, LocalStorage } from '../src/context';
import { ModelClient, ReplayMissError, type ModelClientOptions } from '../src/models/client';
import { costOf } from '../src/models/cost';
import { requestHash, stableStringify } from '../src/models/hash';
import { DevSpendMeter } from '../src/models/meter';
import { candidateTable, fallbackPick, orderPages, select, validatePick } from '../src/stages/select';
import { finalScore, preScore } from '../src/select/score';

describe('pre-score rows', () => {
  const cases: [string, CandidateSource, number, string][] = [
    ['/', 'start', 3, 'home'],
    ['/pricing', 'header', 4, 'tables-toggles'],
    ['/plans', 'sitemap', 3, 'tables-toggles'],
    ['/signup', 'footer', 2.5, 'forms'],
    ['/get-started', 'body', 2, 'forms'],
    ['/login', 'header', 3, 'forms-errors'],
    ['/contact', 'sitemap', 2, 'forms'],
    ['/request-demo', 'body', 2, 'forms'],
    ['/features', 'header', 3, 'nav'],
    ['/solutions', 'sitemap', 2, 'nav'],
    ['/docs', 'header', 3, 'code-blocks'],
    ['/docs/getting-started', 'sitemap', 0.5, 'code-blocks'],
    ['/blog', 'footer', 1.5, 'list-template'],
    ['/blog/a-post', 'sitemap', 0.5, 'post-template'],
    ['/changelog', 'footer', 2.5, 'badges-timeline'],
    ['/about', 'footer', 1.5, 'about'],
    ['/careers', 'footer', 1.5, 'careers'],
    ['/dashboard', 'body', 1, 'app'],
    ['/x/y/z', 'sitemap', -1, 'sitemap'],
    ['/random', 'header', 1, 'nav'],
    ['/random', 'footer', 0.5, 'footer'],
    ['/random', 'body', 0, 'body'],
  ];
  it('adds each matched row, the source bonus and the depth penalty, and names the reason', () => {
    for (const [path, source, score, reason] of cases) {
      const r = preScore(path, source);
      expect([r.score, r.reason], `${path} via ${source}`).toEqual([score, reason]);
    }
  });
  it('makes home and visitor includes mandatory', () => {
    expect(preScore('/', 'start').mandatory).toBe(true);
    const inc = preScore('/app/settings/billing', 'include');
    expect(inc).toMatchObject({ mandatory: true, reason: 'added' });
    expect(inc.score).toBe(10 + 1 - 1);
    expect(preScore('/zz-does-not-exist', 'synthetic')).toMatchObject({ score: 2, reason: 'empty-state' });
  });
  it('adds the template bonus for large groups and the fetch failure penalty', () => {
    expect(finalScore(1, { templateSize: 12, fetchFailed: false })).toBe(1.5);
    expect(finalScore(1, { templateSize: 9, fetchFailed: false })).toBe(1);
    expect(finalScore(1, { fetchFailed: true })).toBe(-4);
  });
});

function cand(id: string, path: string, score: number, extra: Partial<PageCandidate> = {}): PageCandidate {
  return { id, url: `https://t.app${path}`, path, source: 'header', depth: path.split('/').filter(Boolean).length, preScore: score, finalScore: score, reason: 'nav', mandatory: false, fetchFailed: false, title: path, h1: path, ...extra };
}

const table: PageCandidate[] = [
  cand('home0000', '/', 6, { reason: 'home', mandatory: true, source: 'start' }),
  cand('incl0000', '/app/settings', 10, { reason: 'added', mandatory: true, source: 'include' }),
  cand('pric0000', '/pricing', 4, { reason: 'tables-toggles' }),
  cand('sign0000', '/signup', 3, { reason: 'forms' }),
  cand('blog0001', '/blog/one', 1.5, { reason: 'post-template', templateGroup: 'blog', templateSize: 12 }),
  cand('abou0000', '/about', 1.5, { reason: 'about' }),
  cand('team0000', '/team', 1.5, { reason: 'about' }),
];

describe('selection rules', () => {
  it('accepts a valid pick and names what is wrong with an invalid one', () => {
    expect(validatePick(['home0000', 'incl0000', 'pric0000'], table, 3)).toBeNull();
    expect(validatePick(['home0000', 'pric0000', 'sign0000'], table, 3)).toMatch(/missing mandatory/);
    expect(validatePick(['home0000', 'incl0000', 'pric0000', 'sign0000'], table, 3)).toMatch(/more than 3/);
    expect(validatePick(['home0000', 'incl0000', 'nope0000'], table, 3)).toMatch(/not in the table/);
    expect(validatePick(['home0000', 'home0000', 'incl0000'], table, 3)).toMatch(/duplicate/);
  });
  it('falls back to the top scores, mandatory pages first', () => {
    expect(fallbackPick(table, 4).map((c) => c.id)).toEqual(['home0000', 'incl0000', 'pric0000', 'sign0000']);
  });
  it('orders home, then includes, then by score', () => {
    const ordered = orderPages([table[3]!, table[2]!, table[1]!, table[0]!]);
    expect(ordered.map((p) => p.path)).toEqual(['/', '/app/settings', '/pricing', '/signup']);
    expect(ordered.map((p) => p.order)).toEqual([0, 1, 2, 3]);
  });
  it('renders the model table with one row per candidate', () => {
    const t = candidateTable(table);
    expect(t.split('\n')).toHaveLength(table.length + 1);
    expect(t).toContain('blog ×12');
  });
});

const recordingsDir = resolve(import.meta.dirname, '../../../fixtures/recordings');
const config: RunConfig = { url: 'https://t.app/', include: [], pageCap: 4, viewports: ['desktop'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [], timeoutMs: 60_000, keepIntermediate: false, byo: false };
const discovered: DiscoverOutput = { startUrl: 'https://t.app/', scopePrefix: '/', host: 't.app', candidates: table, darkThemeDetected: false, sitemapUrls: 0, hashRouter: false };

function ctxWith(opts: Partial<ModelClientOptions>) {
  const dir = mkdtempSync(join(tmpdir(), 'dse-select-'));
  const models = new ModelClient({ mode: 'live', recordingsDir: dir, ...opts });
  return new MemoryRunContext('abc123def4', config, models, new LocalStorage(dir), { id: 'abc123def4', url: config.url, host: 't.app', status: 'running', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop'] });
}

const usage = { input_tokens: 1400, output_tokens: 90, cache_creation_input_tokens: 0, cache_read_input_tokens: 800 };

describe('the select model pass', () => {
  it('uses a valid model answer and logs it', async () => {
    const ctx = ctxWith({ transport: async () => ({ text: JSON.stringify({ pageIds: ['home0000', 'incl0000', 'sign0000', 'pric0000'] }), usage }) });
    const out = await select(ctx, discovered);
    expect(out.by).toBe('model');
    expect(out.pages.map((p) => p.path)).toEqual(['/', '/app/settings', '/pricing', '/signup']);
    expect(ctx.events.at(-1)!.message).toBe('select · 1 template folded (blog ×12) · model picked 4');
    expect(ctx.cost().calls).toHaveLength(1);
  });
  it('retries once on malformed output, then falls back to the ranking', async () => {
    let calls = 0;
    const ctx = ctxWith({ transport: async () => ({ text: calls++ === 0 ? 'not json' : '{"pages": ["home0000"]}', usage }) });
    const out = await select(ctx, discovered);
    expect(calls).toBe(2);
    expect(out.by).toBe('fallback');
    expect(out.pages.map((p) => p.id)).toEqual(['home0000', 'incl0000', 'pric0000', 'sign0000']);
    expect(ctx.events.at(-1)!.message).toContain('fallback ranking picked 4');
  });
  it('falls back when the model breaks a rule', async () => {
    const ctx = ctxWith({ transport: async () => ({ text: JSON.stringify({ pageIds: ['pric0000', 'sign0000'] }), usage }) });
    const out = await select(ctx, discovered);
    expect(out).toMatchObject({ by: 'fallback' });
    expect(out.fallbackReason).toMatch(/missing mandatory/);
  });
  it('falls back on a timeout', async () => {
    const ctx = ctxWith({
      transport: async () => {
        throw Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
      },
    });
    const out = await select(ctx, discovered);
    expect(out.by).toBe('fallback');
    expect(out.fallbackReason).toMatch(/^timeout/);
  });
  it('replays the recorded messy fixture call, and a miss in strict replay throws', async () => {
    const files = readdirSync(join(recordingsDir, 'select'));
    expect(files.length).toBeGreaterThan(0);
    const rec = JSON.parse(readFileSync(join(recordingsDir, 'select', files[0]!), 'utf8')) as { text: string };
    expect(JSON.parse(rec.text).pageIds).toHaveLength(12);
    const strict = ctxWith({ mode: 'replay', recordingsDir, strictReplay: true });
    await expect(select(strict, discovered)).rejects.toBeInstanceOf(ReplayMissError);
    const lenient = ctxWith({ mode: 'replay', recordingsDir });
    expect((await select(lenient, discovered)).by).toBe('fallback');
  });
  it('captures every page when there are no more candidates than the cap', async () => {
    const ctx = ctxWith({ transport: async () => ({ text: '{}', usage }) });
    const out = await select(ctx, { ...discovered, candidates: table.slice(0, 3) });
    expect(out.by).toBe('all');
    expect(ctx.cost().calls).toHaveLength(0);
  });
});

describe('cost, hashing and the dev cap', () => {
  it('prices uncached and cached responses from the table', () => {
    expect(costOf('claude-haiku-5-5', { input_tokens: 50_000, output_tokens: 0 })).toBeCloseTo(0.005, 10);
    expect(costOf('claude-haiku-5-5', { input_tokens: 1000, output_tokens: 100, cache_creation_input_tokens: 2000, cache_read_input_tokens: 5000 })).toBeCloseTo((1000 * 0.1 + 100 * 0.5 + 2000 * 0.125 + 5000 * 0.01) / 1e6, 10);
    expect(costOf('claude-sonnet-5-5', { input_tokens: 6000, output_tokens: 600, cache_read_input_tokens: 2000 })).toBeCloseTo((6000 * 2 + 600 * 10 + 2000 * 0.1) / 1e6, 10);
    expect(costOf('claude-haiku-5-5', { input_tokens: 150_000, output_tokens: 1000 })).toBeCloseTo((150_000 * 0.5 + 1000 * 2.5) / 1e6, 10);
    expect(() => costOf('claude-unknown', usage)).toThrow();
  });
  it('hashes requests stably, ignoring run ids, timestamps and key order', () => {
    const a = { purpose: 'select', content: [{ type: 'text', text: 'run at 2026-10-25T10:00:00.000Z for /runs/abc123def4/x' }], b: 1, a: 2 };
    const b = { a: 2, b: 1, content: [{ text: 'run at 2026-10-26T11:30:00.000Z for /runs/zzz999yyy8/x', type: 'text' }], purpose: 'select' };
    expect(requestHash(a)).toBe(requestHash(b));
    expect(requestHash({ ...a, b: 3 })).not.toBe(requestHash(a));
    expect(stableStringify({ z: 1, a: [2, { y: 1, x: 2 }] })).toBe('{"a":[2,{"x":2,"y":1}],"z":1}');
  });
  it('refuses the next live call once the build cap minus the reserve is reached', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dse-meter-'));
    const meter = new DevSpendMeter(join(dir, 'dev-spend.json'), 20, 4);
    await meter.add(15.99, 'select');
    let sent = 0;
    const client = new ModelClient({ mode: 'live', recordingsDir: dir, meter, transport: async () => (sent++, { text: '{"ok":true}', usage: { input_tokens: 1_000_000, output_tokens: 0 } }) });
    const req = { purpose: 'select' as const, size: 'small' as const, system: 's', content: [{ type: 'text' as const, text: 'x' }], schema: z.object({ ok: z.boolean() }), maxTokens: 10, timeoutMs: 1000 };
    expect((await client.call(req)).ok).toBe(true);
    const refused = await client.call(req);
    expect(refused).toMatchObject({ ok: false, reason: 'budget' });
    expect(sent).toBe(1);
    const withReserve = new DevSpendMeter(join(dir, 'dev-spend.json'), 20, 4, true);
    expect((await withReserve.allowLive()).ok).toBe(true);
  });
});
