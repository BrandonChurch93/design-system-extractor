'use client';
import { useEffect, useState } from 'react';
import type { EasingToken } from '@dse/schema';
import { bezierOf } from '@dse/pipeline/exports';
import { runPage } from '../../copy/strings';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { Pill } from '../Pill';
import { ReplayButton } from './ReplayButton';
import styles from './EasingCard.module.css';

const W = 64;
const H = 40;
/** The dot travels the 120 px track less its own 8 px. */
const TRAVEL = 112;

/** The curve as an SVG path: a Bézier, the stairs of steps(), the stops of linear(). */
export function curvePath(value: string): string {
  const b = bezierOf(value);
  const x = (t: number) => Math.round(t * W * 10) / 10;
  const y = (v: number) => Math.round((H - v * H) * 10) / 10;
  if (b) return `M0 ${H} C${x(b[0])} ${y(b[1])} ${x(b[2])} ${y(b[3])} ${W} 0`;
  const steps = /^steps\((\d+)/.exec(value);
  if (steps) {
    const n = Number(steps[1]);
    let d = `M0 ${H}`;
    for (let i = 1; i <= n; i++) d += ` H${x(i / n)} V${y(i / n)}`;
    return d;
  }
  const linear = /^linear\((.+)\)$/.exec(value);
  if (linear) {
    const stops = linear[1]!.split(',').map((s) => parseFloat(s));
    return stops.map((v, i) => `${i ? 'L' : 'M'}${x(i / Math.max(1, stops.length - 1))} ${y(v)}`).join(' ');
  }
  return `M0 ${H} L${W} 0`;
}

/** One easing: its name, value and curve, and a dot that runs the curve on Replay. */
export function EasingCard({ easing, durationMs, captionId }: { easing: Pick<EasingToken, 'name' | 'value' | 'siteName'>; durationMs: number; captionId?: string }) {
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState<'start' | 'end'>('start');
  // With reduced motion the curve is drawn and the motion shows where it ends, still.
  const shown = reduced ? 'end' : at;
  useEffect(() => {
    if (!playing) return;
    // The start is painted first, so the move from it is a transition the browser runs.
    const f = requestAnimationFrame(() => requestAnimationFrame(() => setAt('end')));
    return () => cancelAnimationFrame(f);
  }, [playing]);
  const toggle = () => {
    if (playing) {
      setPlaying(false);
      setAt('start');
      return;
    }
    setAt('start');
    setPlaying(true);
  };
  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.name}>{easing.name}</h3>
        {easing.siteName ? <Pill variant="soft">{runPage.namedBySite}</Pill> : null}
      </div>
      <p className={styles.value}>{easing.value}</p>
      <svg className={styles.curve} viewBox={`-2 -2 ${W + 4} ${H + 4}`} width={W} height={H} aria-hidden="true">
        <line x1="0" y1={H} x2={W} y2={H} className={styles.baseline} />
        <path d={curvePath(easing.value)} className={styles.path} />
      </svg>
      <div className={styles.replay}>
        <span className={styles.track} aria-hidden="true">
          <span
            className={styles.dot}
            data-testid="easing-dot"
            data-at={shown}
            style={{ transform: `translateX(${shown === 'end' ? TRAVEL : 0}px)`, transition: !reduced && playing && at === 'end' ? `transform ${durationMs}ms ${easing.value}` : 'none' }}
            onTransitionEnd={() => setPlaying(false)}
          />
        </span>
        <ReplayButton playing={playing} onToggle={toggle} captionId={captionId} />
      </div>
    </article>
  );
}

/** The run's easings, one card each. */
export function EasingGrid({ easings, durationMs, captionId }: { easings: Pick<EasingToken, 'name' | 'value' | 'siteName'>[]; durationMs: number; captionId?: string }) {
  return (
    <div className={styles.grid}>
      {easings.map((e) => (
        <EasingCard key={e.name} easing={e} durationMs={durationMs} captionId={captionId} />
      ))}
    </div>
  );
}
