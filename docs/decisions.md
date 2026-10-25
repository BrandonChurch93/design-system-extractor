# Decisions

Append only. Each entry has an id, the date, the context, the decision, the reasoning, and the documents it affects. A later entry may supersede an earlier one by naming it. Never edit an earlier entry.

This document outranks every other document in the kit. When any two documents disagree, the most recent decision that addresses the question wins; if none does, write one.

## D-001 · Product name and identifiers

Date: 2026-10-25 · Context: planning, with the owner.
Decision: the product is named "Design System Extractor". Repository `design-system-extractor`. npm organization `design-system-extractor`, packages `@design-system-extractor/mcp` and `@design-system-extractor/cli`. CLI binary `dse`. Code identifiers may abbreviate to `dse`. The web app is not published to npm.
Reasoning: the owner wants a portfolio reader to know what it does from the title. Descriptive, like his previous project.
Affects: all documents.

## D-002 · Visual direction

Date: 2026-10-25 · Context: three-direction derby, owner picked A.
Decision: Direction A, "Studio": warm paper ground, warm ink, Plus Jakarta Sans and JetBrains Mono, 18 px card radius, warm low shadows, pill chips. `reference/direction-a.html` is the approved reference; `docs/design/design-system.md` is the spec.
Reasoning: owner's pick.
Affects: `docs/design/*`.

## D-003 · Monochrome chrome

Date: 2026-10-25 · Context: planning.
Decision: the app's interface uses no chroma. The extracted palette is the only color on any page. Pass and fail use icon shape and words.
Reasoning: the extracted palette must read as the subject, and extracted colors must read true, which a colored chrome would distort.
Affects: `docs/design/design-system.md`, `docs/design/components.md`, `docs/quality-bar.md`.

## D-004 · Light theme only

Date: 2026-10-25 · Context: planning.
Decision: v1 ships light only. No dark theme, no toggle. A dark theme is not planned for v2 either.
Reasoning: extracted colors must read true; a dark chrome shifts every swatch and doubles contrast QA for no gain.
Affects: `docs/design/design-system.md`.

## D-005 · Access model

Date: 2026-10-25 · Context: planning.
Decision: no accounts in v1. Anyone can run. A global daily budget of $2.00, a per-visitor cap of 2 runs per day, and a page cap of 12 protect spend. A visitor may supply their own Anthropic API key, which lifts the visitor cap, bypasses the global budget, and raises the page cap to 40. The key stays in the browser and is sent only with that visitor's runs.
Reasoning: recruiters will not create an account; a spend cap protects the owner more directly than a login.
Affects: `docs/specs/caps-and-budget.md`, `docs/design/pages.md`.

## D-006 · The showcase is the owner's runs

Date: 2026-10-25 · Context: planning.
Decision: the home page feed shows only runs the owner chose (the roster in `docs/specs/showcase.md`). Visitors' runs are never listed publicly. Every run has an unguessable share link and is reachable by that link.
Reasoning: this is a portfolio piece; every visitor should land on the best work; no moderation.
Affects: `docs/specs/showcase.md`, `docs/design/pages.md`.

## D-007 · Run page structure

Date: 2026-10-25 · Context: page flow mock approved by the owner.
Decision: one long run page with a sticky section nav (Tokens · Components · Checks · Drift · Exports). Above the fold: identity, stat strip, palette, drift headline. The in-progress run is the same page filling in stage by stage, with a stage rail and a live log, never a separate loading screen. Components open in a side panel by default; every component also has its own URL (`/r/{id}/c/{componentId}`) and the panel offers "Open as page".
Reasoning: tabs hide content and break share links; a panel keeps the grid in view; a page gives every component a share link.
Affects: `docs/design/pages.md`, `docs/design/components.md`.

## D-008 · Provenance is first class

Date: 2026-10-25 · Context: owner asked where a component came from.
Decision: every component card shows its source line ("First seen on /pricing · 11 pages"). The component panel has a Source section directly under the preview: a page crop with the component outlined, the URL, the viewport, the selector, and the full page list with counts. Every token lists the pages and counts it was seen on. The run header links to the crawled page list with the reason each page was chosen.
Reasoning: a reviewer wants proof, not a count.
Affects: `docs/design/pages.md`, `docs/design/components.md`, `docs/specs/component-detection.md`, `docs/specs/data-model.md`.

## D-009 · V2 is planned, prepared, and invisible in v1

