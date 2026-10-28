import { PNG } from 'pngjs';
import type { BBox } from '@dse/schema';

// Crops of the full-page screenshot, which is taken at device scale 2 (docs/specs/crawler.md).

/** A clip below the screenshot's cut, where novel element candidates sit (capture-and-states.md, step 4). */
export type ShotBand = { y: number; height: number; png: Buffer };
export type Shot = { png: Buffer; width: number; height: number; bands?: ShotBand[] };

const decoded = new WeakMap<Buffer, PNG>();

function decode(buf: Buffer): PNG {
  let p = decoded.get(buf);
  if (!p) {
    p = PNG.sync.read(buf);
    decoded.set(buf, p);
  }
  return p;
}

/** How far down the page the screenshot and its bands reach, in CSS px. */
export function shotExtent(shot: Shot): number {
  return Math.max(shot.height, ...(shot.bands ?? []).map((b) => b.y + b.height));
}

/**
 * A region of the screenshot in CSS px, clipped to the page; null when nothing is left. A region
 * below the cut is read from the band that holds it, else from the band it overlaps most.
 */
export function cropShot(shot: Shot, box: BBox): Buffer | null {
  if (box.y + box.h > shot.height && shot.bands?.length) {
    const overlap = (b: ShotBand) => Math.min(box.y + box.h, b.y + b.height) - Math.max(box.y, b.y);
    const band = [...shot.bands].sort((a, b) => overlap(b) - overlap(a))[0]!;
    const main = Math.min(box.y + box.h, shot.height) - box.y;
    if (overlap(band) > main) return cropImage(band.png, shot.width, { ...box, y: box.y - band.y });
  }
  return cropImage(shot.png, shot.width, box);
}

function cropImage(png: Buffer, cssWidth: number, box: BBox): Buffer | null {
  const src = decode(png);
  const scale = src.width / cssWidth;
  const x0 = Math.max(0, Math.floor(box.x * scale));
  const y0 = Math.max(0, Math.floor(box.y * scale));
  const x1 = Math.min(src.width, Math.ceil((box.x + box.w) * scale));
  const y1 = Math.min(src.height, Math.ceil((box.y + box.h) * scale));
  if (x1 <= x0 || y1 <= y0) return null;
  const out = new PNG({ width: x1 - x0, height: y1 - y0 });
  PNG.bitblt(src, out, x0, y0, x1 - x0, y1 - y0, 0, 0);
  return PNG.sync.write(out);
}

/** One pixel of the screenshot or a band at a CSS px point, or null outside them. */
export function pixelAt(shot: Shot, x: number, y: number): { r: number; g: number; b: number; a: number } | null {
  const band = y >= shot.height ? shot.bands?.find((b) => y >= b.y && y < b.y + b.height) : undefined;
  if (y >= shot.height && !band) return null;
  const src = decode(band ? band.png : shot.png);
  const scale = src.width / shot.width;
  const px = Math.floor(x * scale);
  const py = Math.floor((y - (band?.y ?? 0)) * scale);
  if (px < 0 || py < 0 || px >= src.width || py >= src.height) return null;
  const i = (py * src.width + px) * 4;
  return { r: src.data[i]!, g: src.data[i + 1]!, b: src.data[i + 2]!, a: src.data[i + 3]! / 255 };
}

/** The crop's margin painted with the ground (D-094): everything outside the inner box, `margin` CSS px wide. */
export function paintMargin(png: Buffer, margin: number, cssWidth: number, ground: string): Buffer {
  const img = PNG.sync.read(png);
  const scale = img.width / cssWidth;
  const m = Math.round(margin * scale);
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(ground.slice(i, i + 2), 16));
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (x >= m && x < img.width - m && y >= m && y < img.height - m) continue;
      const i = (y * img.width + x) * 4;
      img.data[i] = r!;
      img.data[i + 1] = g!;
      img.data[i + 2] = b!;
      img.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(img);
}

/** The element's box plus a margin, as the state crops are taken (4 px since v1.2, D-094). */
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
