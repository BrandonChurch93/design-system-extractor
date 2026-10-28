import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { cropShot, paintMargin, pixelAt, shotExtent, type Shot } from '../src/components/crop';
import { bandRegions } from '../src/stages/capture';
import { reasonWords, renderOrder } from '../src/stages/previews';

const png = (w: number, h: number, rgb: [number, number, number]) => {
  const p = new PNG({ width: w, height: h });
  for (let i = 0; i < p.data.length; i += 4) [p.data[i], p.data[i + 1], p.data[i + 2], p.data[i + 3]] = [...rgb, 255];
  return PNG.sync.write(p);
};

describe('the order of render checks (D-095)', () => {
  it('checks core components first, most instances first within a tier, then grid order', () => {
    const c = (tier: 'core' | 'page', n: number) => ({ tier, instances: Array.from({ length: n }) as never[] });
    expect(renderOrder([c('page', 9), c('core', 2), c('core', 5), c('page', 1), c('core', 5)])).toEqual([2, 4, 1, 0, 3]);
  });

  it('states each captured reason with a count above zero', () => {
    expect(reasonWords({ live: 38, diff: 5, 'css-too-large': 0, 'fonts-unavailable': 2, 'not-checked': 1 })).toBe(' · 5 render differed · 2 fonts unavailable · 1 not checked in time');
    expect(reasonWords({ live: 4, diff: 0, 'css-too-large': 0, 'fonts-unavailable': 0, 'not-checked': 0 })).toBe('');
  });
});

describe('crops below the screenshot cut (D-098)', () => {
  it('covers the elements with 128 px around them in clips of at most 2,000 px', () => {
    expect(bandRegions([{ y: 9000, h: 40 }, { y: 9300, h: 400 }, { y: 12_000, h: 300 }, { y: 30_000, h: 10 }], 24_000)).toEqual([
      { y: 8872, height: 956 },
      { y: 11_872, height: 556 },
    ]);
    expect(bandRegions([{ y: 9000, h: 3000 }], 24_000)).toEqual([{ y: 8872, height: 3256 }]);
  });

  it('reads a box below the cut from its band, and samples pixels from it', () => {
    const shot: Shot = { png: png(20, 20, [255, 255, 255]), width: 10, height: 10, bands: [{ y: 30, height: 10, png: png(20, 20, [11, 13, 16]) }] };
    expect(shotExtent(shot)).toBe(40);
    const crop = PNG.sync.read(cropShot(shot, { x: 2, y: 32, w: 4, h: 4 })!);
    expect([crop.width, crop.height, crop.data[0], crop.data[1], crop.data[2]]).toEqual([8, 8, 11, 13, 16]);
    expect(pixelAt(shot, 1, 35)).toEqual({ r: 11, g: 13, b: 16, a: 1 });
    expect(pixelAt(shot, 1, 20)).toBeNull();
    expect(PNG.sync.read(cropShot(shot, { x: 0, y: 0, w: 4, h: 4 })!).data[0]).toBe(255);
  });

  it('paints a crop margin with the ground and leaves the element inside it', () => {
    const out = PNG.sync.read(paintMargin(png(16, 16, [255, 255, 255]), 2, 8, '#0B0D10'));
    const at = (x: number, y: number) => [...out.data.subarray((y * 16 + x) * 4, (y * 16 + x) * 4 + 3)];
    expect(at(0, 0)).toEqual([11, 13, 16]);
    expect(at(3, 8)).toEqual([11, 13, 16]);
    expect(at(4, 4)).toEqual([255, 255, 255]);
  });
});
