// WCAG 2.x relative luminance and contrast. Browser-safe.

export type Rgba = { r: number; g: number; b: number; a: number };

/** Parses #RGB, #RGBA, #RRGGBB and #RRGGBBAA into 0..255 channels and 0..1 alpha. */
export function parseHex(hex: string): Rgba {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(h)) throw new Error(`not a hex color: ${hex}`);
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

export function toHex({ r, g, b, a }: Rgba): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0').toUpperCase();
  return `#${c(r)}${c(g)}${c(b)}${a < 1 ? c(a * 255) : ''}`;
}

/** Composites a color with alpha over an opaque ground. */
export function composite(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(c: Rgba): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** The WCAG contrast ratio of two colors; alpha in `fg` is composited over `bg`. */
export function contrastRatio(fg: Rgba | string, bg: Rgba | string): number {
  const b = typeof bg === 'string' ? parseHex(bg) : bg;
  const opaqueBg = b.a < 1 ? composite(b, { r: 255, g: 255, b: 255, a: 1 }) : b;
  const f0 = typeof fg === 'string' ? parseHex(fg) : fg;
  const f = f0.a < 1 ? composite(f0, opaqueBg) : f0;
  const l1 = relativeLuminance(f);
  const l2 = relativeLuminance(opaqueBg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Formats a ratio once, as the copy rules require: "5.4:1". */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`;
}

/** An extracted color close enough to white that a swatch needs an edge. */
export function isNearWhite(hex: string): boolean {
  return contrastRatio(hex, '#FFFFFF') < 1.15;
}
