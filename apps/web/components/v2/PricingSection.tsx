'use client';
import { Check } from 'lucide-react';
import { useState } from 'react';
import type { Limits, PlanId } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { v2 } from '../../copy/strings';
import type { Session } from '../../lib/auth/adapter';
import { billing, type PaidPlan } from '../../lib/billing/adapter';
import { count } from '../../lib/format';
import { Button } from '../Button';
import { Card } from '../Card';
import { Enter } from '../motion/Enter';
import { SignInSheet } from './SignInSheet';
import styles from './v2.module.css';

const P = v2.plans;
const order: PlanId[] = ['free', 'pro', 'team'];

/** Free, Pro and Team, prices as placeholders. Choosing a paid plan signs in first. Flagged. */
export function PricingSection({ limits, session = null }: { limits: Record<PlanId, Limits>; session?: Session | null }) {
  const [signIn, setSignIn] = useState(false);
  async function choose(plan: PaidPlan) {
    if (!session) return setSignIn(true);
    window.location.assign(await billing.createCheckout(session.userId, plan));
  }
  return (
    <section id="plans" className={styles.plans} aria-labelledby="plans-title" data-testid="v2-surface">
      <h2 id="plans-title" className={styles.plansTitle}>
        {P.heading}
      </h2>
      <ul className={styles.planGrid}>
        {order.map((id, i) => (
          <Enter as="li" key={id} move="reveal" index={i} className={styles.planItem}>
            <Card className={styles.plan}>
              <h3 className={styles.planName}>{P.names[id]}</h3>
              <p className={styles.price}>
                <span className={styles.priceValue}>{id === 'free' ? P.freePrice : P.price}</span>
                <span className={styles.period}>{P.period}</span>
              </p>
              <ul className={styles.features}>
                {[fill(P.runsPerDay, { runsPerDay: count(limits[id].runsPerDay) }), fill(P.pageCap, { pageCap: count(limits[id].pageCap) }), ...P.features[id]].map((f) => (
                  <li key={f} className={styles.feature}>
                    <Check size={16} strokeWidth={1.75} aria-hidden="true" className={styles.featureMark} />
                    {f}
                  </li>
                ))}
              </ul>
              <div className={styles.planAction}>
                {id === 'free' ? (
                  <Button variant="ghost" disabled>
                    {P.current}
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => choose(id)}>
                    {P.choose[id]}
                  </Button>
                )}
              </div>
            </Card>
          </Enter>
        ))}
      </ul>
      <p className={styles.plansCaption}>{P.caption}</p>
      <SignInSheet open={signIn} onClose={() => setSignIn(false)} />
    </section>
  );
}
