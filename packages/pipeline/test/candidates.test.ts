import { describe, expect, it } from 'vitest';
import { findCandidates } from '../src/capture/candidates';
import { snap, type El } from './helpers/snap';

const rulesOf = (els: El[], index: number) => findCandidates(snap(els), 'desktop').find((c) => c.dse === `e${index}`)?.rules ?? [];
const body: El = { tag: 'body', box: [0, 0, 1440, 3000], style: { 'background-color': 'rgb(255, 255, 255)' } };
const bordered = { 'border-top-width': '1px', 'border-top-style': 'solid', 'border-top-color': 'rgb(226, 232, 240)' };

describe('element candidate rules', () => {
  it('treats header and footer as landmarks only where ARIA maps them to banner and contentinfo', () => {
    const els: El[] = [body, { tag: 'footer', parent: 0, box: [0, 2800, 1440, 200] }, { tag: 'section', parent: 0, box: [0, 100, 1440, 600] }, { tag: 'div', parent: 2, cls: ['card'], box: [40, 120, 400, 300] }, { tag: 'footer', parent: 3, cls: ['card-footer'], box: [40, 380, 400, 40] }];
    expect(rulesOf(els, 1)).toContain('landmark');
    expect(rulesOf(els, 4)).not.toContain('landmark');
  });

  it('counts a background image as a differing background for the container rule', () => {
    const els: El[] = [body, { tag: 'section', parent: 0, cls: ['promo'], box: [184, 100, 1072, 130], style: { 'background-image': 'url("/promo.png")' } }, { tag: 'h3', parent: 1, own: 'Ship notes', box: [216, 132, 400, 28] }, { tag: 'p', parent: 1, own: 'Teams that publish', box: [216, 172, 400, 26] }];
    expect(rulesOf(els, 1)).toContain('container');
  });

  it('never makes a table row a container', () => {
    const els: El[] = [body, { tag: 'table', parent: 0, box: [48, 100, 1344, 166] }, { tag: 'tbody', parent: 1, box: [48, 140, 1344, 126] }, { tag: 'tr', parent: 2, box: [48, 180, 1344, 41], style: { 'background-color': 'rgb(249, 250, 251)' } }, { tag: 'td', parent: 3, own: 'Seats', box: [48, 180, 400, 41] }, { tag: 'td', parent: 3, own: '1', box: [448, 180, 400, 41] }];
    expect(rulesOf(els, 1)).toContain('data');
    expect(rulesOf(els, 3)).toEqual([]);
  });

  it('accepts a shrink-wrapped flex item as an inline mark, but not a stretched block', () => {
    const els: El[] = [body, { tag: 'div', parent: 0, box: [184, 100, 1072, 24], style: { display: 'flex' } }, { tag: 'span', parent: 1, cls: ['badge'], text: 'Live', box: [184, 100, 59, 24], style: { display: 'flex', 'background-color': 'rgb(21, 128, 61)' } }, { tag: 'div', parent: 0, box: [184, 200, 1072, 24] }, { tag: 'span', parent: 3, text: 'Wide', box: [184, 200, 1072, 24], style: { display: 'block', ...bordered } }];
    expect(rulesOf(els, 2)).toContain('inline-mark');
    expect(rulesOf(els, 4)).not.toContain('inline-mark');
  });
});

describe('the state capture cap', () => {
  it('takes one of each preliminary cluster first, then the largest, up to 40', async () => {
    const { chooseForStates, STATE_CAP } = await import('../src/stages/capture');
    const els: El[] = [{ tag: 'body', box: [0, 0, 1440, 9000] }];
    for (let i = 0; i < 50; i++) els.push({ tag: 'button', parent: 0, cls: ['btn'], text: `Go ${i}`, box: [0, i * 60, 80 + i, 44] });
    els.push({ tag: 'button', parent: 0, cls: ['icon-button'], box: [0, 3100, 44, 44] });
    const s = snap(els);
    const chosen = chooseForStates(s, findCandidates(s, 'desktop'));
    expect(chosen).toHaveLength(STATE_CAP);
    expect(chosen.slice(0, 2)).toEqual(['e1', 'e51']);
    expect(chosen[2]).toBe('e50');
  });
});
