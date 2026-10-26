import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import type { ColorToken } from '@dse/schema';
import { contrastRatio, formatRatio } from '../src/color/contrast';
import { contrastOf, focusOf, groundOf, labelOf, motionOf, sampleGround, tapOf } from '../src/checks/measure';
import { itemsFrom } from '../src/components/items';
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

