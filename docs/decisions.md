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

## D-030 · Labels for every enum value

Date: 2026-10-25 · Context: P1's gate requires a label for every value of every enum in `data-model.md`, but `copy.md` gave labels for only some enums and had no label for the `queued` run status.
Decision: `copy.md` (Enum labels) gains `Queued` and lines for substages, event levels, viewports, page statuses, token kinds, color groups, semantic roles, preview modes, captured reasons, check statuses, drift kinds, evidence kinds, plans and export formats, written in the copy rules' voice and reusing words the copy already uses (the variant color words, the stage rail names, the export card names). `labels.ts` takes each verbatim and a test asserts every label appears in `copy.md`.
Reasoning: one source for every word the product shows.
Affects: `docs/design/copy.md`, `packages/schema/src/labels.ts`.

## D-031 · The run breadcrumb says "Recent runs"

Date: 2026-10-25 · Context: `copy.md` Global and `pages.md` say `Recent runs / {host}`; the Run page block of `copy.md` said `Your runs / {host}`.
Decision: `Recent runs / {host}`, matching the nav label and the page it links to. `copy.md` Run page block fixed.
Affects: `docs/design/copy.md`.

## D-032 · Seed run ids are ten characters

Date: 2026-10-25 · Context: `evals.md` named seed ids of eleven characters (`seedclean00`), but every run id is ten (`docs/glossary.md`), and the schema validates that.
Decision: `seedclean0`, `seedmessy0`, `seedtailw0`, `seedcssin0`, `seedlibra0`, `seedmafter`, and the frozen in-progress runs `seedprog01`, `seedprog02`, `seedprog03`.
Affects: `docs/evals.md`.

## D-033 · Where the database code lives, and what the schema adds

