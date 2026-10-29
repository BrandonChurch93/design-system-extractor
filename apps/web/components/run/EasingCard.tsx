'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import type { EasingToken } from '@dse/schema';
import { bezierOf } from '@dse/pipeline/exports';
import { runPage } from '../../copy/strings';
import { AmbientClock, loopFrames, useAmbientLoop } from '../../lib/motion/ambient';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { usageLine } from '../../lib/motion-view';
import { Pill } from '../Pill';
import styles from './EasingCard.module.css';

const M = runPage.motion;

/** The plot is as wide as the card and 160 tall; progress 0 to 1 runs between 15% insets, so a curve that overshoots stays inside (D-101). */
export const PLOT = { h: 160, pad: 24 } as const;
const y0 = PLOT.h - PLOT.pad;
const y1 = PLOT.pad;
/** The track dot is 10 px and crosses the full track. */
const TRACK_DOT = 10;

/** The curve as an SVG path in pixels at the plot's width, x for time and y for progress: a Bézier, the stairs of steps(), the stops of linear(). */
export function curvePath(value: string, width: number): string {
  const W = Math.max(1, width);
  const b = bezierOf(value);
  const x = (t: number) => Math.round(t * W * 10) / 10;
  const y = (v: number) => Math.round((y0 - v * (y0 - y1)) * 10) / 10;
  if (b) return `M0 ${y0} C${x(b[0])} ${y(b[1])} ${x(b[2])} ${y(b[3])} ${x(1)} ${y1}`;
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
  return `M0 ${y0} L${x(1)} ${y1}`;
}

/**
 * The curve and two dots on the grid's shared clock (D-093): one travels along the curve (x linear,
 * y with the easing, two animations, D-097), one along the track below; both are the browser
 * applying the token's own value.
 */
export function EasingStage({ value }: { value: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const x = useRef<HTMLSpanElement>(null);
  const y = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLSpanElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    setW(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([e]) => e && setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ready = w > 0;
  useAmbientLoop(x, ready ? loopFrames({ transform: 'translateX(0px)' }, { transform: `translateX(${w}px)` }, 'linear', undefined, false) : null, [w]);
  useAmbientLoop(y, ready ? loopFrames({ transform: `translateY(${y0}px)` }, { transform: `translateY(${y1}px)` }, value) : null, [value, w]);
  useAmbientLoop(track, ready ? loopFrames({ transform: 'translateX(0px)' }, { transform: `translateX(${Math.max(0, w - TRACK_DOT)}px)` }, value) : null, [value, w]);
  return (
    <div ref={stage} className={styles.stage} aria-hidden="true" data-testid="easing-stage">
      <span className={styles.plot}>
        {ready ? (
          <svg className={styles.curve} viewBox={`0 0 ${w} ${PLOT.h}`} width={w} height={PLOT.h}>
            <line x1="0.5" y1="0" x2="0.5" y2={PLOT.h} className={styles.axis} />
            <line x1="0" y1={y0} x2={w} y2={y0} className={styles.axis} />
            <path d={curvePath(value, w)} className={styles.path} />
          </svg>
        ) : null}
        <span ref={x} className={styles.curveX}>
          <span ref={y} className={styles.curveDot} data-testid="easing-curve-dot" data-qa-mask="ambient" />
        </span>
      </span>
      <span className={styles.track} data-testid="easing-track">
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
      <p className={styles.uses}>{uses || M.easingUnused}</p>
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
