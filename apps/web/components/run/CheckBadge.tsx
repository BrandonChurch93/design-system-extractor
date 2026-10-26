'use client';
import { Check, X } from 'lucide-react';
import type { CheckResult } from '@dse/schema';
import { checkLabels, checkStatusLabels, fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { checkCounts } from '../../lib/doc';
import { Popover } from '../Popover';
import styles from './CheckBadge.module.css';

export function CheckList({ checks, variantName }: { checks: CheckResult[]; variantName?: (id: string) => string | undefined }) {
  return (
    <ul className={styles.list}>
      {checks.map((c) => (
        <li key={`${c.check}-${c.variantId ?? ''}`} className={styles.row}>
          <span className={styles.name}>
            {checkLabels[c.check]}
            {c.variantId && variantName?.(c.variantId) ? <span className={styles.variant}>{` · ${variantName(c.variantId)}`}</span> : null}
          </span>
          <span className={styles.result}>
            {c.status === 'pass' ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : c.status === 'fail' ? <X size={16} strokeWidth={1.75} aria-hidden="true" /> : null}
            <span className="visually-hidden">{checkStatusLabels[c.status]}</span>
            <span>{c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** "4 of 4" with a check, or a cross when any check fails; opens the check list. */
export function CheckBadge({ checks, name }: { checks: CheckResult[]; name: string }) {
  const { passed, applicable } = checkCounts(checks);
  const ok = passed === applicable;
  return (
    <Popover
      label={`${name} · ${runPage.checks.heading}`}
      width={360}
      placement="bottom-end"
      trigger={(t) => (
        <button type="button" className={styles.badge} {...t}>
          {ok ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <X size={16} strokeWidth={1.75} aria-hidden="true" />}
          <span>{fill(runPage.components.badge, { passed, applicable })}</span>
        </button>
      )}
    >
      <CheckList checks={checks} />
      <p className={styles.disclaimer}>{runPage.checks.disclaimer}</p>
    </Popover>
  );
}
