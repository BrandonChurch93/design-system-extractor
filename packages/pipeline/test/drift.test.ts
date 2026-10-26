import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ColorToken, RunConfig, SpaceToken, Tokens, TypeToken } from '@dse/schema';
import { contrastRatio } from '../src/color/contrast';
import { oklabToOklch, parseCssColor, rgbToOklab } from '../src/color/parse';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { collapseDelta, nearDuplicateColors, spacingFindings, typeNearDuplicates } from '../src/drift/findings';
import { factNumbers, fallbackIntro, fallbackNarrative, rejectReason, writeNarrative } from '../src/drift/narrative';
import { proposeColors } from '../src/drift/proposal';
import { inWords, joinAnd } from '../src/drift/report';
import { ModelClient, type ModelClientOptions } from '../src/models/client';

const color = (id: string, hex: string, usage: number, group: ColorToken['group'] = 'neutral', pages = ['p1']): ColorToken => {
  const o = oklabToOklch(rgbToOklab(parseCssColor(hex)!));
  return { id, name: id, value: hex, oklch: { l: o.l, c: o.c, h: o.h }, group, usage, uses: { text: usage, background: 0, border: 0, other: 0 }, pages: pages.map((pageId) => ({ pageId, count: 1 })), rawValues: [{ value: hex, count: usage }], contrastPairs: [] };
};

describe('findings', () => {
  it('pairs near-duplicate neutrals and same-hue brand colors, never across alphas or groups', () => {
    const pairs = nearDuplicateColors([color('w', '#FFFFFF', 9), color('f5', '#F5F5F5', 3), color('e1', '#E1E1E1', 4), color('blue', '#2458E6', 9, 'brand'), color('blue2', '#1C4EDB', 3, 'brand'), color('navy', '#0B1F3A', 9, 'brand'), color('shadow', '#0B1F3A1F', 2, 'brand'), color('teal', '#0F8A8A', 1, 'brand')], new Map([['p1', '/']]));
    // #F5F5F5 and #E1E1E1 are ΔE 6.04 apart, just outside the neutral threshold.
    expect(pairs.map((p) => [p.a.id, p.b.id, p.delta])).toEqual([
      ['blue', 'blue2', 3],
      ['w', 'f5', 3],
    ]);
    expect(pairs[0]!.pages).toEqual(['/']);
  });

  it('finds off-grid steps and near-steps under 5% of use', () => {
    const sp = (value: number, usage: number, onGrid = true): SpaceToken => ({ id: `s${value}`, value, onGrid, usage, pages: [{ pageId: 'p1', count: usage }], contexts: { padding: usage, margin: 0, gap: 0, layout: 0 } });
    const tokens = { space: [sp(8, 400), sp(10, 40, false), sp(12, 300), sp(40, 3), sp(44, 2), sp(64, 200)], spaceBase: { value: 4, clear: true } } as unknown as Tokens;
    expect(spacingFindings(tokens, new Map([['p1', '/']])).map((s) => [s.kind, s.value, s.nearest])).toEqual([
      ['off-grid', 10, 8],
      ['near-step', 44, 40],
    ]);
  });

  it('collapses variants at the tolerance edges and not beyond', () => {
    const t = (bg: string, pad: string, radius: string, height = '44') => [bg, 'rgb(255, 255, 255)', 'none', '1', pad, radius, '600', height];
    expect(collapseDelta(t('rgb(36, 88, 230)', '0 20 0 20', '8'), t('rgb(36, 88, 230)', '0 22 0 22', '10'))).toEqual({ padding: 2, radius: 2, fontSize: 0, color: false });
    expect(collapseDelta(t('rgb(36, 88, 230)', '0 20 0 20', '8'), t('rgb(36, 88, 230)', '0 23 0 23', '8'))).toBeNull();
    expect(collapseDelta(t('rgb(36, 88, 230)', '0 20 0 20', '8'), t('rgb(36, 88, 230)', '0 20 0 20', '11'))).toBeNull();
    expect(collapseDelta(t('rgb(36, 88, 230)', '0 20 0 20', '8'), t('rgb(34, 86, 228)', '0 20 0 20', '8'))).toEqual({ padding: 0, radius: 0, fontSize: 0, color: true });
    expect(collapseDelta(t('rgb(36, 88, 230)', '0 20 0 20', '8'), t('rgb(28, 78, 219)', '0 20 0 20', '8'))).toBeNull();
    expect(collapseDelta(t('rgb(36, 88, 230)', '0 20 0 20', '8'), t('rgb(36, 88, 230)', '0 20 0 20', '8', '36'))).toBeNull();
    expect(collapseDelta(t('rgb(36, 88, 230)', '0 20 0 20', '8'), t('rgb(11, 31, 58)', '0 20 0 20', '8'))).toBeNull();
  });

  it('pairs type styles a pixel apart at one family and weight', () => {
    const ty = (size: number, lineHeight: number, weight = 400, usage = 10): TypeToken => ({ id: `t${size}-${lineHeight}-${weight}`, name: `t${size}`, role: 'other', family: 'Inter', fallbackStack: 'Inter', size, lineHeight, weight, letterSpacing: 0, usage, pages: [], sample: '' });
    const pairs = typeNearDuplicates([ty(16, 26, 400, 50), ty(15, 22, 400, 5), ty(14, 22, 400, 30), ty(14, 20, 600), ty(12, 16)]);
    expect(pairs.map((p) => [p.a.size, p.b.size])).toEqual([
      [16, 15],
      [14, 15],
    ]);
  });
});

