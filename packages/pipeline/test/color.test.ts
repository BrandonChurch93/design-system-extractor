import { describe, expect, it } from 'vitest';
import { colorsIn, deltaE, hexOf, oklabToOklch, parseCssColor, rgbToOklab } from '../src/color/parse';

const hex = (v: string) => {
  const c = parseCssColor(v);
  return c ? hexOf(c) : null;
};

describe('parsing computed colors', () => {
  it('reads every syntax a browser reports, to the same hex', () => {
    expect(hex('rgb(36, 88, 230)')).toBe('#2458E6');
    expect(hex('#2458e6')).toBe('#2458E6');
    expect(hex('hsl(0, 0%, 100%)')).toBe('#FFFFFF');
    expect(hex('color(srgb 1 1 1)')).toBe('#FFFFFF');
    expect(hex('oklch(0.6283 0.2577 29.23)')).toBe('#FF0000');
    expect(hex('oklab(0 0 0)')).toBe('#000000');
    expect(hex('lab(100 0 0)')).toBe('#FFFFFF');
    expect(hex('color(display-p3 1 1 1)')).toBe('#FFFFFF');
  });

  it('keeps alpha as an 8-digit hex and drops what is not a color', () => {
    expect(hex('rgba(11, 31, 58, 0.12)')).toBe('#0B1F3A1F');
    expect(hex('rgb(11 31 58 / 12%)')).toBe('#0B1F3A1F');
    for (const v of ['transparent', 'rgba(0, 0, 0, 0)', 'currentcolor', 'var(--x)', 'none', 'junk(1)']) expect(hex(v), v).toBeNull();
  });

  it('finds every color inside a shadow or gradient', () => {
    expect(colorsIn('rgba(11, 31, 58, 0.12) 0px 12px 32px 0px, rgb(255, 255, 255) 0px 0px 0px 1px').map(hexOf)).toEqual(['#0B1F3A1F', '#FFFFFF']);
    expect(colorsIn('linear-gradient(rgb(36, 88, 230), oklch(1 0 0))').map(hexOf)).toEqual(['#2458E6', '#FFFFFF']);
  });
});

describe('OKLab and ΔE', () => {
  it('measures distance as OKLab Euclidean × 100', () => {
    expect(deltaE(parseCssColor('#FFFFFF')!, parseCssColor('#FFFFFF')!)).toBe(0);
    expect(deltaE(parseCssColor('#000000')!, parseCssColor('#FFFFFF')!)).toBeCloseTo(100, 0);
    expect(deltaE(parseCssColor('#FFFFFF')!, parseCssColor('#F5F5F5')!)).toBeCloseTo(2.98, 1);
  });

  it('reports a gray with no chroma and a hue for a chromatic color', () => {
    expect(oklabToOklch(rgbToOklab(parseCssColor('#737373')!)).c).toBeLessThan(1e-4);
    const blue = oklabToOklch(rgbToOklab(parseCssColor('#2458E6')!));
    expect(blue.h).toBeGreaterThan(255);
    expect(blue.h).toBeLessThan(270);
  });
});
