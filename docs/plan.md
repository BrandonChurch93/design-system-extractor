# Plan

Eighteen phases, P0 to P17, in order. P16 is v1.1; P17 is v1.2. Each phase lists what it builds, which documents it follows, and its gate: the exit criteria that must all pass before the next phase starts. There are no time estimates anywhere in this plan; a phase takes as long as its gate takes.

Every gate also includes, without repeating it below: the handoff consistency sweep (`docs/handoff.md`), `pnpm check` green, `pnpm qa:copy` green, `pnpm verify:all` green as far as it is wired at that phase (see `docs/specs/architecture.md`: until P8 the evals step runs `--through` the last completed stage), a local commit with a message naming the phase, and the STATUS update. From P2 on, every gate includes `pnpm qa:design` with a screenshot self-review of every page or catalog section the phase touched at 1440, 820 and 390, against `docs/design/*` and `docs/quality-bar.md`. From P6 on, every gate includes `pnpm test:security`.

When a phase reveals that an earlier phase's output does not meet a spec, fix the earlier output as part of the current phase and note it in STATUS. Do not carry known defects forward.

## P0 · Preflight

Follows: `CLAUDE.md`, `docs/00-start-here.md`, `docs/handoff.md`, `docs/specs/architecture.md`, `docs/specs/model-calls.md`.