describe('the proposed set', () => {
  const set: [string, number][] = [['#FFFFFF', 20], ['#EBEBEB', 39], ['#B2B2B2', 40], ['#767676', 7], ['#545454', 44], ['#343434', 14], ['#2B2B2B', 13]];
  it('folds the grays into five steps when no contrast pair is at stake', () => {
    const r = proposeColors(set.map(([h, u], i) => color(`g${i}`, h, u)));
    expect(r.grays).toEqual({ before: 7, after: 5 });
    expect(r.contrastKept).toBe(true);
  });
  it('takes seven steps when five would break a passing pair, and keeps the ratio', () => {
    const toks = set.map(([h, u], i) => color(`g${i}`, h, u));
    toks[3]!.contrastPairs = [{ fg: 'g3', bg: 'g0', ratio: contrastRatio('#767676', '#FFFFFF'), large: false, where: '/' }];
    const r = proposeColors(toks);
    expect(r.grays).toEqual({ before: 7, after: 7 });
    expect(r.contrastKept).toBe(true);
    expect(r.colors.every((c) => c.contrastKept)).toBe(true);
  });
  it('does not hold the proposal to a pair that already fails at token values (D-067)', () => {
    const toks = set.map(([h, u], i) => color(`g${i}`, h, u));
    // Measured on raw colors at 4.6:1, but #767676 on #EBEBEB is 3.9:1 at token values: no proposal can keep it.
    toks[3]!.contrastPairs = [{ fg: 'g3', bg: 'g1', ratio: 4.6, large: false, where: '/' }];
    const r = proposeColors(toks);
    expect(r.grays).toEqual({ before: 7, after: 5 });
    expect(r.contrastKept).toBe(true);
  });
  it('keeps every semantic color and folds a rare brand color into its neighbor', () => {
    const r = proposeColors([color('w', '#FFFFFF', 100), color('blue', '#2458E6', 500, 'brand'), color('blue2', '#2E63ED', 2, 'brand'), color('ok', '#15803D', 3, 'semantic')]);
    expect(r.colors.map((c) => [c.name, c.absorbs])).toEqual([
      ['gray-50', ['w']],
      ['blue', ['blue', 'blue2']],
      ['ok', ['ok']],
    ]);
  });
});

