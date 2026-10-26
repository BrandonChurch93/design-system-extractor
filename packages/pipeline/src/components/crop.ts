import { PNG } from 'pngjs';
import type { BBox } from '@dse/schema';

// Crops of the full-page screenshot, which is taken at device scale 2 (docs/specs/crawler.md).

export type Shot = { png: Buffer; width: number; height: number };

const decoded = new WeakMap<Buffer, PNG>();

function decode(buf: Buffer): PNG {
  let p = decoded.get(buf);
  if (!p) {
    p = PNG.sync.read(buf);
    decoded.set(buf, p);
  }
  return p;
}

/** A region of the screenshot in CSS px, clipped to the page; null when nothing is left. */
export function cropShot(shot: Shot, box: BBox): Buffer | null {
  const src = decode(shot.png);
  const scale = src.width / shot.width;
  const x0 = Math.max(0, Math.floor(box.x * scale));
  const y0 = Math.max(0, Math.floor(box.y * scale));
  const x1 = Math.min(src.width, Math.ceil((box.x + box.w) * scale));
  const y1 = Math.min(src.height, Math.ceil((box.y + box.h) * scale));
  if (x1 <= x0 || y1 <= y0) return null;
  const out = new PNG({ width: x1 - x0, height: y1 - y0 });
  PNG.bitblt(src, out, x0, y0, x1 - x0, y1 - y0, 0, 0);
  return PNG.sync.write(out);
}

/** The element's box plus a margin, as the state crops are taken (8 px). */
export function padded(b: BBox, margin: number): BBox {
  return { x: b.x - margin, y: b.y - margin, w: b.w + margin * 2, h: b.h + margin * 2 };
}

/**
 * The source crop (D-008): the element plus 16 px on every side, at least 320 × 240 CSS px centered
 * on the element, kept inside the page, with the element's box relative to the crop.
 */
export function sourceRegion(b: BBox, page: { width: number; height: number }): { region: BBox; outline: BBox } {
  const w = Math.min(page.width, Math.max(320, b.w + 32));
  const h = Math.min(page.height, Math.max(240, b.h + 32));
  const x = Math.min(Math.max(0, b.x + b.w / 2 - w / 2), Math.max(0, page.width - w));
  const y = Math.min(Math.max(0, b.y + b.h / 2 - h / 2), Math.max(0, page.height - h));
  const region = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  return { region, outline: { x: Math.round(b.x - region.x), y: Math.round(b.y - region.y), w: Math.round(b.w), h: Math.round(b.h) } };
}

/** Downscales so the longer side is at most `max` px (model images, docs/specs/model-calls.md). */
export function downscale(buf: Buffer, max = 512): Buffer {
  const src = decode(buf);
  const f = Math.max(src.width, src.height) / max;
  if (f <= 1) return buf;
  const w = Math.max(1, Math.round(src.width / f));
  const h = Math.max(1, Math.round(src.height / f));
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx0 = Math.floor(x * f);
      const sy0 = Math.floor(y * f);
      const sx1 = Math.min(src.width, Math.max(sx0 + 1, Math.floor((x + 1) * f)));
      const sy1 = Math.min(src.height, Math.max(sy0 + 1, Math.floor((y + 1) * f)));
      const acc = [0, 0, 0, 0];
      let n = 0;
      for (let yy = sy0; yy < sy1; yy++) {
        for (let xx = sx0; xx < sx1; xx++) {
          const i = (yy * src.width + xx) * 4;
          for (let c = 0; c < 4; c++) acc[c]! += src.data[i + c]!;
          n++;
        }
      }
      const o = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) out.data[o + c] = Math.round(acc[c]! / n);
    }
  }
  return PNG.sync.write(out);
}