Build:
- Read every governance document and skim every other document.
- Confirm `ANTHROPIC_API_KEY` is present in `.env.local` (the owner places it before starting). If it is absent, write `BLOCKER:` in STATUS naming it and stop; nothing else in P0 is worth doing without it.
- Verify the toolchain: Node 22 or newer, pnpm, Docker Desktop running (`docker info`; if not running, `open -a Docker` and wait up to 2 minutes, retry three times), Playwright's Chromium installed for the workspace.
- Verify the model ids and prices on docs.claude.com; write them into `packages/pipeline/src/models/config.ts` (created here as a stub) and log D-026 (the build's first decision) with the ids, prices and date.
- `git init`, first commit of the kit as delivered.
- Scaffold the monorepo per `architecture.md`: pnpm workspace, `apps/web` (Next.js, TypeScript strict, CSS Modules, ESLint, `next/font`), `apps/worker`, `packages/schema`, `packages/pipeline`, `packages/mcp`, `packages/cli`, `fixtures/`, `scripts/`, every root script in the architecture table (empty where its subject does not exist yet, but present and passing), Vitest config, Playwright config, `docker-compose.yml` (Postgres 16 with an init script that creates the `dse` and `dse_test` databases, Redis 7, MinIO with an init container that creates the `dse` and `dse-test` buckets), `.env.local` kept as the owner left it (create it from `.env.example` only if it is missing) with `DSE_JOB_ENCRYPTION_KEY` and `DSE_ADMIN_TOKEN` generated with the commands in `.env.example` wherever they are empty; every other value in `.env.example` is already right for local development, `pnpm run doctor`, `apps/web/vercel.json`, `apps/worker/Dockerfile` (a stub that builds).
- `.claude/settings.json` is already present; keep it.
- A `CHANGELOG.md` started with `Unreleased`.

Gate:
- `pnpm run doctor` reports every local service connected.
- `pnpm check` green on the scaffold; `pnpm verify:all` runs end to end with empty suites passing.
- STATUS set up: phase pointer, next action, the P1 checklist copied in.

## P1 · Schema and data model

Follows: `docs/specs/data-model.md`, `docs/glossary.md`, `docs/design/copy.md` (Enum labels).

Build:
- `packages/schema`: every enum in `data-model.md` with its Zod enum, the run document (partial and complete), tokens, components, checks, drift, cost, stats, API contracts (`POST /api/runs` body and responses, blocked result, `GET /api/me`), export shapes, entitlements types and the `plans` map (free real, pro and team placeholders from `docs/v2-plan.md`), `labels.ts` for every enum value in the words of `docs/design/copy.md`.
- Drizzle schema and migrations for `runs`, `run_pages`, `run_events`, `visitors`, `users`, `subscriptions`; `pnpm db:migrate`, `pnpm db:reset`; the postgres-js client with `prepare: false` when the URL is the pooler form.
- The storage adapter interface and S3 driver against MinIO (the right content type on every upload, from the key's extension; S3 objects cannot carry `X-Content-Type-Options`, so nothing relies on it, D-035); key helpers for every storage path.
- `getRunForViewer`, `applyPatch` (JSONB merge), `appendEvent`.

Gate:
- Schema tests: a complete fixture document validates; partial documents validate at each stage; invalid enums fail; every enum named in `data-model.md` exists with a label for every value.
- Migrations apply on a clean database and `pnpm db:reset` returns it to empty and re-applies them; storage round trip for text and binary with the right content type.
- Every type in `data-model.md` exists in `packages/schema` with the same name.

## P2 · Design system in code and the catalog

Follows: `docs/design/design-system.md`, `docs/design/motion.md`, `docs/design/components.md` (Primitives), `docs/quality-bar.md`.

Build:
- `apps/web/styles/tokens.css` with every token as `--dse-*`; fonts through `next/font/google` (self-hosted from committed files since D-112); global reset; the breakpoint media queries.
- Motion utilities: Motion variants for the six moves and their reverses, GSAP helpers for draw, extend, count, wipe; a `useReducedMotion` gate; the stagger helper with the cap.
- Primitives: TopNav, Footer, SectionNav, Button, Chip and ChipGroup, Tag, Pill, Card, Input, Tabs, Popover, Sheet, Toast, Skeleton, Meter, CodeBlock, LiveLog, EmptyState, StateCard, Swatch (all sizes), PaletteStrip.
- `/catalog` rendering each primitive in every state at desktop and 390 frames with sample data and its token list; `noindex`.
- `pnpm qa:design` (Playwright capturing `/catalog` and, later, every page at three viewports into `qa/`), `pnpm qa:visual` with goldens, `pnpm qa:axe`.

Gate:
- Every token in `design-system.md` exists in `tokens.css` with the exact value; a test reads both and diffs.
- Contrast test as defined in `design-system.md`: every listed pair meets its WCAG threshold and the printed ratio is within 0.05 of the computed one.
- Catalog screenshots reviewed against the design docs; the catalog passes axe with zero violations; focus rings visible on every interactive primitive in the screenshots (a focused-state capture is part of `qa:design`).
- Reduced motion: a Playwright test with `reducedMotion: 'reduce'` asserts no transform animations run.
- Visual goldens committed for the catalog.

## P3 · Crawler, selection and capture

Follows: `docs/specs/crawler.md`, `docs/specs/page-selection.md`, `docs/specs/capture-and-states.md`, `docs/specs/caps-and-budget.md` (the private-address rules only), `docs/specs/model-calls.md`, `docs/evals.md`.

Build:
- The six fixture sites in `fixtures/sites/` (five eval fixtures with `expected.json` each, plus `messy-after`), served by `pnpm fixtures:serve`. Build them to the fixture specs in `docs/evals.md`, including the clean fixture's no-drift constraints and the messy fixture's planted items; they are part of the product's proof and deserve care. `pnpm fixtures:build` compiles the Tailwind fixture once; the output is committed.
- `packages/pipeline/src/net/private-ranges.ts`: the shared private-address resolver and validator used by the crawler now and by the API in P10.
- `discover` with robots, sitemaps, nav, exclusions, normalization, redirect policy, template fingerprinting, framework hint, dark theme detection, blocked-state classification.
- `packages/pipeline/src/models/`: the model client wrapper with structured output, cost accounting, prompt caching, the `live`, `record` and `replay` modes with request hashing, and the file half of `BudgetMeter` (dev cap and reserve) per `docs/specs/model-calls.md`.
- `select` with the two scoring passes, the Haiku pass (recorded against the fixtures, then replayed), fallback.
- The evals harness (`pnpm evals` with `--through`, the metrics, `fixtures/results.json`) per `docs/evals.md`, scoring selection exactness at this phase.
- The catalog's dev spend readout wired to the meter file.
- `capture` with the browser setup, the probe load, the main load, scroll pass, freeze, screenshots, snapshot, element candidates, matched CSS through CDP, the Tab walk, every state, caps, events.
- The `RunContext` interface with `MemoryRunContext` complete and `DbRunContext` as an interface only (its database and storage writes land in P10), and the `run.ts` composition with timing, timeout, error classification; `pnpm pipeline:run <url>`.

Gate:
- Selection matches `expected.json` exactly on all five eval fixtures.
- Capture produces the expected element-candidate counts and the expected states on the clean and messy fixtures (primary button hover, focus, active; disabled instance found; the dropdown `open` state; the mobile menu).
- Blocked-state tests pass with recorded bodies for bot, login, robots, unreachable, and the private-address validator passes its IPv4, IPv6 and rebinding tables.
- The no-form-submission marker test and the dialog auto-dismiss test pass.
- Politeness interval test passes.
- `pnpm evals --through capture` passes selection exactness.
- The model-call tests in `model-calls.md` pass for the select purpose: replay, malformed and timeout fallbacks, cost arithmetic, request hash stability, and the dev cap refusing the next live call.

## P4 · Token clustering

Follows: `docs/specs/token-clustering.md`, `docs/specs/model-calls.md`.

Build: colors (collect, OKLCH, cluster, classify, name with fallback, provenance, contrast pairs), type with roles, spacing with base inference, radius, shadow, breakpoints, raw counts, families with loaded flags, events. Record the Haiku naming call for the fixtures.

Gate:
- Token precision and recall meet `docs/evals.md` thresholds on all five fixtures (`pnpm evals --through tokens`).
- Unit tests for clustering, classification, naming uniqueness, base grid inference.
- Deterministic naming fallback produces valid unique names on every fixture when the model is disabled.

## P5 · Component detection

Follows: `docs/specs/component-detection.md`, `docs/specs/model-calls.md`.

Build: element candidates, fingerprints, exact groups, style merge, variant split with deterministic naming, rule classification, the Haiku pass (recorded), the collision call (recorded), cross-page merge, noise removal, instances and provenance with source crops, states attachment, tokens used, responsive variants, caps and ordering, events.

Gate:
- Component precision and recall meet thresholds on all five fixtures; variant accuracy and state capture rate meet their thresholds (`pnpm evals --through components`).
- Variant naming test (3 × 2 button set yields the six names in the spec) passes; cross-page nav merge test passes.
- Every component in a fixture run has complete provenance (a test asserts `firstSeen`, `pages`, selector and bbox non-empty).
- Fallback path produces valid names and types with the model disabled.

## P6 · Preview fidelity and sanitization

Follows: `docs/specs/preview-fidelity.md`.

Build: preview builder (markup, CSS scoping, custom property resolution, fonts), the sanitizer with the whitelist and the second pass, upload-then-render check with pixelmatch against the storage URL, the live-or-captured decision with reasons, per-state preview files, the sandboxed `src` iframe component for the app, the app CSP header builder, `pnpm test:security`.

Gate:
- Live rates meet thresholds on the clean and css-in-js fixtures (`pnpm evals --through previews`).
- The security suite passes every case and asserts zero outbound requests outside the allowlist and zero script execution in the sandbox.
- The messy fixture's unfaithful component is `captured` with the `diff` reason; the oversized-CSS unit test yields `css-too-large`.

## P7 · Checks

Follows: `docs/specs/checks.md`.

Build: the five checks, applicability, detail strings exactly as specified, per-run summary and by-check lists, events.

Gate:
- Planted check accuracy is 100% on every fixture (`pnpm evals --through checks`).
- Contrast math tests against the design system's own pairs and the WCAG samples.
- Focus, tap target, label and reduced-motion unit tables pass.
- A test asserts every rendered check detail matches a template in `checks.md`.

## P8 · Drift

Follows: `docs/specs/drift.md`, `docs/specs/model-calls.md`.

Build: findings, the proposed set with the contrast constraint, numbers, headline and captions from templates, evidence, the Sonnet narrative-and-intro call with the validator and the template fallbacks (recorded), events. From here `verify:all` runs the full `pnpm evals`.

Gate:
- The messy fixture's planted findings are all found; the clean fixture yields zero findings.
- The proposal's `contrastKept` is true on every fixture and a crafted set forces the N increase path.
- Narrative validator tests pass; the fallback texts contain no em dash and no forbidden word.
- Full `pnpm evals` passes every threshold except live-rate and selection, which already passed.

## P9 · Exports, MCP and CLI

Follows: `docs/specs/exports-and-mcp.md`.

Build: every export generator in `packages/pipeline/src/exports/` (browser-safe), design-system.md assembly with the stored intro and narrative, the static prompt, the zip, `packages/mcp` with every tool and resource, `packages/cli` with `extract`, `export`, `serve` and the `--cdp` path. The `/open` page is built in P11 on top of the run page components.

Gate:
- Golden tests for every format; `tokens.w3c.json` validates against the vendored schema.
- MCP scripted client exercises every tool and resource over stdio against a local run through `--file` (the `--run` path needs the API, which P10 builds; P10's gate exercises it).
- CLI end-to-end on the clean fixture including `--cdp` and `dse serve`.
- `pnpm build` of `packages/mcp` and `packages/cli` produces publishable packages (`npm pack` dry run); publishing is the owner's.

## P10 · Worker, queue, caps, API and seed

Follows: `docs/specs/caps-and-budget.md`, `docs/specs/architecture.md`, `docs/design/pages.md` (API routes), `docs/specs/v2-seams.md` (entitlements, viewer, priority), `docs/specs/showcase.md` (the local seed).

Build: BullMQ queue and the worker consumer with the Redis settings and concurrency 1, heartbeat, browser lifecycle and restart policy, the run lifecycle (queued, running, complete, blocked, failed, cancelled) with refunds, the retention cron, `resolveViewer`, `check`, the `plans` map wiring, visitor cookie, Redis counters, the pre-check in order, rate limiting, SSRF guards reusing `private-ranges.ts` with redirect and rebinding re-checks and the `DSE_ALLOW_PRIVATE_HOSTS` allowance, BYO key encryption and handling, the Redis half of `BudgetMeter`, every API route in `pages.md` including `/api/me`, `queuePosition`, health, cancel and capture images, admin routes with the token, the showcase content read path (storage object with the committed file as fallback, `revalidate: 3600`), `pnpm db:seed:fixtures` writing six fixture runs with fixed ids and dates, the three frozen in-progress documents, and the local showcase content.

Gate:
- Integration tests: a full run lifecycle on a fixture through the queue; budget block before enqueue; busy block; BYO bypass of budget and visitor cap but not busy; visitor cap and refund on blocked; cancel; worker crash retry once then fail; rate limit 429; a login-wall run ends `blocked: login` with a one-page document.
- Security unit tables (URL, private ranges, rebinding, key never logged) pass.
- `GET /api/runs/{id}` serves partial documents during a run (a test polls mid-run and sees `tokens` before `components`), with the specified cache headers in each status and `queuePosition` while queued; the MCP `--run` path works against it.
- `pnpm db:seed:fixtures` produces six complete runs and a six-entry local showcase content file.
- `pnpm run doctor` still green.

## P11 · The web app

Follows: `docs/design/pages.md`, `docs/design/components.md`, `docs/design/copy.md`, `docs/design/motion.md`, `docs/quality-bar.md`, `docs/specs/exports-and-mcp.md` (/open).

Build, page by page, each against its section in `pages.md` and with its copy from `apps/web/copy/strings.ts` transcribed verbatim from `copy.md`: Home (headline block, UrlForm, includes, KeyPopover, Showcase from the local content, CategoryFilter), Run (both faces, every region component, the stage-to-rail mapping, StageRail, LiveLog, polling with diff-driven animation, SectionNav sticky, PageListPopover, TokenPopover, SharePopover, ComponentFilter, ComponentGrid, every state of the page including login wall, failed, cancelled, sparse), ComponentPanel as the `@panel` slot reading `searchParams.c`, ComponentPage, Compare (both modes, the picker, the phone notice), Recent (localStorage, `/api/me`), every state route including busy with both detail sources, /open with its fixed CSP allowance, How it works in full (pipeline, cost, checks, EvalTable reading `fixtures/results.json`, CLI and MCP sections), About, Privacy, Terms, the 404, page metadata, the OG image route and the home OG image, sitemap and robots for the app, the CSP middleware with nonces, and a catalog entry for every page-level component built here.

Also: `pnpm qa:design` extended to every page and state (using the seeded fixture runs), `pnpm qa:lighthouse`, visual goldens for every page at three viewports, the copy audit test.

Gate:
- Every page and state in `pages.md` exists and is screenshotted at 1440, 820, 390; the self-review checklist in `quality-bar.md` is applied to each and the result noted in STATUS (what was fixed).
- No horizontal scroll at 390 on any page (a Playwright assertion).
- axe: zero violations on every page and state.
- Lighthouse thresholds on Home and a complete Run page.
- Motion: a recorded video of the in-progress page filling on a fixture run is reviewed; reduced-motion test passes on the run page.
- Copy audit: every string in `strings.ts` appears verbatim in `copy.md`; `pnpm qa:copy` passes.
- The `/open` Playwright test passes.
- Visual goldens committed.
- Polling: a run page open during a fixture run shows each stage landing with no full re-render (a DOM mutation count bound per poll).

## P12 · V2 seams and flagged surfaces

Follows: `docs/specs/v2-seams.md`, `docs/design/components.md` (Flagged v2 surfaces), `docs/v2-plan.md`.

Build: the auth and billing adapters with mocks, PricingSection, PlanBadge, AccountMenu, SignInSheet, BillingPage, UpgradePrompt, their placement behind the flag with `data-testid="v2-surface"`, their catalog entries, the flag-off test, the `next.config` derivation of the public flag.

Gate:
- With the flag off: the flag-off test passes and `pnpm qa:visual` passes against the P11 goldens with every page golden unchanged; the `/catalog` golden is updated once for the new surfaces and the update is logged in STATUS.
- With the flag on: the surfaces render per spec, screenshotted and reviewed; axe zero violations.
- No auth or payment dependency in any `package.json` (a test asserts).

## P13 · Showcase, SEO and content

Follows: `docs/specs/showcase.md`, `docs/design/pages.md` (meta, OG), `docs/design/copy.md`.

Build: the roster and alternates, the showcase script (local and `--remote` paths, `--refresh-links`) on top of P10's admin routes and content read path, the dry run of the real roster locally within the dev spend cap minus the reserve (skip blocked sites, stop when the meter says so, note sparse results), and a review of every page's metadata and OG image against `copy.md`.

Gate:
- The local six-entry showcase renders the home page with no orphan rows at 3 and 2 columns.
- The real-roster dry run's table is pasted into STATUS with per-site status, stats and cost; any site that blocked or produced a sparse run is noted with its alternate.
- OG image goldens committed; every page has the title and description from `copy.md` (a test reads the metadata of every route).

## P14 · Hardening

Follows: `docs/specs/caps-and-budget.md`, `docs/specs/architecture.md`, every spec's caps.

Build: error handling audit (every `catch` either classifies or rethrows), timeouts on every network call, memory checks under a 10-run soak against fixtures (RSS stays under the restart threshold, no leaked contexts), log review (no keys, no HTML bodies in logs), `pnpm audit` clean of high severity, dependency pinning, the worker Dockerfile finished (multi-stage, Playwright base image, non-root, root context), `pnpm run doctor --production` with a committed sample production env file at `fixtures/env/production.sample` (every variable present with placeholder values of the right shape, `DSE_ALLOW_PRIVATE_HOSTS` present and empty, `BILLING_ENABLED=false`) that the build validates against.

Gate:
- Soak test passes; chaos tests (kill the worker mid-run, Redis unavailable at enqueue, storage unavailable mid-capture) end in the specified statuses with refunds.
- `docker build -f apps/worker/Dockerfile .` from the repository root succeeds and the image runs a fixture extraction end to end against the Docker services.
- `pnpm --filter web build` succeeds.
- `pnpm audit --audit-level high` has no findings, or every finding is a transitive advisory with no fix available, listed in STATUS with the advisory id and date.

## P15 · Final consistency, README, runbook, Definition of Done

Follows: everything.

Build:
- A final consistency sweep: for every requirement in every spec and design document, a pointer to code and test, recorded in `docs/traceability.md` (generated by you: a table of document section → files → tests). Anything unsatisfied is fixed now.
- One final live eval (`env DSE_MODEL_MODE=live pnpm evals`, within the reserve) and the results committed to `fixtures/results.json`, which the How it works page reads. If the reserve is gone, the replay results are committed and STATUS says so.
- The README: what it is, a screenshot, how it works in five lines, local setup, the CLI and MCP, the eval results, the license.
- `docs/deploy-runbook.md` verified against the actual env names, scripts and build commands; corrected where the build changed anything.
- STATUS: Known limitations complete and honest; the owner's end list complete; the session log closed with `Build complete`.
- `CHANGELOG.md` with `1.0.0`.

Gate: the Definition of Done.

## P16 · Fidelity: motion, site variables, naming, export integrity

Follows: `docs/specs/motion-capture.md`, and every spec and design document v1.1 amended: `data-model.md`, `capture-and-states.md`, `token-clustering.md`, `component-detection.md`, `preview-fidelity.md`, `exports-and-mcp.md`, `drift.md`, `model-calls.md`, `docs/evals.md`, `docs/design/pages.md`, `components.md`, `copy.md`, `motion.md`, `docs/glossary.md`, decisions D-081 to D-089.

Build:
- Merge `docs/v1-1-addendum.md` into the named documents and sections, log its decisions in `docs/decisions.md` (D-081 to D-088, the addendum's D-027 to D-034, whose ids were taken; the merge rulings are D-089), delete the addendum, and commit (`P16 · docs merged`). From here the specs are the only source.
- Schema: every new enum, type and field; labels; migration for the new JSONB fields (no new tables).
- Fixtures: the clean and messy fixture additions in `docs/evals.md`, and `expected.json` for every fixture updated to the new type roles, tiers and names (every fixture's existing expectations are re-derived under the new naming rules and checked by hand against the fixture source, since type names change for all of them).
- Capture: the motion init script, the motion pass, the new state-diff property set and rules, the transition-aware hover wait.
- Tokens: site variables, site-name precedence for every kind, overlays, the new type roles and word suffixes, breakpoint twins, `tokens:motion` (durations, easings with the table, keyframes).
- Components: tier, slug, variant third words, context fallback names, the no-numeric-name pass, motion attachment, raw-set token references with export-time mapping.
- Previews: reset filtering.
- Drift: motion sprawl and the proposed motion set.
- Exports: every format change, `motion.css`, `motion.json`, the Default line, core-first ordering, the site variables block, the variable-resolution assertion; MCP `get_motion`; CLI format.
- Web: the Motion section and its primitives, the rail ring, overlays strip, site-name Pill and provenance, tier headings and filter, panel Motion block, Compare rows, /open; catalog entries; copy strings; goldens updated once and logged.
- Recordings: the naming call re-recorded for the fixtures (site-named tokens now arrive as fixed).
- `docs/traceability.md` regenerated; README's feature list and screenshot updated; CHANGELOG `1.1.0`.

Gate:
- `pnpm evals` passes every threshold in `docs/evals.md` including all the new rows.
- The export variable-resolution test passes on every fixture and on the three frozen partial documents.
- No component or variant name ending in a digit in any fixture run; no type token named `other`; every component has `tier` and `slug`.
- `motion.css` and `motion.json` goldens committed; `tokens.w3c.json` validates.
- The Motion section is screenshotted at 1440, 820 and 390 on a fixture run and reviewed; Replay works and respects reduced motion (Playwright test with `reducedMotion: 'reduce'` asserts the dot does not move and the caption appears).
- Panel Motion block, Compare rows and /open reviewed the same way.
- A fresh local run against one real site the owner names in `docs/specs/showcase.md` (the first roster entry that is not his own: stripe.com) produces a prompt export with a Motion section, at least one observed pattern, zero `var(--` references to undeclared names, and no numeric names; the prompt is pasted into STATUS under a heading `P16 real-site check` for the owner to read.
- `pnpm verify:all` green; goldens updated once and logged; Definition of Done re-run in full.

## P17 · The second testing round: showcase promotion, document upgrades, easings, touchable previews, check visibility

Follows: `docs/specs/showcase.md` (Promoting a run), `docs/specs/data-model.md` (Upgrading stored documents, Stats, Instance, Preview, EasingToken), `docs/specs/preview-fidelity.md` (Order of render checks, Fonts substituted, Preview ground, Sizing, State files, Why previews fall back, measured), `docs/specs/capture-and-states.md` (Ground), `docs/specs/checks.md` (Per-component result), `docs/specs/exports-and-mcp.md`, `docs/evals.md`, `docs/design/pages.md`, `docs/design/components.md`, `docs/design/motion.md` (Ambient loops), `docs/design/copy.md`, `docs/deploy-runbook.md` (step 11), decisions D-091 to D-097.

Build:

- Merge `docs/v1-2-addendum.md` into the named documents, log its six decisions (D-091 to D-096) and the merge rulings (D-097) in `docs/decisions.md`, delete the addendum, commit (`P17 · docs merged`).
- Showcase: `--add`, `--remove`, `--list`, the promotion rules, the runbook line, the caption variant.
- Documents: `upgradeRunDocument` by `pipelineVersion`, the v1.0 fixture document from `0ff300f`, every read path upgrading; the confirmed root cause verified on the owner's two local runs first (a schema parse), recorded, fixed, regression tests.
- Motion UI: EasingStage, the shared clock, the usage lines (`usedBy`), DurationStrip ticks, PatternRow auto-preview, the ambient-loop rules in `motion.md`, reduced motion, the long-task test; the catalog updated.
- Previews: the measured investigation on three real sites at the showcase timeout with per-reason fixes, render checks core first by usage, the thresholds, `ground` capture and painting, the halo band on `messy-after`, the per-state preview files animating on load, the StateBar with pins and Play, the Ground toggle, the scale caption, the catalog, the security suite extended to the state files (still no scripts, still zero outbound requests).
- Checks: the derived pass-all state, `componentsPassing`, the sixth stat cell, the filter, the CheckBadge restyle, the Checks section opening line, the export and MCP additions.
- Copy, goldens (updated once and logged), traceability regenerated, README updated, CHANGELOG `1.2.0`.

Gate:

- `pnpm showcase --add` on a local run puts it first on the home page; `--remove` takes it down; a sparse run is refused with the stated message.
- Compare renders the owner's two local runs (`tx4mehptdf`, a v1.0 document, and `mhxvphzzfr`, v1.1) with every row, and `/r/tx4mehptdf` renders; the v1.0 fixture document test passes; `upgradeRunDocument` is idempotent (upgrading twice equals upgrading once).
- The Motion section loops in sync, pauses off screen, passes the long-task test, and shows the static fallback under reduced motion (Playwright asserts the dot does not move); screenshots at 1440, 820 and 390 reviewed.
- Live rate meets the new thresholds on the three fixtures and the three real sites; the per-reason table is in STATUS; the linear.app run re-run under the visitor timeout has a checked preview (live, or captured with a reason other than `not-checked`) for every core component; the dark-band button on `messy-after` renders with no halo at 2× zoom in the screenshot review; pinning `Hover` in a live preview loads the hover file and its root reaches the recorded values after the recorded duration (Playwright reads the computed style inside the frame before and after); `pnpm test:security` passes on the state files.
- The stat strip shows six cells at every viewport with no orphan; the `Passing all checks` filter and the restyled CheckBadge render per spec; `pnpm qa:copy` passes with the new strings.
- Real-site check: the owner's own site, run fresh, is pasted into STATUS under `P17 real-site check` with the live-rate table, the components-passing ratio and the Compare link against its previous run.
- `pnpm verify:all` green; Definition of Done re-run in full.

## P18 · The third testing round: the Motion section, token cards, previews that answer

Follows: `docs/design/components.md` (PreviewFrame, Chip, RadiusSample, ShadowSample, ComponentCard, DurationStrip, EasingGrid, EasingCard, EasingStage, KeyframesList, PatternRow, ReplayButton, ComponentPanel, RegionSkeleton), `docs/design/motion.md` (Ambient loops, Performance rules), `docs/design/pages.md` (Run, Tokens and Components), `docs/design/copy.md`, `docs/design/design-system.md` (Spacing), `docs/specs/preview-fidelity.md` (Sizing, Preview ground, Contrast fallback, State rules in the default preview, Security tests, Tests), `docs/specs/capture-and-states.md` (DOM snapshot, Element candidates, States, Ground, What is written), `docs/specs/component-detection.md` (Element candidates, The model pass), `docs/specs/motion-capture.md` (Attachment to components), `docs/specs/data-model.md` (Upgrading stored documents, Instance, Preview, Stats), `docs/evals.md` (clean, Metrics), decisions D-101 to D-111.

Build:

- Merge `docs/v1-3-addendum.md` into the named documents, log its nine decisions (D-101 to D-109) and the merge rulings (D-110) in `docs/decisions.md`, delete the addendum, commit (`P18 · docs merged`). The motion components live in `apps/web/components/run/`, not `apps/web/components/run/motion/` (D-093 Affects, STATUS; D-110).
- Schema and upgrade: `Preview.fill`, `Preview.cropKey` optional, `Instance.hiddenAtCapture`, the two `CapturedReason` values, `pipelineVersion` 1.3.0, the 1.3 upgrade step (fill null, dangling pattern ids removed, the unwritten-key preview to `no-crop`), tests on the v1.0 and v1.1 fixture documents.
- Pipeline: the synthetic page's naming context and the re-recorded recordings; pattern attribution by the pattern's own element; hidden-at-capture candidates, `clip` and `clip-path` in the snapshot, the focus crop as the preview, the drop rule; the `no-crop` form; the fill read; state rules in the default preview document and the security suite over them; the clean fixture's skip link with its expectation.
- Web, Motion: the EasingStage at card width and 160 px, dots 8 and 10, the stage pinned to the bottom, the empty usage line; the DurationStrip's log axis, label budget, popover ticks and the Long list measured once; the ReplayButton's fixed width; the KeyframesList's six and toggle; the PatternRow's centered column, 56 px chips at rest on the scaled start state, the play's return to rest; the catalog states (`Wide range`, `Dense`, `Dark on dark`, the long keyframes list); the skeleton heights re-measured.
- Web, tokens: the Radius and Shadow row, 72 px swatches, the blur-derived gap and padding, values under the swatches, the dead class removed, skeletons re-measured.
- Web, previews: the pointer reaching the frame, the overlay on the body with the touch rule, the 0.6× floor with clip and fade, the clipped caption, the drawer at 1:1 with horizontal scroll, the contrast fallback and the Ground toggle on the card, the code-only card for `no-crop`, the two captions.
- Copy (`strings.ts` from copy.md), `pnpm qa:copy`; goldens updated once and logged; traceability regenerated; README; CHANGELOG `1.3.0`.

The `duration-strip` catalog demo gains `Wide range` (the owner's site: 150, 200, 300, 350, 400, 500, 700, 900, 1000, 1200, 4000, 14000, 35000 ms, with 150 base, 200 slow, 300 slower, 150 most used) and `Dense` (linear.app's 26: 100, 120, 150, 160, 200, 250, 260, 300, 320, 350, 400, 450, 500, 700, 800, 960, 1000, 1200, 1250, 1300, 1500, 2000, 2200, 6000, 10000, 30000 ms, with 100 base, 120 slow, 150 slower); the `component-card` demo gains `Dark on dark` from the owner's site values (`#1A1A1A` on `#141414`).

Gate:

- Screenshots at 1440, 820 and 390 of the Motion section (the clean fixture, the `Wide range` and `Dense` strips, a 12-easing grid), the Tokens section with Radius and Shadow, a component card hovered, a clipped wide component, a `Dark on dark` card, a hidden-until-focus card and a `no-crop` card, reviewed against `docs/design/*` and `docs/quality-bar.md`; every easing stage in a row at the same height; no value label dropped on the `Wide range` strip at 1440; the `Dense` strip under 300 px tall at 390.
- Playwright: the ReplayButton's width is identical before, during and after a play; the pattern chip's computed style at rest equals the scaled start state and returns to it after the play; hovering a card frame changes the root's computed style inside the frame; a tap on the preview under touch emulation opens the drawer and a click on the name row does too; the card Ground toggle repaints and does not open the drawer; the drawer stage scrolls horizontally on a component wider than it; the long-task test still passes with 12 easings at card width.
- Unit: the scale function (floor, anchors, clipped edges); the contrast fallback; the shadow gap from the stored value; the log axis positions and the label budget; the synthetic page context; the hidden-at-capture rule on the snapshot; every reference in every fixture run, seed and versioned fixture document resolves.
- Security: `pnpm test:security` passes over the default preview documents with state rules; a click on a link inside a card frame leaves the frame's URL unchanged.
- Evals in replay at thresholds with the clean fixture's skip link; the live-rate floor unchanged on the three fixtures.
- Real-site check: the owner's portfolio and modernsoftworks.com run fresh through the queue; pasted into STATUS under `P18 real-site check`: the skip link's preview mode and reason, the count of cards on the contrast fallback, the Button names on the 404 page, the durations strip's dropped-label count and whether the Long list was adopted, and three screenshots named in the log.
- `pnpm qa:copy`, axe at zero violations on the run page with the new controls, `pnpm verify:all` green; the Definition of Done re-run in full.

## Definition of Done

All true at once, on a clean checkout, with Docker services running and `DSE_MODEL_MODE=replay`:

1. `pnpm verify:all` is green: check, test, e2e, full evals at thresholds including the motion, naming and export-integrity rows, build, visual goldens, axe, Lighthouse, copy, audit.
2. Every phase gate above is recorded as passed in STATUS with its date.
3. `docs/traceability.md` maps every section of every spec and design document to code and tests with no gaps.
4. `docs/decisions.md` records every deviation, and `STATUS.md` Known limitations lists each with its decision id.
5. `docker build` of the worker from the repository root and `pnpm --filter web build` both succeed.
6. The flag-off test passes.
7. `pnpm qa:copy` passes.
8. `pnpm run doctor --production --env fixtures/env/production.sample` passes.
9. The working tree is clean and committed; it is pushed only when the owner asks (D-115).
10. STATUS says `Build complete` and the owner's end list is exactly what remains.
11. The prompt export of every fixture run contains a Motion section, a Site variables block, a Default line per component, core components before page components, and no `var(--` reference to an undeclared name.
12. Every read path upgrades stored run documents to the current shape by their `pipelineVersion`, and Compare renders any two complete runs of any version.
13. A live component's card frame answers the pointer with the site's own hover and active styles, and no card preview renders below 0.6×.
