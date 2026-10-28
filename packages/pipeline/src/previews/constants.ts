// Preview numbers (docs/specs/preview-fidelity.md). The panel shows the measured diff.

/** At or under this share of differing pixels, a preview is live. */
export const LIVE_MAX_DIFF_PCT = 2.5;
/** pixelmatch's per-pixel color threshold. */
export const PIXEL_THRESHOLD = 0.1;
export const CSS_CAP_BYTES = 200_000;
/** A copied font file's size cap: 1 MB, since a variable font is often over the 300 KB of v1.1 (D-098). */
export const FONT_CAP_BYTES = 1_000_000;
/** An image's own pixels are stored for its placeholder up to this size; larger keeps its average color. */
export const IMAGE_CAP_BYTES = 400_000;
/** The render check pads the instance box by this much on every side. */
export const RENDER_PAD = 8;
export const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com';
export const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com';
