'use client';
import Link from 'next/link';
import type { BlockedReason } from '@dse/schema';
import { blockedReasonLabels, fill, runStatusLabels } from '@dse/schema/labels';
import { recent as R } from '../../copy/strings';
import type { RecentRun } from '../../lib/browser-store';
import { clock, count, shortDate } from '../../lib/format';
import { stateRoute } from '../../lib/state-route';
import { Button } from '../Button';
import { PaletteStrip } from '../PaletteStrip';
import { Pill } from '../Pill';
import styles from './RecentRunRow.module.css';

export function whenLine(iso: string, now: Date): string {
  const d = new Date(iso);
  const day = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (day(d) === day(now)) return fill(R.when.today, { time: clock(iso) });
  if (day(d) === day(yesterday)) return fill(R.when.yesterday, { time: clock(iso) });
  return shortDate(iso);
}

export function resultLine(run: RecentRun): string {
  if (run.status === 'blocked' && run.blockedReason) return blockedReasonLabels[run.blockedReason as BlockedReason] ?? '';
  const s = run.stats;
  if (run.status === 'complete' && s) return fill(R.result, { colors: count(s.colors), components: count(s.components), passed: count(s.checksPassed), applicable: count(s.checksApplicable) });
  return '';
}

/** A run made from this browser: palette block, site, result, when, status and its one action. */
export function RecentRunRow({ run, now, action }: { run: RecentRun; now: Date; action?: React.ReactNode }) {
  const button =
    action ??
    (run.status === 'complete' ? (
      <Button variant="ghost" size="sm" href={`/compare?a=${run.id}`}>
        {R.buttons.compare}
      </Button>
    ) : run.status === 'blocked' && run.blockedReason ? (
      <Button variant="ghost" size="sm" href={`/state/${stateRoute[run.blockedReason as BlockedReason]}?run=${run.id}`}>
        {R.buttons.details}
      </Button>
    ) : null);
  return (
    <li className={styles.row}>
      <span className={styles.palette}>
        <PaletteStrip bands={run.palette ?? []} block />
      </span>
      <span className={styles.site}>
        <Link href={`/r/${run.id}`} className={styles.host}>
          {run.host}
        </Link>
        <span className={styles.id}>{run.id}</span>
      </span>
      <span className={styles.result}>{resultLine(run)}</span>
      <span className={styles.when}>{whenLine(run.createdAt, now)}</span>
      <span className={styles.status}>
        <Pill variant={run.status === 'complete' ? 'solid' : 'soft'}>{runStatusLabels[run.status]}</Pill>
      </span>
      <span className={styles.action}>{button}</span>
    </li>
  );
}
