import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Browser } from 'playwright';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { allowedPrivateHosts, type RunDocumentPartial } from '@dse/schema';
import { BUDGET } from '../src/budget';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { launchBrowser } from '../src/crawl/browser';
import { timeoutDetail } from '../src/errors';
import { ModelClient } from '../src/models/client';
import { runPipeline, type RunDeps } from '../src/run';
import { startFixtureServer } from '../../../scripts/fixtures-serve';

// The run timeout and the time budget (docs/specs/caps-and-budget.md, Run-level guards; D-066):
// a run that runs out of time fails with the timeout detail and keeps what landed; a step past its
// share takes its lighter path and says so. The clock is moved forward, not waited on.

const recordingsDir = resolve(import.meta.dirname, '../../../fixtures/recordings');
const url = 'http://localhost:4100/sites/clean/';
let browser: Browser;
let server: Awaited<ReturnType<typeof startFixtureServer>> | null = null;

function ctxFor(timeoutMs: number) {
  const dir = mkdtempSync(join(tmpdir(), 'dse-budget-'));
  return new MemoryRunContext(
    'budgettest',
    { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)', allowPrivateHosts: allowedPrivateHosts({ DSE_ALLOW_PRIVATE_HOSTS: 'localhost:4100' }), timeoutMs, keepIntermediate: false, byo: false },
    // Names change once naming is cut, so later prompts miss the recordings and take their fallbacks.
    new ModelClient({ mode: 'replay', recordingsDir, strictReplay: false }),
    new LocalStorage(dir),
    { id: 'budgettest', url, host: 'localhost:4100', status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'] },
  );
}

/** From the moment `at` is called, the clock reads `share` of the timeout later than it is. */
function skipAhead(timeoutMs: number, share: number) {
  const real = Date.now.bind(Date);
  return () => void vi.spyOn(Date, 'now').mockImplementation(() => real() + share * timeoutMs);
}

const messages = (ctx: MemoryRunContext) => ctx.events.map((e) => e.message);

beforeAll(async () => {
  try {
    await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) });
  } catch {
    server = await startFixtureServer(4100);
  }
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
  server?.close();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the run timeout', () => {
  it('fails a run that runs out of time with the timeout detail and keeps the stages that landed', async () => {
    const ctx = ctxFor(20_000);
    const out = await runPipeline(ctx, { browser });
    expect(out).toEqual({ status: 'failed', detail: timeoutDetail(20_000) });
    const doc = ctx.current() as RunDocumentPartial;
    expect(doc.status).toBe('failed');
    expect(doc.failedDetail).toBe(timeoutDetail(20_000));
    expect(doc.pages?.length).toBeGreaterThan(0);
    expect(doc.components).toBeUndefined();
  }, 60_000);
});

describe('the time budget', () => {
  const T = 600_000;

  it('past the states share, captures later pages without states, logs the cut, and marks those states over capture cap', async () => {
    const ctx = ctxFor(T);
    const deps: RunDeps = { browser, onDiscover: skipAhead(T, (BUDGET.states + BUDGET.naming) / 2) };
    const out = await runPipeline(ctx, deps);
    expect(out.status).toBe('complete');
    expect(messages(ctx).some((m) => m.includes('time budget for states reached · later pages captured without states'))).toBe(true);
    const states = (ctx.current().components ?? []).flatMap((c) => c.states);
    expect(states.some((s) => !s.captured && s.reason === 'over capture cap')).toBe(true);
  }, 300_000);

  it('past the naming and render check shares, keeps deterministic names and captured crops not checked in time', async () => {
    const ctx = ctxFor(T);
    const deps: RunDeps = { browser, onCapture: skipAhead(T, (BUDGET.previews + BUDGET.narrative) / 2) };
    const out = await runPipeline(ctx, deps);
    expect(out.status).toBe('complete');
    const comps = ctx.current().components ?? [];
    expect(comps.length).toBeGreaterThan(0);
    expect(comps.every((c) => c.preview.mode === 'captured' && c.preview.capturedReason === 'not-checked')).toBe(true);
    expect(comps.every((c) => /^[A-Z][a-z-]*( [a-z0-9-]+)*( \d+)?$/.test(c.name))).toBe(true);
    const log = messages(ctx);
    expect(log.some((m) => /time budget for naming reached · \d+ of \d+ batches named by the rules/.test(m))).toBe(true);
    expect(log.some((m) => m.includes(`time budget for render checks reached · ${comps.length} previews not checked`))).toBe(true);
  }, 300_000);
});
