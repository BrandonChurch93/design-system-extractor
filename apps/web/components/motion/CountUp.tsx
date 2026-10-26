'use client';
import { useEffect, useRef } from 'react';
import { countTo } from '../../lib/motion/gsap';
import { count } from '../../lib/format';

/** A number that ticks from zero (or from its last value) when it comes into view. Tabular. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shown.current === value) return;
    const from = shown.current ?? 0;
    let tween: ReturnType<typeof countTo> = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        tween = countTo(el, value, { from, format: count });
        shown.current = value;
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [value]);
  return (
    <span ref={ref} className={className}>
      {count(value)}
    </span>
  );
}