Date: 2026-10-25 · Context: the web app and the worker both need the Drizzle tables, `applyPatch`, `appendEvent` and `getRunForViewer`, and `architecture.md` allows only four packages. Building the schema also showed fields the UI and later stages need that `data-model.md` did not list.
Decision: the database code lives in `packages/pipeline/src/db/` beside `storage/` (the `DbRunContext` that writes through it lives in the pipeline too), with migrations in `packages/pipeline/drizzle/`. `run_pages` has the primary key (`run_id`, `id`) so two runs of the same site can never collide on a page id. The run document gains: `viewports` and `failedDetail` at the top level; `Page.status` and `failedReason` (captures optional until captured); `tokens.spaceBase` (the inferred base and whether the 85% rule held, for "{base} px base"); `rawCounts.radii` and `rawCounts.shadows` (for the sprawl evidence); `ContrastPair.large` with `fg` and `bg` as token ids (the drift contrast constraint needs the threshold and token identity); `SpaceToken.contexts.layout`; `Component.unmapped` (the panel's Unmapped list); `firstSeen.sourceCrop` (the crop key, size and the outline box); `StateCapture.instanceId`; a nullable `drift.headline.kind`, `drift.findingCount`, `proposal.contrastKept`, `ProposedColor.group` and a defined `ProposedType`; `Evidence.evidenceOnly`; and the `ModelPurpose` enum for cost calls. `GET /api/runs/{id}` returns `{ id, status, isShowcase, document, events }`.
Reasoning: each field is something a later spec reads; naming it once now keeps every consumer on one shape.
Affects: `docs/specs/data-model.md`, `docs/specs/architecture.md`, `docs/design/pages.md`.

## D-034 · Unpublishing hides a run

Date: 2026-10-25 · Context: `showcase.md` says unpublishing removes a run from the showcase and restores a 90-day retention; `pages.md` says an unpublished run returns 404.
Decision: unpublishing sets `is_showcase = false`, `unpublished = true` and a 90-day retention. `getRunForViewer` returns nothing for an unpublished run, so `GET /api/runs/{id}` and `/r/{id}` return 404, and the retention job deletes it later.
Reasoning: unpublishing exists for a site owner's removal request (D-013); a link that keeps working would not honor it.
Affects: `docs/specs/data-model.md`, `packages/pipeline/src/db/`.

## D-035 · No `nosniff` on stored objects

Date: 2026-10-25 · Context: P1 asked for `nosniff` on upload, but S3 object metadata cannot set `X-Content-Type-Options` (only Content-Type, Cache-Control, Content-Disposition and Content-Encoding are system metadata), on MinIO or Supabase Storage.
Decision: every upload carries the right `Content-Type`, from the key's extension (unknown extensions are refused) and immutable caching for run files. `preview-fidelity.md` already makes the sandbox attribute and the preview document's own CSP the security boundary and relies on no storage response header; that stays the rule.
Affects: `docs/plan.md`.

## D-036 · A focus ring for inverse grounds

Date: 2026-10-25 · Context: the `focus` ring (`#35302C`) reads 1.24:1 against `inverse-bg`, so the inverse button inside the drift headline card, the live log's disclosure and anything inside a toast would have an invisible ring, failing the 3:1 rule the design system sets for the ring.
Decision: a new token `focus-inverse` (`#FCFAF8`, 15.55:1 on `inverse-bg`). Any container on `inverse-bg` carries `data-inverse`, which switches the ring color through the `--dse-ring` variable. Width, offset and behavior are unchanged.
Reasoning: the ring rule ("never removed") only holds if the ring can be seen.
Affects: `docs/design/design-system.md`, `apps/web/styles/tokens.css`, `apps/web/styles/globals.css`.

## D-037 · Swatch `token` is 96 wide and 48 high

Date: 2026-10-25 · Context: `components.md` gave the `token` swatch as "48 × 96". Read as width × height (the copy rule for sizes), a 48 px wide swatch cannot carry its hex and the usage caption ("navy-900 · 412 uses") beneath it, which the same entry requires.
Decision: 96 wide × 48 high. The caption truncates with an ellipsis when a name is long; the full value is in the token popover.
Affects: `docs/design/components.md`.

## D-038 · How the catalog shows phones, and how QA reads it

Date: 2026-10-25 · Context: components use media queries, so a 390 px wide box inside a desktop page would not show phone layouts; axe and screenshots also had to cope with nested and sandboxed frames.
Decision: each catalog section shows its states on the page and a real 390 px phone in an iframe of `/catalog/frame/{slug}` (`noindex`, sized to its content by `postMessage`, out of the tab order because it repeats the demos beside it). The TopNav demo's desktop states render in a frame of their own so the page never carries two "Primary" navs. `qa:axe` runs axe-core in each top document (frames are checked as routes of their own; a `sandbox=""` preview frame cannot run axe's injection) and `qa:design` and `qa:visual` capture with the viewport grown to the full document height, in a Chromium without site isolation, so sandboxed preview frames paint in captures. QA scrolls with `behavior: instant` because the app sets smooth scrolling. The app's CSP (P6) therefore allows `frame-src 'self'` for these frames. The catalog gains a Motion section that plays the six moves with a Replay button, and `copy.md` gains the labels the catalog and the icon buttons need.
Affects: `apps/web/app/catalog/`, `tests/qa/`, `docs/design/copy.md`, `docs/specs/preview-fidelity.md` (P6 CSP).

## D-039 · Reduced motion for content present on first paint

Date: 2026-10-25 · Context: the reduced-motion test found that an element rendered on the server takes its entrance variants before the browser's preference can be read, so a reduced-motion reader could see a transform before the client switched variants.
Decision: elements that move on first paint carry `data-move`; under `prefers-reduced-motion: reduce` a global rule sets their `transform` and `clip-path` to none and fades them in over 200 ms. Elements that mount after hydration read the preference in JavaScript as before. The test measures computed transforms, which is what a reader sees, and keeps its no-preference control.
Affects: `docs/design/motion.md`, `apps/web/styles/globals.css`, `tests/e2e/reduced-motion.spec.ts`.

## D-040 · Request hashes leave out image bytes

Date: 2026-10-25 · Context: P3 model client. A crop rendered on two machines differs by a few anti-aliased pixels, so a hash over image bytes would miss every recording made elsewhere.
Decision: the request hash replaces each image block with a placeholder before hashing. The text beside each image (fingerprint, text sample, ids) identifies the item. Run ids, ISO timestamps and storage keys that embed a run id are also normalized, as before.
Reasoning: recordings must replay on any machine; the text already pins down what the image shows.
Affects: `docs/specs/model-calls.md`, `packages/pipeline/src/models/`.

## D-041 · Deterministic page ids and synthetic missing page

