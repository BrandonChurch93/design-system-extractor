'use client';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { Skeleton } from '../Skeleton';
import { CountUp } from '../motion/CountUp';
import { Enter } from '../motion/Enter';
import styles from './StatStrip.module.css';

export type StatCell = { label: string; value?: number; of?: number };

/** Five cells; numbers count in as their stage lands, skeleton numbers before (docs/design/components.md). */
export function StatStrip({ cells, caption }: { cells: StatCell[]; caption?: string }) {
  return (
    <div className={styles.strip} data-cells={cells.length}>
      {cells.map((c, i) => (
        <Enter key={c.label} move="extend" index={i} className={styles.cell}>
          <span className={styles.number}>
            {c.value === undefined ? (
              <Skeleton width={56} height={34} on="surface" />
            ) : (
              <>
                <CountUp value={c.value} className={styles.stat} />
                {c.of !== undefined ? <span className={styles.of}>{fill(runPage.components.badge.replace('{passed}', ''), { applicable: count(c.of) })}</span> : null}
              </>
            )}
          </span>
          <span className={styles.label}>{c.label}</span>
        </Enter>
      ))}
      {caption ? <p className={styles.caption}>{caption}</p> : null}
    </div>
  );
}

export function runStats(stats: { colors?: number; typeStyles?: number; spacingSteps?: number; components?: number; checksPassed?: number; checksApplicable?: number }): StatCell[] {
  const L = runPage.statLabels;
  return [
    { label: L.colors, value: stats.colors },
    { label: L.typeStyles, value: stats.typeStyles },
    { label: L.spacingSteps, value: stats.spacingSteps },
    { label: L.components, value: stats.components },
    { label: L.checksPassed, value: stats.checksPassed, of: stats.checksApplicable },
  ];
}
