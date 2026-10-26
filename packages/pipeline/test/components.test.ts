import { describe, expect, it } from 'vitest';
import type { ColorToken } from '@dse/schema';
import type { StyleMap } from '../src/capture/snapshot';
import { classify } from '../src/components/classify';
import { classesAllowMerge, clusterItems, structureSimilarity } from '../src/components/cluster';
import { baseTokens, itemsFrom } from '../src/components/items';
import { fallbackNames, validName } from '../src/components/model';
import { nameVariants, splitVariants } from '../src/components/variants';
import { firstSeen } from '../src/stages/components';
import { fakeCapture } from './helpers/capture';
import { snap, type El } from './helpers/snap';

const body: El = { tag: 'body', box: [0, 0, 1440, 3000], style: { 'background-color': 'rgb(255, 255, 255)' } };
const pad = (v: number, h: number): Partial<StyleMap> => ({ 'padding-top': `${v}px`, 'padding-bottom': `${v}px`, 'padding-left': `${h}px`, 'padding-right': `${h}px` });
const radius = (r: number): Partial<StyleMap> => ({ 'border-top-left-radius': `${r}px`, 'border-top-right-radius': `${r}px`, 'border-bottom-right-radius': `${r}px`, 'border-bottom-left-radius': `${r}px` });
const border = (c: string): Partial<StyleMap> => ({ 'border-top-width': '1px', 'border-top-style': 'solid', 'border-top-color': c });

const blue = 'rgb(36, 88, 230)';
const white = 'rgb(255, 255, 255)';
const navy = 'rgb(11, 31, 58)';
const tokens = [
  { id: 'tokblue0', value: '#2458E6', group: 'brand' },
  { id: 'toknavy0', value: '#0B1F3A', group: 'brand' },
  { id: 'tokwhite', value: '#FFFFFF', group: 'neutral' },
  { id: 'tokgreen', value: '#15803D', group: 'semantic', semanticRole: 'success' },
  { id: 'tokamber', value: '#B45309', group: 'semantic', semanticRole: 'warning' },
  { id: 'tokred00', value: '#DC2626', group: 'semantic', semanticRole: 'danger' },
] as unknown as ColorToken[];

function button(cls: string[], text: string, y: number, size: 'md' | 'sm', look: 'primary' | 'secondary' | 'ghost', tag = 'a'): El {
  const h = size === 'md' ? 44 : 36;
  const style: Partial<StyleMap> = { display: 'inline-flex', ...pad(0, size === 'md' ? 20 : 16), ...radius(8), 'font-weight': '600', ...border('rgba(0, 0, 0, 0)') };
  if (look === 'primary') Object.assign(style, { 'background-color': blue, color: white });
  if (look === 'secondary') Object.assign(style, { 'background-color': white, color: blue, ...border(blue) });
  if (look === 'ghost') Object.assign(style, { color: navy });
  return { tag, parent: 0, cls, text, box: [184, y, 120, h], style };
}

const buttonPage = (y0: number): El[] => [
  body,
  ...(['primary', 'primary', 'primary', 'secondary', 'secondary', 'ghost', 'ghost'] as const).map((look, i) => button(['btn', `btn-${look}`], `Go ${i}`, y0 + i * 60, 'md', look)),
  ...(['primary', 'secondary', 'ghost'] as const).map((look, i) => button(['btn', `btn-${look}`, 'btn-sm'], `Small ${i}`, y0 + 600 + i * 60, 'sm', look)),
];

