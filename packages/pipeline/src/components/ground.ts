import { deltaE, hexOf } from '../color/parse';
import { ancestors, parseRgb } from '../capture/snapshot';
import { CROP_PAD } from '../capture/states';
import { padded, paintMargin, pixelAt } from './crop';
import type { Item } from './items';

// Ground (docs/specs/capture-and-states.md, D-094): the color an instance sat on, painted behind its preview.

export const CROP_MARGIN = CROP_PAD;

/** The four corners of the crop margin when they agree within ΔE 2; else the nearest opaque ancestor; else the body; else the page's canvas; else white. */
export function groundOf(it: Item): string {
  if (!it.revealed) {
    const m = padded({ x: it.el.x, y: it.el.y, w: it.el.w, h: it.el.h }, CROP_MARGIN);
    const shot = it.vc.screenshot;
    const corners = [
      [m.x + 1, m.y + 1],
      [m.x + m.w - 2, m.y + 1],
      [m.x + 1, m.y + m.h - 2],
      [m.x + m.w - 2, m.y + m.h - 2],
    ].map(([x, y]) => pixelAt(shot, x!, y!));
    if (corners.every((c) => c && c.a >= 1)) {
      const cs = corners as { r: number; g: number; b: number; a: number }[];
      if (cs.every((a) => cs.every((b) => deltaE(a, b) <= 2))) {
        const avg = (k: 'r' | 'g' | 'b') => Math.round(cs.reduce((s, c) => s + c[k], 0) / cs.length);
        return hexOf({ r: avg('r'), g: avg('g'), b: avg('b'), a: 1 });
      }
    }
  }
  const s = it.snapshot;
  for (const a of ancestors(s, it.el)) {
    const c = parseRgb(a.style['background-color']);
    if (c && c.a >= 1) return hexOf(c);
  }
  const body = s.elements.find((e) => e.tag === 'body');
  const bg = body ? parseRgb(body.style['background-color']) : null;
  if (bg && bg.a >= 1) return hexOf(bg);
  // No opaque background anywhere: the canvas the page paints on, read where nothing covers it (D-098).
  const canvas = pixelAt(it.vc.screenshot, 1, 1);
  return canvas && canvas.a >= 1 ? hexOf({ ...canvas, a: 1 }) : '#FFFFFF';
}

/**
 * A crop with its margin painted with the ground, so no page bleeds into it. Left as captured when the
 * element casts a shadow or the state draws a ring or glow (they live in the margin, D-097), or when the
 * crop was clipped at an edge.
 */
export function withGround(png: Buffer | null | undefined, it: Item, ground: string, delta: { property: string }[] = []): Buffer | null {
  if (!png) return null;
  const shadow = it.el.style['box-shadow'];
  if (shadow && shadow !== 'none') return png;
  // A state that draws outside the box (a focus ring, a glow) keeps its margin as captured.
  if (delta.some((d) => /^(outline|box-shadow)/.test(d.property))) return png;
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  const scale = w / (it.el.w + CROP_MARGIN * 2);
  if (Math.abs(h - (it.el.h + CROP_MARGIN * 2) * scale) > 3 || scale < 1) return png;
  return paintMargin(png, CROP_MARGIN, it.el.w + CROP_MARGIN * 2, ground);
}

/** The most common ground among instances, first seen on a tie. */
export function commonGround(grounds: string[]): string | undefined {
  const n = new Map<string, number>();
  for (const g of grounds) n.set(g, (n.get(g) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1])[0]?.[0];
}
