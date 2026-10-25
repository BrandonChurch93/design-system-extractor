# V2 plan

V2 happens only if v1 tests well (the checklist in `docs/deploy-runbook.md`, step 14). This document says what v2 adds, what v1 already prepared, and what the owner decides before it starts. It is a plan, not a build order; when v2 is approved, it becomes its own kit with phases and gates in the shape of `docs/plan.md`.

## What v2 sells

The one-off extraction stays free. That is the marketing. Paid plans sell the things a design-system lead actually needs week after week:

1. **Private runs.** Runs visible only to the owner's account and the people they share with.
2. **Scheduled re-runs with drift alerts.** Watch a site weekly or on every deploy; an email when drift grows or a check that passed starts failing. The Compare page, automated.
3. **A GitHub Action.** Fails a pull request when contrast breaks or when the token count grows beyond a threshold, with the compare link in the check.
4. **Bigger crawls.** More pages, more viewports (tablet, a custom width), longer retention.
5. **Team sharing.** Seats, shared library of runs, a team showcase page.
6. **Priority.** Paid runs skip the queue and the public daily budget.

## Plans (placeholders until the owner sets prices)

| | Free | Pro | Team |
| --- | --- | --- | --- |
| Runs per day | 2 (or BYO key) | 30 | 150 |
| Pages per run | 12 (40 BYO) | 40 | 80 |
| Viewports | desktop, mobile | plus tablet and one custom | same |
| Retention | 90 days | 1 year | unlimited |
| Private runs | no | yes | yes |
| Scheduled re-runs | no | weekly | daily, plus on deploy |
| Drift alerts | no | email | email and Slack |
| GitHub Action | no | yes | yes |
| Seats | 1 | 1 | 10 |
| Priority | 0 | 5 | 7 |
| Price | 0 | [PRICE] / month | [PRICE] / month |

The `Limits`-shaped rows of that table are the `pro` and `team` entries in `packages/schema/src/entitlements.ts` from P1 onward, so v2 does not change the shape of a limit. The rest of the table (drift alerts, the GitHub Action, prices, the alert channels) is product scope, not an entitlement field. The literal v1 placeholder objects:

```
pro:  { runsPerDay: 30,  pageCap: 40, includeCap: 5, viewports: ['desktop','mobile'], retentionDays: 365,  privateRuns: true, scheduledRuns: true, priority: 5, teamSeats: 1 }
team: { runsPerDay: 150, pageCap: 80, includeCap: 5, viewports: ['desktop','mobile'], retentionDays: null, privateRuns: true, scheduledRuns: true, priority: 7, teamSeats: 10 }
```

`viewports` stays `['desktop','mobile']` until v2 adds the tablet and custom viewports to the `Viewport` enum; `scheduledRuns` is a boolean, and the cadence (weekly, daily, on deploy) lives on the v2 `schedules` table, not in entitlements.

## What v1 prepared (so v2 is small)

- Entitlements in one module; `pro` and `team` rows exist.
- `resolveViewer` is the only identity read; the auth adapter interface exists with a mock.
- `runs.owner_id` nullable; `users` and `subscriptions` tables exist; `visitors` tracks ids for the claim flow.
- `priority` on jobs; the queue orders by it.
- Cost metering per run.
- `getRunForViewer` is the single read path for the private-run check.
- The billing adapter interface exists with a mock; PricingSection, PlanBadge, AccountMenu, SignInSheet, BillingPage and UpgradePrompt are built, reviewed and flag-gated.
- The storage adapter and retention column handle plan-based retention already.

## What v2 builds

1. **Auth**: Supabase Auth (magic link and GitHub OAuth) behind `SupabaseAuthAdapter`; the claim flow for runs created before sign-in; session reading in `resolveViewer`.
2. **Billing**: `StripeBillingAdapter` with Checkout, the Customer Portal, and one webhook route handling `checkout.session.completed`, `customer.subscription.updated` and `deleted`; Stripe Tax on; plan changes write `subscriptions` and `resolveViewer` reads the active plan.
3. **Private runs**: the `visibility` column and owner check; a share-with-email flow for Team.
4. **Schedules**: a `schedules` table (site, cadence, owner, last run, alert rules), a cron in the worker that enqueues runs with the owner's priority, and the compare computation stored as a `run_diffs` row; alert emails through Resend with the compare link.
5. **GitHub Action**: a published action that calls the API with an API token (a new `api_tokens` table), waits for the run, computes the diff against the last run for that site, and sets the check status with thresholds from the workflow file.
6. **Team**: an `organizations` table, membership, a team page listing runs, seat enforcement in entitlements.
7. **Flag flip**: `BILLING_ENABLED=true`, prices set, the flag-off test replaced by plan-routing tests.
8. **Legal and operations**: Terms updated for paid service, refund policy, a support email, Stripe Tax configuration, and the Anthropic spend limit raised in step with plan limits.

## What the owner decides before v2 starts

- Prices for Pro and Team.
- Whether to run it under the LLC or personally (affects Stripe account and Terms).
- Whether the GitHub Action ships in the first v2 release or after.
- Whether the free tier keeps the BYO key path once Pro exists (recommended: yes; it is the engineers' path).

## What would make v2 a no

- The showcase runs do not look great on real sites after v1 testing.
- Component detection lands below the thresholds on real-world sites the owner cares about.
- The owner decides a paid SaaS is the wrong signal for the job search at that time.

In any of those cases v1 stands as the portfolio piece it was built to be, and nothing in it hints at what was not built.
