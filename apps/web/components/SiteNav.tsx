import { billingEnabled } from '../lib/flags';
import { currentSession } from '../lib/server/session';
import { TopNav } from './TopNav';
import { AccountMenu } from './v2/AccountMenu';
import { PlanBadge } from './v2/PlanBadge';
import { SignInButton } from './v2/SignInSheet';

/** TopNav with the flagged account entry: nothing when BILLING_ENABLED is off (docs/specs/v2-seams.md). */
export async function SiteNav() {
  if (!billingEnabled()) return <TopNav />;
  const session = await currentSession();
  return (
    <TopNav
      extra={
        session ? (
          <>
            <PlanBadge plan={session.plan} />
            <AccountMenu session={session} />
          </>
        ) : (
          <SignInButton />
        )
      }
    />
  );
}
