# STATUS

This is the single live file for the build. A fresh session with no memory must be able to continue from this file plus the docs. Keep every section current. Update it before any stop.

## Blocker

None.

(When a hard blocker exists, replace the line above with `BLOCKER:` followed by exactly what is needed from Brandon and what was tried. Then stop.)

## Current phase

P15 · Final consistency, README, runbook, Definition of Done. P14 gate passed 2026-10-26.

## Next action

P15, in progress. Work through the P15 plan below in order; tick each item as it lands, commit after each.

### P15 plan

1. Traceability. Four read-only passes mapped every `##` and `###` section of the 20 spec and design documents to code and tests (198 rows, drafts in the session scratchpad, to be merged into `docs/traceability.md`). They listed about 134 gaps. Each is closed by a test, a code fix, or a document fix with a logged decision; `scripts/test/traceability.test.ts` (parked in the scratchpad until the document exists) then holds the document to every heading and every path, with no open gap.
2. Divergences to fix in code: intermediate capture files deleted after `done` unless `DSE_KEEP_INTERMEDIATE=1`; past the 6,000-element snapshot cap, candidates and their ancestors kept; the toggle (checkbox in a label with a track), breadcrumb (list of links with separators), pagination (numbered links) and form (two or more fields) rules; the model's `variantHint`; flex direction in responsive variants; `cancelRun` through `getRunForViewer`; the RegionSkeleton component in the catalog. Evals in replay after the detection changes (re-record within the reserve if hashes change).
3. Divergences to settle in the documents with decisions: the reachability probe is a GET; the interstitial clause; `body` in the page-selection reasons; the dashboard row's login condition (the login wall is detected at capture); fingerprint `box` buckets and the card's child cluster id; naming batches in first-seen order across pages (D-066); stable component ids by content; the dev CSP's `unsafe-eval`; keyframes never reach a preview; drift.md's code sentence (D-069); the typed error list (no `ModelError`); `limitsFor` beside `check`; the session read in `session.ts`; `use-media` beyond the panel; no state-captures index file.
4. Missing tests, grouped: crawler and capture (context options, media block, redirects, caps, synthetic 404, path groups, challenged pages, consent close button, events); tokens and components (caps, rules table, cap and order, events); previews and checks (reasons, placeholders, caps, thresholds, exemptions, byCheck); drift (findings, proposals, numbers, evidence, events); models (request shape, images, record mode, hash); exports, MCP and CLI (shortening, app URL, exit codes, flags, `/open`); platform (doctor fail cases, redirects, BYO and showcase budget, timeout expiry, budget cut path, worker settings, visitors, owner null, frozen runs, retention schedule, unpublish retention); web (UrlForm submit, blocked navigation, `?c=`, recent cap, sitemap and robots, billing metadata, component behaviors on the catalog, PreviewFrame markup, design lint for literal values, uppercase, emoji, copy in JSX).
5. Final live eval within the reserve (`env DSE_MODEL_MODE=live pnpm evals`), results committed.
6. README with a screenshot; `docs/deploy-runbook.md` verified (showcase takes about 95 minutes for twelve sites; Railway variables include `DSE_SHOWCASE_TIMEOUT_MS`); CHANGELOG 1.0.0; Known limitations complete; owner's list; delete `scripts/.tmp-crop.ts`.
7. Definition of Done, all ten items, on a clean tree; `Build complete`.

### P13 real-roster dry run (2026-10-26, `pnpm showcase --dry-run`, $0.140 for the full pass)

