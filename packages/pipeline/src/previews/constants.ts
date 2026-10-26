// Preview numbers (docs/specs/preview-fidelity.md). The panel shows the measured diff.

/** At or under this share of differing pixels, a preview is live. */
export const LIVE_MAX_DIFF_PCT = 2.5;
/** pixelmatch's per-pixel color threshold. */
export const PIXEL_THRESHOLD = 0.1;
export const CSS_CAP_BYTES = 200_000;
export const FONT_CAP_BYTES = 300_000;
/** The render check pads the instance box by this much on every side. */
export const RENDER_PAD = 8;
export const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com';
export const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com';
