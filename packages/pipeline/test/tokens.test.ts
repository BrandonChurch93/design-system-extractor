import { describe, expect, it } from 'vitest';
import type { ColorToken } from '@dse/schema';
import { parseCssColor } from '../src/color/parse';
import type { MatchedStyles } from '../src/capture/matched-css';
import { siteShadowNames } from '../src/stages/tokens';
import { buildColors, capClusters, classify, clusterColors, deterministicNames } from '../src/tokens/colors';
import { collect, emptyRaw, normalizeShadow, semanticContext, type RawColor, type RawRadius, type RawShadow, type RawSpace, type RawType } from '../src/tokens/collect';
import { COLOR_CAP, hueWord } from '../src/tokens/constants';
import { applyNames } from '../src/tokens/naming';
import { buildBreakpoints, buildRadius, buildShadows, buildSpace, inferBase } from '../src/tokens/space';
import { assignRoles, buildType } from '../src/tokens/type';
import { fakeCapture } from './helpers/capture';
import { snap, type El } from './helpers/snap';

const color = (hex: string, weight: number, semantic = 0): RawColor => ({ hex, rgba: parseCssColor(hex)!, weight, uses: { text: weight, background: 0, border: 0, other: 0 }, semantic, pages: new Map([['page0000', weight]]) });

describe('color clustering', () => {
  it('merges the six colors within ΔE 2 of each other and keeps the other fourteen apart', () => {
    const far = ['#000000', '#FFFFFF', '#808080', '#DC2626', '#15803D', '#B45309', '#0F8A8A', '#7C3AED', '#DB2777', '#0B1F3A', '#F59E0B', '#84CC16', '#06B6D4', '#C4C4C4'];
    const near = ['#2458E6', '#2559E7', '#2357E5', '#265AE6', '#2458E4', '#2459E8'];
    const clusters = clusterColors([...far.map((h, i) => color(h, 50 + i)), ...near.map((h, i) => color(h, 40 - i))]);
    expect(clusters).toHaveLength(15);
    const blue = clusters.find((k) => k.rep.hex === '#2458E6')!;
    expect(blue.members.map((m) => m.hex)).toEqual(near);
    expect(blue.members.reduce((s, m) => s + m.weight, 0)).toBe(40 + 39 + 38 + 37 + 36 + 35);
  });

  it('never merges a translucent color into its opaque base', () => {
    expect(clusterColors([color('#0B1F3A', 10), color('#0B1F3A1F', 5)])).toHaveLength(2);
  });
});

describe('the color cap', () => {
  const one = (hex: string, weight: number) => ({ rep: color(hex, weight), members: [color(hex, weight)] });
  it('keeps 80 clusters and merges the lightest into their nearest neighbors', () => {
    const blues = Array.from({ length: COLOR_CAP - 1 }, (_, i) => one(`#00${(i * 3).toString(16).padStart(2, '0').toUpperCase()}FF`, 100 + i));
    const { clusters, merged } = capClusters([one('#0000FE', 2), ...blues, one('#FF0000', 1000), one('#FE0202', 1)]);
    expect(merged).toBe(2);
    expect(clusters).toHaveLength(COLOR_CAP);
    expect(clusters.find((k) => k.rep.hex === '#FF0000')!.members.map((m) => m.hex)).toEqual(['#FF0000', '#FE0202']);
    expect(clusters.find((k) => k.rep.hex === '#0000FF')!.members.map((m) => m.hex)).toEqual(['#0000FF', '#0000FE']);
    expect(capClusters(blues).merged).toBe(0);
  });
});