describe('clustering', () => {
  it('splits a 3 colors × 2 sizes button set into the six variant names of the spec', () => {
    const items = itemsFrom(fakeCapture([{ path: '/', desktop: snap(buttonPage(100)) }]));
    const clusters = clusterItems(items);
    expect(clusters).toHaveLength(1);
    const variants = splitVariants(clusters[0]!.items);
    nameVariants(variants, tokens);
    expect(variants.map((v) => v.name).sort()).toEqual(['Ghost', 'Ghost small', 'Primary', 'Primary small', 'Secondary', 'Secondary small']);
  });

  it('merges the same nav on four pages into one component with four pages of provenance', () => {
    const nav = (): El[] => [body, { tag: 'nav', parent: 0, cls: ['nav-links'], box: [400, 14, 400, 44], style: { display: 'flex' } }, ...['Product', 'Pricing', 'Docs'].map((t, i) => ({ tag: 'a', parent: 1, text: t, own: t, box: [400 + i * 100, 24, 80, 22] as [number, number, number, number] }))];
    const capture = fakeCapture(['/', '/pricing', '/docs', '/contact'].map((path) => ({ path, desktop: snap(nav()) })));
    const navs = clusterItems(itemsFrom(capture)).filter((c) => c.items[0]!.el.tag === 'nav');
    expect(navs).toHaveLength(1);
    expect(new Set(navs[0]!.items.map((i) => i.page.path))).toEqual(new Set(['/', '/pricing', '/docs', '/contact']));
    expect(firstSeen(navs[0]!.items).page.path).toBe('/');
  });

  it('keeps identical classes together on a utility site and merges hashed classes with equal styles', () => {
    const tw = (cls: string[]): El[] => [body, { ...button(cls, 'Start', 100, 'md', 'primary') }, { ...button(['x'], 'Free', 200, 'md', 'primary') }];
    const utility = clusterItems(itemsFrom(fakeCapture([{ path: '/', desktop: snap(tw(['inline-flex', 'h-11', 'px-5', 'bg-blue-600'])) }], 'tailwind')));
    expect(utility.filter((c) => c.items[0]!.el.tag === 'a')).toHaveLength(1);
    const hashed: El[] = [body, button(['css-1a2b3c4'], 'Start', 100, 'md', 'primary'), button(['sc-AxjAm'], 'Free', 200, 'md', 'primary')];
    expect(clusterItems(itemsFrom(fakeCapture([{ path: '/', desktop: snap(hashed) }]))).filter((c) => c.items[0]!.el.tag === 'a')).toHaveLength(1);
  });

  it('keeps a button inside a card as its own component', () => {
    const els: El[] = [body, { tag: 'article', parent: 0, cls: ['card'], text: 'Weekly digests Start', box: [184, 100, 340, 200], style: { ...border('rgb(226, 232, 240)'), ...radius(12) } }, { tag: 'h3', parent: 1, own: 'Weekly digests', text: 'Weekly digests', box: [208, 124, 200, 28] }, { tag: 'p', parent: 1, own: 'Every Friday.', text: 'Every Friday.', box: [208, 160, 200, 26] }, { ...button(['btn', 'btn-primary'], 'Start', 240, 'md', 'primary'), parent: 1 }];
    const clusters = clusterItems(itemsFrom(fakeCapture([{ path: '/', desktop: snap(els) }])));
    expect(clusters.map((c) => c.items[0]!.el.tag).sort()).toEqual(['a', 'article']);
  });

  it('puts a pill badge set in three semantic colors into one component with three variants', () => {
    const badge = (c: string, text: string, x: number): El => ({ tag: 'span', parent: 1, cls: ['badge', `badge-${text.toLowerCase()}`], text, own: text, box: [x, 100, 90, 24], style: { display: 'inline-flex', 'background-color': c, color: white, ...radius(999), ...pad(0, 8) } });
    const els: El[] = [body, { tag: 'div', parent: 0, box: [184, 100, 1072, 24], style: { display: 'flex' } }, badge('rgb(21, 128, 61)', 'Operational', 184), badge('rgb(180, 83, 9)', 'Delayed', 290), badge('rgb(220, 38, 38)', 'Down', 400)];
    const clusters = clusterItems(itemsFrom(fakeCapture([{ path: '/', desktop: snap(els) }])));
    expect(clusters).toHaveLength(1);
    const variants = splitVariants(clusters[0]!.items);
    nameVariants(variants, tokens);
    expect(variants.map((v) => v.name).sort()).toEqual(['Danger', 'Success', 'Warning']);
    expect(classify(clusters[0]!.items)).toEqual({ type: 'badge', confidence: 0.7 });
  });

  it('reads modifier classes and class roots', () => {
    expect(baseTokens(['btn', 'btn-primary', 'btn-sm'])).toEqual(['btn']);
    expect(baseTokens(['card', 'pricing-card', 'pricing-card--featured'])).toEqual(['card', 'pricing-card']);
    expect(baseTokens(['button', 'is-primary', 'is-fullwidth'])).toEqual(['button']);
    expect(classesAllowMerge(['pagination-link'], ['pagination-previous'])).toBe(true);
    expect(classesAllowMerge(['nav-links'], ['footer-links'])).toBe(false);
    expect(structureSimilarity('h3:1 p:1 span:2 svg:1', 'h3:1 p:1 span:1 svg:1')).toBeCloseTo(0.8);
  });
});

