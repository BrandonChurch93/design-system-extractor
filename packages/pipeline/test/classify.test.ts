import { describe, expect, it } from 'vitest';
import type { StyleMap } from '../src/capture/snapshot';
import { classify } from '../src/components/classify';
import { responsiveNote } from '../src/stages/components';
import type { Item } from '../src/components/items';
import { snap, type El } from './helpers/snap';

// The rule forms that need structure, not a tag or a role (docs/specs/component-detection.md,
// Rule classification): specific forms before the general ones.

const body: El = { tag: 'body', box: [0, 0, 1440, 3000] };
const round = (r: number): Partial<StyleMap> => ({ 'border-top-left-radius': `${r}px`, 'border-top-right-radius': `${r}px`, 'border-bottom-right-radius': `${r}px`, 'border-bottom-left-radius': `${r}px` });

function typeOf(els: El[]): string {
  const s = snap([body, ...els]);
  const it = { el: s.elements[1]!, snapshot: s, rules: [], page: { reason: 'nav' }, viewport: 'desktop' } as unknown as Item;
  return classify([it]).type;
}

const crumbs = (sep: boolean): El[] => [
  { tag: 'ol', parent: 0, box: [0, 100, 400, 22] },
  { tag: 'li', parent: 1, own: sep ? '/' : '' },
  { tag: 'a', parent: 2, href: true, text: 'Home' },
  { tag: 'li', parent: 1, own: sep ? '/' : '' },
  { tag: 'a', parent: 4, href: true, text: 'Docs' },
  { tag: 'li', parent: 1, text: 'Setup' },
];

describe('rule classification by structure', () => {
  it('types a checkbox in a label beside a rounded track as a toggle, and a plain one as a checkbox', () => {
    const label: El = { tag: 'label', parent: 0, box: [0, 100, 200, 28] };
    const box: El = { tag: 'input', type: 'checkbox', parent: 1, box: [0, 104, 1, 1] };
    const track: El = { tag: 'span', parent: 1, box: [0, 100, 44, 24], style: round(12) };
    expect(typeOf([label, box, track])).toBe('toggle');
    expect(typeOf([box, { tag: 'span', parent: 0, own: 'Remember me' }].map((e, i) => (i === 0 ? { ...e, parent: 0 } : e)))).toBe('checkbox');
    expect(typeOf([label, box, { ...track, box: [0, 100, 24, 24] }])).not.toBe('toggle');
  });

  it('types an ordered list of links with separators as a breadcrumb, not one without', () => {
    expect(typeOf(crumbs(true))).toBe('breadcrumb');
    expect(typeOf(crumbs(false))).not.toBe('breadcrumb');
  });

  it('types a list of numbered links as pagination', () => {
    const list: El[] = [{ tag: 'ul', parent: 0, box: [0, 100, 300, 40] }, ...['1', '2', '3'].flatMap((n, i): El[] => [{ tag: 'li', parent: 1 }, { tag: 'a', parent: 2 + i * 2, href: true, text: n }])];
    expect(typeOf(list)).toBe('pagination');
    expect(typeOf([{ tag: 'ul', parent: 0, box: [0, 100, 300, 40] }, { tag: 'li', parent: 1 }, { tag: 'a', parent: 2, href: true, text: 'Pricing' }])).not.toBe('pagination');
  });

  it('types a form with two fields as a form, and not one with a single field', () => {
    const form: El = { tag: 'form', parent: 0, box: [0, 100, 400, 200] };
    expect(typeOf([form, { tag: 'input', parent: 1, type: 'email' }, { tag: 'textarea', parent: 1 }, { tag: 'button', parent: 1, text: 'Send' }])).toBe('form');
    expect(typeOf([form, { tag: 'input', parent: 1, type: 'email' }, { tag: 'input', parent: 1, type: 'hidden' }, { tag: 'button', parent: 1, text: 'Join' }])).not.toBe('form');
  });
});

describe('responsive variants', () => {
  const item = (viewport: 'desktop' | 'mobile', style: Partial<StyleMap>, w: number, parentW: number) => {
    const s = snap([{ tag: 'div', box: [0, 0, parentW, 400] }, { tag: 'div', parent: 0, box: [0, 0, w, 200], style }], { w: parentW, h: 900 });
    return { el: s.elements[1]!, snapshot: s, viewport } as unknown as Item;
  };
  it('notes a row that turns into a column, a display change, and a component that fills the phone', () => {
    expect(responsiveNote(item('desktop', { display: 'flex', 'flex-direction': 'row' }, 800, 1200), item('mobile', { display: 'flex', 'flex-direction': 'column' }, 350, 390))).toBe('Stacks at 390 px');
    expect(responsiveNote(item('desktop', { display: 'grid' }, 800, 1200), item('mobile', { display: 'block' }, 350, 390))).toBe('Stacks at 390 px');
    expect(responsiveNote(item('desktop', { display: 'block' }, 600, 1200), item('mobile', { display: 'block' }, 380, 390))).toBe('Changes layout at 390 px');
    expect(responsiveNote(item('desktop', { display: 'flex', 'flex-direction': 'row' }, 1100, 1200), item('mobile', { display: 'flex', 'flex-direction': 'row' }, 380, 390))).toBeUndefined();
  });
});
