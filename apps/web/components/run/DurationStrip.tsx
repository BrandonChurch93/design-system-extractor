'use client';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { DurationToken, RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { labelRows, logPositions, LABEL_ROWS } from '../../lib/duration-axis';
import { count } from '../../lib/format';
import { AMBIENT, loopFrames, useAmbientLoop } from '../../lib/motion/ambient';
import { TokenPopover, tokenInfo } from './TokenPopover';
import styles from './DurationStrip.module.css';

const M = runPage.motion;
/** The tick's mark is 16 px; its 4 px dot rises 12 px from the foot (D-097, D-110). */
const RISE = 12;
/** Durations above this leave the scale for the Long list, adopted by the P18 measurement (D-102, D-111). */
export const LONG_FROM = 2000;

type Duration = Pick<DurationToken, 'name' | 'ms' | 'role' | 'usage'> & { id?: string };

/**
 * A dot that runs up its tick over the duration's real length, linear, on the grid's clock (D-093,
 * D-097). Past the 1,400 ms travel it runs for the travel and stops where it got to.
 */
function TickDot({ ms }: { ms: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const travel = Math.min(ms, AMBIENT.travelMs);
  const reach = RISE * Math.min(1, AMBIENT.travelMs / Math.max(1, ms));
  useAmbientLoop(ref, loopFrames({ transform: 'translateY(0px)' }, { transform: `translateY(${-reach}px)` }, 'linear', Math.max(1, travel)), [ms]);
  // QA masks the loops like the clock: where a dot is depends on when the page is captured.
  return <span ref={ref} className={styles.run} data-testid="duration-dot" data-qa-mask="ambient" />;
}

/** The meta line beside the strip's heading: the count, and how many are labeled when any label is dropped (D-102). */
export function durationsMeta(total: number, labeled: number): string {
  return labeled < total ? fill(M.durationsLabeled, { n: count(total), k: count(labeled) }) : count(total);
}

/**
 * Every duration as a tick on one base-10 log scale from the shortest to the longest (D-102): value
 * labels on two rows above, roles on two below, a label with no room dropped while its tick, dot and
 * popover stay; the most used marked on the baseline.
 */
export function DurationStrip({ durations, doc, head }: { durations: Duration[]; doc?: RunDocumentPartial; head?: (meta: string) => ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => e && setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const all = [...durations].sort((a, b) => a.ms - b.ms);
  const long = all.filter((d) => d.ms > LONG_FROM);
  const list = all.filter((d) => d.ms <= LONG_FROM);
  const top = [...all].sort((a, b) => b.usage - a.usage)[0];
  const xs = logPositions(list.map((d) => d.ms), width || 1000);
  const values = list.map((d) => fill(M.ms, { ms: count(d.ms) }));
  const valueRows = labelRows(xs, values);
  const roleRows = labelRows(xs, list.map((d) => (d.role ? M.roles[d.role] : null)));
  const dropped = valueRows.filter((r) => r === null).length;
  const above = Math.max(1, ...valueRows.map((r) => (r === null ? 0 : r + 1)));
  const below = Math.max(0, ...roleRows.map((r) => (r === null ? 0 : r + 1)));
  const info = (d: Duration) => (doc && d.id ? tokenInfo(doc, d.id) : null);
  return (
    <>
      {head?.(durationsMeta(all.length, all.length - dropped))}
      <div className={`${styles.strip} ${long.length ? styles.withLong : ''}`} data-testid="duration-strip" data-dropped={dropped}>
        <div className={styles.scaleBox} style={{ ['--above' as string]: Math.min(LABEL_ROWS, above), ['--below' as string]: Math.min(LABEL_ROWS, below) }}>
          <ol ref={ref} className={styles.scale}>
            {list.map((d, i) => {
              const tick = (props: Record<string, unknown> = {}) => (
                <button type="button" className={styles.tick} data-most-used={d === top || undefined} {...props}>
                  {valueRows[i] === null ? <span className="visually-hidden">{values[i]}</span> : <span className={styles.value} style={{ ['--row' as string]: valueRows[i] }}>{values[i]}</span>}
                  <span className={styles.mark} aria-hidden="true">
                    <TickDot ms={d.ms} />
                  </span>
                  {d.role && roleRows[i] !== null ? <span className={styles.role} style={{ ['--row' as string]: roleRows[i] }}>{M.roles[d.role]}</span> : null}
                </button>
              );
              const t = info(d);
              return (
                <li key={d.name} className={styles.at} style={{ left: `${xs[i]}px` }} data-testid="duration-tick">
                  {t ? <TokenPopover info={t} trigger={(p) => tick(p)} /> : tick({ tabIndex: -1, 'aria-disabled': true })}
                </li>
              );
            })}
          </ol>
        </div>
        {long.length ? (
          <div className={styles.long} data-testid="duration-long">
            <p className={styles.longHead}>{M.long}</p>
            <ul className={styles.longList}>
              {long.map((d) => {
                const t = info(d);
                const row = (props: Record<string, unknown> = {}) => (
                  <button type="button" className={styles.longRow} {...props}>
                    <span>{d.name}</span>
                    <span>{fill(M.ms, { ms: count(d.ms) })}</span>
                    {d.role ? <span className={styles.longRole}>{M.roles[d.role]}</span> : null}
                  </button>
                );
                return <li key={d.name}>{t ? <TokenPopover info={t} trigger={(p) => row(p)} /> : row({ tabIndex: -1, 'aria-disabled': true })}</li>;
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  );
}
