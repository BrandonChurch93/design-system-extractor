import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ColorToken, Evidence, RunConfig, SpaceToken, Tokens, TypeToken } from '@dse/schema';
import { contrastRatio } from '../src/color/contrast';
import { oklabToOklch, parseCssColor, rgbToOklab } from '../src/color/parse';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { collapseDelta, EVIDENCE_CAP, evidenceRows, nearDuplicateColors, rawSpread, spacingFindings, sprawlEvidence, typeNearDuplicates, type Findings } from '../src/drift/findings';
import { factNumbers, fallbackIntro, fallbackNarrative, rejectReason, writeNarrative } from '../src/drift/narrative';
import { proposeColors, proposeDurations, proposeEasings, proposeSpacing, proposeType } from '../src/drift/proposal';
import { headlineAndSupport, inWords, joinAnd, numbersOf, type Facts } from '../src/drift/report';
import { ModelClient, type ModelClientOptions } from '../src/models/client';
import { drift } from '../src/stages/drift';
import { fakeCapture } from './helpers/capture';

const sp = (value: number, usage: number, onGrid = true): SpaceToken => ({ id: `s${value}`, value, onGrid, usage, pages: [{ pageId: 'p1', count: usage }], contexts: { padding: usage, margin: 0, gap: 0, layout: 0 } });
const ty = (size: number, lineHeight: number, weight = 400, usage = 10): TypeToken => ({ id: `t${size}-${lineHeight}-${weight}`, name: `t${size}-${lineHeight}`, role: 'text', family: 'Inter', fallbackStack: 'Inter', size, lineHeight, weight, letterSpacing: 0, uppercase: false, tags: [], usage, pages: [], sample: '' });

const color = (id: string, hex: string, usage: number, group: ColorToken['group'] = 'neutral', pages = ['p1']): ColorToken => {
  const o = oklabToOklch(rgbToOklab(parseCssColor(hex)!));
  return { id, name: id, value: hex, oklch: { l: o.l, c: o.c, h: o.h }, group, usage, uses: { text: usage, background: 0, border: 0, other: 0 }, pages: pages.map((pageId) => ({ pageId, count: 1 })), rawValues: [{ value: hex, count: usage }], contrastPairs: [] };
};

const config: RunConfig = { url: 'https://t.app/', include: [], pageCap: 12, viewports: ['desktop'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [], timeoutMs: 60_000, keepIntermediate: false, byo: false };
const ctxWith = (opts: Partial<ModelClientOptions>) => {
  const dir = mkdtempSync(join(tmpdir(), 'dse-narrative-'));
  return new MemoryRunContext('abc123def4', config, new ModelClient({ mode: 'live', recordingsDir: dir, ...opts }), new LocalStorage(dir), { id: 'abc123def4', url: config.url, host: 't.app', status: 'running', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop'] });
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
    const pairs = typeNearDuplicates([ty(16, 26, 400, 50), ty(15, 22, 400, 5), ty(14, 22, 400, 30), ty(14, 20, 600), ty(12, 16)]);
    expect(pairs.map((p) => [p.a.size, p.b.size])).toEqual([
      [16, 15],
      [14, 15],
    ]);
  });

  it('writes raw spread as evidence only when a token absorbed four or more raw values', () => {
    const gray = color('g', '#6B6B6B', 30);
    gray.rawValues = ['#6B6B6B', '#6A6A6A', '#6C6C6C', '#6B6B6C'].map((value) => ({ value, count: 5 }));
    const three = color('h', '#2B2B2B', 9);
    three.rawValues = ['#2B2B2B', '#2A2A2A', '#2C2C2C'].map((value) => ({ value, count: 3 }));
    expect(rawSpread([gray, three], new Map([['p1', '/']]))).toEqual([{ a: '#6B6B6B', b: '#6B6B6B, #6A6A6A, #6C6C6C, #6B6B6C', delta: 'written 4 ways', kind: 'color', pages: ['/'], usesA: 30, usesB: 0, evidenceOnly: true }]);
  });

  it('reports more than four radii and more than three shadows as sprawl', () => {
    const radius = (value: number, isPill = false) => ({ id: `r${value}`, value, isPill, usage: 2, pages: [] });
    const shadow = (name: string) => ({ id: `sh${name}`, name, value: '0 1px 2px #0000001F', usage: 3, pages: [] });
    const tokens = (radii: number[], shadows: number) => ({ radius: radii.map((v) => radius(v, v === 9999)), shadow: ['sm', 'md', 'lg'].map(shadow), rawCounts: { shadows } }) as unknown as Tokens;
    expect(sprawlEvidence(tokens([4, 6, 8, 10, 12], 7)).map((e) => [e.kind, e.a, e.b, e.delta, e.usesA, e.evidenceOnly])).toEqual([
      ['sprawl', '5 radii', '4, 6, 8, 10, 12', '5 radii', 10, false],
      ['sprawl', '7 shadows', 'merged into 3', '7 shadows merged into 3', 9, false],
    ]);
    expect(sprawlEvidence(tokens([4, 8, 12, 9999], 3))).toEqual([]);
  });
});

