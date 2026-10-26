// Color parsing and OKLab/OKLCH math. Browser-safe.
import type { Rgba } from './contrast';
import { toHex } from './contrast';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export type Oklab = { L: number; a: number; b: number };
export type OklchValue = { l: number; c: number; h: number };

export function rgbToOklab({ r, g, b }: Rgba): Oklab {
  const [lr, lg, lb] = [r, g, b].map((v) => toLinear(v / 255)) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** OKLab to linear sRGB, unclamped. */
function oklabToLinear({ L, a, b }: Oklab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

/** OKLab to sRGB 0..255, clamped into gamut. */
export function oklabToRgb(lab: Oklab, alpha = 1): Rgba {
  const [r, g, b] = oklabToLinear(lab).map((c) => Math.round(clamp01(toGamma(clamp01(c))) * 255)) as [number, number, number];
  return { r, g, b, a: alpha };
}

export function oklabToOklch({ L, a, b }: Oklab): OklchValue {
  const c = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-4 ? 0 : h };
}

export function oklchToOklab({ l, c, h }: OklchValue): Oklab {
  const r = (h * Math.PI) / 180;
  return { L: l, a: c * Math.cos(r), b: c * Math.sin(r) };
}

/** OKLab Euclidean distance × 100, the ΔE used by every clustering and drift rule. */
export function deltaE(x: Rgba | Oklab, y: Rgba | Oklab): number {
  const A = 'L' in x ? x : rgbToOklab(x);
  const B = 'L' in y ? y : rgbToOklab(y);
  return Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b) * 100;
}

function num(s: string, scale = 1): number {
  const t = s.trim();
  if (t === 'none') return 0;
  return t.endsWith('%') ? (parseFloat(t) / 100) * scale : parseFloat(t);
}

function alphaOf(s: string | undefined): number {
  if (s === undefined) return 1;
  return clamp01(num(s, 1));
}

/**
 * Parses a computed CSS color: rgb/rgba, hex, oklch, oklab, lab, lch, hsl and color(srgb …),
 * color(display-p3 …), color(srgb-linear …). Returns null for transparent, currentcolor or junk.
 */
export function parseCssColor(input: string): Rgba | null {
  const v = input.trim().toLowerCase();
  if (!v || v === 'transparent' || v === 'none' || v === 'currentcolor' || v.startsWith('var(')) return null;
  if (v.startsWith('#')) {
    const h = v.slice(1);
    if (!/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(h)) return null;
    const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) / 255 : 1 };
  }
  const m = /^([a-z-]+)\((.*)\)$/.exec(v);
  if (!m) return null;
  const fn = m[1]!;
  const body = m[2]!.replace(/,/g, ' ');
  const [main, alphaPart] = body.split('/').map((x) => x.trim()) as [string, string | undefined];
  const parts = main.split(/\s+/).filter(Boolean);
  const alphaFromList = fn === 'rgba' || fn === 'hsla' || (fn === 'rgb' && parts.length === 4) ? parts[3] : undefined;
  const a = alphaOf(alphaPart ?? alphaFromList);
  if (a === 0) return null;
  if (fn === 'rgb' || fn === 'rgba') {
    const [r, g, b] = parts.slice(0, 3).map((p) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p))) as [number, number, number];
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a };
  }
  if (fn === 'hsl' || fn === 'hsla') {
    const h = parseFloat(parts[0]!);
    const s = num(parts[1]!, 1);
    const l = num(parts[2]!, 1);
    const k = (n: number) => (n + h / 30) % 12;
    const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), a };
  }
  if (fn === 'oklab') return oklabToRgb({ L: num(parts[0]!, 1), a: num(parts[1]!, 0.4), b: num(parts[2]!, 0.4) }, a);
  if (fn === 'oklch') return oklabToRgb(oklchToOklab({ l: num(parts[0]!, 1), c: num(parts[1]!, 0.4), h: parseFloat(parts[2]!) || 0 }), a);
  if (fn === 'lab' || fn === 'lch') {
    // CIE Lab (D50) to sRGB through XYZ.
    const L = num(parts[0]!, 100);
    let A: number;
    let B: number;
    if (fn === 'lab') {
      A = num(parts[1]!, 125);
      B = num(parts[2]!, 125);
    } else {
      const C = num(parts[1]!, 150);
      const H = ((parseFloat(parts[2]!) || 0) * Math.PI) / 180;
      A = C * Math.cos(H);
      B = C * Math.sin(H);
    }
    const fy = (L + 16) / 116;
    const fx = fy + A / 500;
    const fz = fy - B / 200;
    const finv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
    const X = 0.96422 * finv(fx);
    const Y = 1 * (L > 8 ? fy ** 3 : L / (24389 / 27));
    const Z = 0.82521 * finv(fz);
    // Bradford D50 to D65, then XYZ to linear sRGB.
    const X65 = 0.9554734527 * X - 0.0230985368 * Y + 0.0632593086 * Z;
    const Y65 = -0.0283697093 * X + 1.0099954580 * Y + 0.0210413989 * Z;
    const Z65 = 0.0123140016 * X - 0.0205076964 * Y + 1.3303659366 * Z;
    const lin = [3.2409699419 * X65 - 1.5373831776 * Y65 - 0.4986107603 * Z65, -0.9692436363 * X65 + 1.8759675015 * Y65 + 0.0415550574 * Z65, 0.0556300797 * X65 - 0.2039769589 * Y65 + 1.0569715142 * Z65];
    const [r, g, b] = lin.map((c) => Math.round(clamp01(toGamma(clamp01(c))) * 255)) as [number, number, number];
    return { r, g, b, a };
  }
  if (fn === 'color') {
    const space = parts[0]!;
    const [x, y, z] = parts.slice(1, 4).map((p) => num(p, 1)) as [number, number, number];
    if (space === 'srgb') return { r: Math.round(clamp01(x) * 255), g: Math.round(clamp01(y) * 255), b: Math.round(clamp01(z) * 255), a };
    if (space === 'srgb-linear') return { r: Math.round(toGamma(clamp01(x)) * 255), g: Math.round(toGamma(clamp01(y)) * 255), b: Math.round(toGamma(clamp01(z)) * 255), a };
    if (space === 'display-p3') {
      const [lr, lg, lb] = [x, y, z].map((c) => toLinear(clamp01(c))) as [number, number, number];
      const r = 1.2249401 * lr - 0.2249404 * lg + 0 * lb;
      const g = -0.0420569 * lr + 1.0420571 * lg + 0 * lb;
      const b = -0.0196376 * lr - 0.0786361 * lg + 1.0982735 * lb;
      return { r: Math.round(clamp01(toGamma(clamp01(r))) * 255), g: Math.round(clamp01(toGamma(clamp01(g))) * 255), b: Math.round(clamp01(toGamma(clamp01(b))) * 255), a };
    }
  }
  return null;
}

/** Uppercase hex, 8 digits when alpha is below 1 (docs/specs/data-model.md). */
export function hexOf(c: Rgba): string {
  return toHex({ ...c, a: Math.round(c.a * 255) / 255 });
}

/** Every color inside a value such as a box-shadow or gradient. */
export function colorsIn(value: string): Rgba[] {
  const out: Rgba[] = [];
  const re = /(rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;
  for (const m of value.matchAll(re)) {
    const c = parseCssColor(m[0]);
    if (c) out.push(c);
  }
  return out;
}
