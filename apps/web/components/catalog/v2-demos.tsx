'use client';
import { useState } from 'react';
import { plans } from '@dse/schema';
import { stateLabels } from '@dse/schema/labels';
import type { Session } from '../../lib/auth/adapter';
import { Card } from '../Card';
import { AccountMenu, AccountMenuBody } from '../v2/AccountMenu';
import { BillingPage } from '../v2/BillingPage';
import { PlanBadge } from '../v2/PlanBadge';
import { PricingSection } from '../v2/PricingSection';
import { SignInButton, SignInForm } from '../v2/SignInSheet';
import { UpgradePrompt } from '../v2/UpgradePrompt';
import type { Demo } from './demos';
import styles from './Catalog.module.css';

// The flagged v2 surfaces render here always, so they are reviewed while the app hides them (docs/specs/v2-seams.md).

const session: Session = { userId: 'u_sample', email: 'ada@tidewater.app', plan: 'pro' };

function SignInSample() {
  const [email, setEmail] = useState('');
  return <SignInForm email={email} onEmail={setEmail} onEmailSubmit={() => {}} onGitHub={() => {}} />;
}

export const v2Demos: Demo[] = [
  {
    slug: 'pricing-section',
    name: 'PricingSection',
    tokens: ['surface', 'line-soft', 'radius-lg', 'h2', 'h3', 'stat', 'label', 'body-sm', 'caption', 'muted'],
    frameHeight: 1500,
    states: () => [{ label: stateLabels.default, wide: true, node: <PricingSection limits={plans} /> }],
  },
  {
    slug: 'plan-badge',
    name: 'PlanBadge and AccountMenu',
    tokens: ['line-strong', 'muted', 'caption', 'radius-pill', 'surface', 'shadow-card', 'label'],
    frameHeight: 320,
    states: () => [
      {
        label: stateLabels.default,
        node: (
          <span className={styles.row}>
            <PlanBadge plan="pro" />
            <AccountMenu session={session} />
          </span>
        ),
      },
      {
        label: stateLabels.open,
        node: (
          <Card className={styles.popoverBox}>
            <AccountMenuBody session={session} />
          </Card>
        ),
      },
    ],
  },
  {
    slug: 'sign-in-sheet',
    name: 'SignInSheet',
    tokens: ['surface', 'radius-lg', 'shadow-sheet', 'scrim', 'h2', 'label'],
    frameHeight: 420,
    states: () => [
      { label: stateLabels.default, node: <SignInButton /> },
      { label: stateLabels.open, wide: true, node: <Card><SignInSample /></Card> },
    ],
  },
  {
    slug: 'billing-page',
    name: 'BillingPage',
    tokens: ['title', 'label', 'muted', 'h3', 'meta', 'surface', 'line-soft', 'radius-lg'],
    frameHeight: 700,
    states: () => [{ label: stateLabels.default, wide: true, node: <BillingPage plan="free" limits={plans.free} usage={{ runs: 1, pages: 9 }} /> }],
  },
  {
    slug: 'upgrade-prompt',
    name: 'UpgradePrompt',
    tokens: ['surface-tint', 'line', 'radius-md', 'body'],
    frameHeight: 220,
    states: () => [{ label: stateLabels.default, wide: true, node: <UpgradePrompt /> }],
  },
];
