import { describe, expect, it } from 'vitest';
import { patternOwners } from '../src/components/motion';
import { snap, type El } from './helpers/snap';

// A pattern belongs to the component that owns its own element, never to another target's (D-105).

describe('patternOwners', () => {
  const els: El[] = [
    { tag: 'body', box: [0, 0, 1440, 3000] },
    { tag: 'div', parent: 0, cls: ['row'], box: [0, 100, 1440, 60] },
    { tag: 'span', parent: 1, text: 'One', box: [0, 100, 100, 40] },
    { tag: 'a', parent: 1, cls: ['btn'], text: 'Two', box: [120, 100, 100, 40] },
    { tag: 'a', parent: 1, cls: ['btn'], text: 'Three', box: [240, 100, 100, 40] },
    { tag: 'div', parent: 0, cls: ['card'], box: [0, 300, 400, 300] },
    { tag: 'h3', parent: 5, text: 'Card', box: [20, 320, 200, 30] },
  ];
  const capture = { pages: [{ page: { id: 'p1' }, viewports: { desktop: { snapshot: snap(els) } } }] } as never;
  const owners = new Map([
    ['p1|desktop|e3', 'button00'],
    ['p1|desktop|e4', 'button00'],
    ['p1|desktop|e5', 'card0000'],
  ]);
  const t = (d: string) => ({ pageId: 'p1', viewport: 'desktop' as const, d });

  it('leaves a stagger led by an unowned span without an owner, though later targets are owned', () => {
    expect(patternOwners(capture, owners, new Map([['stagger1', [t('e2'), t('e3'), t('e4')]]])).has('stagger1')).toBe(false);
  });

  it('takes the instance that is or holds the pattern element', () => {
    const out = patternOwners(capture, owners, new Map([['own', [t('e3')]], ['inside', [t('e6'), t('e3')]]]));
    expect(out.get('own')).toEqual(['button00']);
    expect(out.get('inside')).toEqual(['card0000']);
  });
});
