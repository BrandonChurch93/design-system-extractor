'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import type { DurationToken } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { AMBIENT, loopFrames, useAmbientLoop } from '../../lib/motion/ambient';
import styles from './DurationStrip.module.css';

const M = runPage.motion;
/** Labels closer than this stagger onto another line (docs/design/components.md, DurationStrip). */
const MIN_GAP = 36;
const LABEL = 56;
/** The tick's mark is 16 px; its 4 px dot runs from the foot to the top. */
const RISE = 12;

/**
 * A dot that runs up its tick over the duration's real length, linear, on the grid's clock (D-093,
 * D-097). Past the 1,400 ms travel it runs for the travel and stops where it got to.
 */
function TickDot({ ms }: { ms: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const travel = Math.min(ms, AMBIENT.travelMs);
  const reach = RISE * Math.min(1, AMBIENT.travelMs / Math.max(1, ms));
  useAmbientLoop(ref, loopFrames({ transform: 'translateY(0px)' }, { transform: `translateY(${-reach}px)` }, 'linear', Math.max(1, travel)), [ms]);
  return <span ref={ref} className={styles.run} data-testid="duration-dot" />;
}

/** Every duration as a tick on one scale from 0 to the longest, the most used marked with its role. */
export function DurationStrip({ durations }: { durations: Pick<DurationToken, 'name' | 'ms' | 'role' | 'usage'>[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const list = [...durations].sort((a, b) => a.ms - b.ms);
  const max = Math.max(1, ...list.map((d) => d.ms));
  const top = [...list].sort((a, b) => b.usage - a.usage)[0];
  // Rows by position: a tick within a label's width of the last one on a line takes the next line.
  const last: number[] = [];
  const placed = list.map((d) => {
    const x = (d.ms / max) * width;
    let row = last.findIndex((at) => x - at >= Math.max(MIN_GAP, LABEL));
    if (row < 0) row = last.length;
    last[row] = x;
    return { d, pct: (d.ms / max) * 100, row };
  });
  const rows = Math.max(1, last.length);
  return (
    <div ref={ref} className={styles.strip} style={{ ['--rows' as string]: rows }}>
      <ol className={styles.scale}>
        {placed.map(({ d, pct, row }) => (
          <li key={d.name} className={styles.tick} style={{ left: `${pct}%`, ['--row' as string]: row }} data-most-used={d === top || undefined}>
            <span className={styles.value}>{fill(M.ms, { ms: count(d.ms) })}</span>
            <span className={styles.mark} aria-hidden="true">
              <TickDot ms={d.ms} />
            </span>
            {d.role ? <span className={styles.role}>{M.roles[d.role]}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
