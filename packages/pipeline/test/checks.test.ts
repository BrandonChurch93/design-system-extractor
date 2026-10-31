import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import type { CheckResult, ColorToken, Component, Tokens } from '@dse/schema';
import { contrastRatio, formatRatio } from '../src/color/contrast';
import { contrastOf, focusBox, focusOf, groundOf, labelOf, motionOf, sampleGround, tapOf } from '../src/checks/measure';
import { findCandidates } from '../src/capture/candidates';
import { itemsFrom, type Item } from '../src/components/items';
import { checkComponent, summarize } from '../src/stages/checks';
import { fakeCapture } from './helpers/capture';
import { snap, type El } from './helpers/snap';
import { detailTemplates, matchesTemplate } from './helpers/templates';

const tokens = [
  { id: 't1', name: 'gray-50', value: '#FFFFFF' },
  { id: 't2', name: 'teal-500', value: '#0F8A8A' },
  { id: 't3', name: 'blue-900', value: '#0B1F3A' },
] as unknown as ColorToken[];
const white = { r: 255, g: 255, b: 255, a: 1 };
const details: string[] = [];
const keep = <T extends { detail: string } | null>(m: T) => {
  if (m) details.push(m.detail);
  return m;
};

const item = (els: El[], index = 1, reason?: 'home') => itemsFrom(fakeCapture([{ path: '/', reason, desktop: snap(els) }])).find((i) => i.el.index === index) ?? (() => {
  const s = snap(els);
  return { snapshot: s, el: s.elements[index]!, revealed: undefined, vc: { candidates: [], screenshot: { png: Buffer.alloc(0), width: 1440, height: 900 } } } as never;
})();

describe('contrast math', () => {
  it('matches the WCAG sample pairs and the design system pairs', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('#0B1F3A', '#FFFFFF')).toBeCloseTo(16.52, 2);
    expect(formatRatio(4.499)).toBe('4.4:1');
  });

  it('composites translucent text and grounds, and samples the crop over an image', () => {
    const els: El[] = [
      { tag: 'body', box: [0, 0, 400, 300], style: { 'background-color': 'rgb(255, 255, 255)' } },
      { tag: 'div', parent: 0, box: [0, 0, 300, 100], style: { 'background-color': 'rgba(11, 31, 58, 0.5)' } },
      { tag: 'p', parent: 1, own: 'Hello', text: 'Hello', box: [10, 10, 100, 20], style: { color: 'rgba(255, 255, 255, 0.9)', 'font-size': '14px' } },
    ];
    const s = snap(els);
    const g = groundOf(s, s.elements[2]!)!;
    expect([g.r, g.g, g.b].map(Math.round)).toEqual([133, 143, 157]);
    const r = keep(contrastOf(item(els, 2), tokens))!;
    expect(r.status).toBe('fail');
    expect(r.detail).toMatch(/^\d\.\d:1 on #858F9D, needs 4\.5:1$/);
    const withImage = snap([{ ...els[0]! }, { ...els[1]!, style: { 'background-image': 'url(x.png)' } }, els[2]!]);
    expect(groundOf(withImage, withImage.elements[2]!)).toBeNull();
    const crop = new PNG({ width: 10, height: 10 });
    for (let i = 0; i < crop.data.length; i += 4) [crop.data[i], crop.data[i + 1], crop.data[i + 2], crop.data[i + 3]] = i % 12 === 0 ? [255, 255, 255, 255] : [15, 138, 138, 255];
    expect(sampleGround(PNG.sync.write(crop), white)).toEqual({ r: 15, g: 138, b: 138, a: 1 });
  });

  it('reports the planted 4.18:1 tag against its token and large text at 3:1', () => {
    const els: El[] = [{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'span', parent: 0, own: 'New', text: 'New', box: [0, 0, 40, 24], style: { color: 'rgb(255, 255, 255)', 'background-color': 'rgb(15, 138, 138)', 'font-size': '12px' } }];
    expect(keep(contrastOf(item(els), tokens))!.detail).toBe('4.1:1 on teal-500, needs 4.5:1');
    const large: El[] = [els[0]!, { ...els[1]!, style: { ...els[1]!.style, 'font-size': '24px' } }];
    expect(keep(contrastOf(item(large), tokens))!.detail).toBe('4.1:1 on teal-500');
  });
});