describe('classification', () => {
  const one = (c: RawColor) => classify({ rep: c, members: [c] });
  it('calls low chroma neutral whatever its context', () => {
    expect(one(color('#E2E8F0', 10, 10))).toEqual({ group: 'neutral' });
  });
  it('makes a color semantic at 70% of uses in a semantic context, by hue band', () => {
    expect(one(color('#15803D', 10, 7))).toEqual({ group: 'semantic', semanticRole: 'success' });
    expect(one(color('#DC2626', 10, 9))).toEqual({ group: 'semantic', semanticRole: 'danger' });
    expect(one(color('#B45309', 10, 8))).toEqual({ group: 'semantic', semanticRole: 'warning' });
    expect(one(color('#2458E6', 10, 10))).toEqual({ group: 'semantic', semanticRole: 'info' });
    expect(one(color('#15803D', 10, 6))).toEqual({ group: 'brand' });
  });
  it('keeps a semantic-context color brand when its hue fits no band', () => {
    expect(one(color('#7C3AED', 10, 10))).toEqual({ group: 'brand' });
  });
  it('reads semantic context from classes, roles, invalid fields and the error text they point to', () => {
    const s = snap([
      { tag: 'body' },
      { tag: 'div', parent: 0, role: 'status' },
      { tag: 'span', parent: 1 },
      { tag: 'input', parent: 0, aria: { 'aria-invalid': 'true', 'aria-describedby': 'email-error' } },
      { tag: 'p', parent: 0 },
      { tag: 'span', parent: 0, cls: ['badge-new'] },
      { tag: 'p', parent: 0, cls: ['lead'] },
    ]);
    s.elements[4]!.id = 'email-error';
    expect([...semanticContext(s)].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('color names', () => {
  it('names by step and hue, takes a letter on collision, and uses role-step for repeated roles', () => {
    const items = [
      { rep: parseCssColor('#EBEBEB')!, group: 'neutral' as const },
      { rep: parseCssColor('#E8E8E8')!, group: 'neutral' as const },
      { rep: parseCssColor('#2458E6')!, group: 'brand' as const },
      { rep: parseCssColor('#DC2626')!, group: 'semantic' as const, semanticRole: 'danger' as const },
      { rep: parseCssColor('#7F1D1D')!, group: 'semantic' as const, semanticRole: 'danger' as const },
      { rep: parseCssColor('#15803D')!, group: 'semantic' as const, semanticRole: 'success' as const },
    ];
    const names = deterministicNames(items);
    expect(names).toEqual(['gray-100', 'gray-100b', 'blue-600', 'danger-500', 'danger-700', 'success']);
    expect(hueWord(195)).toBe('teal');
    expect(hueWord(264)).toBe('blue');
  });

  it('keeps model names only when they follow every rule', () => {
    const raw = emptyRaw();
    for (const c of [color('#2458E6', 30), color('#E2E8F0', 20), color('#0F8A8A', 10)]) raw.colors.set(c.hex, c);
    const tokens = buildColors(raw).tokens as ColorToken[];
    const [blue, teal, gray] = ['#2458E6', '#0F8A8A', '#E2E8F0'].map((h) => tokens.find((t) => t.value === h)!);
    const kept = applyNames(tokens, [
      { id: blue!.id, name: 'blue-action' },
      { id: teal!.id, name: 'accent' },
      { id: gray!.id, name: 'Gray Border' },
    ]);
    expect(kept).toBe(1);
    expect(tokens.map((t) => t.name).sort()).toEqual(['blue-action', 'gray-200', 'teal-500']);
    expect(applyNames(tokens, [{ id: teal!.id, name: 'blue-action' }])).toBe(0);
  });
});

describe('spacing', () => {
  const sp = (value: number, weight: number): RawSpace => ({ value, weight, contexts: { padding: weight, margin: 0, gap: 0, layout: 0 }, pages: new Map([['page0000', weight]]) });
  it('infers the base from 85% agreement, 8 before 4', () => {
    expect(inferBase([sp(8, 40), sp(16, 40), sp(24, 15), sp(12, 5)])).toEqual({ value: 8, clear: true });
    expect(inferBase([sp(4, 10), sp(8, 30), sp(12, 40), sp(16, 20)])).toEqual({ value: 4, clear: true });
    expect(inferBase([sp(5, 30), sp(10, 30), sp(12, 40)])).toEqual({ value: 4, clear: false });
  });
  it('keeps up to twelve on-grid steps and off-grid values above 2% flagged', () => {
    const raw = emptyRaw();
    for (const s of [...Array.from({ length: 14 }, (_, i) => sp((i + 1) * 4, 100 - i)), sp(10, 40), sp(21, 5)]) raw.space.set(s.value, s);
    const { space, spaceBase } = buildSpace(raw);
    expect(spaceBase).toEqual({ value: 4, clear: true });
    expect(space.filter((s) => s.onGrid).map((s) => s.value)).toEqual([4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48]);
    expect(space.filter((s) => !s.onGrid).map((s) => s.value)).toEqual([10]);
  });
});

describe('radius and breakpoints', () => {
  const r = (value: number, count: number): RawRadius => ({ value, isPill: value === 999, count, pages: new Map([['page0000', count]]) });
  it('keeps the six most used radii, ascending', () => {
    const raw = emptyRaw();
    for (const x of [r(2, 1), r(4, 9), r(6, 3), r(8, 20), r(12, 7), r(16, 2), r(24, 5), r(999, 4)]) raw.radius.set(x.value, x);
    const radius = buildRadius(raw);
    expect(radius.map((t) => t.value)).toEqual([4, 6, 8, 12, 24, 999]);
    expect(radius.find((t) => t.value === 999)!.isPill).toBe(true);
  });
  it('keeps the six most used breakpoints, ascending, the smaller width first on a tie', () => {
    const raw = emptyRaw();
    for (const [w, n] of [[640, 3], [768, 9], [1024, 9], [1280, 5], [1536, 1], [480, 2], [960, 2], [1440, 4]] as const) raw.breakpoints.set(w, n);
    expect(buildBreakpoints(raw)).toEqual([480, 640, 768, 1024, 1280, 1440]);
  });
});

describe('shadows', () => {
  const sh = (value: string, maxBlur: number, count: number): RawShadow => ({ value, maxBlur, count, pages: new Map([['page0000', count]]) });
  it('buckets more than three shadows by blur, merging the least used, and names them by blur', () => {
    const raw = emptyRaw();
    for (const s of [sh('0px 1px 2px 0px #0000001F', 2, 20), sh('0px 2px 4px 0px #0000001F', 4, 2), sh('0px 8px 16px 0px #0000001F', 16, 9), sh('0px 24px 48px 0px #0000001F', 48, 4)]) raw.shadows.set(s.value, s);
    const tokens = buildShadows(raw);
    expect(tokens.map((t) => [t.name, t.value, t.usage])).toEqual([
      ['sm', '0px 1px 2px 0px #0000001F', 22],
      ['md', '0px 8px 16px 0px #0000001F', 9],
      ['lg', '0px 24px 48px 0px #0000001F', 4],
    ]);
    expect(buildShadows(raw, new Map([['0px 8px 16px 0px #0000001F', 'raised']])).map((t) => t.name)).toEqual(['sm', 'raised', 'lg']);
  });
  it('takes a name only from a box-shadow that is exactly one custom property ending in shadow-{name}, last in the cascade', () => {
    const shadows = ['0px 1px 2px 0px', '0px 2px 4px 0px', '0px 3px 6px 0px', '0px 4px 8px 0px', '0px 5px 10px 0px', '0px 6px 12px 0px'].map((l) => `rgba(0, 0, 0, 0.1) ${l}`);
    const cap = fakeCapture([{ path: '/', desktop: snap([{ tag: 'body' }, ...shadows.map((v): El => ({ tag: 'div', parent: 0, style: { 'box-shadow': v } }))]) }]);
    const rule = (value: string) => ({ selector: '.x', matched: ['.x'], origin: 'regular', media: [], supports: [], declarations: [{ name: 'box-shadow', value, important: false }] });
    const plain = rule('0 1px 2px black');
    const matched: Record<string, MatchedStyles> = {
      e1: { rules: [rule('var(--shadow-sm)')], inline: [], pseudo: [] },
      e2: { rules: [rule('var(--ds-shadow-lg, 0 4px 8px red)')], inline: [], pseudo: [] },
      e3: { rules: [rule('var(--shadow-md), 0 0 0 1px red')], inline: [], pseudo: [] },
      e4: { rules: [rule('var(--elevation-2)')], inline: [], pseudo: [] },
      e5: { rules: [rule('var(--shadow-xl)'), plain], inline: [], pseudo: [] },
      e6: { rules: [plain], inline: [{ name: 'box-shadow', value: 'var(--shadow-card)', important: false }], pseudo: [] },
    };
    cap.pages[0]!.viewports.desktop!.matched = matched;
    const names = siteShadowNames(cap);
    expect(names).toEqual(new Map([[normalizeShadow(shadows[0]!), 'sm'], [normalizeShadow(shadows[1]!), 'lg'], [normalizeShadow(shadows[5]!), 'card']]));
  });
});

describe('type roles', () => {
  const t = (size: number, weight: number, tags: Record<string, number>, extra: Partial<RawType> = {}): RawType => ({ key: `${size}|${weight}`, family: 'Inter', fallbackStack: 'Inter, sans-serif', size, lineHeight: size * 1.5, weight, letterSpacing: 0, count: Object.values(tags).reduce((a, b) => a + b, 0), tags: new Map(Object.entries(tags)), pages: new Map(), sample: '', homeLargest: false, pageLargest: false, ...extra });
  it('assigns display, headings, code, body and the sizes below body', () => {
    const types = [t(48, 700, { h1: 1, p: 3 }, { homeLargest: true }), t(36, 700, { h1: 9 }), t(20, 600, { h3: 5, a: 9 }), t(16, 400, { p: 40 }), t(14, 400, { li: 10, td: 9 }), t(14, 600, { label: 8, button: 6 }), t(12, 400, { span: 9 }), t(14, 400, { code: 3 }, { family: 'ui-monospace', fallbackStack: 'ui-monospace, monospace' }), t(16, 500, { a: 12 })];
    const roles = assignRoles(types);
    expect(types.map((x) => roles.get(x))).toEqual(['display', 'h1', 'h3', 'body', 'body-sm', 'label', 'caption', 'code', 'other']);
  });
  it('keeps the 24 tuples with the most elements', () => {
    const raw = emptyRaw();
    for (let i = 0; i < 30; i++) {
      const x = t(10 + i, 400, { span: 3 + i });
      raw.type.set(x.key, x);
    }
    const usage = buildType(raw).tokens.map((x) => x.usage);
    expect(usage).toHaveLength(24);
    expect(Math.min(...usage)).toBe(9);
  });
  it('drops tuples under 3 elements unless a heading or the largest size on a page, never a menu', () => {
    const own = (tag: string, size: number, y: number): El => ({ tag, parent: 0, own: 'Text', box: [0, y, 300, 30], style: { 'font-size': `${size}px`, 'line-height': `${size * 1.5}px` } });
    const page = snap([{ tag: 'body', box: [0, 0, 1440, 3000] }, own('p', 16, 0), own('p', 16, 40), own('p', 16, 80), own('span', 14, 120), own('span', 14, 160), own('h5', 18, 200), own('div', 40, 240)]);
    const menu = snap([{ tag: 'body', box: [0, 0, 1440, 900] }, own('a', 60, 0)]);
    const base = { pageId: 'page0000', path: '/', isHome: true, viewport: 'desktop' as const, focusOutlines: [], media: [], fonts: [] };
    const raw = collect([
      { ...base, kind: 'page', snapshot: page },
      { ...base, kind: 'open', snapshot: menu },
    ]);
    expect(buildType(raw).tokens.map((x) => [x.size, x.usage])).toEqual([
      [40, 1],
      [18, 1],
      [16, 3],
    ]);
  });
});
