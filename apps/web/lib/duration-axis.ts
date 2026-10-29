// The durations strip's axis (docs/design/components.md, DurationStrip; D-102): a base-10 log scale
// from the shortest duration to the longest, and labels placed greedily by x on at most two rows each side.

/** Labels on one row keep at least this much between their centers, and never touch. */
export const LABEL_GAP = 56;
export const LABEL_ROWS = 2;
/** The mono `hex` style's advance per character, for the label widths the placement keeps apart. */
const CHAR_PX = 7.3;

/** Each duration's x in px on a log scale over `width`; one duration, or all equal, sits at the center. */
export function logPositions(ms: number[], width: number): number[] {
  const lo = Math.log10(Math.max(1, Math.min(...ms)));
  const hi = Math.log10(Math.max(1, Math.max(...ms)));
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