describe('rule classification', () => {
  const one = (el: El, extra: El[] = [], reason?: 'home' | 'empty-state') => {
    const items = itemsFrom(fakeCapture([{ path: '/', reason, desktop: snap([body, el, ...extra]) }]));
    const target = items.find((i) => i.el.index === 1);
    return target ? classify([target]) : null;
  };
  it.each<[string, El, string, El[]?]>([
    ['toggle', { tag: 'button', parent: 0, role: 'switch', aria: { 'aria-checked': 'false' }, box: [0, 0, 52, 44] }, 'toggle'],
    ['button', { tag: 'button', parent: 0, text: 'Send', box: [0, 0, 80, 44] }, 'button'],
    ['button-like link', button(['btn'], 'Start free', 0, 'md', 'primary'), 'button'],
    ['long styled link', button(['pill'], 'What changed this week', 0, 'md', 'secondary'), 'link'],
    ['input', { tag: 'input', parent: 0, box: [0, 0, 300, 44] }, 'input'],
    ['select', { tag: 'select', parent: 0, box: [0, 0, 300, 44] }, 'select'],
    ['textarea', { tag: 'textarea', parent: 0, box: [0, 0, 300, 120] }, 'textarea'],
    ['breadcrumb', { tag: 'nav', parent: 0, aria: { 'aria-label': 'Breadcrumb' }, box: [0, 100, 600, 22] }, 'breadcrumb'],
    ['pagination', { tag: 'nav', parent: 0, aria: { 'aria-label': 'pagination' }, box: [0, 100, 600, 44] }, 'pagination'],
    ['tabs', { tag: 'div', parent: 0, role: 'tablist', box: [0, 100, 600, 45], style: border('rgb(226, 232, 240)') }, 'tabs', [{ tag: 'button', parent: 1, role: 'tab', text: 'A' }, { tag: 'button', parent: 1, role: 'tab', text: 'B' }]],
    ['nav', { tag: 'nav', parent: 0, box: [0, 100, 600, 44] }, 'nav'],
    ['header', { tag: 'header', parent: 0, box: [0, 0, 1440, 73] }, 'header'],
    ['footer', { tag: 'footer', parent: 0, box: [0, 2800, 1440, 157] }, 'footer'],
    ['table', { tag: 'table', parent: 0, box: [0, 100, 600, 160] }, 'table'],
    ['code block', { tag: 'pre', parent: 0, box: [0, 100, 600, 98] }, 'code-block'],
    ['avatar', { tag: 'img', parent: 0, box: [0, 100, 40, 40], style: radius(20) }, 'avatar'],
  ])('%s', (_name, el, type, extra) => {
    expect(one(el, extra)?.type).toBe(type);
  });
  it('types an alert, a hero, an empty state and a card from their content', () => {
    const container = (cls: string[], h: number, role?: string): El => ({ tag: 'div', parent: 0, cls, role, text: 'Heading Some text Go', box: [184, 100, 1072, h], style: border('rgb(226, 232, 240)') });
    const kids = (heading: string, size = 20): El[] => [{ tag: 'svg', parent: 1, box: [200, 120, 24, 24] }, { tag: 'h2', parent: 1, own: heading, text: heading, box: [240, 120, 400, 36], style: { 'font-size': `${size}px`, 'font-weight': '700' } }, { tag: 'p', parent: 1, own: 'Some text', text: 'Some text', box: [240, 160, 400, 26] }];
    expect(one(container(['alert'], 80), kids('Saved'))?.type).toBe('alert');
    expect(one({ ...container(['hero'], 500), box: [0, 60, 1440, 500] }, kids('Release notes', 48), 'home')?.type).toBe('hero');
    expect(one(container(['missing'], 300), [...kids('Not here'), { tag: 'a', parent: 1, text: 'Home', href: true, box: [240, 200, 80, 44] }], 'empty-state')?.type).toBe('empty-state');
    expect(one(container(['card'], 200), kids('Weekly digests'))?.type).toBe('card');
  });
});

describe('fallback names', () => {
  it('uses the type label, numbered from the second of a type', () => {
    expect(fallbackNames([{ guess: { type: 'card', confidence: 0.6 } }, { guess: { type: 'button', confidence: 0.95 } }, { guess: { type: 'card', confidence: 0.6 } }])).toEqual(['Card', 'Button', 'Card 2']);
  });
  it('accepts sentence-case names of one to three words and nothing else', () => {
    for (const ok of ['Button', 'Pricing card', 'Status badge', 'Site header']) expect(validName(ok), ok).toBe(true);
    for (const bad of ['', 'primary button', 'A very long name here', 'Card\u2014big', 'Card - big', 'Accessible button']) expect(validName(bad), bad).toBe(false);
  });
});