describe('the narrative', () => {
  const facts = { host: 'tidewater.app', pages: 12, colors: 23, numbers: [{ kind: 'grays', before: 14, after: 8, caption: 'Eight are within ΔE 6.0 of a neighbor.' }] };
  const numbers = factNumbers(facts);
  it('rejects an invented number, a dash, a scolding or forbidden word, and a wrong length', () => {
    expect(rejectReason('The palette has 14 grays. Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBeNull();
    expect(rejectReason('The palette has 15 grays. Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBe('an invented number 15');
    expect(rejectReason('The palette has 14 grays \u2014 eight would do. Two are close. More. The set keeps contrast.', numbers, [4, 6])).toBe('a dash');
    expect(rejectReason('The palette is messy. Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBe('a scolding word');
    expect(rejectReason('An accessible palette. Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBe('a forbidden word');
    expect(rejectReason('Short.', numbers, [4, 6])).toBe('1 sentences');
    expect(rejectReason('It was extracted from tidewater.app across 12 pages. It holds 23 colors.', numbers, [2, 2])).toBeNull();
  });

  it('falls back to templates with no dash and no forbidden word', () => {
    const narrative = fallbackNarrative({ headline: { kind: 'grays', before: 14, after: 8, sentence: '14 grays across 12 pages. 8 would do.' }, supporting: ['Two spacing values, two of them off the 4 px grid.'] });
    expect(narrative).toBe('14 grays across 12 pages. 8 would do. Two spacing values, two of them off the 4 px grid. The proposed set keeps every passing contrast ratio.');
    const intro = fallbackIntro({ host: 'tidewater.app', date: 'October 26, 2026', colors: 23, typeStyles: 10, spacingSteps: 13, components: 31, pages: 12 });
    expect(intro).toBe('This design system was extracted from tidewater.app on October 26, 2026: 23 colors, 10 type styles, 13 spacing steps and 31 components across 12 pages.');
    for (const t of [narrative, intro]) expect(t).not.toMatch(/[‒-―]|\b(accessible|compliant|a11y)\b/i);
  });

  const config: RunConfig = { url: 'https://t.app/', include: [], pageCap: 12, viewports: ['desktop'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [], timeoutMs: 60_000, keepIntermediate: false, byo: false };
  const ctxWith = (opts: Partial<ModelClientOptions>) => {
    const dir = mkdtempSync(join(tmpdir(), 'dse-narrative-'));
    return new MemoryRunContext('abc123def4', config, new ModelClient({ mode: 'live', recordingsDir: dir, ...opts }), new LocalStorage(dir), { id: 'abc123def4', url: config.url, host: 't.app', status: 'running', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop'] });
  };
  const usage = { input_tokens: 3000, output_tokens: 600, cache_creation_input_tokens: 0, cache_read_input_tokens: 1800 };
  const drift = { headline: { kind: 'grays' as const, before: 14, after: 8, sentence: '14 grays across 12 pages. 8 would do.' }, supporting: [] };
  const intro = { host: 'tidewater.app', date: 'October 26, 2026', colors: 23, typeStyles: 10, spacingSteps: 13, components: 31, pages: 12 };

  it('uses a valid answer field by field, and the template for a field that fails', async () => {
    const ctx = ctxWith({ transport: async () => ({ text: JSON.stringify({ narrative: 'The palette has 14 grays. Eight would do. They sit close together. The proposed set keeps every contrast ratio.', designSystemIntro: 'Extracted from tidewater.app with 99 colors. It holds components.' }), usage }) });
    const out = await writeNarrative(ctx, facts, drift, intro);
    expect(out.narrativeBy).toBe('model');
    expect(out.introBy).toBe('template (an invented number 99)');
    expect(out.intro).toBe(fallbackIntro(intro));
    expect(ctx.cost().calls.map((c) => c.purpose)).toEqual(['narrative']);
  });

  it('falls back on malformed output and on a timeout', async () => {
    const bad = ctxWith({ transport: async () => ({ text: 'no', usage }) });
    expect(await writeNarrative(bad, facts, drift, intro)).toMatchObject({ narrativeBy: 'template (invalid)', introBy: 'template (invalid)' });
    const slow = ctxWith({
      transport: async () => {
        throw Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
      },
    });
    expect(await writeNarrative(slow, facts, drift, intro)).toMatchObject({ narrativeBy: 'template (timeout)' });
  });
});

describe('words in sentences', () => {
  it('writes numbers under ten as words (copy rule 9)', () => {
    expect([inWords(0), inWords(8, true), inWords(10), inWords(14, true)]).toEqual(['zero', 'Eight', '10', '14']);
    expect(joinAnd(['10', '18'])).toBe('10 and 18');
    expect(joinAnd(['/a', '/b', '/c'])).toBe('/a, /b and /c');
  });
});
