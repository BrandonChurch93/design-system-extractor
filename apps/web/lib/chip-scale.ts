// A pattern's values scaled to its 56 px chip (docs/design/components.md, PatternRow; D-104): px
// translations × 0.35 clamped to ±14 per axis, percentages as they are, blur halved and clamped at 6 px,
// scale and rotate as they are; at rest the opacity is floored at 0.25 so a rest state is never empty.

const K = 0.35;
const CLAMP = 14;
const BLUR_MAX = 6;
export const REST_OPACITY_FLOOR = 0.25;

const r2 = (v: number) => Math.round(v * 100) / 100;
const px = (v: number) => `${r2(Math.max(-CLAMP, Math.min(CLAMP, v * K)))}px`;

/** One length: px scaled and clamped, a percentage or anything else as it is. */
function length(v: string): string {
  const m = /^(-?\d*\.?\d+)px$/.exec(v.trim());
  return m ? px(Number(m[1])) : v.trim();
}

export function scaleTransform(value: string): string {
  const v = value.trim();
  if (!v || v === 'none') return v;
  const matrix = /^matrix\(([^)]+)\)$/.exec(v);
  if (matrix) {
    const n = matrix[1]!.split(',').map((x) => Number(x.trim()));
    if (n.length === 6 && n.every(Number.isFinite)) return `matrix(${[...n.slice(0, 4), Number.parseFloat(px(n[4]!)), Number.parseFloat(px(n[5]!))].map(r2).join(', ')})`;
  }
  const m3 = /^matrix3d\(([^)]+)\)$/.exec(v);
  if (m3) {
    const n = m3[1]!.split(',').map((x) => Number(x.trim()));
    if (n.length === 16 && n.every(Number.isFinite)) {
      n[12] = Number.parseFloat(px(n[12]!));
      n[13] = Number.parseFloat(px(n[13]!));
      n[14] = Number.parseFloat(px(n[14]!));
      return `matrix3d(${n.map(r2).join(', ')})`;
    }
  }
  return v.replace(/translate(X|Y|Z|3d)?\(([^)]*)\)/g, (_m, axis: string | undefined, args: string) => `translate${axis ?? ''}(${args.split(',').map(length).join(', ')})`);
}

/** The `translate` property: one to three lengths. */
export function scaleTranslate(value: string): string {
  const v = value.trim();
  return !v || v === 'none' ? v : v.split(/\s+/).map(length).join(' ');
}

export function scaleFilter(value: string): string {
  return value.replace(/blur\(\s*(-?\d*\.?\d+)px\s*\)/g, (_m, n: string) => `blur(${r2(Math.min(BLUR_MAX, Number(n) / 2))}px)`);
}

/** A pattern's start or end values scaled to the chip; `rest` floors the opacity. */
export function chipValues(values: Record<string, string>, rest = false): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [p, v] of Object.entries(values)) {
    if (p === 'transform') out[p] = scaleTransform(v);
    else if (p === 'translate') out[p] = scaleTranslate(v);
    else if (p === 'filter') out[p] = scaleFilter(v);
    else out[p] = v;
  }
  if (rest && 'opacity' in out) {
    const o = Number.parseFloat(out.opacity!);
    if (!Number.isFinite(o) || o < REST_OPACITY_FLOOR) out.opacity = String(REST_OPACITY_FLOOR);
  }
  return out;
}