| Order | Site | Result | Pages | Colors | Type styles | Spacing steps | Components | Checks passed | Duration | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | brandonchurchportfolio.com | complete | 4 | 14 | 24 | 12 | 16 | 27 of 35 | 2 min 27 s | $0.008 |
| 2 | generative-ui-github.vercel.app | complete | 3 | 26 | 24 | 8 | 31 | 39 of 45 | 1 min 4 s | $0.005 |
| 3 | stripe.com | complete | 12 | 80 | 24 | 12 | 120 | 109 of 187 | 10 min 8 s | $0.017 |
| 4 | linear.app | complete | 12 | 80 | 24 | 12 | 120 | 117 of 202 | 6 min 41 s | $0.017 |
| 5 | vercel.com | complete | 12 | 29 | 24 | 12 | 83 | 63 of 149 | 4 min 6 s | $0.009 |
| 6 | notion.so | blocked · invalid-url · replaced by figma.com |  |  |  |  |  |  | 0 min 4 s | $0.000 |
| 6 | figma.com | complete | 12 | 51 | 24 | 12 | 104 | 145 of 199 | 8 min 20 s | $0.013 |
| 7 | apple.com | failed · replaced by airbnb.com | 12 | 80 | 0 | 0 | 0 | 0 of 0 | 6 min 2 s | $0.003 |
| 7 | airbnb.com | failed · replaced by etsy.com | 12 | 33 | 0 | 0 | 0 | 0 of 0 | 4 min 28 s | $0.001 |
| 7 | etsy.com | blocked · bot · replaced by bestbuy.com |  |  |  |  |  |  | 0 min 18 s | $0.000 |
| 7 | bestbuy.com | blocked · unreachable · replaced by github.com |  |  |  |  |  |  | 1 min 49 s | $0.000 |
| 7 | github.com | complete | 12 | 80 | 24 | 12 | 120 | 181 of 229 | 8 min 32 s | $0.020 |
| 8 | wikipedia.org | complete | 2 | 17 | 20 | 11 | 21 | 29 of 40 | 0 min 52 s | $0.005 |
| 9 | usa.gov | complete | 12 | 18 | 24 | 12 | 38 | 46 of 50 | 4 min 56 s | $0.006 |
| 10 | homedepot.com | complete | 12 | 20 | 19 | 7 | 37 | 33 of 65 | 3 min 51 s | $0.006 |
| 11 | modernsoftworks.com | sparse · replaced by shopify.com | 2 | 3 | 1 | 3 | 0 | 0 of 0 | 0 min 18 s | $0.002 |
| 11 | shopify.com | complete | 12 | 80 | 24 | 12 | 120 | 116 of 157 | 11 min 57 s | $0.016 |
| 12 | amazon.com | complete | 12 | 53 | 24 | 12 | 93 | 99 of 166 | 6 min 33 s | $0.013 |

12 entries would be listed. Re-runs after the fixes (`--dry-run --only`):

| Order | Site | Result | Pages | Colors | Type styles | Spacing steps | Components | Checks passed | Duration | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | notion.com | complete | 12 | 38 | 24 | 12 | 79 | 94 of 156 | 5 min 34 s | $0.012 |
| 7 | apple.com | complete | 12 | 80 | 24 | 12 | 119 | 117 of 196 | 13 min 18 s | $0.015 |

With these, orders 6 and 7 list the roster's own sites (notion.com, apple.com); modernsoftworks.com, which has no Personal alternate, would take the first alternate left, github.com. The twelve entries cover every category chip. airbnb.com, no longer needed as an alternate, was checked through tokens with `pnpm pipeline:run https://airbnb.com/ --through tokens`: 24 type styles, all sizes and line heights positive.

Findings:
- apple.com and airbnb.com failed at the end of tokens: text set to `font-size: 0` or `line-height: 0` became a type style of size 0, which the document schema refuses. Fixed (D-072, regression test in `collect.test.ts`).
- notion.so redirects to notion.com, another host, so the crawler blocked it "redirected off-site" as the spec requires. The roster now names notion.com (D-072).
- modernsoftworks.com answers every request, including a plain browser request, with Hostinger's "403 Forbidden" page. That page carries no bot marker, so the start page failed, only the synthetic 404 was captured, and the run came back sparse and was replaced, as specified. Listed for Brandon below.
- etsy.com blocks with a captcha (bot, correct); bestbuy.com gives no answer in 20 s (unreachable, correct).
- homedepot.com: 7 of 12 selected pages answered 403 with no bot marker, so 5 were captured and the run is thinner (37 components) but complete. The Pages column counts selected pages.
- The 80-color rows are the color cap. Every completed run finished inside the 15-minute showcase timeout (D-071); the longest was shopify.com at 12 min.

### P13 dry-run findings (first attempt, stopped after five sites, $0.013 spent)

- brandonchurchportfolio.com complete in 200 s (4 pages, 16 components; capture 2 min 18 s, previews 36 s for 16 components, 7 live of 16).
- generative-ui-github.vercel.app complete in 83 s (3 pages, 31 components).
- stripe.com failed: timed out at 6 min inside capture (discover 60 s; each page about 65 s per viewport, mostly 40 state elements at about 1.5 s each; two pages at a time). Replaced by coinbase.com.
- coinbase.com failed: an `open` state click navigated the page ("Execution context was destroyed"), and one element failed the run. The spec forbids following links during capture. Replaced by wise.com.
- wise.com: discover took 80 s (2,000 sitemap URLs, template fingerprints); stopped by hand during capture.
- Second Stripe run (pipeline:run, 15 min timeout, novelty capture but old previews): complete in 773 s. Discover 60, capture 270, tokens 14, components 109 (sequential naming), previews 314 (sequential), rest 3. Quality findings: drift "contrast not kept" because the constraint used measured raw ratios a clustered token pair can never reach (fixed, D-067); 36 of 120 previews live; design-system.md 1,104 KB and prompt.md 522 KB, mostly site headers' CSS custom properties and markup (decided: D-069).
- Arithmetic: 12 pages × 2 viewports of state capture alone is about 12 minutes; previews at about 2.3 s a component reach 4 minutes at the 120 cap. The pipeline needs a time budget and faster state capture and previews.

### Carried into P13 (found in the P12 review)