describe('focus visible', () => {
  const el = snap([{ tag: 'body' }, { tag: 'a', parent: 0, style: { 'background-color': 'rgb(36, 88, 230)' } }]).elements[1]!;
  it.each<[string, { property: string; from: string; to: string }[], boolean, string]>([
    ['outline ring', [{ property: 'outline-style', from: 'none', to: 'solid' }, { property: 'outline-width', from: '0px', to: '2px' }, { property: 'outline-color', from: 'rgb(0, 0, 0)', to: 'rgb(36, 88, 230)' }], true, '2 px ring, 5.8:1 against gray-50'],
    ['box-shadow when the outline is removed', [{ property: 'box-shadow', from: 'none', to: 'rgb(11, 31, 58) 0px 0px 0px 3px' }], true, '3 px ring, 16.5:1 against gray-50'],
    ['a background change too faint to see', [{ property: 'background-color', from: 'rgb(36, 88, 230)', to: 'rgb(11, 31, 58)' }], true, '2.8:1 ring, needs 3:1'],
    ['faint ring', [{ property: 'outline-style', from: 'none', to: 'solid' }, { property: 'outline-width', from: '0px', to: '2px' }, { property: 'outline-color', from: 'rgb(0, 0, 0)', to: 'rgb(226, 232, 240)' }], true, '1.2:1 ring, needs 3:1'],
    ['outline none and nothing else', [], true, 'No visible change on focus'],
    ['not reached by keyboard', [{ property: 'outline-style', from: 'none', to: 'solid' }], false, 'Not reachable by keyboard'],
  ])('%s', (_name, delta, keyboard, detail) => {
    expect(keep(focusOf(delta, keyboard, el, white, tokens)).detail).toBe(detail);
  });
  it('passes a background change of 3:1 or more', () => {
    const plain = snap([{ tag: 'body' }, { tag: 'a', parent: 0, style: { 'background-color': 'rgb(255, 255, 255)' } }]).elements[1]!;
    expect(keep(focusOf([{ property: 'background-color', from: 'rgb(255, 255, 255)', to: 'rgb(11, 31, 58)' }], true, plain, white, tokens)).detail).toBe('Background change, 16.5:1');
  });
});

describe('tap target', () => {
  it.each<[number, number, string, string]>([
    [44, 44, 'pass', '44 × 44 at 390 px'],
    [120, 44, 'pass', '120 × 44 at 390 px'],
    [36, 36, 'fail', '36 px tall, 8 short'],
    [13, 13, 'fail', '13 px tall, 31 short'],
    [200, 40, 'fail', '40 px tall, 4 short'],
    [30, 48, 'fail', '30 px wide, 14 short'],
  ])('%i × %i', (w, h, status, detail) => {
    const el = snap([{ tag: 'body' }, { tag: 'button', parent: 0, box: [0, 0, w, h] }]).elements[1]!;
    expect(keep(tapOf(el))).toMatchObject({ status, detail });
  });
});

describe('label present', () => {
  const field = (extra: El[], input: Partial<El> = {}, attrs: Record<string, string> = {}) => {
    const els: El[] = [{ tag: 'body' }, { tag: 'input', parent: 0, ...input }, ...extra];
    const it = item(els);
    Object.assign(it.el.attrs, attrs);
    return it;
  };
  it('reads label elements, wrapping labels, aria-label and aria-labelledby, and refuses a placeholder alone', () => {
    const forLabel = field([{ tag: 'label', parent: 0, text: 'Email' }]);
    forLabel.el.id = 'email';
    forLabel.snapshot.elements[2]!.attrs.for = 'email';
    expect(keep(labelOf(forLabel, false)).detail).toBe('Label element');
    const wrapped = item([{ tag: 'body' }, { tag: 'label', parent: 0, text: 'I agree' }, { tag: 'input', parent: 1 }], 2);
    expect(keep(labelOf(wrapped, false)).detail).toBe('Label element');
    expect(keep(labelOf(field([], { aria: { 'aria-label': 'Search' } }), false)).detail).toBe('aria-label');
    const byRef = field([{ tag: 'span', parent: 0, text: 'Newsletter' }], { aria: { 'aria-labelledby': 'nl' } });
    byRef.snapshot.elements[2]!.id = 'nl';
    expect(keep(labelOf(byRef, false)).detail).toBe('aria-label');
    expect(keep(labelOf(field([], {}, { placeholder: 'Your email' }), false))).toMatchObject({ status: 'fail', detail: 'Placeholder only' });
    expect(keep(labelOf(field([], {}, { title: 'Email' }), false))).toMatchObject({ status: 'fail', detail: 'No name found' });
  });
  it('accepts an icon button named by aria-label, title or visually hidden text, and fails one with none', () => {
    const icon = (extra: El[] = [], aria: Record<string, string> = {}) => item([{ tag: 'body' }, { tag: 'button', parent: 0, aria, box: [0, 0, 44, 44] }, { tag: 'svg', parent: 1, box: [12, 12, 20, 20] }, ...extra]);
    expect(keep(labelOf(icon([], { 'aria-label': 'Copy' }), true)).detail).toBe('aria-label');
    const titled = icon();
    titled.el.attrs.title = 'Copy';
    expect(keep(labelOf(titled, true)).detail).toBe('aria-label');
    expect(keep(labelOf(icon([{ tag: 'span', parent: 1, text: 'Copy', box: [0, 0, 1, 1] }]), true)).detail).toBe('Visually hidden text');
    expect(keep(labelOf(icon(), true))).toMatchObject({ status: 'fail', detail: 'No name found' });
  });
});

