import { describe, expect, it } from 'vitest';
import { chipValues, scaleFilter, scaleTransform, scaleTranslate } from '../lib/chip-scale';

// The pattern chip's rest and play values (D-104).

describe('chip values', () => {
  it('scales px translations by 0.35, clamped to ±14 per axis; percentages and scale and rotate as they are', () => {
    expect(scaleTransform('translateY(12px)')).toBe('translateY(4.2px)');
    expect(scaleTransform('translate(-80px, 24px) scale(0.96)')).toBe('translate(-14px, 8.4px) scale(0.96)');
    expect(scaleTransform('translateX(-100%) rotate(4deg)')).toBe('translateX(-100%) rotate(4deg)');
    expect(scaleTransform('matrix(1, 0, 0, 1, 0, 24)')).toBe('matrix(1, 0, 0, 1, 0, 8.4)');
    expect(scaleTransform('none')).toBe('none');
    expect(scaleTranslate('0px 60px')).toBe('0px 14px');
  });

  it('halves blur, clamped at 6 px', () => {
    expect(scaleFilter('blur(8px)')).toBe('blur(4px)');
    expect(scaleFilter('blur(20px) saturate(1.2)')).toBe('blur(6px) saturate(1.2)');
  });

  it('floors the opacity at rest only', () => {
    expect(chipValues({ opacity: '0', transform: 'translateY(12px)' }, true)).toEqual({ opacity: '0.25', transform: 'translateY(4.2px)' });
    expect(chipValues({ opacity: '0' })).toEqual({ opacity: '0' });
    expect(chipValues({ opacity: '0.6' }, true)).toEqual({ opacity: '0.6' });
  });
});