- Done (D-064): EvalTable lays out by its own width, labels its stacked cells, wraps only at interpuncts; how-it-works 820 and 390 goldens and the catalog goldens updated, 1440 unchanged.
- Done (D-073): goldens take an absolute 25-pixel bound beside the ratio. Measured with no tolerance, 118 of 125 matched to the pixel; the other seven were stale data from the reseed, reviewed and updated.

### P12 self-review (flag on: `qa/billing` at 1440, 820, 390; flag off: qa:visual unchanged from P11; catalog v2 sections)

Fixed during review: plan cards at about 232 px (820 px and the catalog column) wrapped "per month" under "[PRICE]" in Pro and Team but not Free, so the feature rules misaligned across the row (D-062). Checked and kept: Plans between Showcase and Footer with buttons on one bottom line; the SignInSheet centered at 440 over the scrim and opened from the phone menu; UpgradePrompt inside the StateCard above the key form; the billing page's three cards at 760; every phone capture within the 20 px gutter; no chroma beyond the extracted palette; the mock toast on sign-in.

### P11 self-review (quality-bar.md, every page at 1440, 820, 390)

Fixed during review: showcase and component grids overflowing at 390 (minmax columns); long hosts wrapping inside headers; component card "uses" captions and the MCP caption wrapping badly; catalog index entries wrapping; the panel heading's focus ring clipped and the phone panel head stacking; Recent rows breaking the host mid-word in the Compare picker (rows now lay out by their list's width, D-059); Compare's paired cards not sharing a bottom edge and the picker's buttons not lining up with the paste form; code under the CodeBlock copy button (the button has its own column now); "1 pages" on a one-page run (D-059); empty Radius and Shadow cards reading 0 on the login-wall run (left out, D-059); landmark and heading-order findings from axe; the catalog frame-height race (P10). Checked and kept: StateCard spacing (`space-8` per pages.md), phone sheets for the page list, share and panel, the in-progress rail wrapping to two rows, every number from data, the extracted palette the only color.

### P11 plan

Read for P11: pages, components, copy, motion, quality-bar, design-system, exports-and-mcp (/open), preview-fidelity (Serving, CSP), the reference wireframes, and Next 16's parallel routes, proxy (the renamed middleware), CSP nonce guide, page props and metadata docs.

1. Foundations: every string of `copy.md` in `apps/web/copy/strings.ts`; `lib/format.ts` (durations, dates, costs, counts, rule 9 words); `lib/run-view.ts` (view model from a document: breadcrumb, meta lines, rail state from events, regions landed); `lib/browser-store.ts` (`dse_recent`, `dse_key`, `dse_blocked`, try/catch); `lib/storage-url.ts`; `proxy.ts` with the per-request nonce CSP (`/open` allowance); every page rendered dynamically so the nonce applies.
2. Home: UrlForm (client checks, POST, blocked navigation, 429 and 400 lines, includes), KeyPopover, ShowcaseCard, ShowcaseGrid, CategoryFilter, `revalidate` read path.
3. Run page complete face: RunHeader, PageListPopover, StatStrip, PaletteRow, Swatch popovers (TokenPopover), DriftHeadline, SectionNav, Tokens (Color, Type, Spacing, Radius, Shadow cards), Components (filter, grid, card, StatesStrip, CheckBadge), Checks (summary, table), Drift (numbers, proposal, collapses, evidence), Exports (cards, set toggle, download all, MCP), SharePopover, footer with log link; sparse and login captions.
4. In-progress face: StageRail, PagesCard, RegionSkeleton, LiveLog, polling every 1.5 s with ETag, diff-driven entrances, blocked navigation, queued meta from `queuePosition`, Cancel.
5. Component panel (`@panel` slot, `?c=`) and component page; CaptureViewer; Sheet on phones.
6. State routes, failed, cancelled, not found, 404.
7. Recent runs (localStorage, `/api/me`), Compare (both modes, picker, phone notice).
8. `/open`, How it works (EvalTable from `fixtures/results.json`), About, Privacy, Terms.
9. Metadata, run OG images, home OG image, sitemap, robots, noindex rules.
10. Catalog entries for every page-level component.
11. QA: `tests/qa/pages.ts` with every page and state, goldens, axe, no horizontal scroll at 390, Lighthouse script and thresholds, `/open` test, polling mutation bound test, reduced-motion on the run page, a recorded video of the in-progress page reviewed, the Compare deltas test (messy to messy-after).

## Phase checklist

P15 (the Definition of Done in `docs/plan.md`):

- [ ] 1. `pnpm verify:all` green.
- [ ] 2. Every phase gate recorded as passed with its date.
- [ ] 3. `docs/traceability.md` maps every section of every spec and design document to code and tests with no gaps (test).
- [ ] 4. `docs/decisions.md` records every deviation; Known limitations lists each with its decision id.
- [ ] 5. `docker build` of the worker from the root and `pnpm --filter web build` succeed.
- [ ] 6. The flag-off test passes.
- [ ] 7. `pnpm qa:copy` passes.
- [ ] 8. `pnpm run doctor --production --env fixtures/env/production.sample` passes.
- [ ] 9. Working tree clean, committed, never pushed.
- [ ] 10. STATUS says `Build complete` and the owner's end list is exactly what remains.