Date: 2026-10-25 · Context: the select call's input table carries page ids and the synthetic 404 path. With nanoid values every run would hash differently and miss its recording.
Decision: a page id is 8 characters in the id alphabet derived from the SHA-256 of the page's normalized URL. The synthetic missing page is `{prefix}/{token}-does-not-exist`, where the token is the first 10 hex characters of the SHA-256 of `dse-404:{host}{prefix}`. Run ids stay random nanoids (they are the access control).
Reasoning: replay, recordings and goldens need stable inputs; neither value is a secret.
Affects: `docs/specs/crawler.md`, `docs/specs/data-model.md`.

## D-042 · styled-components class names count as hashed

Date: 2026-10-25 · Context: `capture-and-states.md` defines hashed class tokens to include `^sc-`, but the framework hint regex in `crawler.md` did not, so a styled-components site under-counted its hashed classes.
Decision: the `css-in-js` hint also counts class tokens matching `/^sc-[A-Za-z0-9]+/`. One definition of hashed everywhere.
Affects: `docs/specs/crawler.md`, `packages/pipeline/src/crawl/framework.ts`.

## D-043 · Element candidate rules, made exact

Date: 2026-10-25 · Context: building capture against the fixtures showed four places where the literal rules miss or double count.
Decision: (a) the inline mark rule also accepts a flex or grid item narrower than half its parent, because the browser blockifies an `inline-flex` child of a flex container and its computed display reads `flex`; (b) the container rule treats a background image or gradient as a background that differs from the parent's; (c) table parts (`thead`, `tbody`, `tfoot`, `tr`, `td`, `th`, `caption`, `colgroup`) are never container candidates, because they belong to the table; (d) `header` and `footer` count as landmarks only where ARIA maps them to `banner` and `contentinfo`, that is, not inside `article`, `aside`, `main`, `nav` or `section` (a card footer is not a page footer).
Affects: `docs/specs/component-detection.md`, `packages/pipeline/src/capture/candidates.ts`.

## D-044 · The reduced-motion probe runs after the main load

