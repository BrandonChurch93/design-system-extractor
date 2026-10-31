import { describe, expect, it } from 'vitest';
import { contrastFallback } from '../lib/ground';
import { fitPreview } from '../lib/preview-fit';

describe('the card scale (D-107)', () => {
  const room = { w: 339, h: 152 };
  it('fits on width and on height, never up', () => {
    expect(fitPreview({ w: 120, h: 44 }, room, 16).scale).toBe(1);
    expect(fitPreview({ w: 400, h: 44 }, room, 16)).toEqual({ scale: (339 - 32) / 400, anchored: false, clipRight: false, clipBottom: false });
    expect(fitPreview({ w: 200, h: 180 }, room, 16).scale).toBeCloseTo(120 / 180);
  });
  it('fits the whole region, counting the anchored inset once: 520 px in 339 is cut, 330 is not (D-112)', () => {
    const region = { w: 339, h: 152 };
    expect(fitPreview({ w: 520, h: 44 }, region, 16)).toMatchObject({ scale: 0.6, anchored: true, clipRight: true, clipBottom: false });
    expect(fitPreview({ w: 330, h: 44 }, region, 16)).toMatchObject({ anchored: false, clipRight: false, clipBottom: false });
  });

  it('stops at 0.6×, anchored top-left, and says which edges it cuts', () => {
    expect(fitPreview({ w: 880, h: 96 }, room, 16)).toEqual({ scale: 0.6, anchored: true, clipRight: true, clipBottom: false });
    expect(fitPreview({ w: 300, h: 400 }, room, 16)).toEqual({ scale: 0.6, anchored: true, clipRight: false, clipBottom: true });
    expect(fitPreview({ w: 1440, h: 640 }, room, 16)).toEqual({ scale: 0.6, anchored: true, clipRight: true, clipBottom: true });
  });
});

describe('the contrast fallback (D-109)', () => {
  it('swaps a ground within ΔE 5 of the fill for the opposite tone', () => {
    expect(contrastFallback('#1A1A1A', '#141414')).toBe('light');
    expect(contrastFallback('#F7F7F7', '#FFFFFF')).toBe('dark');
  });
  it('keeps the sampled ground past ΔE 5, for a transparent fill, or when either is unknown', () => {
    expect(contrastFallback('#2458E6', '#141414')).toBeNull();
    expect(contrastFallback(null, '#141414')).toBeNull();
    expect(contrastFallback('#1A1A1A', undefined)).toBeNull();
  });
  it('turns at ΔE 5', async () => {
    const { deltaE, parseHex } = await import('@dse/pipeline/color');
    const near = ['#1E1E1E', '#262626', '#2A2A2A', '#303030'].map((h) => [h, deltaE(parseHex(h), parseHex('#141414'))] as const);
    const under = near.find(([, d]) => d <= 5)!;
    const over = near.find(([, d]) => d > 5)!;
    expect(contrastFallback(under[0], '#141414')).toBe('light');
    expect(contrastFallback(over[0], '#141414')).toBeNull();
  });
});
