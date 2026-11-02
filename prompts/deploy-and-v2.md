Push Design System Extractor to GitHub, deploy v1 with me, then plan v2.

Start with the reading order in CLAUDE.md (CLAUDE.md, STATUS.md, docs/decisions.md through D-115), then read `docs/deploy-runbook.md`, `docs/v2-plan.md` and `docs/specs/v2-seams.md` in full. Write the session-start line in the STATUS session log.

Where things stand: v1.3 is complete and green (`env DSE_MODEL_MODE=replay pnpm verify:all` passed on 2026-11-02, plus a later fix for a dev-only hydration mismatch, D-114). I have approved pushing (D-115): CLAUDE.md rule 8 now allows it, and `git push` and `git remote add` are no longer denied in `.claude/settings.json`. This deployment is hands-on with me, so ask me for anything only I can do (accounts, dashboards, secrets) instead of logging it as a blocker.

## 1 · Push

1. `git status` must be clean. Add the remote: `git remote add origin https://github.com/BrandonChurch93/design-system-extractor.git` (the `gh` login is BrandonChurch93 over HTTPS; the repository on GitHub is empty).
2. `git push -u origin main`. No force push, no pull requests.
3. Confirm with `gh repo view BrandonChurch93/design-system-extractor` and tell me the commit count and the head commit. Note the push in the STATUS session log.

## 2 · Deploy v1 (docs/deploy-runbook.md, steps 2 to 11)

`.env.production.local` already exists at the repository root. It is gitignored and mode 600. It holds the Anthropic key, generated `DSE_JOB_ENCRYPTION_KEY` and `DSE_ADMIN_TOKEN`, the app URL, the contact email and every cap. Six `PASTE_` values remain, which I fill from Supabase and Upstash. Never print its secrets in chat, and never commit it.

1. Ask me whether I have filled the six `PASTE_` values. If I haven't, walk me through runbook steps 2 and 3. Supabase: a US West project, the Session (5432) and Transaction (6543) pooler strings, a public `dse` bucket, an S3 access key pair. Upstash: a regional Redis database, its `rediss://` URL, and a daily command quota of at least 100,000. Confirm I set a monthly spend limit on the Anthropic key.
2. Run `pnpm run doctor --production` and fix anything it flags with me.
3. Migrate: `env DOTENV_FILE=.env.production.local pnpm db:migrate`.
4. Railway (step 8). The service deploys from the GitHub repo with root `/` and the Dockerfile `apps/worker/Dockerfile`, one replica, and every variable from the file. Give me the variables in a form I can paste without you echoing secrets, for example a command that copies them to the clipboard. Wait for `worker ready · queue dse · concurrency 1`.
5. Vercel (step 9). The root directory is `apps/web`, with the same variables except `DATABASE_URL`, which is the Transaction pooler string here. `vercel` CLI commands are denied in settings, so I use the dashboard.
6. Verify (step 10): `/api/health` answers `ok`, the worker is alive, and the budget is full. Then a real run of my portfolio through the live site.
7. Showcase (step 11), about 1.5 hours for twelve sites. Run it in the background and report each site as it finishes.
8. Then I review the live site myself. Fix anything I find as `Fix ·` commits through the usual gate, and push when I approve.

Update STATUS and `What Brandon must do at the end` after each step, so a fresh session could continue from it alone.

## 3 · Plan v2 (payments), after I say v1 looks good live

Don't start v2 code before I sign off on v1. `docs/v2-plan.md` is the plan. v1 already prepared the seams: entitlements with `pro` and `team` rows, the auth and billing adapter interfaces with mocks, the `users` and `subscriptions` tables, and the flag-gated PricingSection, BillingPage, UpgradePrompt and SignInSheet.

1. Ask me the four decisions under `What the owner decides before v2 starts`: Pro and Team prices, LLC or personal, whether the GitHub Action ships in the first release, and whether free users keep the bring-your-own-key path. Log each answer as a decision.
2. Turn `docs/v2-plan.md` into its own kit in the shape of `docs/plan.md`: phases, each with exit criteria and a gate, starting with auth (Supabase Auth with magic link and GitHub OAuth) and then billing (`StripeBillingAdapter` with Checkout, the Customer Portal, one webhook route, Stripe Tax). Show me the phase list before building.
3. List what I must set up for v2, with exact dashboard steps: a Stripe account and products with prices in test mode first, the webhook endpoint and its signing secret, a GitHub OAuth app and Supabase Auth settings, and Resend for alert emails if schedules are in the first release.
4. Then build phase by phase under CLAUDE.md, with every gate real, and with `BILLING_ENABLED` staying false in production until I approve the flip.
