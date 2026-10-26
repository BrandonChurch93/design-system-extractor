import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Tokens, allowedPrivateHosts } from '@dse/schema';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { launchBrowser } from '../src/crawl/browser';
import { ModelClient } from '../src/models/client';
import { runPipeline } from '../src/run';
import { startFixtureServer } from '../../../scripts/fixtures-serve';

const recordingsDir = resolve(import.meta.dirname, '../../../fixtures/recordings');
let browser: Browser;
let server: Awaited<ReturnType<typeof startFixtureServer>> | null = null;
let ctx: MemoryRunContext;

beforeAll(async () => {
  try {
    await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) });
  } catch {
    server = await startFixtureServer(4100);
  }
  browser = await launchBrowser();
  const url = 'http://localhost:4100/sites/clean/';
  const dir = mkdtempSync(join(tmpdir(), 'dse-tokens-'));
  ctx = new MemoryRunContext(
    'tokenstest',
    { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)', allowPrivateHosts: allowedPrivateHosts({ DSE_ALLOW_PRIVATE_HOSTS: 'localhost:4100' }), timeoutMs: 600_000, keepIntermediate: false, byo: false },
    new ModelClient({ mode: 'replay', recordingsDir, strictReplay: true }),
    new LocalStorage(dir),
    { id: 'tokenstest', url, host: 'localhost:4100', status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'] },
  );
  await runPipeline(ctx, { browser, through: 'tokens' });
}, 300_000);

afterAll(async () => {
  await browser?.close();
  server?.close();
});

describe('the tokens stage on the clean fixture', () => {
  it('writes a complete tokens section that validates', () => {
    const t = Tokens.parse(ctx.document.tokens);
    expect(t.colors).toHaveLength(9);
    expect(t.spaceBase).toEqual({ value: 4, clear: true });
    expect(t.families).toEqual([expect.objectContaining({ name: 'Inter', loaded: true }), expect.objectContaining({ name: 'ui-monospace', loaded: true })]);
    expect(t.rawCounts).toMatchObject({ colors: 9, radii: 3, shadows: 2 });
  });

  it('classifies the three state colors as semantic by their context', () => {
    const roles = Object.fromEntries((ctx.document.tokens?.colors ?? []).filter((c) => c.semanticRole).map((c) => [c.value, c.semanticRole]));
    expect(roles).toEqual({ '#15803D': 'success', '#B45309': 'warning', '#DC2626': 'danger' });
  });

  it('records the planted 4.18:1 contrast pair on white text over teal', () => {
    const colors = ctx.document.tokens?.colors ?? [];
    const white = colors.find((c) => c.value === '#FFFFFF')!;
    const teal = colors.find((c) => c.value === '#0F8A8A')!;
    const pair = white.contrastPairs.find((p) => p.bg === teal.id && !p.large)!;
    expect(pair.ratio).toBeCloseTo(4.18, 2);
    expect(pair.where).toBe('/');
  });

  it('logs each substage in the live-log voice', () => {
    const lines = ctx.events.filter((e) => e.stage === 'tokens').map((e) => `${e.substage} ${e.message}`);
    expect(lines).toEqual([
      'tokens:palette tokens · colors 9 clustered from 9 raw values · ΔE threshold 2.3',
      'tokens:palette tokens · color names by model · 2 renamed',
      'tokens:type tokens · type 9 styles · Inter, ui-monospace · all loaded',
      'tokens:space tokens · spacing 11 steps · 4 px base · 3 radii · 2 shadows',
    ]);
  });
});
