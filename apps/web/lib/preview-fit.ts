// How a preview sits in its region (docs/specs/preview-fidelity.md, Sizing; D-107): scaled down to fit,
// on width and on height, never up and never below 0.6×; past the floor it is anchored top-left at a
// `space-4` inset and cut at the region's edge.

export const SCALE_FLOOR = 0.6;
/** The inset of an anchored preview, `space-4`. */
export const ANCHOR_INSET = 16;

export type Fit = { scale: number; anchored: boolean; clipRight: boolean; clipBottom: boolean };

/**
 * `region` is the whole preview region (its border box), never the box left inside an anchored inset,
 * so the inset is counted once (D-112). An anchored preview is cut on an edge when it reaches into
 * that edge's inset, where the fade then sits.
 */
export function fitPreview(size: { w: number; h: number }, region: { w: number; h: number }, padding: number): Fit {
  const fits = Math.min(1, (region.w - padding * 2) / size.w, (region.h - padding * 2) / size.h);
  if (fits >= SCALE_FLOOR) return { scale: fits, anchored: false, clipRight: false, clipBottom: false };
  const scale = SCALE_FLOOR;
  return {
    scale,
    anchored: true,
    clipRight: ANCHOR_INSET + size.w * scale > region.w - ANCHOR_INSET + 0.5,
    clipBottom: ANCHOR_INSET + size.h * scale > region.h - ANCHOR_INSET + 0.5,
  };
}