## Gates passed

- P14 · Hardening · 2026-10-26 · chaos tests: killed worker restarts on the next and completes counted once, Redis down fails fast with no run, failed enqueue fails its run and refunds, storage outage fails the run refunded (D-074) · soak: ten of ten complete, max RSS 967 MB of 1,536, no context or page left open, heap growth 6.2 MB after the JSDOM leak fix (D-075) · `pnpm docker:smoke`: image built from the root completes the clean fixture against the Docker services and stops cleanly · `pnpm --filter web build` green · error handling audit, every fetch bounded (test), the web app's Redis bounded, log review (test), dependencies pinned (test), `fixtures/env/production.sample` passes doctor --production (test) · `pnpm audit`: no high, one moderate GHSA-67mh-4wv8-2f99 (esbuild dev server via drizzle-kit, dev only) · D-074, D-075 logged with documents fixed · verify:all green (451 tests, e2e 138, evals, visual 125, axe 174, billing 16, Lighthouse, copy).

- P13 · Showcase, SEO and content · 2026-10-26 · showcase script with local, `--remote`, `--only`, `--alternates`, `--refresh-links`, `--dry-run` (D-063) and its tests · local six-entry showcase with no orphan rows at 3 and 2 columns (layout e2e) · real-roster dry run pasted above with per-site status, stats and cost, blocked and sparse sites noted with their alternates ($0.17 for the full pass and re-runs) · real-site fixes from the dry runs: CSSOM matched CSS, ordered novelty, time budget, parallel naming and checks, link guard, showcase timeout, hidden text (D-066 to D-072) · metadata on every route from copy.md (metadata e2e reads copy.md) · OG goldens · visual goldens with an absolute 25-pixel bound (D-073) · D-063 to D-073 logged with documents fixed · qa:design reviewed (home, how it works, catalog, run, compare, recent) · verify:all green (434 tests, e2e 138, evals, visual 125, axe 174, billing 16, Lighthouse home and run, copy) · `pnpm audit` one moderate advisory, none high.

- P12 · V2 seams and flagged surfaces · 2026-10-26 · flag derived at build time and read through one module · auth and billing adapters with mocks · PricingSection, PlanBadge, AccountMenu, SignInSheet (with the TopNav Sign in), BillingPage and UpgradePrompt behind the flag with `data-testid="v2-surface"`, in the catalog always · flag-off test in two halves (D-060) · `qa:billing` on a flag-on build, reviewed at three viewports, axe zero · page goldens unchanged but `run-390-after-select` (D-061) · catalog golden updated · `tests/qa/` committed (was ignored) · D-060, D-061, D-062 logged with documents fixed · verify:all green (412 tests, e2e 134, visual 123, axe 174, billing 16) · `pnpm audit` one moderate advisory, none high.

- P11 · The web app · 2026-10-26 · every page and state in pages.md built and captured at 1440, 820, 390 (162 design captures) and self-reviewed (notes above) · no horizontal scroll at 390 (layout e2e) · axe zero violations on every page and state · Lighthouse home 100/100/100/100, run 99/100/100/100 · in-progress video reviewed (rail fills, stats count, 60 fps, grid entrance without long frames) and reduced motion on the run page · copy audit and qa:copy · /open test · goldens for every page at three viewports (all page goldens new; catalog golden updated for the page-level entries and the CodeBlock column) · polling mutation bound per poll · Compare deltas messy to messy-after · D-058, D-059 logged with documents fixed · P6 preview CSP defect fixed · verify:all green (405 tests, e2e 53, visual 123, axe 169) · `pnpm audit` one moderate advisory, none high.

- P10 · Worker, queue, caps, API and seed · 2026-10-26 · integration through the queue: lifecycle on clean with mid-run polls seeing tokens before components, budget, busy, BYO, visitor and address caps, refunds on blocked and cancel, crash retried once then failed, status gate, rate limit, login wall ending blocked with one page, retention · key never in a log, row or Redis value · every API route including exports, capture, OG, me, health, admin · MCP `--run` against the route and the production build · seed run twice with identical output (six complete runs, three frozen, six showcase entries) · worker image builds, boots in production mode and stops on SIGTERM · doctor green · D-057 logged with documents fixed · catalog frame-height race fixed (frames asked for their height after hydration; it had failed qa:visual one run in three) · verify:all green (395 tests) · qa:design reviewed (catalog unchanged; every phone frame sized to content at three widths) · build spend $0.093.

