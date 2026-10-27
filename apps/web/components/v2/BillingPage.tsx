'use client';
import type { Limits, PlanId } from '@dse/schema';
import { v2 } from '../../copy/strings';
import type { Session } from '../../lib/auth/adapter';
import { portalFor } from '../../lib/billing/adapter';
import { count } from '../../lib/format';
import { Button } from '../Button';
import { Card } from '../Card';
import { Meter } from '../Meter';
import styles from './v2.module.css';

const B = v2.billing;

export type Usage = { runs: number; pages: number };

/** `/account/billing`: plan, this period's usage against the plan's cap, invoices. Flagged. */
export function BillingPage({ plan, limits, usage, session = null }: { plan: PlanId; limits: Limits; usage: Usage; session?: Session | null }) {
  async function manage() {
    const go = await portalFor(session);
    if (go) window.location.assign(go);
  }
  return (
    <div className={styles.billing} data-testid="v2-surface">
      <h1 className={styles.billingTitle}>{B.title}</h1>
      <Card className={styles.billingCard}>
        <p className={styles.billingLabel}>{B.current}</p>
        <div className={styles.billingRow}>
          <h2 className={styles.planName}>{v2.plans.names[plan]}</h2>
          <Button variant="ghost" size="sm" onClick={manage} disabled={!session}>
            {B.manage}
          </Button>
        </div>
      </Card>
      <Card className={styles.billingCard}>
        <p className={styles.billingLabel}>{B.usage}</p>
        <Meter value={usage.runs} max={limits.runsPerDay} label={B.meterLabel} />
        <p className={styles.usageLine}>{B.usageLine.replace('{runs} runs', usage.runs === 1 ? B.oneRun : `${count(usage.runs)} runs`).replace('{pages} pages', usage.pages === 1 ? B.onePage : `${count(usage.pages)} pages`)}</p>
      </Card>
      <Card className={styles.billingCard}>
        <p className={styles.billingLabel}>{B.invoices}</p>
        <p className={styles.empty}>{B.noInvoices}</p>
      </Card>
    </div>
  );
}
