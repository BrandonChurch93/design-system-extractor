import type { PlanId } from '@dse/schema';
import { v2 } from '../../copy/strings';
import { Pill } from '../Pill';

/** The viewer's plan beside the account menu. Flagged (BILLING_ENABLED). */
export function PlanBadge({ plan }: { plan: PlanId }) {
  return (
    <span data-testid="v2-surface">
      <Pill variant="soft">{v2.plans.names[plan]}</Pill>
    </span>
  );
}