- P9 · Exports, MCP and CLI · 2026-10-26 · golden tests for every format and both sets, W3C export validates against the vendored DTCG schema · scripted MCP client over stdio exercises every tool and resource (`--file`, `--run`, `--url`) · CLI end to end on clean including `--cdp`, `export` and `serve` · `npm pack` dry runs ship only the build · D-056 logged with documents fixed · catalog unchanged (qa:visual, qa:design) · axe zero violations · verify:all green.
- P8 · Drift · 2026-10-26 · full `pnpm evals` passes every threshold on all five fixtures (replay) · messy drift recall 16 of 16, zero findings on clean, tailwind, css-in-js, library · contrast kept everywhere, the N increase path tested · narrative validator and fallbacks tested, narrative recorded · D-055 logged with documents fixed · catalog unchanged (qa:visual, qa:design) · axe zero violations · verify:all green with the full evals · build spend $0.08.
- P7 · Checks · 2026-10-26 · planted check accuracy 100% failures and 100% passes on all five fixtures (replay) · contrast math, compositing, crop sampling, focus, tap target, label and reduced-motion tables · every rendered detail matches a template read from checks.md · clean run finds exactly its two planted failures · D-054 logged with documents fixed · catalog unchanged (qa:visual, qa:design) · axe zero violations · verify:all green with test:security.
- P6 · Preview fidelity and sanitization · 2026-10-26 · live rates clean 0.963, messy 0.903, tailwind 0.963, css-in-js 0.963, library 0.955 (floors 0.90, 0.85, 0.90, 0.75, 0.90) · messy promo card captured with diff · security suite (37 cases, worker and app sandbox, zero requests off the allowlist, no script) · CSP builder tested · 250 KB CSS yields styles too large · D-053 logged with documents fixed · DOMPurify 3.4.17 for advisories in 3.4.16 · catalog unchanged (qa:visual, qa:design) · axe zero violations · verify:all green with test:security.
- P5 · Component detection · 2026-10-25 · components P/R 1.000 / 1.000 on clean, messy, library and 0.963 / 0.963 on tailwind and css-in-js (floors 0.92 / 0.90 and 0.88 / 0.87) · variants and states above floors · fallback run passes with valid names · variant naming, cross-page merge, classification table, clustering and model-call tests · provenance and crops integration test · D-052 logged with documents fixed · catalog unchanged (qa:visual, qa:design) · axe zero violations · verify:all green · build spend $0.04.
- P4 · Token clustering · 2026-10-25 · token precision and recall 1.000 on all five fixtures (`evals:gate`, replay) · fallback names valid and unique on every fixture (`evals --fallback`) · color naming recorded, model-call fallbacks tested · clustering, classification, naming, base inference, shadows, type roles unit tests · tokens integration test · D-051 logged with documents fixed · catalog unchanged (qa:visual, qa:design) · axe zero violations · verify:all green · build spend $0.0038.
- P3 · Crawler, selection and capture · 2026-10-25 · selection exact on all five fixtures (`evals:gate`, replay) · capture, blocked-state, private-range, politeness, form and dialog, select model-call tests green (unit and integration) · expected.json complete for all five fixtures · D-040 to D-050 logged with documents fixed · catalog unchanged (qa:visual against goldens, qa:design reviewed at three viewports) · axe zero violations · verify:all green. Fixed during the gate: nested `run.mjs` runs lost the record of which variables came from `.env.local`, so `verify:all` ran evals live once ($0.0002); now kept and tested (`scripts/test/run-env.test.ts`).
- P2 · Design system in code and the catalog · 2026-10-25 · tokens.css diffed against design-system.md and motion.md both ways (mutation-checked) · contrast table recomputed within 0.05 · 23 primitives plus a Motion section in /catalog with 390 px frames · axe zero violations on the catalog at 1440, 820, 390 and on all 25 frame routes · reduced-motion Playwright test with a no-preference control · catalog goldens committed · qa:design reviewed at three viewports with a 60-stop keyboard focus walk · verify:all green.
- P1 · Schema and data model · 2026-10-25 · 42 tests (schema, enums and labels verbatim from copy.md, every data-model type by name, migrations clean and idempotent, db:reset, patch merge and concurrency, events, unpublished runs hidden, storage text and binary round trip with content types) · verify:all green.
- P0 · Preflight · 2026-10-25 · `pnpm run doctor` all services connected (Postgres 16, Redis 7, MinIO with both buckets and public read, Anthropic key with both model ids live) · `pnpm check` green · `pnpm verify:all` green end to end with empty suites · worker image builds and runs · `pnpm --filter web build` green.

## Decisions made during this build

Mirror of the entries added to `docs/decisions.md`, newest first.