describe('reduced motion', () => {
  it.each<[string, { animation: boolean; transition: boolean } | undefined, { animation: boolean; transition: boolean } | undefined, boolean, string | null]>([
    ['an animation that stops', { animation: true, transition: false }, { animation: false, transition: false }, false, 'Stops under reduced motion'],
    ['an animation that keeps running', { animation: true, transition: false }, { animation: true, transition: false }, false, 'Animation still runs under reduced motion'],
    ['a hover transition that stops', { animation: false, transition: true }, { animation: false, transition: false }, true, 'Stops under reduced motion'],
    ['a transition on something you cannot hover', { animation: false, transition: true }, { animation: false, transition: true }, false, null],
    ['no motion', { animation: false, transition: false }, undefined, true, null],
  ])('%s', (_name, main, reduced, interactive, detail) => {
    const m = keep(motionOf(main, reduced, interactive));
    expect(m?.detail ?? null).toBe(detail);
  });
});

describe('contrast reading rules (D-054)', () => {
  it('leaves text inside a nested component to that component', () => {
    const els: El[] = [
      { tag: 'body', box: [0, 0, 400, 300], style: { 'background-color': 'rgb(255, 255, 255)' } },
      { tag: 'div', parent: 0, box: [0, 0, 300, 120] },
      { tag: 'p', parent: 1, own: 'Plan', text: 'Plan', box: [10, 10, 100, 20], style: { color: 'rgb(11, 31, 58)' } },
      { tag: 'span', parent: 1, own: 'New', text: 'New', box: [10, 40, 40, 20], style: { color: 'rgb(170, 170, 170)', 'font-size': '14px' } },
    ];
    const card = item(els);
    expect(keep(contrastOf(card, tokens))!.status).toBe('fail');
    card.vc.candidates.push({ dse: 'e3', rules: ['inline-mark'], interactive: false, area: 800 });
    expect(keep(contrastOf(card, tokens))!.detail).toBe('16.5:1 on gray-50');
  });

  it('measures placeholder text at Chromium’s #757575 default and at the input’s ::placeholder color', () => {
    const field = item([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'input', parent: 0, box: [0, 0, 240, 44] }]);
    field.el.attrs.placeholder = 'Your email';
    expect(keep(contrastOf(field, tokens))).toMatchObject({ status: 'pass', detail: '4.6:1 on gray-50', measured: { fg: '#757575' } });
    expect(keep(contrastOf(field, tokens, 'rgb(170, 170, 170)'))).toMatchObject({ status: 'fail', detail: '2.3:1 on gray-50, needs 4.5:1' });
    field.el.attrs.value = 'ada@example.com';
    expect(contrastOf(field, tokens)).toBeNull();
  });

  it('holds bold text under 18.66 px to 4.5:1 and bold text at 18.66 px to 3:1', () => {
    const tag = (size: string, weight: string) => item([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'span', parent: 0, own: 'New', text: 'New', box: [0, 0, 40, 24], style: { color: 'rgb(255, 255, 255)', 'background-color': 'rgb(15, 138, 138)', 'font-size': size, 'font-weight': weight } }]);
    expect(keep(contrastOf(tag('18.66px', '700'), tokens))!.detail).toBe('4.1:1 on teal-500');
    expect(keep(contrastOf(tag('18px', '700'), tokens))!.detail).toBe('4.1:1 on teal-500, needs 4.5:1');
    expect(keep(contrastOf(tag('18.66px', '600'), tokens))!.detail).toBe('4.1:1 on teal-500, needs 4.5:1');
  });
});