describe('motion sprawl', () => {
  const dur = (ms: number, usage: number) => ({ id: `d${ms}`, name: `duration-${ms}`, ms, usage, pages: [], rawValues: [`${ms}ms`] });
  const ease = (name: string, value: string, usage: number) => ({ id: `e${name}`, name, value, usage, pages: [], usedBy: { componentTypes: [], patternKinds: [] } });
  const nine = [100, 120, 150, 160, 200, 250, 300, 400, 500].map((ms) => dur(ms, ms === 160 ? 400 : ms === 150 ? 2 : 40));
  const seven = [ease('ease-out-quad', 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', 90), ease('ease-custom-1', 'cubic-bezier(0.25, 0.45, 0.45, 0.95)', 4), ease('ease-custom-2', 'cubic-bezier(0.26, 0.47, 0.44, 0.93)', 3), ease('ease-custom-3', 'cubic-bezier(0.24, 0.46, 0.46, 0.94)', 2), ease('ease', 'ease', 30), ease('linear', 'linear', 20), ease('ease-in-out', 'ease-in-out', 10)];

  it('reports more than six durations and more than five easings as sprawl, never more', () => {
    const rows = sprawlEvidence({ radius: [], shadow: [], rawCounts: { shadows: 0 }, duration: nine, easing: seven } as unknown as Tokens);
    expect(rows.map((e) => [e.kind, e.delta])).toEqual([
      ['sprawl', '9 durations: 100, 120, 150, 160, 200, 250, 300, 400, 500 ms'],
      ['sprawl', '7 easings, 3 within 0.05 of ease-out-quad'],
    ]);
    expect(sprawlEvidence({ radius: [], shadow: [], rawCounts: { shadows: 0 }, duration: nine.slice(0, 6), easing: seven.slice(0, 5) } as unknown as Tokens)).toEqual([]);
  });

  it('proposes the durations without the rare near ones and the easings folded into the most used', () => {
    const d = proposeDurations({ duration: nine });
    expect(d.map((x) => x.ms)).toEqual([100, 120, 160, 200, 250, 300, 400, 500]);
    expect(d.find((x) => x.ms === 160)).toMatchObject({ role: 'base', absorbs: ['duration-160', 'duration-150'] });
    const e = proposeEasings({ easing: seven });
    expect(e.map((x) => x.name)).toEqual(['ease-out-quad', 'ease', 'linear', 'ease-in-out']);
    expect(e[0]!.absorbs).toEqual(['ease-out-quad', 'ease-custom-1', 'ease-custom-2', 'ease-custom-3']);
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
  it('proposes the on-grid spacing steps, dropping the less used member of a near-step', () => {
    const tokens = { space: [sp(8, 400), sp(10, 40, false), sp(12, 300), sp(40, 3), sp(44, 2), sp(64, 200)], spaceBase: { value: 4, clear: true } } as unknown as Tokens;
    expect(proposeSpacing(tokens, { spacing: spacingFindings(tokens, new Map()) } as Findings)).toEqual([8, 12, 40, 64]);
  });
  it('merges near-duplicate type styles into the more used one', () => {
    const type = [ty(16, 26, 400, 50), ty(15, 22, 400, 5), ty(14, 22, 400, 30), ty(14, 20, 600)];
    const out = proposeType({ type } as Tokens, { type: typeNearDuplicates(type) } as Findings);
    expect(out.map((t) => [t.name, t.absorbs])).toEqual([
      ['t16-26', ['t16-26', 't15-22']],
      ['t14-22', ['t14-22']],
      ['t14-20', ['t14-20']],
    ]);
  });
});

describe('numbers, headline and evidence', () => {
  const facts: Facts = {
    grays: { before: 14, after: 5, pages: 12, within: 4.2, involved: 8 },
    variants: { before: 6, after: 3, components: 31, affected: 2, involved: 3, delta: '1 px of padding or a 2 px radius' },
    spacing: { before: 9, after: 7, offGrid: 2, base: 4, values: [10, 18], pages: ['/', '/pricing'] },
    type: { before: 10, after: 9, involved: 2 },
  };
  it('orders up to three numbers by relative reduction, with captions from the templates', () => {
    expect(numbersOf(facts)).toEqual([
      { kind: 'grays', before: 14, after: 5, caption: 'Eight are within ΔE 4.2 of a neighbor. Nobody can tell them apart.' },
      { kind: 'variants', before: 6, after: 3, caption: 'Three differ only by 1 px of padding or a 2 px radius.' },
      { kind: 'spacing', before: 9, after: 7, caption: 'Two sit off the 4 px grid: 10 and 18, on / and /pricing.' },
    ]);
    const fewer: Facts = { ...facts, grays: { ...facts.grays, after: 14 }, variants: { ...facts.variants, after: 6 }, spacing: { ...facts.spacing, pages: ['/', '/a', '/b', '/c'] } };
    expect(numbersOf(fewer)).toEqual([
      { kind: 'spacing', before: 9, after: 7, caption: 'Two sit off the 4 px grid: 10 and 18, on four pages.' },
      { kind: 'type', before: 10, after: 9, caption: 'Two differ by 1 px or less in size or line height.' },
    ]);
  });
  it('renders the first as the headline and the next two as supporting sentences', () => {
    const tokens = { colors: [], space: [] } as unknown as Tokens;
    expect(headlineAndSupport(tokens, numbersOf(facts), facts)).toEqual({
      headline: { kind: 'grays', before: 14, after: 5, sentence: '14 grays across 12 pages. 5 would do.' },
      supporting: ['Six variants across 31 components where three would do.', 'Nine spacing values, two of them off the 4 px grid.'],
    });
    const typeFirst = numbersOf({ ...facts, grays: { ...facts.grays, after: 14 }, variants: { ...facts.variants, after: 6 }, spacing: { ...facts.spacing, after: 9 }, type: { before: 10, after: 4, involved: 6 } });
    expect(headlineAndSupport(tokens, typeFirst, facts).headline.sentence).toBe('10 type styles where 4 would do.');
  });

  it('orders evidence by kind with raw spread last, and caps the rows at 40', () => {
    const [a, b] = [color('a', '#F5F5F5', 4), color('b', '#F0F0F0', 2)];
    const row = (n: number): Evidence => ({ a: `#00000${n % 10}`, b: '', delta: 'written 4 ways', kind: 'color', pages: [], usesA: 1, usesB: 0, evidenceOnly: true });
    const f: Findings = {
      colors: [{ a, b, delta: 1.2, pages: ['/'] }],
      collapses: [{ componentId: 'comp0001', keep: 'vari0001', merge: ['vari0002'], delta: 'padding 2 px', componentName: 'Button', keepName: 'Primary', mergeNames: ['Primary 2'], parts: { padding: 2, radius: 0, fontSize: 0, color: false } }],
      spacing: [{ value: 10, nearest: 8, pages: ['/'], uses: 40, nearUses: 400, kind: 'off-grid' }],
      type: [{ a: ty(16, 26, 400, 50), b: ty(15, 22, 400, 5) }],
      sprawl: [{ a: '5 radii', b: '4, 6, 8, 10, 12', delta: '5 radii', kind: 'sprawl', pages: [], usesA: 10, usesB: 0, evidenceOnly: false }],
      spread: Array.from({ length: 40 }, (_, i) => row(i)),
    };
    const rows = evidenceRows(f);
    expect(rows).toHaveLength(EVIDENCE_CAP);
    expect(rows.slice(0, 6).map((r) => [r.kind, r.a, r.b, r.delta, r.evidenceOnly])).toEqual([
      ['color', '#F5F5F5', '#F0F0F0', 'ΔE 1.2', false],
      ['variant', 'Button · Primary', 'Primary 2', 'padding 2 px', false],
      ['spacing', '10 px', '8 px', '2 px', false],
      ['type', 't16-26', 't15-22', '1 px', false],
      ['sprawl', '5 radii', '4, 6, 8, 10, 12', '5 radii', false],
      ['color', '#000000', '', 'written 4 ways', true],
    ]);
  });
});

describe('the drift stage', () => {
  it('logs a drifting run as before and after per number, and a template narrative as such', async () => {
    const page = 'page0000';
    const grays: [string, number][] = [['#FFFFFF', 20], ['#EBEBEB', 39], ['#B2B2B2', 40], ['#767676', 7], ['#545454', 44], ['#343434', 14], ['#2B2B2B', 13]];
    const tokens = {
      colors: grays.map(([h, u], i) => color(`gray${i}`, h, u, 'neutral', [page])),
      type: [],
      space: [sp(8, 400), sp(10, 40, false), sp(12, 300), sp(16, 200)].map((t) => ({ ...t, pages: [{ pageId: page, count: t.usage }] })),
      spaceBase: { value: 4, clear: true },
      radius: [],
      shadow: [],
      breakpoints: [],
      overlays: [],
      duration: [],
      easing: [],
      keyframes: [],
      siteVariables: [],
      rawCounts: { colors: 7, fontDecls: 0, spacingValues: 4, radii: 0, shadows: 0 },
      families: [],
    } as Tokens;
    const ctx = ctxWith({
      transport: async () => {
        throw Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
      },
    });
    const out = await drift(ctx, fakeCapture([{ path: '/' }]), tokens, [], new Map(), 't.app');
    expect(out.numbers.map((n) => [n.kind, n.before, n.after])).toEqual([
      ['grays', 7, 5],
      ['spacing', 4, 3],
    ]);
    expect(ctx.events.map((e) => e.message)).toEqual(['drift · 7 grays → 5 · 4 spacing → 3 · contrast kept', 'drift · narrative by template (timeout)']);
  });
});

describe('the narrative', () => {
  const facts = { host: 'tidewater.app', pages: 12, colors: 23, numbers: [{ kind: 'grays', before: 14, after: 8, caption: 'Eight are within ΔE 6.0 of a neighbor.' }] };
  const numbers = factNumbers(facts);
  it('rejects an invented number, a dash, an exclamation mark, a scolding or forbidden word, and a wrong length', () => {
    expect(rejectReason('The palette has 14 grays. Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBeNull();
    expect(rejectReason('The palette has 15 grays. Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBe('an invented number 15');
    expect(rejectReason('The palette has 14 grays \u2014 eight would do. Two are close. More. The set keeps contrast.', numbers, [4, 6])).toBe('a dash');
    expect(rejectReason('The palette is messy. Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBe('a scolding word');
    expect(rejectReason('An accessible palette. Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBe('a forbidden word');
    expect(rejectReason('Short.', numbers, [4, 6])).toBe('1 sentences');
    expect(rejectReason('The palette has 14 grays! Eight would do. Two are close. The set keeps contrast.', numbers, [4, 6])).toBe('an exclamation mark');
    expect(rejectReason('It was extracted from tidewater.app across 12 pages. It holds 23 colors.', numbers, [2, 2])).toBeNull();
  });

  it('falls back to templates with no dash and no forbidden word', () => {
    const narrative = fallbackNarrative({ headline: { kind: 'grays', before: 14, after: 8, sentence: '14 grays across 12 pages. 8 would do.' }, supporting: ['Two spacing values, two of them off the 4 px grid.'] });
    expect(narrative).toBe('14 grays across 12 pages. 8 would do. Two spacing values, two of them off the 4 px grid. The proposed set keeps every passing contrast ratio.');
    const intro = fallbackIntro({ host: 'tidewater.app', date: 'October 26, 2026', colors: 23, typeStyles: 10, spacingSteps: 13, components: 31, pages: 12 });
    expect(intro).toBe('This design system was extracted from tidewater.app on October 26, 2026: 23 colors, 10 type styles, 13 spacing steps and 31 components across 12 pages.');
    for (const t of [narrative, intro]) expect(t).not.toMatch(/[‒-―]|\b(accessible|compliant|a11y)\b/i);
  });

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