- D-078 · Fixes from the P15 e2e and script tests: blocked-run redirect, toast replacement, worker Redis connections in the seed and showcase, budget cut events, the motion rule for hover and focus colors.
- D-077 · More sweep rulings: `radius-xs`, icon size, literal copy, run ids in mono, the synthetic 404 under the cap, font CORS; shared CSS Modules, cap priority, path groups, evidence cap.
- D-076 · Sweep rulings: intermediate files deleted, snapshot cap keeps candidates, structural rule forms, flex direction, one read path, RegionSkeleton; documents fixed where the code is right.
- D-075 · `pnpm soak` and `pnpm docker:smoke` with their pass rules; preview JSDOM windows closed and the sanitizer's second pass uses a template (a heap leak the soak found).
- D-074 · Outage outcomes: a killed worker's run restarts on the next worker; the web app's Redis fails fast; a failed enqueue fails its run and gives everything back; a storage outage fails the run, refunded.
- D-073 · Visual goldens take `maxDiffPixels: 25` beside the ratio; seven stale goldens updated.
- D-072 · Text at zero font size or line height is not a type style; the roster's Notion entry is notion.com.
- D-071 · Showcase runs take `DSE_SHOWCASE_TIMEOUT_MS` (15 min); the timeout detail names the run's own minutes.
- D-070 · A trigger never merges by name with an action control; the novelty key carries trigger and icon-only.
- D-069 · Component code is its own rules with token variables; design-system.md and the whole prompt bound their code; the full code stays in each component's prompt.
- D-068 · Matched CSS read from the CSSOM: one query per selector instead of a CDP call per node (31 s to 1 s on a large page).
- D-067 · The drift constraint holds pairs that pass at today's token values.
- D-066 · Run-wide novelty, a time budget with labeled fallbacks, parallel naming and render checks, links never followed and navigation survived.
- D-065 · Page metadata: one helper for title, description, preview and indexing; 404 titled Not found; unfinished runs use the global description; a test reads copy.md.
- D-064 · EvalTable lays out by its own width and labels its stacked cells.
- D-063 · Showcase script: the content route lists exactly its runs; `--dry-run`; replacement and multiple-of-six rules; own worker locally with the build meter; cost is the run's record.
- D-062 · A plan card under 280 px wide sets "per month" beneath the price, so one row shares one layout.
- D-061 · QA starts every page at `qaNow`; `run-390-after-select` is the one page golden updated in P12 (its masked meta line wraps by the clock); `/qa/` ignored from the root so `tests/qa/` is committed.
- D-060 · The flag is read from the build-time public value everywhere; the flag-off test is a unit half and a browser half; `qa:billing` serves a flag-on build on 3101; without a session TopNav shows Sign in and paid plans open the SignInSheet; the billing page shows the visitor's free day.
- D-059 · Phone forms on state pages take a full-width button like UrlForm; RecentRunRow lays out by its list's width; empty Radius and Shadow cards are left out; one page reads `1 page`.
- D-058 · The web app made exact: proxy.ts CSP with nonce and per-request pages, jitless Zod, blocking metadata, the P6 preview CSP base fixed, copy additions, entrances from the parent's intersection, run page placements, sliced documents for the browser, Compare by signature, bare domains as https, UTC run dates, seeded blocked and QA runs, Lighthouse desktop preset, catalog page-level entries.
- D-057 · Worker, queue, caps and API made exact: visitor identity fallback becomes the cookie, key and showcase runs not counted, decimal cents and reservation at creation, job carries counted keys, queue depth and position from the runs table, BullMQ priority and retry settings, capture redirect, OG fonts, `stats` and `sparse`, seed with fixed ids at creation, extra recordings kept, `db:seed:check` in verify:all.
- D-056 · Exports, MCP and CLI made exact: W3C header in `$description` and `$extensions`, export names, voice check on prose only, byte-stable zip, the exports stage and `runUrl`, the CLI's folder layout and served storage, `--cdp` per-tab guards, package entry points.
- D-055 · Drift made exact: supporting sentence patterns, caption values, evidence strings, proposal details, the validator's extra rules, no date in the model's facts.
- D-054 · Checks made exact: one worst result per check per component with its variant, `Not applicable`, nested components excluded from a container's contrast, focus and tap and label and motion readings, triggers cluster apart, the library's focus ring.
- D-053 · Previews made exact: markup and variables kept by capture, the root keeps its page box on its ground, rules without media wrappers, alignment-tolerant comparison, CSS px sizes, a storage server for local runs, jsdom 29.
- D-052 · Component clustering made exact: base class tokens and families, guarded style merge, look merge, variant rules, classification readings, collision guard, provenance and state details, popups opened at scroll 0, recordings with request text and retries.
- D-051 · Token rules made exact: base 8 tried before 4, ARIA semantic context, hue bands, naming and collision rules, usage as occurrences, contrast pair collection, `evals --fallback`; messy expectations corrected.
- D-050 · Rule classification tries specific forms first: toggle before button; breadcrumb, pagination and tabs before nav.
- D-049 · An `aria-invalid="true"` element counts as semantic (error) context for color classification.
- D-048 · Near-duplicate colors are compared only between tokens of matching alpha.
- D-047 · `expected.json` conventions: capture order, first-seen instance boxes, states not variants, composite items as components.
- D-046 · Fixture authoring: clean's planted caption is the New tag (4.2:1); messy plants seven; library is Bulma with a brand layer and three planted failures.
- D-045 · Centered auto margins count as layout, not spacing.
- D-044 · The reduced-motion probe runs after the main load and measures the candidates that moved; no `open` on tabs.
- D-043 · Element candidate rules made exact: blockified flex items as inline marks, background images differ, no table parts, header and footer only as ARIA landmarks.
- D-042 · `sc-` class names count as hashed for the css-in-js hint.
- D-041 · Page ids and the synthetic missing page are deterministic.
- D-040 · Request hashes leave out image bytes.
- D-039 · Reduced motion for content on first paint: `data-move` plus a stylesheet rule; elements mounting later read the preference in JavaScript.
- D-038 · Catalog phones are real 390 px iframes; axe-core runs per top document; QA captures at full document height without site isolation; CSP will allow `frame-src 'self'`.
- D-037 · Swatch `token` is 96 wide × 48 high.
- D-036 · `focus-inverse` ring token for inverse grounds.
- D-035 · No `nosniff` on stored objects (S3 cannot set it); the right Content-Type on every upload.
- D-034 · Unpublishing hides a run (404) and restores 90-day retention.
- D-033 · Database code in `packages/pipeline/src/db/`; `run_pages` keyed by (run_id, id); the run document fields later stages need.
- D-032 · Seed run ids are ten characters (`seedclean0` … `seedprog03`).
- D-031 · The run breadcrumb says "Recent runs".
- D-030 · Labels for every enum value added to copy.md.
- D-029 · Local MinIO runs from Chainguard's image; bucket init image built locally (`docker/storage-init`).
- D-028 · Always `pnpm run doctor` (pnpm's built-in `doctor` shadows the script); the production check requires the session string and reminds that Vercel gets the pooler string.
- D-027 · Structured outputs (`output_config.format`) instead of forced tool use; no sampling parameters; small model thinking off at effort low, large model adaptive at effort low.
- D-026 · Verified model ids `claude-haiku-5-5` and `claude-sonnet-5-5` and their prices on 2026-10-25.

## Known limitations

Things implemented differently from the spec, with the decision id that explains why. Brandon reads this list at the end.

- Model calls send no `temperature`: the API no longer accepts sampling parameters, so naming and narrative are stabilized by prompts, schemas, validation and recordings instead (D-027).

## Toolchain notes

- `next.config` sets `agentRules: false` (Next 16 would write an AGENTS.md with em dashes into apps/web) and `devIndicators: false`. Next 16's own docs are in `apps/web/node_modules/next/dist/docs`; read them before writing routes (P11), because the API differs from older Next.
- QA (`qa:design`, `qa:visual`, `qa:axe`) and `test:e2e` start a fresh production build on port 3100 through `scripts/qa-server.mjs` (rebuilds when sources are newer). Kill any stray server on 3100 before running them.
- Dev helpers: `pnpm exec tsx scripts/shot.ts <url> <out.png> [w] [h]`, `scripts/tile.ts` to cut tall screenshots for review and `scripts/montage.ts` to set several side by side.
- Fixture authoring aids (need `pnpm fixtures:serve` or start the server themselves through the pipeline): `pnpm exec tsx scripts/fixtures-inventory.ts <site> [--where=10,18] [--color=#HEX,...]` prints every raw token value, the ΔE 2.3 clusters and the drift near-duplicate pairs; `scripts/fixtures-candidates.ts <site> [desktop|mobile]` prints every element candidate with its rules, box and states. Re-run both after any fixture change and keep `expected.json` in step (D-046, D-047).

- jsdom is 29.1.1: jsdom 30 needs Node 22.22 (D-053). `pnpm exec tsx scripts/previews-inspect.ts <fixture> <outDir>` renders a fixture run's previews beside their crops after `pnpm evals --through previews`.
- Node 22.14, pnpm 9.15.9, TypeScript 5.9.3 (the native 7.x compiler is not yet supported by Next.js tooling), ESLint 9 (ESLint 10 is not supported by the React, jsx-a11y and import plugins that `eslint-config-next` uses), Next.js 16.4, React 19.3, Zod 4.6, Vitest 5, Playwright 1.64 with its Chromium.
- Queue and API (P10): tests use Redis logical database 15 and `dse_test`; the API route handlers are plain `Request`/`Response` functions, so integration tests call them directly with the harness in `apps/web/test/helpers/harness.ts`. `pnpm db:seed:fixtures` takes about ten minutes (six runs, concurrency 1) and refuses to run while a worker heartbeat is live: stop `pnpm dev` first. `pnpm db:seed:check` seeds only when the seed is missing. Sites outside the eval fixtures are recorded with `env DSE_MODEL_MODE=record pnpm exec node scripts/run.mjs tsx scripts/record-extra.ts messy-after walled` (listed in `fixtures/recordings/extra.json`, kept by prune). Next 16 rejects unknown exports from `route.ts` files: keep helpers in `lib/`.
- Internal packages `@dse/schema` and `@dse/pipeline` are consumed as TypeScript source; the worker, MCP and CLI bundles inline them with tsup.
- Root scripts load `.env.local` (or `DOTENV_FILE`) through `scripts/run.mjs` without overriding variables already set, so `env DSE_MODEL_MODE=live pnpm evals` wins.

## What Brandon must do at the end

Keep this list current. It is the only hands-on work he will do.

1. Follow `docs/deploy-runbook.md`.
2. modernsoftworks.com answers every request with Hostinger's "403 Forbidden" page (seen 2026-10-26, from a browser user agent too). Until it serves pages, the showcase replaces it with an alternate; once it does, `pnpm showcase --only modernsoftworks.com` restores it.

## Session log

Newest first. One line per session start, one per gate passed, one per stop. Keep it short.

- 2026-10-26 · Gate passed · P14 · chaos, soak, Docker smoke, timeouts, pinning, production sample, verify:all green.
- 2026-10-26 · Gate passed · P13 · dry run of the real roster, metadata and OG goldens, verify:all green.
- 2026-10-26 · Session continued (after compaction) · P13 · re-read CLAUDE.md, STATUS, decisions, plan P13, showcase, crawler, token-clustering, handoff · tree clean at 7bbb9fa · full real-roster dry run finished, two fixes (D-072).
- 2026-10-26 · Gate passed · P12 · flag-off test, flag-on captures and axe, goldens held, verify:all green.
- 2026-10-26 · Session started · P12 · read CLAUDE.md, handoff, STATUS, decisions, plan, v2-seams, v2-plan, components, pages, copy, quality-bar, architecture · tree reconciled: P12 steps 1 to 5 uncommitted; `.gitignore`'s `qa/` also matched `tests/qa/`, so the QA suite was never committed (now `/qa/`); the nine in-progress goldens changed with `qaNow` show the StatStrip at 0, not a clock-only change (investigating); `pnpm check` green.

- 2026-10-26 · Gate passed · P11 · every page at three viewports, axe, Lighthouse, goldens, verify:all green.
- 2026-10-26 · Session started (after compaction) · P11 · read CLAUDE.md, STATUS, decisions, plan, handoff, pages, components, copy, motion, quality-bar, exports-and-mcp · tree reconciled (goldens, D-058, recent-row container layout uncommitted; QA registry typecheck fixed).
- 2026-10-26 · Gate passed · P10 · queue, worker, API, seed, verify:all green.
- 2026-10-26 · Session started (after compaction) · P10 · read CLAUDE.md, STATUS, decisions, plan P10, caps-and-budget, architecture, pages, v2-seams, showcase, data-model, evals seed section, Next 16 route handler docs · tree clean at 48d3dbe.
- 2026-10-26 · Gate passed · P9 · exports, MCP and CLI tested end to end, verify:all green.
- 2026-10-26 · Gate passed · P8 · full evals green on all fixtures, verify:all green.
- 2026-10-26 · Gate passed · P7 · planted checks 100% on all fixtures, verify:all green.
- 2026-10-26 · Gate passed · P6 · live rates above floors, security suite green, verify:all green.
- 2026-10-25 · Gate passed · P5 · components at or above floors on all five fixtures, fallback valid, verify:all green.
- 2026-10-25 · Gate passed · P4 · tokens 1.000 / 1.000 on all fixtures, fallback names valid, verify:all green.
- 2026-10-25 · Gate passed · P3 · selection exact, capture and blocked-state tests, expected.json complete, verify:all green.
- 2026-10-25 · P3 · expected.json authored for all five fixtures (fixtures adjusted per D-046), decisions D-040 to D-050 logged and documents fixed, new unit tests (candidates, color, collect, expected files), verify:all started.
- 2026-10-25 · Session started (after compaction) · P3 · read CLAUDE.md, STATUS, decisions, plan, handoff, evals, crawler, page-selection, capture-and-states, caps-and-budget, model-calls · tree reconciled (P3 work since 0377500 uncommitted: tests, color parse, token collect, fixture fixes).
- 2026-10-25 · Gate passed · P2 · tokens, contrast, catalog, axe, reduced motion, goldens, verify:all green.
- 2026-10-25 · Gate passed · P1 · tests, migrations, storage round trip, verify:all green.
- 2026-10-25 · Gate passed · P0 · doctor, check and verify:all green.
- 2026-10-25 · Session started · P0 · read CLAUDE.md, 00-start-here, STATUS, handoff, decisions, quality-bar, glossary, brief, plan, evals, deploy-runbook, v2-plan, every design and spec document, reference READMEs · tree clean (new repository).
