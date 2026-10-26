import type { PlanId } from '@dse/schema';

// The billing seam (docs/specs/v2-seams.md). V1 ships the mock: checkout and portal go nowhere,
// there is no subscription. V2 adds StripeBillingAdapter and its webhook route.

export type PaidPlan = Exclude<PlanId, 'free'>;
export type Subscription = { plan: PaidPlan; status: 'active' | 'past_due' | 'canceled'; renewsAt: string };
export type BillingEvent = { type: 'subscription.updated' | 'subscription.deleted'; userId: string; subscription: Subscription | null };

export interface BillingAdapter {
  createCheckout(userId: string, plan: PaidPlan): Promise<string>;
  createPortal(userId: string): Promise<string>;
  handleWebhook(payload: string, signature: string): Promise<BillingEvent[]>;
  getSubscription(userId: string): Promise<Subscription | null>;
}

export class MockBillingAdapter implements BillingAdapter {
  async createCheckout(): Promise<string> {
    return '#';
  }
  async createPortal(): Promise<string> {
    return '#';
  }
  async handleWebhook(): Promise<BillingEvent[]> {
    return [];
  }
  async getSubscription(): Promise<Subscription | null> {
    return null;
  }
}

export const billing: BillingAdapter = new MockBillingAdapter();