Date: 2026-10-25 · Context: `capture-and-states.md` orders the reduced-motion probe before the main load, but the probe must measure "every element that will be an element candidate", which is only known from the main load's snapshot.
Decision: per page and viewport, the main load runs first; the probe then loads the page again under `prefers-reduced-motion: reduce` and measures, by selector, the element candidates that moved in the main load (one that does not move without the preference cannot move with it). A component's motion includes its descendants' animations (a pulsing dot inside a badge is the badge's animation), and motion is read before the freeze. `open` is never attempted on `role=tab` elements: their `aria-controls` names a tab panel, and switching it is a selection, not a popup.
Reasoning: the same measurement, aimed at exactly the elements the check will judge.
Affects: `docs/specs/capture-and-states.md`, `packages/pipeline/src/stages/capture.ts`.

## D-045 · Centered auto margins are layout

Date: 2026-10-25 · Context: `margin: 0 auto` computes to pixel values, so every centered container would add its side margins (for example 160 px) to the spacing steps.
Decision: when an element's left and right margins are equal and it is centered in its parent, those two margins count toward `contexts.layout` and are not spacing values.
Affects: `docs/specs/token-clustering.md`, `packages/pipeline/src/tokens/collect.ts`.

## D-046 · Fixture authoring

Date: 2026-10-25 · Context: P3 built the six fixture sites and their `expected.json`; measuring them against the rules showed what each fixture needed to prove what `evals.md` says it proves.
Decision:
- clean: the planted caption at 4.2:1 is the "New" tag, caption-size text (12 px) in white on teal `#0F8A8A`, 4.18:1, so the planted failure uses only palette colors. The empty state has a border so it is a container element candidate. Buttons stacked in a column sit in an action row so they size to their content. Prose paragraphs keep body text the most common `p` style. The no-drift numbers were checked: the nearest neutral pair is ΔE 7.2, no two same-hue chromatics are within ΔE 8 (the translucent shadow color is compared only with colors of its alpha, D-048), no spacing near-steps, no type near-duplicates, 3 radii, 2 shadows.
- tailwind and css-in-js: built from the same source as clean and pixel-compared with it (at most 0.002% of pixels differ); their extracted inventories equal clean's, so all three share one expected design. Tailwind compiles with `source(none)` and only the classes the generator emits.
- messy: it inherits the clean family's two planted failures (the unnamed copy button and the New tag), so it plants seven check failures, five of its own. The 10 px off-grid value is also used by the header action and check-row gaps so it clears the 2% step threshold; the footer stays white so its gray caption is not an unplanned contrast failure (the table header carries `#F5F5F5`); the small share button has no border or ground so it is its own component, not a size variant of the icon button.
- library: Bulma 1.0.4 with a small brand layer in `site.css`, as a real site would have: 44 px controls and buttons, paddings on the 4 px grid, one light gray, one border gray, one link blue, visible focus rings, three shadows. Stock Bulma's computed shades and calc paddings fall inside the drift tolerances, and this fixture must show zero false drift. Notification gets `role=status` and a paragraph, tabs get `tablist` and `tab` roles, the hero uses an `h1` and is taller than half the viewport, and the message component is dropped. Planted failures: the `has-text-grey-light` footer caption, the unnamed icon button, and Bulma's 13 px native checkbox.
Affects: `docs/evals.md`, `fixtures/src/`, `fixtures/sites/`.

## D-047 · expected.json conventions

Date: 2026-10-25 · Context: `evals.md` gives the shape of `expected.json` but not how each value is chosen, and component scoring depends on it.
Decision: pages are listed in capture order. A component's `page`, `viewport` and `bbox` are its first-seen instance (capture order, desktop preferred) in document CSS px. `states` lists the states the capture spec takes for it. Variants exclude state-driven styles: an instance that differs only because it is selected, current, checked, invalid or disabled supplies that state, not a variant. The interactive items of a composite (tab buttons, pagination links) are components of their own; a header nav and a footer nav are two components. Planted check entries name expected components. `scripts/test/expected.test.ts` checks every file against these rules and that clean, tailwind and css-in-js share one design.
Affects: `docs/evals.md`, `docs/specs/component-detection.md`.

## D-048 · Near-duplicate colors compare equal alphas only

Date: 2026-10-25 · Context: the clean fixture's shadow color `rgba(11, 31, 58, 0.12)` has the same hue and lightness as its navy, so the near-duplicate rule would report ΔE 0 between a shadow and a text color on a site with no drift.
Decision: near-duplicate color pairs are only formed between tokens whose alpha matches within 0.05, the same alpha rule clustering uses.
Affects: `docs/specs/drift.md`.

## D-049 · An invalid field is error context

Date: 2026-10-25 · Context: the semantic rule reads class, role and ancestor class, so a danger red used on an `aria-invalid="true"` input border (with class `input`) counted against the 70% semantic threshold.
Decision: an element with `aria-invalid="true"` counts as matching the semantic pattern (as `invalid` does in a class name).
Affects: `docs/specs/token-clustering.md`.

## D-050 · Rule classification checks specific forms first

Date: 2026-10-25 · Context: the rule list in `component-detection.md` takes the first match, but `button` (tag button) precedes `toggle` (`role=switch` on a button), and `nav` precedes `breadcrumb` and `pagination`, which are navs. As written, a switch could never be a toggle and a breadcrumb never a breadcrumb.
Decision: rules are tried with the specific form before the general one: `toggle` before `button`, and `breadcrumb`, `pagination` and `tabs` before `nav`. Confidences are unchanged.
Affects: `docs/specs/component-detection.md`.

## D-051 · Token rules made exact

Date: 2026-10-25 · Context: P4 built the tokens stage against `token-clustering.md` and the fixtures.
Decision:
- Base grid: 8 when 85% of weighted values are divisible by 8, else 4 when 85% are divisible by 4, else 4 marked not clear. As written (4 first), every 8 px grid would read as 4, because every multiple of 8 is a multiple of 4; the spec's own test asks for an 8 px set to infer 8.
- Semantic context (extends D-049): a role on an ancestor counts like an ancestor class, and so does the error message an invalid field names in `aria-describedby` or `aria-errormessage`. Utility-class sites (Tailwind, hashed CSS-in-JS) carry their states in ARIA, not class names.
- Hue words: twelve bands by OKLCH hue, each starting at pink 0, red 15, orange 40, amber 65, yellow 90, lime 115, green 135, teal 165, cyan 200, blue 230, indigo 275, violet 295, pink 325. Chromatic names use the same lightness steps as grays.
- Names: a collision takes a letter (`gray-100b`); a semantic role held by several clusters is named `{role}-{step}`, a single one by its role alone. The model's names must match the pattern, keep the role, `gray` or the hue word as one part, have at most three parts and stay unique, or the deterministic name stands, per name.
- Usage is occurrences (text, background, border and other uses summed); weight, which favors large grounds, only orders clustering.
- Contrast pairs are collected per text node against the opaque effective background, skipped where a gradient or image lies behind the text (the checks stage samples the crop there), mapped to the nearest opaque token, and the worst ratio per background token is kept.
- The display role reads only a page's own snapshot, never the snapshot of a menu it revealed; spacing tokens need a weight above zero (values seen only in layout contexts are counted, never steps); shadow names come from a `box-shadow` that is exactly one custom property ending in `shadow-{name}`, as the last declaration in the cascade.
- `pnpm evals --fallback` runs every model step on its fallback, the check that the deterministic names are valid and unique on every fixture.
- Fixture expectations corrected: the messy fixture's one code block sits on one selected page (two elements), so by the three-element rule it is not a type token, and its share button has no ground, so its 6 px radius is not a radius token. The clean family's planted ratio is 4.18:1, which the floor-to-one-decimal rule shows as "4.1:1".
Affects: `docs/specs/token-clustering.md`, `docs/evals.md`, `fixtures/sites/messy/expected.json`, `packages/pipeline/src/tokens/`.

## D-052 · Component clustering made exact

Date: 2026-10-25 · Context: P5 built the components stage against `component-detection.md` and the five fixtures. Taken literally, the clustering rules split one button family across class modifiers and tags, merged a header nav with a footer nav because their styles match, made a selected tab a variant, and gave every card height its own size.
Decision:
- Exact groups use the tag (text-like input types count as one input), the role, the base class tokens (a token that extends another, `btn-primary` beside `btn` or `pricing-card--featured` beside `pricing-card`, and `is-*`, `has-*` and size or state words are modifiers), the structure, whether the element is icon-only, and, for inline marks, whether the ground is a semantic color. A Tailwind site's class tokens are ignored like hashed ones, because utilities describe values, not components.
- Groups that share non-empty base tokens are one component whatever their colors or children; for controls this holds across `a`, `button` and submit inputs. Icon-only controls stay apart from text controls.
- The style merge also requires the base tokens to agree (equal, one inside the other, none to read, or every token sharing its first segment with one on the other side, as `pagination-link` and `pagination-next`) and the structures to overlap by 70% or more; `display` is compared by its inner type (a flex item's `inline-flex` is blockified to `flex`).
- Two clusters of one type whose instances are controls or marks and that share an identical variant look are one component.
- Variants come from the main viewport's instances (desktop when present) that are in no state; the rest join the variant of the same element (page and selector) or the nearest one. Height is part of a variant only for controls, marks and avatars. A transparent border is no border. Colors, not variants, are ranked Primary, Secondary, Tertiary; a single variant is `Default`; a repeated name takes a number. These words are in `copy.md`.
- Classification: a popup root revealed by `open` is a dropdown; a styled link that is a tab or a page number is a link however short; the empty state is tried before the section header and the card, a section header has no ground, and repeated rows stacked in one column (three or more, at least 80% of their parent's width) are list rows before cards. A badge carries a status word or a number. The model sets the type and may drop a cluster as noise only below confidence 0.9; it names every cluster.
- Same-named clusters merge when their styles agree; otherwise they go to the collision call only when the site's base classes allow it, and stay apart (numbered) when the site's own class names set them apart. The fallback name is the type label, numbered from the second of a type (`Card`, `Card 2`).
- Provenance counts a page's desktop instances, or its mobile ones when it has no desktop instance. States come from the first-seen instance first; `disabled`, `error`, `checked` and `selected` are cropped from the page screenshot at an instance in that state; a missing hover, focus or active reads `over capture cap` or `no instance found`. `Changes layout at 390 px` means the phone instance fills its container (90% or more) where the desktop one does not (60% or less). Each variant's crop and the phone crop are stored (`variants/{variantId}/default.png`, `mobile.png`).
- Capture opens a trigger that is visible from the top of the page at scroll 0, so a sticky header's popup always lands at one place.
- Recordings carry the request text, and `DSE_REPLAY_MISS_DIR` writes a missed request there, so a miss can be compared with what was recorded.
- Fixtures: messy's small share button is `share-button` (its old class `icon-button-sm` declared it a size of the icon button, which the fixture does not mean), and the library's pagination links are two variants (text links 12 px and number links 8 px of padding).
Affects: `docs/specs/component-detection.md`, `docs/specs/capture-and-states.md`, `docs/specs/data-model.md`, `docs/design/copy.md`, `docs/evals.md`, `fixtures/`, `packages/pipeline/src/components/`.

## D-053 · Previews made exact

Date: 2026-10-26 · Context: P6 built the preview builder, sanitizer and render check against `preview-fidelity.md` and the fixtures. Read literally, the preview wrapped the element in a plain block, so inline elements picked up a line box, stretched elements lost the height their layout gave them, absolutely positioned popups rendered outside the box, and sub-pixel page positions made identical renders differ by a fifth of their pixels. Capture also did not keep the markup the builder needs.
Decision:
- Capture stores, for every element candidate and every revealed popup root, its `outerHTML` (up to 300 KB; larger markup is left out and the component is captured with `styles too large`) and the computed value of every custom property its matched rules name; and, for each `open` state, a crop of the revealed element alone, which is the popup's reference for the render check.
- `.dse-root` is a column flex container as wide as the instance, carries the inherited text properties of the element's parent, the resolved custom properties, and the opaque ground the element sat on (so a button from a dark card shows on its card's color). The root element keeps the exact box it had on the page (`box-sizing: border-box`, its measured width and height, no margin, and `position: relative` with no offsets when it was absolute, fixed or sticky).
- Matched rules are used without their `@media` and `@supports` wrappers: they matched when the instance was captured, and the preview renders at the instance's size, not the page's. Rules from the element and its descendants are merged keeping each element's cascade order; a selector that no longer matches inside the preview has its leading ancestors replaced by `.dse-root`; id selectors follow the sanitizer's `dse-` prefix.
- The comparison is against a crop of the full-page screenshot at the instance's exact box (the stored state crops carry an 8 px margin). It takes the best alignment within 2 device pixels and forgives a size difference of up to 4 device pixels, beyond which the extra area counts as differing, so a fractional page position never makes an identical render fail.
- Images inside a component take their average color from the page screenshot. A declaration name that is not a property name is removed with its value (a style attribute beginning `@import url(http:…)` parsed as one). `image-set()` and `src()` are removed like `url()`. `fonts-unavailable` is the reason when a web font file could not be served and the render differed. Which font case each component took is recorded in the previews event.
- Preview and crop sizes are recorded in CSS px (crops are taken at device scale 2); this also corrects the source crop sizes P5 recorded at device scale.
- Local runs (evals, tests) serve their storage folder over HTTP (`scripts/storage-serve.ts`), so the render check always loads a preview from a URL, as with MinIO and Supabase. jsdom is pinned at 29.1.1 because jsdom 30 needs Node 22.22.
Affects: `docs/specs/preview-fidelity.md`, `docs/specs/capture-and-states.md`, `docs/specs/data-model.md`, `packages/pipeline/src/previews/`, `packages/pipeline/src/stages/capture.ts`.

## D-054 · Checks made exact

Date: 2026-10-26 · Context: P7 built the five checks against `checks.md`. The spec measures "the component's" result but components have variants and many instances, and leaves a few readings open.
Decision:
- Each component carries one result per check. The first-seen instance, each variant's representative and, where a check reads them (tap target, label, reduced motion), the other instances are measured; the worst result decides, and `variantId` names its variant when that is not the first-seen one. Instances in a state (disabled, invalid, selected) are not measured for contrast or labels. A container's contrast leaves out text inside a nested component (the tag in a card answers for itself), as component-detection.md keeps nested components separate.
- A check that does not apply is `na` with the detail `Not applicable`.
- Contrast: a placeholder's color comes from the input's matched `::placeholder` rules, else Chromium's default `#757575`. Where an image or gradient lies behind text, the ground is sampled from the page screenshot as the spec describes; inside a popup, whose page screenshot does not exist, the ground is read from its own snapshot.
- Focus visible: the ground is the parent's effective background; an `auto` outline counts as 1 px; a box-shadow ring's size is its largest length; a border change counts at the border's width. Interactive types are button, link, input, select, textarea, checkbox, radio and toggle.
- Tap target: every phone instance is measured; a failure reports the worst, a pass the smallest box.
- Label present: `aria-label` is also the pass detail for a name from `aria-labelledby` or, on an icon-only control, from `title` (the detail strings are fixed). An icon-only control has fewer than two characters of text.
- Reduced motion: a transition counts only on an interactive component (the spec's hover transition); an animation counts on any. When the probe did not measure a moving element the result is `na` with `Not measured: capture cap`.
- Clustering (extends D-052): an element that opens something (`aria-haspopup`, `aria-expanded`, `aria-controls`) is a trigger and never clusters with an action button, so a classless site's menu button and copy button stay two components.
- Fixture: the library's focus ring is `#2E333D`. The blue ring measured 2.6:1 against the hero's turquoise, a true failure, but the library plants its failures deliberately and this one was an accident of the brand layer.
Affects: `docs/specs/checks.md`, `docs/specs/component-detection.md`, `fixtures/src/library/generate.ts`, `packages/pipeline/src/checks/`.

## D-055 · Drift made exact

Date: 2026-10-26 · Context: P8 built drift against `drift.md`, `model-calls.md` and the drift lines of `copy.md`, which leave the supporting sentences, some caption values and the evidence strings open.
Decision:
- Supporting sentences follow the headline patterns with rule 9: grays `{n} grays across {pages} pages where {m} would do.`, variants `{n} variants across {k} components where {m} would do.`, spacing `{n} spacing values, {k} of them off the {base} px grid.`, type `{n} type styles where {m} would do.` (numbers under ten as words, the first word capitalized). Headlines keep numerals.
- Caption values: grays `{k}` counts the neutral tokens in a near-duplicate pair and `{d}` is the largest ΔE among those pairs, one decimal; variants `{k}` counts the variants involved (kept and merged) and the delta words come from the largest padding, radius and color differences; spacing `{pages}` lists the paths, or reads `{n} pages` past three.
- Evidence strings: colors are hex values with `ΔE {d}`; variants read `{component} · {kept variant}` and the merged names with the deltas; spacing reads `{value} px` and the nearest step; type reads token names; raw spread reads the hex and `written {n} ways`, evidence only. Radius and shadow sprawl count as findings (none of the five fixtures has any).
- The proposal: a near-step drops its less used member from the proposed spacing; a brand fold that would break a passing contrast pair is not made; proposed grays are named `gray-{step}` by lightness. With five or fewer neutrals nothing folds.
- Variant collapses compare the full looks of each variant's representative instance. Font size is not part of a variant's look (D-052), so a font-size-only difference never makes a variant to collapse.
- The narrative validator also rejects exclamation marks and a narrative outside four to six sentences or an intro of other than two. The intro's date ("October 26, 2026") is added only by the template: the model's facts carry no date, so recordings stay valid.
- With nothing to collapse, the headline kind is null with before and after 0.
Affects: `docs/specs/drift.md`, `docs/design/copy.md`, `packages/pipeline/src/drift/`.

## D-056 · Exports, MCP and CLI made exact

Date: 2026-10-26 · Context: P9 built the export generators, the MCP server and the CLI against `exports-and-mcp.md`.
Decision:
- `tokens.w3c.json` carries its header in the top-level `$description` and the run facts in `$extensions["app.design-system-extractor"]`, because the DTCG format reserves `$` keys and `$meta` is not one of them. The vendored schema (`packages/schema/vendor/w3c-tokens.schema.json`) names the 2024 draft it encodes in `$comment`.
- Names: a space value with a decimal writes `space-17_5`; the pill radius is `radius-pill` at `9999px`; shadows are `shadow-{bucket}`; a type style gets `--type-{name}-tracking` only when its letter spacing is not zero. `tokens.json` keys radius, shadow and font entries without their prefix.
- The voice check on design-system.md and prompt.md covers our prose; fenced code blocks hold the site's own markup and CSS, which is data, and dashes inside them are written as escapes so the files still carry none.
- `all.zip` is stored without compression with a fixed date, so the same run zips to the same bytes in the browser and on the server.
- The `exports` stage stores `designSystemMd` and `promptMd` in the document; the run's source line comes from `RunConfig.runUrl` (`{appUrl}/r/{id}` on the server, the folder path for the CLI). Stages read the document as it stands through `RunContext.current()`.
- The CLI writes the document's storage keys onto the folder layout (`screenshots/`, `components/`, `fonts/`) and serves the folder over HTTP while it runs, so previews are checked from a URL as in production; `dse serve` maps the same keys. On the visitor's own machine the address asked for is allowed even when it is private. `--cdp` crawls in new tabs of the browser's first context, with the request guard on each tab, and leaves the browser open. Exit codes: 0 complete, 2 blocked, 1 failed.
- The MCP and CLI packages start from `dist/bin.js`; their runtime libraries are declared dependencies (kept external), and the workspace packages are bundled in.
Affects: `docs/specs/exports-and-mcp.md`, `packages/pipeline/src/exports/`, `packages/mcp`, `packages/cli`.