Date: 2026-10-25 · Context: owner wants to test v1 and then decide on paid plans.
Decision: v1 builds the seams (entitlements module, nullable owner on runs, priority on jobs, cost metering, viewer abstraction, storage adapter, billing adapter with a mock provider) and the v2 surfaces (pricing section, plan badge, account menu, billing page, upgrade prompt, sign-in sheet) behind `BILLING_ENABLED=false` with zero entry points when off. No Stripe keys, no login provider, no payment in v1.
Reasoning: Stripe is a day once entitlements are centralized; the data model is what is expensive to retrofit; a "Plans" button that goes nowhere makes a portfolio piece look unfinished.
Affects: `docs/specs/v2-seams.md`, `docs/v2-plan.md`, `docs/design/pages.md`.

## D-010 · Component previews: live when faithful, captured otherwise

Date: 2026-10-25 · Context: planning.
Decision: a component preview is a sanitized live render of its extracted HTML and CSS when the render matches the captured crop within the pixel-diff threshold in `docs/specs/preview-fidelity.md`; otherwise the crop is shown with a "Captured" label. The pipeline decides, never a person.
Reasoning: live previews make it feel like a system; a threshold rule is verifiable by the build itself.
Affects: `docs/specs/preview-fidelity.md`.

## D-011 · Build-time model spend

Date: 2026-10-25 · Context: owner approved.
Decision: real model calls during the build are capped at $20 total by `DSE_DEV_SPEND_CAP_USD`. Model responses are recorded to fixtures and replayed in tests. When the cap is reached, only replay mode is allowed; the build continues.
Reasoning: naming and narrative must be tested against real models at least once; repeated test runs must not re-spend.
Affects: `docs/specs/model-calls.md`, `docs/evals.md`.

## D-012 · Deployment is the owner's only hands-on step

Date: 2026-10-25 · Context: owner is not hands-on until the end.
Decision: the build runs entirely locally with Docker Compose (Postgres, Redis, MinIO). Production deployment (Supabase, Upstash, Railway, Vercel, npm publish, showcase generation) is done by the owner following `docs/deploy-runbook.md`, which the build verifies for accuracy with `pnpm doctor` and dry-run builds.
Reasoning: accounts and secrets cannot be created by the build.
Affects: `docs/deploy-runbook.md`, `docs/plan.md`.

## D-013 · Third-party sites in the showcase

Date: 2026-10-25 · Context: planning.
Decision: the showcase includes well-known third-party sites. Runs on them show tokens, captures, live previews, and the CSS declarations of components. The crawler identifies itself honestly, obeys robots.txt, and rate limits. The footer of every run page carries a "Report a problem with this run" mail link, and the owner can unpublish a showcase run by removing it from the roster.
Reasoning: computed styles are inspection, the owner accepted the posture, and a removal path keeps it responsible.
Affects: `docs/specs/showcase.md`, `docs/specs/crawler.md`, `docs/design/copy.md`.

## D-014 · Status streaming uses polling

Date: 2026-10-25 · Context: planning.
Decision: the in-progress run page polls `GET /api/runs/{id}` every 1.5 s with an ETag while the run is queued or running. The run document carries partial results per stage, so each poll can fill in whatever is new. No server-sent events, no websockets.
Reasoning: simpler, robust on serverless, and progressive fill-in comes from the document shape rather than a transport.
Affects: `docs/specs/architecture.md`, `docs/specs/data-model.md`.

## D-015 · Local runs from the CLI open client-side

Date: 2026-10-25 · Context: login-walled and private sites.
Decision: `dse extract` writes a run folder locally (run.json, exports, screenshots). The web app has `/open`, which loads a run.json from the visitor's disk and renders it entirely in the browser; nothing is uploaded or stored.
Reasoning: no upload endpoint to abuse, no storage of private sites, and private sites still get the full UI.
Affects: `docs/specs/exports-and-mcp.md`, `docs/design/pages.md`.

## D-016 · Unused

Date: 2026-10-25 · Reserved during planning and never assigned. The build's first decision is D-026, which records the verified model ids, the price table values and the date checked (plan P0). Ids are never reused.

## D-017 · Previews are served from the storage origin, never srcdoc

Date: 2026-10-25 · Context: pre-build audit.
Decision: component previews are files on the storage origin, loaded by `<iframe sandbox="" src>`; the worker's fidelity check loads the same URL. The app CSP allows `frame-src {storage}`. `srcdoc` is forbidden because it inherits the app's CSP and would block the fonts the worker rendered with.
Reasoning: the live-or-captured decision must be made against what the visitor will see.
Affects: `docs/specs/preview-fidelity.md`, `docs/specs/data-model.md`.

