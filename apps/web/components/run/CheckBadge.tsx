'use client';
import { Check, X } from 'lucide-react';
import type React from 'react';
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

/**
 * The check mark (D-096), by weight not color (D-003): a filled ink Pill `All checks` when every
 * applicable check passes, an outlined Pill `{passed} of {applicable} checks` otherwise, nothing when
 * no check applies. Opens the check list.
 */
export function CheckBadge({ checks, name }: { checks: CheckResult[]; name: string }) {
  const { passed, applicable } = checkCounts(checks);
  if (!applicable) return null;
  const all = passed === applicable;
  return (
    <Popover
      label={`${name} · ${runPage.checks.heading}`}
      width={360}
      placement="bottom-end"
      trigger={(t) => <CheckPill all={all} passed={passed} applicable={applicable} {...t} />}
    >
      <CheckList checks={checks} />
      <p className={styles.disclaimer}>{runPage.checks.disclaimer}</p>
    </Popover>
  );
}

type PillProps = { all: boolean; passed: number; applicable: number } & React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> };

/** The Pill alone: a button when it opens the list, a plain mark at the head of the panel's Checks block. */
export function CheckPill({ all, passed, applicable, ...rest }: PillProps) {
  const body = all ? (
    <>
      <Check size={16} strokeWidth={1.75} aria-hidden="true" />
      <span>{runPage.components.badgeAll}</span>
    </>
  ) : (
    <span>{fill(runPage.components.badgeSome, { passed, applicable })}</span>
  );
  const cls = `${styles.badge} ${all ? styles.all : styles.some}`;
  if (!rest.onClick && !rest['aria-haspopup']) return <span className={cls}>{body}</span>;
  return (
    <button type="button" className={cls} {...rest}>
      {body}
    </button>
  );
}
