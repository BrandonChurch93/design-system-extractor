import type { Transition, Variants } from 'motion/react';
import { duration, ease, REDUCED_DURATION, SLIDE_TRAVEL, staggerDelay } from './timing';

// The six moves (docs/design/motion.md) as Motion variants with `hidden`, `shown` and `exit`.
// Every entrance has its reverse as `exit`. Reduced motion swaps in an opacity change.

export type Move = 'draw' | 'wipe' | 'extend' | 'slide' | 'reveal' | 'count';
export type Edge = 'right' | 'bottom' | 'left' | 'top';

const enter = (d: number, delay = 0): Transition => ({ duration: d, ease: ease.standard, delay });
const leave = (d: number, delay = 0): Transition => ({ duration: d, ease: ease.exit, delay });

/** A hairline or text revealed left to right by a clip; undraws right to left. */
export function drawVariants(d: number = duration.base): Variants {
  return {
    hidden: { clipPath: 'inset(0 100% 0 0)' },
    shown: (i: number = 0) => ({ clipPath: 'inset(0 0% 0 0)', transition: enter(d, staggerDelay(i)) }),
    exit: { clipPath: 'inset(0 100% 0 0)', transition: leave(duration.base) },
  };
}

/** Text revealed left to right behind a clip, no vertical movement. */
export const wipeVariants = drawVariants;

/** A bar or block that grows from its leading edge, and shrinks back to it. */
export function extendVariants(d: number = duration.base, axis: 'x' | 'y' = 'x'): Variants {
  if (axis === 'y') {
    return {
      hidden: { scaleY: 0 },
      shown: (i: number = 0) => ({ scaleY: 1, transition: enter(d, staggerDelay(i)) }),
      exit: { scaleY: 0, transition: leave(duration.fast) },
    };
  }
  return {
    hidden: { scaleX: 0 },
    shown: (i: number = 0) => ({ scaleX: 1, transition: enter(d, staggerDelay(i)) }),
    exit: { scaleX: 0, transition: leave(duration.fast) },
  };
}

/** A short travel in from an edge with opacity; slides back out the same edge. */
export function slideVariants(edge: Edge = 'bottom', d: number = duration.slow, travel: number = SLIDE_TRAVEL): Variants {
  const offset = { right: { x: travel }, left: { x: -travel }, bottom: { y: travel }, top: { y: -travel } }[edge];
  return {
    hidden: { ...offset, opacity: 0 },
    shown: (i: number = 0) => ({ x: 0, y: 0, opacity: 1, transition: enter(d, staggerDelay(i)) }),
    exit: { ...offset, opacity: 0, transition: leave(d) },
  };
}

/** A card's frame extends, then its content wipes in; content unwipes, then the frame shrinks. */
export function revealFrameVariants(): Variants {
  return {
    hidden: { clipPath: 'inset(0 0 100% 0 round 18px)' },
    shown: (i: number = 0) => ({
      clipPath: 'inset(0 0 0% 0 round 18px)',
      transition: { ...enter(duration.base, staggerDelay(i)), when: 'beforeChildren' },
    }),
    exit: { clipPath: 'inset(0 0 100% 0 round 18px)', transition: { ...leave(duration.base), when: 'afterChildren' } },
  };
}

export function revealContentVariants(): Variants {
  return {
    hidden: { clipPath: 'inset(0 100% 0 0)' },
    shown: { clipPath: 'inset(0 0% 0 0)', transition: enter(duration.base) },
    exit: { clipPath: 'inset(0 100% 0 0)', transition: leave(duration.fast) },
  };
}

/** What every move becomes under prefers-reduced-motion: a 200 ms opacity change, no stagger. */
export function reducedVariants(): Variants {
  return {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: REDUCED_DURATION, ease: 'linear' } },
    exit: { opacity: 0, transition: { duration: REDUCED_DURATION, ease: 'linear' } },
  };
}

export function variantsFor(move: Exclude<Move, 'count'>, reduced: boolean, opts: { edge?: Edge; d?: number } = {}): Variants {
  if (reduced) return reducedVariants();
  switch (move) {
    case 'draw':
    case 'wipe':
      return drawVariants(opts.d);
    case 'extend':
      return extendVariants(opts.d);
    case 'slide':
      return slideVariants(opts.edge, opts.d);
    case 'reveal':
      return revealFrameVariants();
  }
}

/**
 * Exits run first (docs/design/motion.md, Reverses): after a filter change an entering card waits for
 * a leaving one, whose content wipes out over motion-fast and whose frame then closes over motion-base.
 * The delay lives in the variant's own transition, which a transition prop beside it cannot override.
 */
export function afterExits(v: Variants): Variants {
  const shown = v.shown as (i: number) => { transition?: Transition };
  return {
    ...v,
    shown: (i: number) => {
      const t = shown(i);
      return { ...t, transition: { ...t.transition, delay: ((t.transition as { delay?: number } | undefined)?.delay ?? 0) + duration.fast + duration.base } };
    },
  };
}