## D-018 · The forbidden-word rule is exact

Date: 2026-10-25 · Context: pre-build audit found "accessible name" in copy and the rule in docs.
Decision: `pnpm qa:copy` checks the words `accessible`, `compliant`, `a11y` (word boundary, case-insensitive) only in the copy source, app components and routes, labels, export templates, prompts, and `docs/design/copy.md`, with a `qa-copy-allow` marker for the lines that state the rule. The ARIA term "accessible name" is not used in product copy; the product says "a name a screen reader can announce" and the check detail is "No name found". The axe script is `qa:axe`.
Reasoning: a grep that matches its own rule can never pass.
Affects: `docs/specs/architecture.md`, `docs/design/copy.md`, `docs/specs/checks.md`, `CLAUDE.md`, `docs/handoff.md`.

## D-019 · `busy` is its own blocked reason; blocked-login runs render

Date: 2026-10-25 · Context: pre-build audit.
Decision: queue depth over 20 blocks with reason `busy` and its own state page, before the cap and budget checks, for every run. A run blocked by a login wall still produces a complete one-page document; `/r/{id}` renders it with the login caption instead of redirecting.
Reasoning: one reason per state page; "Open it anyway" must open something.
Affects: `docs/specs/caps-and-budget.md`, `docs/specs/crawler.md`, `docs/design/pages.md`, `docs/design/copy.md`, `docs/specs/data-model.md`.

## D-020 · Showcase content lives in storage in production

Date: 2026-10-25 · Context: Vercel functions cannot write to the repository.
Decision: the committed `showcase.json` is the seed and fallback; production reads `showcase/showcase.json` from storage with hourly revalidation; the admin content endpoint writes it. The roster gains notion.so (SaaS) and makes stripe.com the Finance entry so every category chip has a card; craigslist moves to the alternates.
Affects: `docs/specs/showcase.md`, `docs/deploy-runbook.md`.

## D-021 · A sixth fixture, `messy-after`

Date: 2026-10-25 · Context: the local showcase needs six entries and Compare needs a real pair.
Decision: `fixtures/sites/messy-after` is the messy site half-fixed, seeded alongside the five eval fixtures, not scored by evals, asserted by the Compare e2e test.
Affects: `docs/evals.md`, `docs/specs/showcase.md`, `docs/plan.md`.

## D-022 · Build verification without the Vercel CLI; worker Docker context is the repository root

Date: 2026-10-25 · Context: the Vercel CLI needs an interactive login; the worker image needs `packages/`.
Decision: the web build is verified with `pnpm --filter web build`; Railway builds `apps/worker/Dockerfile` with the repository root as context. The Claude Code MCP install line is verified by the owner after publishing, not by the build.
Affects: `docs/specs/architecture.md`, `docs/plan.md`, `docs/deploy-runbook.md`, `docs/specs/exports-and-mcp.md`.

## D-023 · QA viewports are 1440, 820 and 390

Date: 2026-10-25 · Context: the tablet layout was never screenshotted at 1024.
Decision: every screenshot gate uses 1440 × 900, 820 × 1180 and 390 × 844.
Affects: `docs/design/design-system.md`, `docs/evals.md`, `docs/plan.md`, `CLAUDE.md`, `docs/handoff.md`.

## D-024 · Names: `headline`, `xl`, `title-sm`, `h2-sm`, `drift-sub`; "page candidate" and "element candidate"

Date: 2026-10-25 · Context: the word "hero" was used for five different things and three one-off sizes existed.
Decision: the app's largest type style is `headline`; the large button, input and swatch sizes are `xl`; the three one-off sizes become named styles; `hero` is only the extracted component type. URL candidates are "page candidates", DOM candidates are "element candidates".
Affects: `docs/design/design-system.md`, `docs/design/components.md`, `docs/glossary.md`, `docs/specs/crawler.md`, `docs/specs/component-detection.md`.

## D-025 · The build-time spend reserve

Date: 2026-10-25 · Context: D-011.
Decision: of the $20 cap, $4 (`DSE_DEV_SPEND_RESERVE_USD`) is reserved for the final live eval in P15; the meter refuses live calls at cap minus reserve before P15. The P13 dry run stops when the meter says so.
Affects: `docs/specs/model-calls.md`, `docs/evals.md`, `docs/plan.md`, `.env.example`.