describe('one result per check for a component', () => {
  const buttons = (grounds: string[], mobile = false) => {
    const els: El[] = [{ tag: 'body', box: [0, 0, 1440, 900] }, ...grounds.map((g, i): El => ({ tag: 'button', parent: 0, own: 'Send', text: 'Send', box: [100, 100 + i * 60, 120, 44], style: { color: 'rgb(255, 255, 255)', 'background-color': g } }))];
    const items = itemsFrom(fakeCapture([{ path: '/', desktop: snap(els), ...(mobile ? { mobile: snap(els, { w: 390, h: 2000 }) } : {}) }]));
    return items.filter((i) => i.el.tag === 'button');
  };
  const sourceOf = (first: Item, variants: [string, Item][], items: Item[]) => ({ first, variants: new Map(variants), items, variantOf: new Map(variants.map(([id, it]) => [it, id])) });
  const button = { type: 'button' } as Component;
  const noTokens = { colors: tokens } as Tokens;
  const results = (r: CheckResult[]) => {
    for (const x of r) keep(x);
    return Object.fromEntries(r.map((x) => [x.check, x]));
  };

  it('takes the worst variant and names it when it is not the first seen', () => {
    const [blue, pale] = buttons(['rgb(36, 88, 230)', 'rgb(110, 190, 190)']);
    const worstLater = results(checkComponent(button, sourceOf(blue!, [['vblue001', blue!], ['vpale001', pale!]], [blue!, pale!]), noTokens));
    expect(worstLater.contrast).toMatchObject({ status: 'fail', variantId: 'vpale001' });
    const worstFirst = results(checkComponent(button, sourceOf(pale!, [['vpale001', pale!], ['vblue001', blue!]], [pale!, blue!]), noTokens));
    expect(worstFirst.contrast!.status).toBe('fail');
    expect(worstFirst.contrast).not.toHaveProperty('variantId');
  });

  it('reads the ::placeholder color from the input’s matched rules', () => {
    const els: El[] = [{ tag: 'body', box: [0, 0, 1440, 900] }, { tag: 'input', parent: 0, box: [100, 100, 240, 44] }];
    const field = itemsFrom(fakeCapture([{ path: '/', desktop: snap(els) }])).find((i) => i.el.tag === 'input')!;
    field.el.attrs.placeholder = 'Your email';
    field.vc.matched[field.el.d] = { rules: [], inline: [], pseudo: [{ pseudo: 'placeholder', rules: [{ selector: 'input::placeholder', matched: ['input::placeholder'], origin: 'regular', media: [], supports: [], declarations: [{ name: 'color', value: 'rgb(170, 170, 170)', important: false }] }] }] };
    const r = results(checkComponent({ type: 'input' } as Component, sourceOf(field, [['vfield01', field]], [field]), noTokens));
    expect(r.contrast).toMatchObject({ status: 'fail', detail: '2.3:1 on gray-50, needs 4.5:1' });
  });

  it('is not measured without a focus capture, and not present without a phone instance', () => {
    const [blue] = buttons(['rgb(36, 88, 230)']);
    const r = results(checkComponent(button, sourceOf(blue!, [['vblue001', blue!]], [blue!]), noTokens));
    expect(r['focus-visible']).toMatchObject({ status: 'na', detail: 'Not measured: capture cap' });
    expect(r['tap-target']).toMatchObject({ status: 'na', detail: 'Not present at 390 px' });
    const both = buttons(['rgb(36, 88, 230)'], true);
    const phone = results(checkComponent(button, sourceOf(both[0]!, [['vblue001', both[0]!]], both), noTokens));
    expect(phone['tap-target']).toMatchObject({ status: 'pass', detail: '120 × 44 at 390 px' });
  });

  it('exempts a link inside a sentence of prose: it never becomes a component to measure', () => {
    const s = snap([
      { tag: 'body', box: [0, 0, 390, 900] },
      { tag: 'p', parent: 0, text: 'Read the pricing guide before you start.', own: 'Read the  before you start.', box: [20, 100, 350, 48] },
      { tag: 'a', parent: 1, text: 'pricing guide', own: 'pricing guide', box: [80, 100, 96, 20], style: { display: 'inline' } },
      { tag: 'a', parent: 0, text: 'Start', own: 'Start', box: [20, 200, 80, 30], style: { display: 'inline-block', 'background-color': 'rgb(36, 88, 230)', 'padding-left': '12px', 'padding-right': '12px' } },
    ]);
    expect(findCandidates(s, 'mobile').map((c) => c.dse)).toEqual(['e3']);
  });

  it('motion is not measured when the reduced-motion probe hit the capture cap', () => {
    expect(keep(motionOf({ animation: true, transition: false }, undefined, false))).toMatchObject({ status: 'na', detail: 'Not measured: capture cap' });
  });
});

