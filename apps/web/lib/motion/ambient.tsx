'use client';
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { usePrefersReducedMotion } from './reduced';

// Ambient loops (docs/design/motion.md, D-093, D-097): one clock for the Motion section's easings
// and durations. Every loop starts at the same time on `document.timeline`, travels for 1,400 ms,
// holds 500, fades out 150, resets and fades in 150, forever, and pauses while the section is off screen.

export const AMBIENT = { fadeMs: 150, travelMs: 1400, holdMs: 500 } as const;
export const CYCLE_MS = AMBIENT.fadeMs * 2 + AMBIENT.travelMs + AMBIENT.holdMs;
/** Under reduced motion each dot is drawn still at this share of the travel time. */
export const STILL_AT = 0.6;

type Clock = { epoch: number; add(a: Animation): void; remove(a: Animation): void };
const ClockContext = createContext<Clock | null>(null);

/**
 * The keyframes of one loop: fade in at `from`, travel to `to` over `travelMs` with `easing` (the
 * segment's own easing, so the fades stay linear), hold, fade out. `travelMs` shorter than the
 * travel arrives early and waits, as a short duration does.
 */
export function loopFrames(from: Keyframe, to: Keyframe, easing: string, travelMs: number = AMBIENT.travelMs, fade = true): Keyframe[] {
  const at = (ms: number) => ms / CYCLE_MS;
  const o = (v: number) => (fade ? { opacity: v } : {});
  return [
    { ...from, ...o(0), offset: 0 },
    { ...from, ...o(1), offset: at(AMBIENT.fadeMs), easing },
    { ...to, ...o(1), offset: at(AMBIENT.fadeMs + travelMs) },
    { ...to, ...o(1), offset: at(AMBIENT.fadeMs + AMBIENT.travelMs + AMBIENT.holdMs) },
    { ...to, ...o(0), offset: 1 },
  ];
}

/** Holds the shared start time and pauses every loop inside it while it is off screen. */
export function AmbientClock({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const anims = useRef(new Set<Animation>());
  const visible = useRef(false);
  const clock = useMemo<Clock>(() => {
    const epoch = typeof document === 'undefined' ? 0 : Math.round(Number(document.timeline.currentTime ?? 0));
    return {
      epoch,
      add(a) {
        anims.current.add(a);
        if (visible.current) a.startTime = epoch;
        else a.pause();
      },
      remove(a) {
        anims.current.delete(a);
      },
    };
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = Boolean(e?.isIntersecting);
      for (const a of anims.current) {
        if (a.playState === 'idle') continue;
        // Resuming on the clock's start time keeps every loop in step with the others.
        if (visible.current) a.startTime = clock.epoch;
        else a.pause();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [clock]);
  return (
    <div ref={ref} className={className} data-ambient-clock>
      <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>
    </div>
  );
}

/**
 * One loop on the element, on the section's clock. Under reduced motion the animation is created
 * paused at 60% of the travel, so the browser still places the dot on the real curve, and it never runs.
 */
export function useAmbientLoop(ref: RefObject<Element | null>, frames: Keyframe[] | null, deps: unknown[]): void {
  const clock = useContext(ClockContext);
  const reduced = usePrefersReducedMotion();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !frames || !clock) return;
    let a: Animation;
    try {
      a = el.animate(frames, { duration: CYCLE_MS, iterations: Infinity });
    } catch {
      // A value the browser cannot read as an easing is not animated.
      return;
    }
    if (reduced) {
      a.pause();
      a.currentTime = AMBIENT.fadeMs + STILL_AT * AMBIENT.travelMs;
      return () => a.cancel();
    }
    clock.add(a);
    return () => {
      clock.remove(a);
      a.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, reduced, ...deps]);
}
