import type { BlockedReason } from '@dse/schema';

/**
 * The state page each blocked reason lands on (docs/design/pages.md, State pages). A plain module, so
 * server pages and client components read the same table.
 */
export const stateRoute: Record<BlockedReason, string> = {
  budget: 'budget',
  busy: 'busy',
  'visitor-cap': 'visitor-cap',
  'invalid-url': 'invalid',
  'private-address': 'invalid',
  bot: 'bot',
  robots: 'robots',
  login: 'login',
  unreachable: 'unreachable',
};
