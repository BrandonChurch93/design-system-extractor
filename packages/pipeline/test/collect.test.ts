import { describe, expect, it } from 'vitest';
import { breakpointsOf, collect, normalizeShadow, shadowLayers } from '../src/tokens/collect';
import { snap, type El } from './helpers/snap';

const source = (els: El[], isHome = true) => ({ pageId: 'home0000', isHome, viewport: 'desktop' as const, snapshot: snap(els), focusOutlines: [], media: [], fonts: [] });

describe('collecting raw values', () => {
  it('normalizes shadows and drops transparent ring placeholders', () => {
    const tw = 'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(11, 31, 58, 0.12) 0px 1px 2px 0px';
    expect(shadowLayers(tw)).toHaveLength(1);
    expect(normalizeShadow(tw)).toBe('0px 1px 2px 0px #0B1F3A1F');
    expect(normalizeShadow('none')).toBe('');
  });

  it('reads breakpoints in px, em and range syntax', () => {
    expect(breakpointsOf('(min-width: 1024px)')).toEqual([1024]);
    expect(breakpointsOf('screen and (max-width: 40em)')).toEqual([640]);
    expect(breakpointsOf('(width >= 768px)')).toEqual([768]);
  });

  it('weights large grounds, counts uses, and keeps centered auto margins out of spacing', () => {
    const els: El[] = [
      { tag: 'body', box: [0, 0, 1440, 3000], style: { 'background-color': 'rgb(255, 255, 255)' } },
      { tag: 'div', parent: 0, cls: ['container'], box: [160, 0, 1120, 3000], style: { 'margin-left': '160px', 'margin-right': '160px', 'padding-left': '24px', 'padding-right': '24px' } },
      { tag: 'a', parent: 1, own: 'Start free', box: [184, 100, 106, 44], style: { 'background-color': 'rgb(36, 88, 230)', color: 'rgb(255, 255, 255)', 'padding-left': '20px', 'padding-right': '20px', 'border-top-left-radius': '8px' } },
      { tag: 'p', parent: 1, own: 'Body text', box: [184, 200, 600, 26], style: { 'margin-bottom': '16px', 'line-height': '26px' } },
    ];
    const raw = collect([source(els)]);
    expect(raw.colors.get('#FFFFFF')!.uses).toMatchObject({ background: 1, text: 1 });
    expect(raw.colors.get('#FFFFFF')!.weight).toBe(1 + 4 + 1);
    expect(raw.space.get(160)?.weight ?? 0).toBe(0);
    expect(raw.space.get(24)!.contexts.padding).toBe(2);
    expect(raw.space.get(20)!.contexts.padding).toBe(2);
    expect(raw.radius.get(8)!.count).toBe(1);
    const body = [...raw.type.values()].find((t) => t.size === 16 && t.lineHeight === 26)!;
    expect(body.tags.get('p')).toBe(1);
  });
});
