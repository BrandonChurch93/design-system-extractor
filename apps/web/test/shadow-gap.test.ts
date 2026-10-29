import { describe, expect, it } from 'vitest';
import { blurRadii, shadowGap } from '../lib/shadow-gap';

// The Shadow card's gap from the stored values (D-103).

describe('the shadow gap', () => {
  it('reads each layer\'s blur, the third length after inset', () => {
    expect(blurRadii('0 1px 2px rgba(11, 31, 58, 0.12)')).toEqual([2]);
    expect(blurRadii('inset 0 0 0 1px #E2E8F0, 0 12px 32px rgba(0, 0, 0, 0.2)')).toEqual([0, 32]);
    expect(blurRadii('none')).toEqual([0]);
  });
  it('rounds twice the largest blur up to a spacing token, never below space-6', () => {
    expect(shadowGap(['0 1px 2px rgba(0, 0, 0, 0.1)'])).toBe(28);
    expect(shadowGap(['0 4px 16px #0003'])).toBe(40);
    expect(shadowGap(['0 1px 2px #0001', '0 12px 32px rgba(11, 31, 58, 0.12)'])).toBe(64);
    expect(shadowGap(['0 24px 48px rgba(0, 0, 0, 0.3)'])).toBe(96);
    expect(shadowGap(['0 40px 120px #000'])).toBe(96);
  });
});