## D-026 · Verified model ids and prices

Date: 2026-10-25 · Context: P0, model ids are verified, not remembered (CLAUDE.md rule 13).
Decision: checked on platform.claude.com (docs.claude.com redirects there), Models overview and Pricing, on 2026-10-25. `models.small` is `claude-haiku-5-5` and `models.large` is `claude-sonnet-5-5`, both current, both retrieved live through the Models API by `pnpm run doctor`. Prices in USD per million tokens, written to `packages/pipeline/src/models/config.ts`, the only file that names a model id:

| Model | Input | Cache write (5 min) | Cache read | Output |
| --- | --- | --- | --- | --- |
| `claude-haiku-5-5`, prompts up to 100,000 tokens | 0.10 | 0.125 | 0.01 | 0.50 |
| `claude-haiku-5-5`, prompts over 100,000 tokens | 0.50 | 0.625 | 0.05 | 2.50 |
| `claude-sonnet-5-5` | 2.00 | 2.50 | 0.10 | 10.00 |

The price table gains a `cacheWrite` column and an optional long-context row, because cache writes and Haiku's long-prompt tier change the cost of a call and the cost record must be exact.
Reasoning: rule 13; exact cost accounting.
Affects: `packages/pipeline/src/models/config.ts`, `docs/specs/model-calls.md`.

## D-027 · Structured outputs instead of forced tool use; no sampling parameters

Date: 2026-10-25 · Context: `docs/specs/model-calls.md` asked for forced `tool_choice` and temperatures 0 and 0.3. On the current API, forced `tool_choice` (`any` or `tool`) returns a 400 on `claude-sonnet-5-5`, and API version `2026-10-21` rejects `temperature`, `top_p` and `top_k` on every model. Thinking cannot be disabled on `claude-sonnet-5-5`.
Decision: every model call uses structured outputs (`output_config.format` with a JSON schema generated from the call's Zod schema by Zod 4's `z.toJSONSchema` through the SDK's `zodOutputFormat` helper), parsed and validated with the same Zod schema, retry once on a validation failure, then the fallback. No sampling parameters are sent. The small model runs with thinking disabled at effort `low`; the large model runs adaptive thinking at effort `low`. Stability comes from tight prompts, structured outputs, validation and record and replay. `zod-to-json-schema` is not used (Zod 4 has it built in).
Reasoning: the closest faithful version of the spec on the API as it exists; the guarantees the spec wanted (schema-shaped output, a validated parse, a deterministic fallback) all hold.
Affects: `docs/specs/model-calls.md`, `packages/pipeline/src/models/`.

## D-028 · `pnpm run doctor`, and what the production check reads

Date: 2026-10-25 · Context: pnpm 9 has a built-in `doctor` command, so a bare `pnpm doctor` runs pnpm's own check and never reaches the workspace script. Separately, `architecture.md` said `doctor --production` checks the web app's pooler string and the worker's session string, but the production env file holds only one `DATABASE_URL`, the session string (the runbook gives Vercel the pooler string directly).
Decision: every document says `pnpm run doctor`. This supersedes the wording of D-012, which names `pnpm doctor`. `pnpm run doctor --production` requires the file's `DATABASE_URL` to be the session form (5432), fails on the pooler form (6543) with a note that it belongs to Vercel only, and prints that reminder when it passes.
Reasoning: a documented command that silently runs something else is worse than two extra characters.
Affects: `docs/plan.md`, `docs/specs/architecture.md`, `docs/specs/caps-and-budget.md`, `docs/deploy-runbook.md`, `.env.example`.

## D-029 · Local MinIO from Chainguard's image

Date: 2026-10-25 · Context: the `minio/minio` and `minio/mc` images are no longer published on Docker Hub or quay.io.
Decision: Docker Compose runs MinIO from `cgr.dev/chainguard/minio` (the same MinIO server, current release) and creates the buckets with a two-line local image (`docker/storage-init`) that copies Chainguard's `mc` onto `cgr.dev/chainguard/wolfi-base` so the init container has a shell. Buckets `dse` and `dse-test` with anonymous download, as before. Production is unaffected (Supabase Storage).
Reasoning: keeps MinIO and the spec's local shape; the closest working source of the image.
Affects: `docker-compose.yml`, `docs/specs/architecture.md`.
