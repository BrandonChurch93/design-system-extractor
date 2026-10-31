// The durations strip's axis (docs/design/components.md, DurationStrip; D-102): a base-10 log scale
// from the shortest duration to the longest, and labels placed greedily by x on at most two rows each side.

/** Labels on one row keep at least this much between their centers, and never touch. */
export const LABEL_GAP = 56;
export const LABEL_ROWS = 2;
/** The mono `hex` style's advance per character, for the label widths the placement keeps apart. */
const CHAR_PX = 7.3;

/**
 * Each duration's x in px on a log scale over `width`; one duration, or all equal, sits at the center.
 * `end` fixes the scale's top (2,000 ms when the Long list holds the rest, D-111).
 */
export function logPositions(ms: number[], width: number, end?: number): number[] {
  const lo = Math.log10(Math.max(1, Math.min(...ms)));
  const hi = Math.log10(Math.max(1, end ?? Math.max(...ms)));
  if (!(hi > lo)) return ms.map(() => width / 2);
  return ms.map((v) => ((Math.log10(Math.max(1, v)) - lo) / (hi - lo)) * width);
}

/**
 * The row each label takes, or null when it fits on neither (dropped; its tick stays). Greedy by x:
 * a label takes the first row whose last label is far enough left of it.
 */
export function labelRows(xs: number[], texts: (string | null)[], rows = LABEL_ROWS): (number | null)[] {
  const last: { x: number; half: number }[] = [];
  return xs.map((x, i) => {
    const text = texts[i];
    if (text === null || text === undefined) return null;
    const half = (text.length * CHAR_PX) / 2;
    for (let r = 0; r < rows; r++) {
      const prev = last[r];
      if (!prev || (x - prev.x >= LABEL_GAP && x - prev.x >= prev.half + half + 4)) {
        last[r] = { x, half };
        return r;
      }
    }
    return null;
  });
}

/** Half the widest label in px: the axis is inset by it, so no label leaves the strip's box (D-112). */
export function labelInset(texts: (string | null)[]): number {
  return Math.ceil(Math.max(0, ...texts.map((t) => (t ? (t.length * CHAR_PX) / 2 : 0))));
}

/** A tick is labeled only when its value shows and, if it has a role, its role shows too (D-112). */
export function labeledCount(valueRows: (number | null)[], roles: (string | null)[], roleRows: (number | null)[]): number {
  return valueRows.filter((r, i) => r !== null && (!roles[i] || roleRows[i] !== null)).length;
}

/** A trigger's target: 24 px across, clear of every other (WCAG 2.5.8). */
export const TARGET = 24;

/**
 * Which ticks are popover triggers: every tick whose value label was dropped, since the popover is
 * then its only reading (D-102); then the rest, most used first, each taken when its center sits at
 * least a target's width from every trigger already taken. The others are drawn, not pressed (D-111, D-112).
 */
export function triggerTicks(xs: number[], usage: number[], dropped: boolean[] = []): boolean[] {
  const order = xs.map((_, i) => i).sort((a, b) => Number(Boolean(dropped[b])) - Number(Boolean(dropped[a])) || usage[b]! - usage[a]! || a - b);
  const taken: number[] = [];
  const out = xs.map(() => false);
  for (const i of order) {
    if (dropped[i] || taken.every((x) => Math.abs(x - xs[i]!) >= TARGET)) {
      taken.push(xs[i]!);
      out[i] = true;
    }
  }
  return out;
}