describe('the per-run summary', () => {
  const comp = (n: number, checks: [CheckResult['check'], CheckResult['status'], string, Record<string, number>?][]) =>
    ({ id: `comp${String(n).padStart(4, '0')}`, name: `Component ${n}`, checks: checks.map(([check, status, detail, measured]) => ({ check, status, detail, ...(measured ? { measured } : {}) })) }) as unknown as Component;
  it('counts applicable results only and lists the worst eight failures per check by shortfall', () => {
    const comps = [
      ...[40, 13, 36, 30, 20, 43, 25, 38, 42, 33].map((h, i) => comp(i, [['tap-target', 'fail', `${h} px tall, ${44 - h} short`, { w: 120, h }], ['label', 'na', 'Not applicable']])),
      comp(10, [['tap-target', 'pass', '44 × 44 at 390 px', { w: 44, h: 44 }], ['contrast', 'fail', '2.5:1 on gray-50, needs 3:1', { ratio: 2.5 }]]),
      comp(11, [['contrast', 'fail', '3.9:1 on gray-50, needs 4.5:1', { ratio: 3.9 }]]),
      comp(12, [['contrast', 'fail', '2.9:1 on gray-50, needs 3:1', { ratio: 2.9 }]]),
    ];
    const out = summarize(comps);
    expect(out.summary).toEqual({ passed: 1, failed: 13, applicable: 14, total: 65 });
    const tap = out.byCheck.find((b) => b.check === 'tap-target')!;
    expect([tap.passed, tap.applicable]).toEqual([1, 11]);
    expect(tap.failing.map((f) => f.detail)).toEqual(['13 px tall, 31 short', '20 px tall, 24 short', '25 px tall, 19 short', '30 px tall, 14 short', '33 px tall, 11 short', '36 px tall, 8 short', '38 px tall, 6 short', '40 px tall, 4 short']);
    expect(out.byCheck.find((b) => b.check === 'contrast')!.failing.map((f) => f.name)).toEqual(['Component 11', 'Component 10', 'Component 12']);
    expect(out.byCheck.find((b) => b.check === 'label')).toEqual({ check: 'label', passed: 0, applicable: 0, failing: [] });
  });
});

describe('detail strings', () => {
  it('reads every template from checks.md', () => {
    expect(detailTemplates().length).toBeGreaterThanOrEqual(17);
  });
  it('renders every detail above from a template in checks.md', () => {
    expect(details.length).toBeGreaterThan(20);
    for (const d of details) expect(matchesTemplate(d), d).toBe(true);
    expect(matchesTemplate('Looks good')).toBe(false);
  });
});


describe('tap target for a component hidden until focus (D-112)', () => {
  const el = (w: number, h: number) => ({ w, h }) as Parameters<typeof focusBox>[0];
  it('measures the classic 1 px sr-only link in its focus state', () => {
    const box = focusBox(el(1, 1), { delta: [{ property: 'width', to: '160px' }, { property: 'height', to: '44px' }] })!;
    expect(tapOf(box)).toMatchObject({ status: 'pass', detail: '160 × 44 at 390 px' });
  });
  it('measures a clip-path link at its own box, which focus does not change', () => {
    expect(tapOf(focusBox(el(134, 44), { delta: [{ property: 'outline-width', to: '2px' }] })!)).toMatchObject({ status: 'pass', detail: '134 × 44 at 390 px' });
  });
  it('has no box when no focus state shows it', () => {
    expect(focusBox(el(1, 1), undefined)).toBeNull();
    expect(focusBox(el(1, 1), { hidden: true, delta: [] })).toBeNull();
  });
});
