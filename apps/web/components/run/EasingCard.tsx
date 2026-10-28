'use client';
import { useRef } from 'react';
import type { EasingToken } from '@dse/schema';
import { bezierOf } from '@dse/pipeline/exports';
import { runPage } from '../../copy/strings';
import { AmbientClock, loopFrames, useAmbientLoop } from '../../lib/motion/ambient';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { usageLine } from '../../lib/motion-view';
import { Pill } from '../Pill';
import styles from './EasingCard.module.css';

const M = runPage.motion;

/** The plot: 160 × 96, progress 0 to 1 over the middle 64 px, so a curve that overshoots stays inside. */
export const PLOT = { w: 160, h: 96, pad: 16 } as const;
const y0 = PLOT.h - PLOT.pad;
const y1 = PLOT.pad;
/** The track dot travels the 120 px track less its own 8 px. */
const TRAVEL = 112;

/** The curve as an SVG path, x for time and y for progress: a Bézier, the stairs of steps(), the stops of linear(). */
export function curvePath(value: string): string {
  const b = bezierOf(value);
  const x = (t: number) => Math.round(t * PLOT.w * 10) / 10;
  const y = (v: number) => Math.round((y0 - v * (y0 - y1)) * 10) / 10;
  if (b) return `M0 ${y0} C${x(b[0])} ${y(b[1])} ${x(b[2])} ${y(b[3])} ${PLOT.w} ${y1}`;
  const steps = /^steps\((\d+)/.exec(value);
  if (steps) {
    const n = Number(steps[1]);
    const start = /start/.test(value);
    let d = `M0 ${y0}`;
    for (let i = 1; i <= n; i++) d += start ? ` V${y(i / n)} H${x(i / n)}` : ` H${x(i / n)} V${y(i / n)}`;
    return d;
  }
  const linear = /^linear\((.+)\)$/.exec(value);
  if (linear) {
    const stops = linear[1]!.split(',').map((s) => parseFloat(s));
    return stops.map((v, i) => `${i ? 'L' : 'M'}${x(i / Math.max(1, stops.length - 1))} ${y(v)}`).join(' ');
  }
  return `M0 ${y0} L${PLOT.w} ${y1}`;
}

/**
 * The curve and two dots on the grid's shared clock (D-093): one travels along the curve (x linear,
 * y with the easing, two animations, D-097), one along the track below; both are the browser
 * applying the token's own value.
 */
export function EasingStage({ value }: { value: string }) {
  const x = useRef<HTMLSpanElement>(null);
  const y = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLSpanElement>(null);
  useAmbientLoop(x, loopFrames({ transform: 'translateX(0px)' }, { transform: `translateX(${PLOT.w}px)` }, 'linear', undefined, false), []);
  useAmbientLoop(y, loopFrames({ transform: `translateY(${y0}px)` }, { transform: `translateY(${y1}px)` }, value), [value]);
  useAmbientLoop(track, loopFrames({ transform: 'translateX(0px)' }, { transform: `translateX(${TRAVEL}px)` }, value), [value]);
  return (
    <div className={styles.stage} aria-hidden="true">
      <span className={styles.plot}>
        <svg className={styles.curve} viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} width={PLOT.w} height={PLOT.h}>
          <line x1="0.5" y1="0" x2="0.5" y2={PLOT.h} className={styles.axis} />
          <line x1="0" y1={y0} x2={PLOT.w} y2={y0} className={styles.axis} />
          <path d={curvePath(value)} className={styles.path} />
        </svg>
        <span ref={x} className={styles.curveX}>
          <span ref={y} className={styles.curveDot} data-testid="easing-curve-dot" data-qa-mask="ambient" />
        </span>
      </span>
      <span className={styles.track}>
        <span ref={track} className={styles.dot} data-testid="easing-dot" data-qa-mask="ambient" />
      </span>
    </div>
  );
}

/** One easing: its name, value, what uses it, and its stage. No button: the loop is ambient (D-093). */
export function EasingCard({ easing }: { easing: Pick<EasingToken, 'name' | 'value' | 'siteName'> & { usedBy?: EasingToken['usedBy'] } }) {
  const uses = usageLine(easing.usedBy);
  return (
    <article className={styles.card} data-testid="easing-card">
      <div className={styles.head}>
        <h3 className={styles.name}>{easing.name}</h3>
        {easing.siteName ? <Pill variant="soft">{runPage.namedBySite}</Pill> : null}
      </div>
      <p className={styles.value}>{easing.value.replace(/,\s*/g, ',​ ')}</p>
      {uses ? <p className={styles.uses}>{uses}</p> : null}
      <EasingStage value={easing.value} />
    </article>
  );
}

/** The run's easings on one shared clock, with the caption that says why they move together. */
export function EasingGrid({ easings }: { easings: (Pick<EasingToken, 'name' | 'value' | 'siteName'> & { usedBy?: EasingToken['usedBy'] })[] }) {
  const reduced = usePrefersReducedMotion();
  return (
    <>
      <div className={styles.grid}>
        {easings.map((e) => (
          <EasingCard key={e.name} easing={e} />
        ))}
      </div>
      <p className={styles.caption} data-testid={reduced ? 'easing-reduced' : 'easing-caption'}>
        {reduced ? M.easingReduced : M.easingCaption}
      </p>
    </>
  );
}

export { AmbientClock };
