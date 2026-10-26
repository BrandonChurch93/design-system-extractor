# V2 seams and flagged surfaces

V1 ships no accounts, no payments, and no visible trace of either (D-009). It does ship the structure that makes v2 a small addition rather than a rework, and the v2 screens, built and reviewed, behind one flag. This document is the contract between the two versions. `docs/v2-plan.md` describes what v2 does with it.

## The flag

`BILLING_ENABLED` (server). The client reads `NEXT_PUBLIC_BILLING_ENABLED`, which `next.config` sets from `BILLING_ENABLED` at build time so the two can never disagree; nobody sets the public one by hand. The app's server code reads the same build-time value through `apps/web/lib/flags.ts`, so a build is either on or off throughout (D-060). `false` in every v1 environment. When false:

- No route, link, nav item, button, anchor, sitemap entry, or meta tag references pricing, plans, accounts, billing or sign-in. `/account/*` returns 404.
- `resolveViewer` always returns `userId: null, plan: 'free'`.
- The budget and visitor-cap state pages show the BYO key form, not the upgrade prompt.

The flag-off test has two halves (D-060): `apps/web/test/flag-off.test.ts` checks the flag's derivation, the mocks, the viewer, the dependency list and the billing route's 404, and `tests/e2e/flag-off.spec.ts` renders every page and state of the QA registry with the flag off in a browser (the catalog excepted, which shows the surfaces always) and asserts: no element with `data-testid="v2-surface"` exists; no `href` points at `/account`, `/account/billing` or `#plans`; `/account/billing` returns 404; and within the app's chrome regions only (TopNav, Footer, the home headline block, every StateCard, and the run header; each carries `data-testid="chrome"`), none of the words `pricing`, `plans`, `billing`, `upgrade`, `subscription`, `Pro`, `Team` appear (word-boundary, case-insensitive). Extracted data (a crawled site's `/pricing` page, a component named "Pricing card") and the How it works prose are outside the chrome regions and are not checked. P12's gate also runs `pnpm qa:visual` against the P11 goldens with the flag off and requires every page golden to be unchanged; `/catalog` is the one golden that changes in P12 (it gains the flagged surfaces) and its update is logged in STATUS.

When true, the surfaces in `docs/design/components.md` under "Flagged v2 surfaces" render in their places in `docs/design/pages.md`. `pnpm qa:billing` builds the app with the flag on and captures and axe-checks them there.

## Entitlements

`packages/schema/src/entitlements.ts`:

```
type PlanId = 'free' | 'pro' | 'team'
type Limits = { runsPerDay: number, pageCap: number, includeCap: number, viewports: Viewport[], retentionDays: number | null, privateRuns: boolean, scheduledRuns: boolean, priority: number, teamSeats: number }
export const plans: Record<PlanId, Limits>
```

V1 fills `free` with real values and `pro` and `team` with the v2 placeholder values from `docs/v2-plan.md` (they are never resolved for a viewer in v1). Every limit check in web and worker goes through `check(viewer, action)`. Adding a plan is adding a row.

## Viewer

`resolveViewer(request)` is the only place identity is read. In v1 it reads the visitor cookie and the BYO header. In v2 it also reads the auth session. Nothing else in the app touches cookies or sessions.

## Owner on runs

`runs.owner_id` is nullable and null in v1. `visitor_id` is always set. V2's claim flow: on sign-in, runs with the session's visitor id and null owner get the user as owner. The `users` and `subscriptions` tables exist from P1 (see `data-model.md`), empty.

## Priority and queue

Jobs carry `priority` (0 free, 10 showcase, v2: 5 pro, 7 team). BullMQ orders by it. The in-progress page's "runs ahead of you" counts jobs with priority ≥ the viewer's.

## Cost metering

Every run records `cost` precisely. V2 bills on plan limits, not on cost, but the meter is what shows usage on the billing page and what sets the per-plan runs-per-day sensibly.

## Private runs

In v1 every run is public by link. The run row has no `visibility` column yet; the v2 migration adds `visibility: 'link' | 'private'` with a default of `link`, and `GET /api/runs/{id}` gains an owner check for `private`. V1 code reads runs through one function (`getRunForViewer`) so the check has one place to go.

## Storage and retention

Retention is a column from day one; plans set it. Showcase runs have null.

## Auth adapter

`apps/web/lib/auth/adapter.ts` with `getSession(request)`, `signInWithEmail(email)`, `signInWithGitHub()`, `signOut()`. V1 ships `MockAuthAdapter` (returns no session; sign-in methods show the "Sign-in is not enabled yet." toast). V2 ships `SupabaseAuthAdapter`. The SignInSheet calls the adapter, never a provider directly.

## Billing adapter

`apps/web/lib/billing/adapter.ts` with `createCheckout(userId, plan)` → URL, `createPortal(userId)` → URL, `handleWebhook(payload, signature)` → events, `getSubscription(userId)`. V1 ships `MockBillingAdapter` (checkout and portal return `#`, subscription null). V2 ships `StripeBillingAdapter` and the webhook route. The PricingSection and BillingPage call the adapter only.

## Flagged surfaces, built in P12

PricingSection, PlanBadge, AccountMenu, SignInSheet, BillingPage, UpgradePrompt, as specified in `docs/design/components.md`, with prices as `[PRICE]` placeholders and the caption that prices are placeholders. They render in `/catalog` always and in the app only with the flag on. Their tests run with the flag forced on.

## What v1 must not do

- Collect emails, names, or any account data.
- Add Stripe, Supabase Auth, or any auth or payment dependency to `package.json`. The adapters are interfaces plus mocks.
- Show, link or mention plans anywhere a visitor can reach with the flag off.
