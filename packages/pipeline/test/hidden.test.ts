import { describe, expect, it } from 'vitest';
import { findCandidates } from '../src/capture/candidates';
import { hiddenAtCapture, hiddenAtFocus } from '../src/capture/hidden';
import { snap, type El } from './helpers/snap';

// Hidden at capture (capture-and-states.md, DOM snapshot; D-108).

const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

describe('the hidden-at-capture rule', () => {
  it('hides boxes at or below 1 px on a side and boxes entirely outside the document', () => {
    expect(hiddenAtCapture(box(0, 0, 1440, 0), {}, 1440)).toBe(true);
    expect(hiddenAtCapture(box(0, 0, 1, 1), {}, 1440)).toBe(true);
    expect(hiddenAtCapture(box(-9999, 10, 120, 40), {}, 1440)).toBe(true);
    expect(hiddenAtCapture(box(10, -60, 120, 40), {}, 1440)).toBe(true);
    expect(hiddenAtCapture(box(1440, 10, 120, 40), {}, 1440)).toBe(true);
    expect(hiddenAtCapture(box(-60, 10, 120, 40), {}, 1440)).toBe(false);
    expect(hiddenAtCapture(box(10, 10, 2, 2), {}, 1440)).toBe(false);
  });

  it('hides by visibility, display, opacity, a zero clip rect and a clip-path inset of half or more', () => {
    const b = box(10, 10, 120, 40);
    expect(hiddenAtCapture(b, { visibility: 'hidden' }, 1440)).toBe(true);
    expect(hiddenAtCapture(b, { display: 'none' }, 1440)).toBe(true);
    expect(hiddenAtCapture(b, { opacity: '0' }, 1440)).toBe(true);
    expect(hiddenAtCapture(b, { opacity: '0.01' }, 1440)).toBe(false);
    expect(hiddenAtCapture(b, { clip: 'rect(0px, 0px, 0px, 0px)' }, 1440)).toBe(true);
    expect(hiddenAtCapture(b, { clip: 'auto' }, 1440)).toBe(false);
    expect(hiddenAtCapture(b, { 'clip-path': 'inset(50%)' }, 1440)).toBe(true);
    expect(hiddenAtCapture(b, { 'clip-path': 'inset(10%)' }, 1440)).toBe(false);
    expect(hiddenAtFocus({ width: '140px', height: '44px', 'clip-path': 'none' })).toBe(false);
    expect(hiddenAtFocus({ width: '1px', height: '1px' })).toBe(true);
  });

  it('keeps a hidden focusable link as a flagged candidate and drops a zero-height header', () => {
    const els: El[] = [
      { tag: 'body', box: [0, 0, 1440, 3000] },
      { tag: 'a', parent: 0, cls: ['skip-link'], text: 'Skip to content', tab: true, box: [24, 12, 140, 44], style: { 'clip-path': 'inset(50%)', 'background-color': 'rgb(11, 31, 58)', 'padding-left': '16px', 'padding-right': '16px' } },
      { tag: 'header', parent: 0, box: [0, 0, 1440, 0] },
      { tag: 'nav', parent: 2, box: [0, 0, 1440, 0] },
      { tag: 'button', parent: 0, text: 'Closed', tab: false, box: [0, 200, 100, 40], style: { display: 'none' } },
      { tag: 'button', parent: 0, text: 'Faded', tab: false, box: [0, 300, 100, 40], style: { opacity: '0' } },
    ];
    const c = findCandidates(snap(els), 'desktop');
    expect(c.find((x) => x.dse === 'e1')).toMatchObject({ hidden: true });
    expect(c.map((x) => x.dse)).toEqual(['e1']);
  });
});
