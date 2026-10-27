'use client';
import { User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v2 } from '../../copy/strings';
import { auth, type Session } from '../../lib/auth/adapter';
import { Popover } from '../Popover';
import { PlanBadge } from './PlanBadge';
import styles from './v2.module.css';

/** The signed-in viewer's menu in TopNav: email, plan, Billing, Sign out. Hidden without a session. Flagged. */
export function AccountMenu({ session, defaultOpen }: { session: Session; defaultOpen?: boolean }) {
  return (
    <span data-testid="v2-surface" className={styles.navItem}>
      <Popover
        label={v2.account.label}
        width={280}
        placement="bottom-end"
        defaultOpen={defaultOpen}
        trigger={(t) => (
          <button type="button" className={styles.accountButton} aria-label={v2.account.label} {...t}>
            <User size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      >
        <AccountMenuBody session={session} />
      </Popover>
    </span>
  );
}

export function AccountMenuBody({ session }: { session: Session }) {
  const router = useRouter();
  return (
    <div className={styles.accountBody}>
      <p className={styles.accountEmail}>{session.email}</p>
      <PlanBadge plan={session.plan} />
      <ul className={styles.accountItems}>
        <li>
          <Link href="/account/billing" className={styles.accountItem}>
            {v2.account.billing}
          </Link>
        </li>
        <li>
          <button
            type="button"
            className={styles.accountItem}
            onClick={async () => {
              await auth.signOut();
              router.push('/');
              router.refresh();
            }}
          >
            {v2.account.signOut}
          </button>
        </li>
      </ul>
    </div>
  );
}
