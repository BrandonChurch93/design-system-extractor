'use client';
import { useEffect, useRef } from 'react';
import { extendIn } from '../lib/motion/gsap';
import styles from './Meter.module.css';

/** An 8 px track with an ink fill that extends from the left. */
export function Meter({ value, max, label, animate = true }: { value: number; max: number; label: string; animate?: boolean }) {
  const fill = useRef<HTMLSpanElement>(null);
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  useEffect(() => {
    if (animate && fill.current) extendIn(fill.current, { d: 0.6 });
  }, [animate, pct]);
  return (
    <span role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={styles.track}>
      <span ref={fill} className={styles.fill} style={{ width: `${pct}%` }} />
    </span>
  );
}
