import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Checks, Component, Drift, Tokens, allowedPrivateHosts } from '@dse/schema';
import { matchesTemplate } from './helpers/templates';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { launchBrowser } from '../src/crawl/browser';
import { ModelClient } from '../src/models/client';
import { runPipeline } from '../src/run';
import { startFixtureServer } from '../../../scripts/fixtures-serve';
import { startStorageServer } from '../../../scripts/storage-serve';
import type { Server } from 'node:http';

const recordingsDir = resolve(import.meta.dirname, '../../../fixtures/recordings');
let browser: Browser;
let server: Awaited<ReturnType<typeof startFixtureServer>> | null = null;
let ctx: MemoryRunContext;
let storage: LocalStorage;
let storageServer: Server;

beforeAll(async () => {
  try {
    await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) });
  } catch {
    server = await startFixtureServer(4100);
  }
  browser = await launchBrowser();
  const url = 'http://localhost:4100/sites/clean/';
  const dir = mkdtempSync(join(tmpdir(), 'dse-stages-'));
  storageServer = await startStorageServer(dir, 4403);
  ctx = new MemoryRunContext(
    'tokenstest',
    { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)', allowPrivateHosts: allowedPrivateHosts({ DSE_ALLOW_PRIVATE_HOSTS: 'localhost:4100' }), timeoutMs: 600_000, keepIntermediate: false, byo: false },
    new ModelClient({ mode: 'replay', recordingsDir, strictReplay: true }),
    (storage = new LocalStorage(dir, 'http://localhost:4403')),
    { id: 'tokenstest', url, host: 'localhost:4100', status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'] },
  );
  await runPipeline(ctx, { browser, through: 'drift' });
}, 300_000);

afterAll(async () => {
  await browser?.close();
  server?.close();
  storageServer?.close();
});

describe('the tokens stage on the clean fixture', () => {
  it('writes a complete tokens section that validates', () => {
    const t = Tokens.parse(ctx.document.tokens);
    expect(t.colors).toHaveLength(9);
    expect(t.spaceBase).toEqual({ value: 4, clear: true });
    expect(t.families).toEqual([expect.objectContaining({ name: 'Inter', loaded: true }), expect.objectContaining({ name: 'ui-monospace', loaded: true })]);
    expect(t.rawCounts).toMatchObject({ colors: 12, radii: 3, shadows: 2 });
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
      'tokens:palette tokens · colors 9 clustered from 12 raw values · ΔE threshold 2.3',
      'tokens:palette tokens · color names by model · 1 renamed',
      'tokens:type tokens · type 9 styles · Inter, ui-monospace · all loaded',
      'tokens:space tokens · spacing 11 steps · 4 px base · 3 radii · 2 shadows',
      'tokens:motion tokens · motion 5 durations · 2 easings · 2 keyframes',
      'tokens:motion tokens · 6 site variables named tokens · 3 overlays',
    ]);
  });
});

describe('the components stage on the clean fixture', () => {
  it('writes components that validate, with complete provenance and stored crops', async () => {
    const comps = Component.array().parse(ctx.document.components);
    expect(comps.length).toBe(29);
    for (const c of comps) {
      const f = c.provenance.firstSeen;
      expect(f.selector, c.name).not.toBe('');
      expect(f.bbox.w * f.bbox.h, c.name).toBeGreaterThan(0);
      expect(c.provenance.pages.length, c.name).toBeGreaterThan(0);
      expect(c.preview.cropKey, c.name).toBeTruthy();
      expect(await storage.get(c.preview.cropKey!), c.name).not.toBeNull();
      if (f.sourceCrop) {
        expect(f.sourceCrop.width).toBeGreaterThanOrEqual(320);
        expect(await storage.get(f.sourceCrop.key)).not.toBeNull();
      }
    }
    expect(comps.filter((c) => !c.provenance.firstSeen.sourceCrop).map((c) => c.type)).toEqual(['dropdown', 'dropdown']);
  });

  it('finds the button with its seven variants, five states and links to the palette', () => {
    const button = ctx.document.components!.find((c) => c.name === 'Button')!;
    expect(button.variants.map((v) => v.name).sort()).toEqual(['Ghost', 'Ghost rounded', 'Ghost small', 'Primary', 'Primary small', 'Secondary', 'Secondary small']);
    expect(button.states.filter((s) => s.captured).map((s) => s.state)).toEqual(['default', 'hover', 'focus', 'active', 'disabled']);
    expect(button.states.find((s) => s.state === 'focus')!.reachedByKeyboard).toBe(true);
    expect(button.provenance.pages.map((p) => p.path)).toEqual(['/', '/pricing', '/docs', '/login', '/signup', '/contact', '/features', expect.stringMatching(/-does-not-exist$/), '/docs/getting-started']);
    expect(button.tokensUsed.map((t) => t.property)).toEqual(expect.arrayContaining(['color', 'border-radius', 'padding-left', 'font']));
  });

  it('attaches the planted hover transition: on the hover delta with its timing, and in motion with the easing token', () => {
    const button = ctx.document.components!.find((c) => c.name === 'Button')!;
    const lift = button.states.find((s) => s.state === 'hover')!.delta.find((d) => d.property === 'transform')!;
    expect(lift).toMatchObject({ to: 'translateY(-1px)', transition: { durationMs: 160 } });
    const easing = ctx.document.tokens!.easing!.find((e) => e.value === 'cubic-bezier(0.25, 0.46, 0.45, 0.94)')!;
    expect(button.motion!.transitions).toEqual(expect.arrayContaining([expect.objectContaining({ state: 'hover', property: 'transform', durationMs: 160, easingTokenId: easing.id })]));
  });

  it('logs the component count and the model use', () => {
    const lines = ctx.events.filter((e) => e.stage === 'components').map((e) => e.message);
    expect(lines[0]).toMatch(/^components · 29 found from [\d,]+ element candidates · 29 by model$/);
  });
});

