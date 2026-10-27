import { describe, expect, it, vi } from 'vitest';
import { checkoutFor, MockBillingAdapter, portalFor } from '../lib/billing/adapter';

// docs/specs/v2-seams.md, Billing adapter: the pricing and billing surfaces reach payments only
// through the adapter, and only for a signed-in viewer.

describe('the billing seam', () => {
  it('asks a visitor without a session to sign in, and checks a signed-in one out through the adapter', async () => {
    const adapter = new MockBillingAdapter();
    const checkout = vi.spyOn(adapter, 'createCheckout').mockResolvedValue('https://pay.example/c/1');
    expect(await checkoutFor(null, 'pro', adapter)).toEqual({ signIn: true });
    expect(checkout).not.toHaveBeenCalled();
    expect(await checkoutFor({ userId: 'u1' }, 'team', adapter)).toEqual({ go: 'https://pay.example/c/1' });
    expect(checkout).toHaveBeenCalledWith('u1', 'team');
  });

  it('opens the portal through the adapter only with a session', async () => {
    const adapter = new MockBillingAdapter();
    const portal = vi.spyOn(adapter, 'createPortal').mockResolvedValue('https://pay.example/p/1');
    expect(await portalFor(null, adapter)).toBeNull();
    expect(await portalFor({ userId: 'u1' }, adapter)).toBe('https://pay.example/p/1');
    expect(portal).toHaveBeenCalledOnce();
  });

  it('ships the mock in v1: checkout and portal go nowhere, there is no subscription', async () => {
    const m = new MockBillingAdapter();
    expect([await m.createCheckout(), await m.createPortal(), await m.getSubscription(), await m.handleWebhook()]).toEqual(['#', '#', null, []]);
  });
});
