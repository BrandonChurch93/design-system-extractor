import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/meta';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { planLimits } from '@dse/schema';
import { visitorUsage } from '@dse/pipeline/db/runs';
import { PageShell } from '../../../components/PageShell';
import { BillingPage } from '../../../components/v2/BillingPage';
import { v2 } from '../../../copy/strings';
import { resolveViewer } from '../../../lib/entitlements';
import { billingEnabled } from '../../../lib/flags';
import { currentSession } from '../../../lib/server/session';
import { services } from '../../../lib/server/services';

export async function generateMetadata(): Promise<Metadata> {
  if (!billingEnabled()) return {};
  return pageMeta({ title: v2.billing.title, description: v2.billing.metaDescription, index: false });
}

/** Flagged (BILLING_ENABLED): a 404 otherwise (docs/specs/v2-seams.md). Without a session it shows the visitor's free day. */
export default async function Billing() {
  if (!billingEnabled()) notFound();
  const svc = services();
  const session = await currentSession();
  const viewer = resolveViewer(new Request('http://app.local/', { headers: await headers() }), svc.encryptionKey);
  const plan = session?.plan ?? viewer.plan;
  const limits = planLimits(plan, svc.env);
  const since = new Date(svc.counters.resetsAt().getTime() - 24 * 60 * 60 * 1000);
  const usage = await visitorUsage(svc.db, viewer.visitorId, since);
  return (
    <PageShell>
      <BillingPage plan={plan} limits={limits} usage={usage} session={session} />
    </PageShell>
  );
}