describe('the previews stage on the clean fixture', () => {
  it('makes nearly every component live, stores each preview and its states, and fills the code', async () => {
    const comps = ctx.document.components!;
    const live = comps.filter((c) => c.preview.mode === 'live');
    expect(live.length / comps.length).toBeGreaterThanOrEqual(0.9);
    for (const c of live) {
      expect(c.preview.diffPct!, c.name).toBeLessThanOrEqual(2.5);
      expect((await storage.get(c.preview.htmlKey!))?.toString('utf8'), c.name).toContain('<div class="dse-root">');
      expect(c.code.html.length, c.name).toBeGreaterThan(0);
    }
    const button = comps.find((c) => c.name === 'Button')!;
    expect(Object.keys(button.preview.stateHtmlKeys ?? {}).sort()).toEqual(['active', 'focus', 'hover']);
    const hover = (await storage.get(button.preview.stateHtmlKeys!.hover!))!.toString('utf8');
    // The state rule without !important, and the recorded transition played from the default (D-094).
    expect(hover).toMatch(/\.dse-root > :first-child:not\(#dse-state\) \{ background-color: #E2E8F0;[^}]*animation: dse-state-0 160ms /);
    expect(button.variants.every((v) => v.preview.mode === 'live')).toBe(true);
    // The avatar's photo keeps its own pixels from the screenshot, so it renders live (D-098).
    expect(comps.find((c) => c.type === 'avatar')!.preview).toMatchObject({ mode: 'live' });
  });

  it('logs the build in the live-log voice', () => {
    const line = ctx.events.find((e) => e.stage === 'previews')!.message;
    // The skip link stays captured, shown focused (D-108).
    expect(line).toMatch(/^previews · 29 built · 28 live · 1 captured \(median diff \d+\.\d %\) · 1 hidden until focused$/);
  });
});

describe('the checks stage on the clean fixture', () => {
  it('gives every component one result per check, each in the words of checks.md', () => {
    for (const c of ctx.document.components!) {
      expect(c.checks.map((r) => r.check), c.name).toEqual(['contrast', 'focus-visible', 'tap-target', 'label', 'reduced-motion']);
      for (const r of c.checks) expect(matchesTemplate(r.detail), `${c.name} ${r.check}: ${r.detail}`).toBe(true);
    }
  });

  it('finds exactly the two planted failures and sums them', () => {
    const failing = ctx.document.components!.flatMap((c) => c.checks.filter((r) => r.status === 'fail').map((r) => `${c.name} · ${r.check} · ${r.detail}`));
    expect(failing).toEqual([expect.stringMatching(/ · label · No name found$/), expect.stringMatching(/ · contrast · 4\.1:1 on teal-500, needs 4\.5:1$/)]);
    const summary = Checks.parse(ctx.document.checks);
    expect(summary.summary.failed).toBe(2);
    expect(summary.summary.total).toBe(29 * 5);
    expect(summary.summary.passed + summary.summary.failed).toBe(summary.summary.applicable);
    expect(ctx.events.find((e) => e.stage === 'checks')!.message).toBe(`checks · ${summary.summary.applicable} applicable · ${summary.summary.passed} passed · 2 failed`);
  });
});

describe('the drift stage on the clean fixture', () => {
  it('finds no drift, keeps contrast, and writes the narrative and intro', () => {
    const d = Drift.parse(ctx.document.drift);
    expect(d.findingCount).toBe(0);
    expect(d.headline).toEqual({ kind: null, before: 0, after: 0, sentence: 'Nothing to collapse. 9 colors, 11 spacing steps, all on the grid.' });
    expect(d.proposal.contrastKept).toBe(true);
    expect(d.narrative.length).toBeGreaterThan(40);
    expect(ctx.document.exports?.designSystemIntro).toMatch(/localhost:4100/);
    expect(ctx.events.filter((e) => e.stage === 'drift').map((e) => e.message)).toEqual(['drift · nothing to collapse · contrast kept', 'drift · narrative by model']);
  });
});
