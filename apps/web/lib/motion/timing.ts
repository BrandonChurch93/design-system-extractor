// Mirrors the motion tokens in styles/tokens.css (docs/design/motion.md); a test keeps them equal.
export const duration = { fast: 0.16, base: 0.26, slow: 0.42, stage: 0.6 } as const;
export const ease = {
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
};
export const STAGGER = 0.03;
export const STAGGER_CAP = 12;
/** Reduced motion collapses every move to this opacity change. */
export const REDUCED_DURATION = 0.2;
export const PRESS_DURATION = 0.08;
export const SLIDE_TRAVEL = 16;

/** Items past the cap enter together, with the cap's delay. */
export function staggerDelay(index: number): number {
  return Math.min(Math.max(index, 0), STAGGER_CAP) * STAGGER;
}

export const easeCss = {
  standard: `cubic-bezier(${ease.standard.join(', ')})`,
  exit: `cubic-bezier(${ease.exit.join(', ')})`,
};
