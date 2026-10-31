'use client';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { DurationToken, RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { labeledCount, labelInset, labelRows, logPositions, triggerTicks, LABEL_ROWS } from '../../lib/duration-axis';
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
  // With the Long list the scale ends at 2,000 ms, where the list begins (D-111, D-112).
  const xs = logPositions(list.map((d) => d.ms), width || 1000, long.length ? LONG_FROM : undefined);
  const values = list.map((d) => fill(M.ms, { ms: count(d.ms) }));
  const roles = list.map((d) => (d.role ? M.roles[d.role] : null));
  const valueRows = labelRows(xs, values);
  const roleRows = labelRows(xs, roles);
  const labeled = labeledCount(valueRows, roles, roleRows);
  const dropped = list.length - labeled;
  const triggers = triggerTicks(xs, list.map((d) => d.usage), valueRows.map((r) => r === null));
  const inset = Math.max(20, labelInset([...values, ...roles]));
  const above = Math.max(1, ...valueRows.map((r) => (r === null ? 0 : r + 1)));
  const below = Math.max(0, ...roleRows.map((r) => (r === null ? 0 : r + 1)));
  const info = (d: Duration) => (doc && d.id ? tokenInfo(doc, d.id) : null);
  return (
    <>
      {head?.(durationsMeta(all.length, labeled + long.length))}
      <div className={`${styles.strip} ${long.length ? styles.withLong : ''}`} data-testid="duration-strip" data-dropped={dropped}>
        <div className={styles.scaleBox} style={{ ['--above' as string]: Math.min(LABEL_ROWS, above), ['--below' as string]: Math.min(LABEL_ROWS, below), paddingInline: inset }}>
          <ol ref={ref} className={styles.scale}>
            {list.map((d, i) => {
              const t = triggers[i] ? info(d) : null;
              const Tag = t ? 'button' : 'span';
              const tick = (props: Record<string, unknown> = {}) => (
                <Tag {...(t ? { type: 'button' as const } : {})} className={styles.tick} data-most-used={d === top || undefined} {...props}>
                  {valueRows[i] === null ? <span className="visually-hidden">{values[i]}</span> : <span className={styles.value} style={{ ['--row' as string]: valueRows[i] }}>{values[i]}</span>}
                  <span className={styles.mark} aria-hidden="true">
                    <TickDot ms={d.ms} />
                  </span>
                  {d.role ? roleRows[i] !== null ? <span className={styles.role} style={{ ['--row' as string]: roleRows[i] }}>{M.roles[d.role]}</span> : <span className="visually-hidden">{M.roles[d.role]}</span> : null}
                </Tag>
              );
              return (
                <li key={d.name} className={styles.at} style={{ left: `${xs[i]}px` }} data-testid="duration-tick">
                  {t ? <TokenPopover info={t} trigger={(p) => tick(p)} /> : tick()}
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
                const Tag = t ? 'button' : 'span';
                // Two columns: the name in `meta` (with its role when it has one), the value in `hex` right-aligned (D-112).
                const row = (props: Record<string, unknown> = {}) => (
                  <Tag {...(t ? { type: 'button' as const } : {})} className={styles.longRow} {...props}>
                    <span className={styles.longName}>
                      {d.name}
                      {d.role ? <span className={styles.longRole}> · {M.roles[d.role]}</span> : null}
                    </span>
                    <span className={styles.longValue}>{fill(M.ms, { ms: count(d.ms) })}</span>
                  </Tag>
                );
                return <li key={d.name}>{t ? <TokenPopover info={t} trigger={(p) => row(p)} /> : row()}</li>;
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  );
}
