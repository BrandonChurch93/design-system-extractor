// Known easing curves (docs/specs/motion-capture.md, Easings): the CSS keywords and the Penner set
// as cubic Béziers. A site's value matches a curve when every control point is within 0.02.

export type Bezier = [number, number, number, number];

export const EASING_TOLERANCE = 0.02;

export const easingTable: { name: string; bezier: Bezier }[] = [
  // CSS Easing Functions Level 1, the keyword curves.
  { name: 'linear', bezier: [0, 0, 1, 1] },
  { name: 'ease', bezier: [0.25, 0.1, 0.25, 1] },
  { name: 'ease-in', bezier: [0.42, 0, 1, 1] },
  { name: 'ease-out', bezier: [0, 0, 0.58, 1] },
  { name: 'ease-in-out', bezier: [0.42, 0, 0.58, 1] },
  // Robert Penner's equations as cubic Béziers, in the values Matthew Lein's Ceaser published,
  // which most CSS libraries copy.
  { name: 'ease-in-quad', bezier: [0.55, 0.085, 0.68, 0.53] },
  { name: 'ease-out-quad', bezier: [0.25, 0.46, 0.45, 0.94] },
  { name: 'ease-in-out-quad', bezier: [0.455, 0.03, 0.515, 0.955] },
  { name: 'ease-in-cubic', bezier: [0.55, 0.055, 0.675, 0.19] },
  { name: 'ease-out-cubic', bezier: [0.215, 0.61, 0.355, 1] },
  { name: 'ease-in-out-cubic', bezier: [0.645, 0.045, 0.355, 1] },
  { name: 'ease-in-quart', bezier: [0.895, 0.03, 0.685, 0.22] },
  { name: 'ease-out-quart', bezier: [0.165, 0.84, 0.44, 1] },
  { name: 'ease-in-out-quart', bezier: [0.77, 0, 0.175, 1] },
  { name: 'ease-in-quint', bezier: [0.755, 0.05, 0.855, 0.06] },
  { name: 'ease-out-quint', bezier: [0.23, 1, 0.32, 1] },
  { name: 'ease-in-out-quint', bezier: [0.86, 0, 0.07, 1] },
  { name: 'ease-in-expo', bezier: [0.95, 0.05, 0.795, 0.035] },
  { name: 'ease-out-expo', bezier: [0.19, 1, 0.22, 1] },
  { name: 'ease-in-out-expo', bezier: [1, 0, 0, 1] },
  { name: 'ease-in-circ', bezier: [0.6, 0.04, 0.98, 0.335] },
  { name: 'ease-out-circ', bezier: [0.075, 0.82, 0.165, 1] },
  { name: 'ease-in-out-circ', bezier: [0.785, 0.135, 0.15, 0.86] },
  { name: 'ease-in-back', bezier: [0.6, -0.28, 0.735, 0.045] },
  { name: 'ease-out-back', bezier: [0.175, 0.885, 0.32, 1.275] },
  { name: 'ease-in-out-back', bezier: [0.68, -0.55, 0.265, 1.55] },
];

const keywords: Record<string, Bezier> = Object.fromEntries(easingTable.slice(0, 5).map((e) => [e.name, e.bezier]));

/** A timing function as a Bézier: keywords converted, `cubic-bezier(…)` read; null for `steps()` and `linear()`. */
export function bezierOf(value: string): Bezier | null {
  const v = value.trim().toLowerCase();
  if (keywords[v]) return keywords[v]!;
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(v);
  if (!m) return null;
  const n = m[1]!.split(',').map(Number);
  return n.length === 4 && n.every(Number.isFinite) ? (n as Bezier) : null;
}

/** The known curve a value matches within 0.02 per control point, if any. */
export function knownEasing(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (keywords[v]) return v;
  const b = bezierOf(v);
  if (!b) return null;
  return easingTable.find((e) => e.bezier.every((x, i) => Math.abs(x - b[i]!) <= EASING_TOLERANCE))?.name ?? null;
}

/** Whether two easings are near-identical for drift's proposed set: every control point within 0.05. */
export function nearEasing(a: string, b: string, tolerance = 0.05): boolean {
  const x = bezierOf(a);
  const y = bezierOf(b);
  if (!x || !y) return a.trim() === b.trim();
  return x.every((v, i) => Math.abs(v - y[i]!) <= tolerance);
}
