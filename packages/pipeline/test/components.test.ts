import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { ComponentGroup, type ColorToken, type RunConfig } from '@dse/schema';
import type { StyleMap } from '../src/capture/snapshot';
import { classify } from '../src/components/classify';
import { classesAllowMerge, clusterItems, structureSimilarity, toneOnly } from '../src/components/cluster';
import { baseTokens, itemsFrom } from '../src/components/items';
import { fallbackNames, validName } from '../src/components/model';
import { endsInDigit, ordinal, pageSegment, slugsOf, uniqueNames } from '../src/components/naming';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { ModelClient, type ModelClientOptions } from '../src/models/client';
import { nameVariants, splitVariants } from '../src/components/variants';
import type { CaptureOutput } from '../src/stages/capture';
import type { ExtractedTokens } from '../src/stages/tokens';
import { COMPONENT_CAP, components, firstSeen, tiersOf } from '../src/stages/components';
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
    const variants = nameVariants(splitVariants(clusters[0]!.items), tokens);
    expect(variants.map((v) => v.name).sort()).toEqual(['Ghost', 'Ghost small', 'Primary', 'Primary small', 'Secondary', 'Secondary small']);
  });

  it('names two ghost buttons that differ only in radius Ghost and Ghost rounded, never with a number', () => {
    const page = [body, ...[0, 1, 2].map((i) => button(['btn'], `Go ${i}`, 100 + i * 60, 'md', 'ghost')), ...[0, 1].map((i) => ({ ...button(['btn'], `Pill ${i}`, 400 + i * 60, 'md', 'ghost'), style: { ...button(['btn'], '', 0, 'md', 'ghost').style, ...radius(22) } }))];
    const variants = nameVariants(splitVariants(clusterItems(itemsFrom(fakeCapture([{ path: '/', desktop: snap(page) }])))[0]!.items), tokens);
    expect(variants.map((v) => v.name)).toEqual(['Ghost', 'Ghost rounded']);
  });

  it('merges variants that differ in nothing a word can name', () => {
    const page = [body, ...[0, 1, 2].map((i) => button(['btn'], `Go ${i}`, 100 + i * 60, 'md', 'ghost')), ...[0, 1].map((i) => ({ ...button(['btn'], `Wide ${i}`, 400 + i * 60, 'md', 'ghost'), style: { ...button(['btn'], '', 0, 'md', 'ghost').style, 'font-weight': '600', 'background-color': 'rgba(0, 0, 0, 0)', color: 'rgb(11, 31, 59)' } }))];
    const variants = nameVariants(splitVariants(clusterItems(itemsFrom(fakeCapture([{ path: '/', desktop: snap(page) }])))[0]!.items), tokens);
    expect(variants.map((v) => [v.name, v.items.length])).toEqual([['Default', 5]]);
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

  it('calls two notice boxes one tone apart when only their colors differ', () => {
    const box = { background: '#FFF7E6', borderWidth: 1, borderStyle: 'solid', borderColor: '#E8A317', radius: 8, padding: [12, 16, 12, 16], fontSize: 14, fontWeight: 400, display: 'flex', shadow: false, textTransform: 'none' };
    expect(toneOnly(box, { ...box, background: '#E7F6EC', borderColor: '#1F9D55' })).toBe(true);
    expect(toneOnly(box, { ...box, padding: [16, 20, 16, 20] })).toBe(false);
    expect(toneOnly(box, { ...box, radius: 12 })).toBe(false);
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
  it('uses the type label, never a number', () => {
    expect(fallbackNames([{ guess: { type: 'card', confidence: 0.6 } }, { guess: { type: 'button', confidence: 0.95 } }, { guess: { type: 'card', confidence: 0.6 } }])).toEqual(['Card', 'Button', 'Card']);
  });
  it('gives a repeated name its context: the landmark, a section heading, the page; then an ordinal word', () => {
    const page = snap([body, { tag: 'header', parent: 0 }, { tag: 'button', parent: 1 }, { tag: 'footer', parent: 0 }, { tag: 'button', parent: 3 }, { tag: 'section', parent: 0 }, { tag: 'h2', parent: 5, text: 'Pricing for teams' }, { tag: 'button', parent: 5 }, { tag: 'button', parent: 0 }, { tag: 'button', parent: 3 }]);
    const items = itemsFrom(fakeCapture([{ path: '/', desktop: page }, { path: '/docs/start.html', desktop: page }]));
    const at = (pageOrder: number, index: number) => items.find((it) => it.page.order === pageOrder && it.el.index === index)!;
    const list = [at(0, 2), at(0, 4), at(0, 7), at(1, 8), at(0, 9), at(0, 8)].map((first) => ({ name: 'Button', first }));
    list.push({ name: 'Step 2', first: at(0, 8) });
    const renamed = uniqueNames(list);
    expect(list.map((x) => x.name)).toEqual(['Button', 'Button (footer)', 'Button (pricing for)', 'Button (start)', 'Button (footer, home)', 'Button (home)', 'Step (home)']);
    expect(renamed).toEqual([{ from: 'Step 2', to: 'Step (home)' }]);
    expect(list.every((x) => !endsInDigit(x.name))).toBe(true);
    expect(pageSegment('/docs/getting-started/')).toBe('getting started');
    expect(pageSegment('/blog/release_notes.html')).toBe('release notes');
    // The synthetic missing page is context, never its probe path (D-105).
    expect(pageSegment('/8780d3aa06-does-not-exist')).toBe('404 page');
    expect(pageSegment('/docs/8780d3aa06-does-not-exist')).toBe('404 page');
    expect(pageSegment('/how-it-does-not-exist')).toBe('how it does not exist');
    expect(ordinal(2)).toBe('second');
    expect(ordinal(21)).toBe('twenty first');
    expect(ordinal(140)).toBe('one hundred fortieth');
  });
  it('makes slugs unique, kebab case, with an ordinal word for a repeat', () => {
    expect(slugsOf(['Primary button', 'Button (footer)', 'Primary button'])).toEqual(['primary-button', 'button-footer', 'primary-button-second']);
  });
  it('tiers: core on two pages, three on one, or the most used of a control type; else page-specific', () => {
    const c = (type: string, pages: number[]) => ({ type, provenance: { firstSeen: {}, pages: pages.map((count, i) => ({ pageId: `p${i}`, path: '/', count })) } }) as unknown as Parameters<typeof tiersOf>[0][number];
    expect(tiersOf([c('card', [1, 1]), c('card', [3]), c('card', [1]), c('button', [2]), c('button', [1]), c('tooltip', [1])])).toEqual(['core', 'core', 'page', 'core', 'page', 'core']);
  });
  it('accepts sentence-case names of one to three words and nothing else', () => {
    for (const ok of ['Button', 'Pricing card', 'Status badge', 'Site header']) expect(validName(ok), ok).toBe(true);
    for (const bad of ['', 'primary button', 'A very long name here', 'Card\u2014big', 'Card - big', 'Accessible button']) expect(validName(bad), bad).toBe(false);
  });
});

describe('the components stage', () => {
  const config: RunConfig = { url: 'https://t.app/', include: [], pageCap: 12, viewports: ['desktop'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [], timeoutMs: 360_000, keepIntermediate: false, byo: false };
  const stageTokens = { colors: tokens, type: [], space: [], spaceBase: { value: 4, clear: true }, radius: [], shadow: [], breakpoints: [], rawCounts: { colors: 0, fontDecls: 0, spacingValues: 0, radii: 0, shadows: 0 }, families: [] } as unknown as ExtractedTokens;
  const png = PNG.sync.write(new PNG({ width: 144, height: 300 }));
  const usage = { input_tokens: 100, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };

  /** Names every item `Item {id}` unless `name` says otherwise; types unsure guesses as `retype` says. */
  function namer(name: (line: string) => string | undefined, retype: (guess: string) => string = (g) => g): ModelClientOptions['transport'] {
    return async (req) => {
      const text = req.content.map((b) => (b.type === 'text' ? b.text : '')).join('\n');
      if (text.startsWith('Pairs:')) return { text: JSON.stringify({ pairs: [] }), usage };
      const items = [...text.matchAll(/^(c\d+) guess (\S+) .*$/gm)].map((m) => ({ id: m[1]!, type: retype(m[2]!), name: name(m[0]) ?? `Item ${m[1]!.slice(1)}`, isComponent: true, variantHint: null }));
      return { text: JSON.stringify({ items }), usage };
    };
  }

  async function run(capture: CaptureOutput, transport: ModelClientOptions['transport']) {
    for (const p of capture.pages) for (const vc of Object.values(p.viewports)) vc!.screenshot = { key: 'x.png', width: 1440, height: 3000, pageHeight: 3000, cut: false, png };
    const dir = mkdtempSync(join(tmpdir(), 'dse-components-'));
    const ctx = new MemoryRunContext('comptest01', config, new ModelClient({ mode: 'live', recordingsDir: dir, transport }), new LocalStorage(dir), { id: 'comptest01', url: config.url, host: 't.app', status: 'running', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop'] });
    const out = await components(ctx, capture, stageTokens);
    return { out: out.components, messages: ctx.events.map((e) => e.message) };
  }

  it('logs the clusters merged across pages and the noise dropped', async () => {
    const wrapper: El = { tag: 'div', parent: 0, box: [184, 900, 400, 200], style: border('rgb(226, 232, 240)') };
    const home: El[] = [body, button(['btn'], 'Start', 100, 'md', 'primary'), button(['btn'], 'Try', 200, 'md', 'primary'), wrapper, { tag: 'div', parent: 3, box: [200, 920, 100, 40] }, { tag: 'div', parent: 3, box: [200, 980, 100, 40] }];
    const pricing: El[] = [body, button(['cta'], 'Buy', 100, 'md', 'primary'), button(['cta'], 'Upgrade', 200, 'md', 'primary')];
    const capture = fakeCapture([
      { path: '/', desktop: snap(home) },
      { path: '/pricing', desktop: snap(pricing) },
    ]);
    const { out, messages } = await run(capture, namer((line) => (/classes (btn|cta)/.test(line) ? 'Primary button' : undefined)));
    expect(out.filter((c) => c.name === 'Primary button')).toHaveLength(1);
    expect(out.find((c) => c.name === 'Primary button')!.provenance.pages.map((p) => p.path)).toEqual(['/', '/pricing']);
    expect(messages).toContain('components · merged 1 across pages');
    expect(messages).toContain('components · 1 noise cluster dropped');
  });

  it('caps at 120, dropping other first and then the fewest instances, ordered by group then instance count', async () => {
    const letters = 'ghijklmnopqrstuvwxyz';
    const cls = (i: number) => `w${letters[Math.floor(i / 20)]}${letters[i % 20]}`;
    const els: El[] = [body];
    // Three buttons with three instances each, 120 with one.
    for (let i = 0; i < 123; i++) for (let n = 0; n < (i < 3 ? 3 : 1); n++) els.push(button([cls(i)], `Go ${i}`, 100 + els.length * 18, 'md', 'primary'));
    els.push({ tag: 'nav', parent: 0, cls: ['site-nav'], box: [400, 14, 400, 44], style: { display: 'flex' } });
    const navIndex = els.length - 1;
    for (const [i, t] of ['Product', 'Pricing', 'Docs'].entries()) els.push({ tag: 'a', parent: navIndex, text: t, own: t, box: [400 + i * 100, 24, 80, 22] });
    // Two cards the model types as other, with more instances than any button.
    for (const name of ['gcard', 'hcard']) {
      for (let n = 0; n < 5; n++) {
        const at = els.length;
        els.push({ tag: 'article', parent: 0, cls: [name], text: 'Weekly digests Every Friday.', box: [700, 100 + at * 4, 340, 200], style: { ...border('rgb(226, 232, 240)'), ...radius(12) } });
        els.push({ tag: 'h3', parent: at, own: 'Weekly digests', text: 'Weekly digests', box: [720, 120 + at * 4, 200, 28] });
        els.push({ tag: 'p', parent: at, own: 'Every Friday.', text: 'Every Friday.', box: [720, 160 + at * 4, 200, 26] });
      }
    }
    const { out } = await run(fakeCapture([{ path: '/', desktop: snap(els) }]), namer(() => undefined, (g) => (g === 'card' ? 'other' : g)));
    expect(out).toHaveLength(COMPONENT_CAP);
    expect(out.some((c) => c.type === 'other')).toBe(false);
    expect(out.filter((c) => c.instances.length === 3)).toHaveLength(3);
    const ranks = out.map((c) => ComponentGroup.options.indexOf(c.group));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(out.at(-1)!.group).toBe('navigation');
    const buttons = out.filter((c) => c.group === 'buttons').map((c) => c.instances.length);
    expect(buttons).toEqual([...buttons].sort((a, b) => b - a));
  });
});
