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

## D-057 · Worker, queue, caps and API made exact

Date: 2026-10-26 · Context: P10 built the queue, the worker, the counters, every API route and the fixture seed against `caps-and-budget.md`, `architecture.md`, `pages.md`, `v2-seams.md` and `showcase.md`, which leave several mechanics open.
Decision:
- Visitor identity: without a valid `dse_v` cookie the visitor is a keyed hash (HMAC under a key derived from `DSE_JOB_ENCRYPTION_KEY`) of the client IP and the user agent, and that value is what the cookie is set to, so a client that refuses cookies keeps one identity and a first visit counts where the next ones will. The IP is stored only as a keyed hash.
- Runs with a visitor's key, and showcase runs, do not count toward the visitor's daily runs or the address's six: the key lifts the cap, and counting them would spend the free allowance. Showcase runs also skip the rate limit and the budget, never the queue depth.
- The budget counters hold cents as decimals (`INCRBYFLOAT`): one model call costs a fraction of a cent. The worst case is reserved when a run is created, not when it starts, so twenty queued runs cannot overrun the day; it is released at any end, a cancel while queued included. Refunds and releases happen once per run, guarded by a key.
- A run job carries `{runId, byoKeyCiphertext?, counted?}`: `counted` names the exact Redis keys the run incremented, so a refund decrements the day the run was created. A site-wide `runs:{day}` counter supplies the budget page's runs-today line.
- Blocked details: `budget` reports `used` in dollars spent; `visitor-cap` uses the same shape with `used` and `runsToday` the visitor's count (the stricter of the cookie and the address) and `budget` the runs per day.
- Queue depth and `queuePosition` are read from the `runs` table (queued, not frozen), so QA documents never count; position counts queued runs of higher priority, or equal priority and created earlier.
- BullMQ takes the lowest number first, so a job's BullMQ priority is 100 minus the app's priority, and every job has one. The job id is the run id. Jobs have two attempts, the worker `maxStartedAttempts: 2` and `maxStalledCount: 1`: a crash or a thrown error restarts the run once from the beginning (document, pages and log reset), and the next failure ends it `failed` with the stopped-unexpectedly detail and refunds it. A replay miss is not retried.
- The browser restarts every 25 runs or when the worker's own RSS passes 1.5 GB; Chromium's processes are not visible through Playwright's launch handle, and the run count bounds their growth.
- `GET /api/runs/{id}/pages/{pageId}/capture` redirects (302) to the stored image, because a full-page capture can exceed what a function may return. A 404 from the run route is `no-store`. Cancel answers `{id, status: 'cancelled' | 'cancelling'}`, 403 from another browser, 409 once the run has ended. Exports exist for complete runs and for a login wall's one-page run (409 otherwise); files are named by their format and the zip `{host}-{set}.zip`. `/api/health` answers 503 with `ok: false` when a service is unreachable. An admin token shorter than 32 characters, or unset, admits nobody.
- The Open Graph image is drawn with Plus Jakarta Sans 500 and 700 in WOFF (the image renderer cannot read WOFF2), committed with its OFL license under `apps/web/assets/og`; a complete run's image is stored at `runs/{id}/og.png` and served from there.
- The pipeline writes `stats` and `sparse` with its final patch; nothing wrote them before.
- The retention job is a BullMQ job scheduler on the same queue, at 03:00 in the budget time zone.
- The seed creates each fixture run with its fixed id, rather than renaming it afterward, because every storage key embeds the run id. Event times are spread evenly across the fixed duration; costs are recorded in `fixtures/seed.json` on the first seed and reused. The frozen documents are the clean seed run's document after the last event of `select`, `tokens` and `components`, pointing at `seedclean0`'s files. Every fixture's host is `localhost:4100`, so the showcase names carry each one's identity. The seed refuses to run while a worker heartbeat is live.
- Recordings for sites outside the eval fixtures (`messy-after`, the login wall of the queue tests) are made by `scripts/record-extra.ts` and listed in `fixtures/recordings/extra.json`, which `pnpm evals --prune-recordings` keeps.
- `pnpm db:seed:check` seeds only when the seed is missing or incomplete; `verify:all` runs it right after `check`, because the API end-to-end test and the Compare test read the seeded runs.
- Tests use Redis logical database 15 and the queue tests a test-only model transport on the worker.
Affects: `docs/specs/caps-and-budget.md`, `docs/specs/architecture.md`, `docs/specs/data-model.md`, `docs/design/pages.md`, `docs/evals.md`, `packages/pipeline/src/queue/`, `apps/worker/`, `apps/web/lib/`, `apps/web/app/api/`, `scripts/db-seed-fixtures.ts`.

## D-058 · The web app made exact

Date: 2026-10-26 · Context: P11 built every page in `pages.md` against `components.md`, `copy.md`, `motion.md` and `quality-bar.md`, on Next 16, and measured them with axe, Lighthouse and the QA suites.
Decision:
- Next 16 renamed middleware to proxy: the CSP and its per-request nonce are set in `apps/web/proxy.ts`, and every page renders per request (the root layout awaits `connection()`) so Next can put the nonce on its scripts. The home page's showcase read keeps its hourly revalidation at the data fetch. Zod runs `jitless` (set once in `packages/schema`), because the CSP forbids the `Function('')` probe Zod otherwise makes. Metadata is blocking for every reader (`htmlLimitedBots: /.*/`), so link previews and audits read a run's title and description. The app has an icon (`app/icon.svg`, ink and paper).
- Fixed a P6 defect: a preview document's CSP named the storage base without a trailing slash, and a CSP source path without one matches that exact path only, so every font a preview loads was blocked (the local check passed because the fallback rendered close enough). The base is now a prefix (`{storagePublicBase}/`); live rates rose (messy 0.935, library 1.000) and a test pins the policy.
- `copy.md` gains what the pages needed and the copy did not hold: single-word placeholders (`{families}`, `{list}`, `{values}`, `{names}`) with the joining rule in words; the How it works card titles, the eval cell formats, the CLI and MCP code blocks and the MCP caption; the token popover lines; the `Breadcrumb` landmark label; preview titles; the pill radius label; Compare's singular spans, its day, week and month thresholds and the column facts line.
- Entrances are triggered when the element's parent comes into view: an element starting clipped to nothing never reports an intersection. Grids enter from the grid's own intersection. Static fit-to-ground scaling of previews (`data-fit`) is not motion. A stage ring already done when the rail mounts is drawn in place; only a ring that lands later performs.
- Run page placements: on the in-progress face the PagesCard sits under the StageRail and the LiveLog at the bottom, above the footer; the drift narrative is the first paragraph of the Drift report; the checks disclaimer is the Checks section caption (the summary sits directly beneath it, so it is not repeated); the drift headline is not a landmark. A local run (`/open`) has no MCP card (no stored run to name) and its panel works without routes.
- The browser gets a slice of the run where it can: the run page leaves out the stored markdown exports (they are regenerated in the browser on demand), the panel slot sends one component, the tokens and the pages.
- Compare matches components across runs by signature (type, tag, base class tokens; the name only where there are none), because names come from a model and can differ between runs; a finished gray count reads `Grays · {n} fewer` without "still 0 to go". The failed count falls by exactly the fixes, which is what the messy-after test asserts.
- The URL field reads a bare domain as https. Run dates are written in UTC; Recent run times are in the reader's clock.
- The seed adds two worker-side blocked runs (`seedlogin0` behind a login wall, `seedblock0` blocked as a bot) and four QA-only documents marked `qa_frozen` (`seedqueue0` queued, `seedfail00` failed, `seedcanc00` cancelled, `seedspars0` sparse), so every run state and state page can be screenshotted from real data.
- Lighthouse runs the desktop preset against the production build. Design QA masks the three time-dependent texts (elapsed time, runs left, hours to the reset).
- The catalog shows page-level components from the committed fixture runs, grouped where they compose one region (each entry names every component it shows), and a long entry name wraps in the index.
Affects: `docs/specs/preview-fidelity.md`, `docs/design/copy.md`, `docs/design/pages.md`, `docs/design/motion.md`, `docs/evals.md`, `apps/web/`, `packages/schema/`, `packages/pipeline/src/previews/build.ts`, `scripts/db-seed-fixtures.ts`.

## D-059 · Phone forms, recent rows and singular page counts

Date: 2026-10-26 · Context: the P11 self-review at 390 px. `components.md` keeps every Button but the Extract button from full width, while the state pages' retry and key forms are the same Input-and-Button row as UrlForm; the RecentRunRow's phone layout broke the host mid-word inside the Compare picker, whose list is narrow at every viewport; a login wall's one-page run read "1 pages".
Decision:
- The forms on the state pages (the key form's `Extract {host}`, `Try this page`, `Try again`) follow UrlForm on phones: the button goes full width beneath the Input.
- RecentRunRow lays out by the width of the list it sits in (a container query), not the viewport: the full row above 760 px, three columns with the status and button at the right up to 760, and below 480 the status Pill and the button share a last line under the result, so the host keeps the full width. A row with no result line (a running run) leaves the line out.
- A Radius or Shadow card is left out when the run found no tokens of that kind (a login wall's sign-in page often has neither); the other takes the full width. An empty card reading 0 was a list without a designed empty state.
- A page count of one is written `1 page` wherever a count of pages is written (run meta lines, the page list button, Compare's column facts), as the component source line already did.
Affects: `docs/design/components.md`, `docs/design/copy.md`, `docs/design/pages.md`, `apps/web/components/recent/`, `apps/web/components/run/TokensSection.tsx`, `apps/web/lib/run-view.ts`.

## D-060 · The flag, its tests, and the flagged surfaces made exact

Date: 2026-10-26 · Context: P12 built the v2 seams and surfaces against `v2-seams.md`, the flagged entries of `components.md` and `v2-plan.md`. Next inlines `NEXT_PUBLIC_*` values at build time, so a page can only show a flagged surface in a build made with the flag on; a test that "renders every page and state" needs a browser and a production build; and the spec left open what TopNav, the pricing buttons and the billing page do when there is no session, which in v1 is always.
Decision:
- The app's server code reads the flag through `apps/web/lib/flags.ts`, which reads the build-time `NEXT_PUBLIC_BILLING_ENABLED` that `next.config` derives from `BILLING_ENABLED`. One build is on or off everywhere; the runtime value cannot disagree with the browser's.
- The flag-off test is two files: `apps/web/test/flag-off.test.ts` (the derivation, that only `next.config` and `lib/flags.ts` name the public flag, the viewer, the mocks, no auth or payment dependency in any `package.json`, the billing route's 404) and `tests/e2e/flag-off.spec.ts` (every page and state of the QA registry at 1440 and 390 with the phone menu open: no v2 surface, no link to `/account` or `#plans`, none of the plan words in the chrome regions or in meta tags; `/account` and `/account/billing` 404; the sitemap clean). The catalog is excepted: it shows the surfaces always.
- `pnpm qa:billing` serves a second production build made with the flag on (`.next-billing`, port 3101; `next.config` takes `distDir` from `DSE_NEXT_DIST`, and the QA server restores the `next-env.d.ts` and `tsconfig.json` Next rewrites for that folder) and captures home with Plans, the sign-in sheet, the budget and run-limit states with the UpgradePrompt and the billing page at three viewports into `qa/billing`, with axe on each. It runs in `verify:all` after `qa:axe`.
- With the flag on and no session, TopNav shows a `sm` ghost "Sign in" button (copy reuses the SignInSheet title) that opens the SignInSheet; AccountMenu and PlanBadge need a session, so in v1 they are seen only in the catalog. "Choose Pro" and "Choose Team" open the SignInSheet without a session and the adapter's checkout with one.
- The billing page without a session shows the visitor's free plan, the runs this visitor started since the budget day began and the pages they captured (`visitorUsage` over the runs table), a Meter against the plan's runs per day, and "Manage subscription" disabled. The current plan is written as its name; the PlanBadge belongs to TopNav.
- The UpgradePrompt is a tinted block inside the StateCard above the key form, because Cards never nest. The Plans grid has three columns down to tablet and stacks on phones. The runs and pages feature lines read from entitlements (copy rule 10). The SignInSheet's content is 440 wide at most, centered on wide screens.
- `copy.md` gains the "Sign in" trigger, the billing meter label, the billing page metadata and the usage line's singular forms (`1 run`, `1 page`, as D-059).
Affects: `docs/specs/v2-seams.md`, `docs/specs/architecture.md`, `docs/design/components.md`, `docs/design/pages.md`, `docs/design/copy.md`, `apps/web/`, `scripts/qa-server.mjs`, `playwright.billing.config.ts`, `tests/billing/`, `tests/e2e/flag-off.spec.ts`.

## D-061 · QA starts every page at one moment; the one golden that follows the clock

Date: 2026-10-26 · Context: P12's gate holds every P11 page golden unchanged. The in-progress run pages write their elapsed time from the reader's clock and Recent runs writes "Today" from it, so their captures depended on when QA ran. The elapsed text is masked, but at 390 px the masked meta line wraps by the length of that text, so the page height itself followed the clock. Separately, `.gitignore`'s `qa/` matched `tests/qa/` as well as the root screenshot folder, so the QA registry and the design, visual and axe specs were never committed.
Decision:
- QA (design, visual, axe and the billing captures) starts every page at `qaNow` (`tests/qa/pages.ts`): two minutes and 41 seconds after the frozen in-progress runs began. The clock is shifted, not stopped, because GSAP's ticker reads it. Recent runs and the Compare picker read the reader's clock, as their rows come from browser storage.
- `run-390-after-select` is the one page golden updated in P12: its masked meta line now wraps to three lines at `qaNow` where the P11 capture, taken at another time, wrapped to two. Every other page golden, the other eight in-progress ones included, is the P11 file unchanged and passes.
- `.gitignore` names the screenshot folder from the root (`/qa/`); `tests/qa/` is committed.
Reasoning: a golden that changes with the hour is not a regression test; the gate's intent (no page changed by P12) holds for every page whose rendering does not depend on the clock, and the exception is named.
Affects: `tests/qa/pages.ts`, `tests/qa/visual.spec.ts`, `apps/web/test/goldens/run-390-after-select.png`, `.gitignore`.

## D-062 · A narrow plan card sets its period beneath the price

Date: 2026-10-26 · Context: the P12 review at 820 px and in the catalog's desktop column. Three plan cards there are about 232 px wide: "[PRICE]" in `stat` left no room for "per month", so Pro and Team wrapped the period to a second line while Free kept it beside "0", and the feature lists' top rules sat at different heights across one row.
Decision: each plan card is a size container; below 280 px of card width every card sets the period beneath the price, above it the period sits beside the price. One row always shares one layout.
Reasoning: cards in a row share their edges (`quality-bar.md`); a rule that depends on each card's own text would not.
Affects: `docs/design/components.md`, `apps/web/components/v2/v2.module.css`.

## D-063 · The showcase script made exact

Date: 2026-10-26 · Context: P13 built `pnpm showcase` against `showcase.md`, on the P10 admin routes. Step 5 sets and unsets `is_showcase`, which the `--remote` path cannot do from the owner's machine; the P13 dry run must exercise the real roster without replacing the fixture showcase the goldens read; and "cost logged under purpose `showcase`" named a model-call purpose that does not exist (a call's purpose is what it is for: select, colors, components, collision, narrative).
Decision:
- `POST /api/admin/showcase/content` lists exactly the content's runs: each named run gets `is_showcase` and null retention, every other showcase run is taken out with a 90-day retention, in one transaction. Content naming a run that is missing, unpublished or not complete is refused with 400 and changes nothing. The local path calls the same function (`syncShowcase`).
- `--dry-run` runs the sites and prints the table but writes no content and lists nothing; its runs keep a 90-day retention. The report of every run is also written to `.dse/showcase-report.md`.
- A run is replaced when it blocks (at the pre-check or in the worker), fails, is cancelled, or comes back sparse or without stats. The replacement is the first untried alternate of the same category, else the first untried alternate; it takes the replaced site's order. The listed entries are the largest multiple of six, earliest in roster order.
- Locally, the script runs its own worker (configured as the worker service, with the build meter) unless a `pnpm dev` worker's heartbeat is live; in live mode it checks the build meter before every site and stops when the meter refuses.
- `--only host` takes a roster host, or an alternate already listed, and replaces that entry by order; a blocked or sparse result leaves the content as it was.
- Showcase runs are kept off the public budget by the worker (P10); their cost is the run's own `cost` record and the script's table, not a model-call purpose.
Affects: `docs/specs/showcase.md`, `docs/specs/architecture.md`, `apps/web/app/api/admin/showcase/content/route.ts`, `packages/pipeline/src/db/runs.ts`, `scripts/showcase/`.

## D-064 · EvalTable lays out by its own width and labels its stacked cells

Date: 2026-10-26 · Context: found in the P12 catalog review, a P11 defect. EvalTable chose its layout from the viewport: in the catalog's desktop column (746 px at a 1440 viewport) it kept the no-wrap desktop rule and ran out of its card into the phone frame. On phones it hid the header row, so each fixture's two `precision · recall` lines and its live count had no label. Narrow cells also broke inside "precision 1.00" and "26 of 27".
Decision: the table is a size container and lays out by its own width, as RecentRunRow does (D-059): one line per value from 1000 px, wrapping values from 560 px, stacked rows below 560 px. Stacked, each measured cell shows its column name (`Tokens`, `Components`, `Live previews`, the header strings) above its value. A value wraps only at its interpunct; "precision 1.00", "recall 1.00" and "26 of 27" never break. The text is unchanged.
Reasoning: a number without its label is not a measurement a reader can use; the component must hold its layout wherever it is placed.
Affects: `docs/design/components.md`, `apps/web/components/how/`, the how-it-works goldens at 820 and 390, the catalog goldens.

## D-065 · Page metadata made exact

Date: 2026-10-26 · Context: the P13 metadata review against `copy.md` and `pages.md`, with a test that reads both. Next merges metadata shallowly, so a page that set its own `openGraph` (the run and component pages) dropped the layout's, and no page set an `og:title` or `og:description`. The home page's file-based image reached only the home segment, so "every other page uses the home image" was not true of any page. The catalog's title carried the suffix twice; the 404 had no title of its own; an in-progress run's description read "0 colors, 0 type styles and 0 components".
Decision:
- One helper (`apps/web/lib/meta.ts`) writes every page's title, description, link preview and indexing: `og:title` and `twitter:title` are the full title, `og:description` and `twitter:description` the description, `og:site_name` the wordmark, `twitter:card` `summary_large_image`, and the image is the run's `/og` route on run and component pages and the home image (`/opengraph-image`) everywhere else.
- The 404, and a state route that does not exist, are titled `Not found` with the App 404 body as the description. A run that has not finished uses the global meta description, because its counts are not known yet. Both lines are in `copy.md`.
- `tests/e2e/metadata.spec.ts` reads the Page metadata and Global lines of `copy.md` and checks every route's title, description, preview tags, image and indexing, and that both images answer 1200 × 630 PNGs.
Affects: `docs/design/copy.md`, `docs/design/pages.md`, `apps/web/lib/meta.ts`, every `apps/web/app/**/page.tsx` with metadata, `apps/web/app/layout.tsx`, `apps/web/app/not-found.tsx`, `tests/e2e/metadata.spec.ts`.

## D-066 · A run fits its timeout: run-wide novelty, a time budget, parallel naming and render checks, safe navigation

Date: 2026-10-26 · Context: the P13 dry run on the real roster. Built to the specs, a 12-page site could not finish in the 6-minute timeout: stripe.com timed out inside capture, and with a 15-minute timeout took 773 s (discover 60 s, capture 270 s, naming 109 s, previews 314 s). Every page re-measured the header, footer and nav that every page shares; naming and render checks ran one at a time; and on coinbase.com a state probe's click followed a link, the page's context was destroyed, and one element failed the whole run.
Decision:
- Novelty is run-wide per viewport. A preliminary cluster's matched CSS (keyed by its novelty key and subtree size), states, `open` popup and reduced-motion reading are taken where it is first seen; later pages measure only the clusters they add, and only a viewport's first page fills the state cap by area. Novelty is decided in page order (`NoveltyLedger`): a page reads what the pages before it chose, waiting for their choices, never whichever page finished first, so a run measures the same clusters every time and model requests replay. Previews build from the earliest instance of the same variant whose CSS was read; the placeholder color reads a sibling's rules when an instance has none.
- A time budget in shares of the timeout, from the run's start (`packages/pipeline/src/budget.ts`): fingerprints 12%, states 45%, naming 70%, render checks 88%, narrative 94%. Past its share each step takes its lighter path: path-pattern grouping, default captures only, the deterministic names, the crop with the new captured reason `not-checked` ("not checked in time"), the narrative template. Each cut is an event.
- Component naming runs four batches at once; answers are applied by batch, so names never depend on timing. Render checks run in three lanes, each on its own page; the font copier shares one fetch per font. The alignment search descends from the unshifted position to the best neighbouring shift instead of trying all 25.
- The capture page script stops link navigation (the click still reaches the page's handlers) and `window.open`, as the spec's "never follow a link" requires. A page that navigates itself anyway keeps what was measured; the rest of its probes end, those elements' states read `not reachable` (a reason already in the copy), and the run continues.
Reasoning: the timeout, the page cap and "usually finishes in about 3 minutes" are product promises; repeated measurement of shared chrome bought nothing; a budget makes completion a guarantee rather than a hope, and every cut is labeled where a reader sees it.
Affects: `docs/specs/capture-and-states.md`, `docs/specs/caps-and-budget.md`, `docs/specs/crawler.md`, `docs/specs/model-calls.md`, `docs/specs/preview-fidelity.md`, `docs/specs/data-model.md`, `docs/design/copy.md`, `packages/schema/src/enums.ts`, `packages/schema/src/labels.ts`, `packages/pipeline/src/`.

## D-067 · The drift constraint holds pairs that pass at today's token values

Date: 2026-10-26 · Context: on stripe.com the proposal reported "contrast not kept" and folded no grays at all. A contrast pair is measured on raw colors; clustering merges colors within ΔE 2.3, so a pair can pass raw (4.6:1) and fail at its tokens' values (3.9:1). No proposal can keep such a pair, so every size failed and the identity mapping stood.
Decision: a pair constrains the proposal when it passes both as measured and at today's token values. The proposal never lowers a ratio of the system it is compared with.
Affects: `docs/specs/drift.md`, `packages/pipeline/src/drift/proposal.ts`, `packages/pipeline/test/drift.test.ts`.

## D-068 · Matched CSS is read from the page's CSSOM

Date: 2026-10-26 · Context: CDP's `CSS.getMatchedStylesForNode` returns every ancestor's matched rules with each node. On stripe.com that was 239 KB a node, 95% inherited rules, at 5.7 ms a node: 31 s for one page's components, and most of a run's capture time.
Decision: matched rules are read in the page. Each stylesheet's rules are walked in document order (`@media` and `@supports` evaluated with `matchMedia` and `CSS.supports`, layers, imports and container rules walked); each selector of each rule is matched once with `querySelectorAll` against the wanted elements (a selector whose last compound names a class, id or tag no wanted element carries is skipped; escaped selectors are always matched); pseudo-elements `::before`, `::after`, `::placeholder` and `::marker` are matched on their base. Declarations come from the browser's serialization of each rule. A stylesheet the page cannot read (cross-origin without CORS) is fetched once per run by the worker through the guarded fetch and parsed by the browser as a constructed sheet. The output keeps the `MatchedStyles` shape in stylesheet order, which is what the preview builder needs: the preview document re-applies the cascade itself. On stripe.com the home page's matched CSS fell from 31 s to 1 s.
Affects: `docs/specs/capture-and-states.md`, `packages/pipeline/src/capture/cssom-match.ts`, `packages/pipeline/src/capture/matched-css.ts`, `packages/pipeline/src/stages/capture.ts`.

## D-069 · Component code is the component's own rules with token variables; whole-system documents bound their code

Date: 2026-10-26 · Context: the P13 dry run on stripe.com wrote a 1,104 KB design-system.md and a 522 KB prompt. Two causes. Each component's CSS was the whole preview document's CSS (four `@font-face` lines pointing at storage, the `.dse-root` sizing rules, and capture's own freeze rules, which the matched CSS had taken for the site's, with a doubled `!important`), so even the clean fixture's 27 components carried about 2 KB of scaffolding each. And `components.md` asks for "the extracted declarations with token variables substituted where a value maps", which was never done.
Decision:
- A component's `code.css` (the Code tab, the exports, the MCP server, the zip's `preview.css`) is its own matched rules, with a value that equals a token written as that token's variable, by property: colors anywhere, space steps in padding, margin and gap, radius steps in border radii, a whole box-shadow equal to a shadow token. Names are the raw set's, as `tokens.css` writes them. The preview document keeps its fonts and root rules; capture marks its freeze stylesheet and the matched CSS skips it.
- In design-system.md every component keeps its section, and a snippet over 3,000 characters of HTML or 4,000 of CSS is cut at a tag or declaration boundary, with a comment: `shortened · {kept} of {total} characters · the component's own prompt has all of it`.
- The whole-system prompt carries component CSS (each shortened as above) within 48,000 characters, in grid order; contracts past the budget keep their states and tokens, and one line says the component's own prompt has its code. A component's own prompt keeps all of its code.
Reasoning: design-system.md is for a repository's documentation and a prompt for a model's context; both must stay readable on a large site, and the full code stays one click or one tool call away.
Affects: `docs/design/components.md`, `docs/specs/exports-and-mcp.md`, `packages/pipeline/src/exports/`, `packages/pipeline/src/previews/build.ts`, `packages/pipeline/src/stages/previews.ts`, `packages/pipeline/src/stages/capture.ts`, `packages/pipeline/src/capture/cssom-match.ts`, the export goldens.

## D-070 · Triggers stay apart from action controls in the name merge and the novelty key

Date: 2026-10-26 · Context: re-recording the fixtures for D-066, the model named the css-in-js and Tailwind menu trigger and the planted unnamed copy button both "Icon button". The cross-page merge of same-named clusters then joined them, the copy button vanished and its planted label failure landed on the menu button. D-054 keeps a trigger apart from an action button in clustering, but the merge by name did not ask. Separately, on sites whose class names carry nothing (hashed or utility), the run-wide novelty key (tag, role, classes, ground, height) could not tell the copy button from an earlier control, so it was never probed.
Decision: two same-named clusters merge, by style or by the collision call, only when both are triggers or neither is. The novelty key also carries whether the element opens something (`aria-haspopup`, `aria-controls`, `aria-expanded`) and whether it is icon-only (fewer than two characters of text), the two distinctions clustering already keeps (D-052, D-054). With both, every fixture passes every threshold with states at 1.000.
Affects: `docs/specs/capture-and-states.md`, `docs/specs/component-detection.md`, `packages/pipeline/src/capture/candidates.ts`, `packages/pipeline/src/stages/components.ts`.

## D-071 · Showcase runs get their own, longer timeout

Date: 2026-10-26 · Context: with D-066, stripe.com completes inside the 6-minute timeout, but only by leaning on the time budget: on its 22,000 px pages capture took 178 s, so most components kept their deterministic names and most previews were not checked. That is an honest result for a visitor's run. The showcase is different: the owner's runs, generated once, and the first thing every visitor sees.
Decision: a run at showcase priority (10) takes `DSE_SHOWCASE_TIMEOUT_MS` (default 900000, 15 minutes) instead of `DSE_RUN_TIMEOUT_MS` (360000). The budget shares apply to whichever timeout the run has. The timeout detail is computed from the run's own timeout: `Timed out after {minutes} minutes.` A visitor's run is unchanged.
Reasoning: the showcase should show the product complete; visitors keep the promise they were given.
Affects: `docs/specs/caps-and-budget.md`, `docs/design/copy.md`, `.env.example`, `packages/schema/src/env.ts`, `packages/pipeline/src/errors.ts`, `packages/pipeline/src/run.ts`, `apps/worker/src/`, `scripts/showcase/index.ts`, `scripts/db-seed-fixtures.ts`.


## D-072 · Hidden text is not a type style; the Notion entry is notion.com

Date: 2026-10-26 · Context: the P13 dry run of the real roster failed apple.com and airbnb.com at the end of the tokens stage. Both pages carry text set to `font-size: 0` or `line-height: 0` (screen-reader text and icon wrappers), which became a type tuple with size or line height 0, and the run document schema, which requires both to be positive, refused the document, so the run ended "The crawler stopped unexpectedly." Separately, notion.so now redirects to notion.com, another host, so the crawler blocked it as "redirected off-site", as `docs/specs/crawler.md` requires.
Decision: type collection skips text whose computed font size or line height is zero; its colors still count. The roster's sixth entry is notion.com. The off-site redirect rule is unchanged.
Reasoning: text at zero size is not seen, so it is not part of the system a visitor reads; the roster names the site's current home rather than loosening a security rule for one domain.
Affects: `docs/specs/token-clustering.md`, `docs/specs/showcase.md`, `packages/pipeline/src/tokens/collect.ts`, `scripts/showcase/roster.ts`.

## D-073 · Visual goldens also take an absolute bound of 25 pixels

Date: 2026-10-26 · Context: the visual gate compared with `maxDiffPixelRatio: 0.001` alone, which on tall pages allows thousands of pixels (about 7,750 on a 1440 run page). Measured with no tolerance at all, 118 of 125 goldens matched to the pixel, and the other seven differed by 280 to 1,841 pixels: real data changes from the P13 reseed (Compare's removed token names and its component rows, the in-progress run's palette strip and progress bar) that had passed under the ratio and so were never refreshed.
Decision: every screenshot and OG comparison takes `maxDiffPixels: 25` beside the ratio; Playwright applies the smaller of the two. The seven goldens were reviewed and updated.
Reasoning: rendering here is deterministic, so a bound near zero costs nothing in flakes and catches a changed digit or a moved line on any page height.
Affects: `playwright.qa.config.ts`, `tests/qa/visual.spec.ts`, seven goldens in `apps/web/test/goldens/`.

## D-074 · What a worker crash, a Redis outage and a storage outage end in

Date: 2026-10-26 · Context: P14's chaos tests need the specified statuses, and the specs give them only for a crash. The web app also built its Redis client with BullMQ's worker settings (no retry limit per request), so with Redis down `POST /api/runs` waited for it indefinitely instead of answering.
Decision:
- A worker killed mid-run: its job's lock lapses, the next worker finds the job stalled and runs it again from the beginning (document, pages and log reset); a run that completes is counted once. A second crash fails it with the stopped detail and refunds it, as before.
- Redis down when a run is requested: the web app's client (`createApiRedis`: one retry per request, 5 s connect and command timeouts) fails the pre-check within seconds; the route answers 500 with "Something broke on our side." and no run exists. When only the enqueue fails, the run row it created ends `failed` with the stopped detail, and the count refund and the reservation release are each attempted on their own, so one failing cannot keep the others from happening; failures are logged.
- Storage down during capture: the run ends `failed` with the stopped detail and is refunded. The file storage used by the CLI and evals treats only a missing file as missing.
- The OG route logs a failed write of its image instead of ignoring it; the image is still served.
Reasoning: a visitor gets an answer in seconds, never a run left queued forever, and is never charged for a run that could not happen.
Affects: `docs/specs/caps-and-budget.md`, `packages/pipeline/src/queue/redis.ts`, `packages/pipeline/src/context.ts`, `apps/web/lib/server/services.ts`, `apps/web/lib/server/runs.ts`, `apps/web/app/api/runs/[id]/og/route.tsx`, `apps/web/test/chaos.int.test.ts`.

## D-075 · The soak, the leak it found, and the image smoke test

Date: 2026-10-26 · Context: P14 asks for memory checks under a 10-run soak and for the worker image to run a fixture extraction end to end against the Docker services; neither had a script or a pass rule.
Decision:
- `pnpm soak` sends ten fixture runs (the five eval fixtures twice, each as its own visitor) through one in-process worker against the test database, Redis database 15 and the test bucket. It passes when every run completes with a valid document, the worker's RSS stays under the 1.5 GB restart threshold after every run, the browser holds no context and no page between runs, and the heap left after a full collection grows by no more than 64 MB from run 2 to run 10. It writes `.dse/soak.json`.
- The first soak passed these rules but showed the heap growing about 3.7 MB a run. Heap snapshots traced it to JSDOM documents: every preview's placeholder window was never closed, and the sanitizer's second pass created a new document in its shared window each call. Both are fixed: the preview builder closes its window, and the second pass parses into a template's one inert document. Six runs in a row now hold the heap within a megabyte a run after the first.
- `pnpm docker:smoke` builds `apps/worker/Dockerfile` from the repository root, runs the image against the Docker services through `host.docker.internal` (test database, Redis database 15, test bucket, the fixture server), sends it the clean fixture through the same admission code as a visitor, waits for the run to complete with a valid document, live previews and checks, then stops the container with SIGTERM and requires a clean exit. The container runs with `NODE_ENV=development` because production ignores the private-host allowance that lets it reach the host, and with `fixtures/recordings` mounted for replay. The image itself is unchanged.
Reasoning: both rules are measurements a fresh checkout can repeat; the leak would have grown without bound in a worker that only restarts its browser.
Affects: `scripts/soak.ts`, `scripts/docker-smoke.ts`, `package.json`, `apps/worker/src/browser.ts`, `packages/pipeline/src/previews/build.ts`, `packages/pipeline/src/previews/sanitize.ts`, `docs/specs/caps-and-budget.md`.

## D-076 · Rulings from the P15 traceability sweep

Date: 2026-10-26 · Context: mapping every section of every spec and design document to code and tests (`docs/traceability.md`) found places where the code and the documents disagree. Each is settled here, by changing the code where the document was right and by fixing the document where the code is the better answer.
Decision, code changed to match the documents:
- Intermediate capture files (snapshots and matched CSS) are deleted when a run is done unless `DSE_KEEP_INTERMEDIATE=1`; they were written and never removed.
- Past the 6,000-element snapshot cap, element candidates (controls, elements with a role or a popup) and their ancestors are still recorded; everything past the cap was dropped.
- Rule classification gains the missing structural forms: a checkbox in a label beside a rounded track is a toggle, an ordered list of links with separators is a breadcrumb, a list or nav of numbered links is pagination, and a form needs two or more fields.
- A responsive variant compares flex direction as well as display.
- Cancel reads the run through `getRunForViewer`, the one read path.
- RegionSkeleton is a component with the documented shapes per region (8 swatches, 8 type rows, 9 spacing bars, 6 cards, the checks summary and 5 rows, 3 drift numbers, 6 export cards and the MCP card) and has a catalog entry.
Decision, documents changed to match the code:
- The reachability check after two failed pages is a GET of the origin, since many servers refuse HEAD.
- An interstitial that never settles is not a separate test: it either shows a challenge marker once loaded (bot) or the start page fails to load (unreachable).
- `body` is a page reason (a link in the start page's body), as the enum, data-model.md and copy.md already had it.
- The settings, dashboard and app row is scored by path; a page behind a login is caught at capture as a login wall.
- The fingerprint has no box buckets and the card structure lists child tags, not child clusters. Size enters through the variant split's height bucket. Adding box buckets now would re-cluster every fixture and every recording for no measured gain: every fixture passes every threshold with component precision and recall at or above 0.926.
- The model's `variantHint` is a description that helps the model; variant names come only from the deterministic naming, which already gives `Outlined` where it applies.
- Naming batches go in first-seen order across pages with four calls in flight (D-066), not per page group.
- Component ids are a hash of the group key, stable across repeated runs; the document is ordered as the spec says.
- `@keyframes` never reach a preview, because a preview carries only the rules matched to its elements; the app's dev CSP allows `'unsafe-eval'` for the Next.js dev server only.
- drift.md's sentence on component code follows D-069 (token variables).
- The typed errors are `BlockedError`, `TimeoutError`, `CancelledError`, `ModelAuthError` and `ReplayMissError`; there is no `ModelError`, because every other model failure is absorbed by its fallback.
- Allow and block decisions go through `check`; a created run's values come from `limitsFor` in the same module.
- Server components read the session through `currentSession()`, the same auth adapter as `resolveViewer`.
- The phone breakpoint is read in JavaScript through `useMedia`, which follows changes, for the panel and sheet, the Popover on phones and the CaptureViewer.
- There is no state captures index file; state captures reach storage as component crops.
Reasoning: the documents are the spec, so where the code fell short it was fixed; where the code is right for a reason the document did not foresee, the document now says what the product does and why.
Affects: `docs/specs/crawler.md`, `docs/specs/page-selection.md`, `docs/specs/capture-and-states.md`, `docs/specs/component-detection.md`, `docs/specs/preview-fidelity.md`, `docs/specs/drift.md`, `docs/specs/architecture.md`, `docs/specs/caps-and-budget.md`, `docs/specs/v2-seams.md`, `docs/design/design-system.md`, `docs/design/components.md`, `packages/pipeline/src/run.ts`, `packages/pipeline/src/capture/snapshot-script.ts`, `packages/pipeline/src/stages/capture.ts`, `packages/pipeline/src/components/classify.ts`, `packages/pipeline/src/stages/components.ts`, `apps/web/lib/server/runs.ts`, `apps/web/components/run/RegionSkeleton.tsx` and the run sections, the catalog.

## D-077 · More rulings from the P15 sweep: tokens, conventions, the 404 candidate, fonts

Date: 2026-10-26 · Context: the tests written to close the traceability gaps found a second set of differences between the code and the documents.
Decision, code changed to match the documents:
- Seven stylesheets set a literal 2 px radius. Hairline details need it, so the design system gains `radius-xs` (2 px) and they use it; the design-rules test reads the radius tokens from `tokens.css`.
- The account menu's icon was 18 px; it is 20, as the icon rule says.
- The Open Graph image and the catalog's frame label held literal copy; they read `strings.ts`, and copy.md gains the frame label.
- The run id in the run page's footer and in the failed and cancelled bodies is set in mono, as copy rule 11 says.
- The synthetic 404 candidate ranks right after the start page and visitor includes under the 300-candidate cap, so a large site still gets its empty state; it ranked last and was always cut.
- A font file is copied for previews only when the site serves it (same host, with or without `www.`) or its server allows cross-origin use (`Access-Control-Allow-Origin` of `*` or the site's origin, asked with an `Origin` header).
Decision, documents changed to match the code:
- Three CSS Modules are shared by a family of components and named after it: `Catalog`, `HowItWorks`, `v2`.
- The 300-candidate priority names every source the crawler has: the start page, visitor includes, the synthetic 404, header links, other navigation, footer links, sitemap, body.
- Path-pattern groups apply to every candidate, fetched or not.
- Drift evidence is capped at 40 rows in the document, which every surface reads; the numbers count every finding.
- The drift narrative's fallback event line carries its reason, as model-calls.md says for every fallback.
- The home page's one-hour revalidation is set on the fetch of the showcase object.
- copy.md's placeholder for the source paths is `{paths}`, as `strings.ts` has it.
Reasoning: the same as D-076.
Affects: `docs/design/design-system.md`, `docs/design/copy.md`, `docs/specs/architecture.md`, `docs/specs/crawler.md`, `docs/specs/drift.md`, `docs/specs/showcase.md`, `apps/web/styles/tokens.css`, seven CSS Modules, `apps/web/components/v2/AccountMenu.tsx`, `apps/web/app/api/runs/[id]/og/route.tsx`, `apps/web/components/catalog/CatalogView.tsx`, `apps/web/components/run/RunView.tsx`, `packages/pipeline/src/stages/discover.ts`, `packages/pipeline/src/crawl/fetch.ts`, `packages/pipeline/src/previews/fonts.ts`.

## D-078 · Fixes from the P15 end-to-end and script tests

Date: 2026-10-26 · Context: the tests written to close the last traceability gaps ran the product the way a visitor and the owner do, and found four faults and one contradiction.
Decision:
- A direct visit to a blocked run redirected to `/state/undefined`: the server page read the reason-to-route table from a client module. The table lives in `apps/web/lib/state-route.ts`, a plain module, and a test keeps server code from importing values from client modules.
- A toast that replaces another waited for nothing: both were on screen for about 200 ms. The toast region now lets the old one leave before the new one enters, as motion.md's Reverses says.
- The fixture seed and the showcase script built their worker's Redis connection by duplicating the web app's client, which D-074 made fail fast; BullMQ refuses that for a worker, so a fresh seed would have failed. Both create the worker's own connection.
- Naming and render checks cut by the time budget now log their cut as an event, as every cut must.
- motion.md said only transform, opacity, clip-path and stroke-dashoffset animate, yet asked for a focus ring that fades and hover changes of ground and text. The rule now says what the product does: movement and reveals use those four; hover and focus may change colors (color, background-color, border-color, outline-color, text-decoration-color, box-shadow) over `motion-fast`; the opened card's ring fades its outline color over `motion-slow`. A test holds every stylesheet to it.
- For tests: the showcase script reads a roster from `DSE_SHOWCASE_ROSTER` and writes its report to `DSE_SHOWCASE_REPORT` when set, so its orchestration runs end to end on fixture sites; `pruneRecordings` and the worker's `devMeterFor` are their own functions, so their rules are tested directly. The messy fixture's expected file names its planted promo card, which must come out captured with reason `diff`.
Reasoning: each is the documented behavior; the motion rule was the document's own contradiction, settled toward what reads well and costs nothing in frames.
Affects: `docs/design/motion.md`, `docs/evals.md`, `apps/web/lib/state-route.ts`, `apps/web/lib/submit-run.ts`, `apps/web/app/r/[id]/page.tsx`, `apps/web/components/Toast.tsx`, `scripts/db-seed-fixtures.ts`, `scripts/showcase/`, `scripts/evals.ts`, `scripts/evals/prune.ts`, `apps/worker/src/config.ts`, `packages/pipeline/src/stages/components.ts`, `packages/pipeline/src/stages/previews.ts`, `packages/schema/src/expected.ts`, `fixtures/sites/messy/expected.json`.

## D-079 · Grid entrances, exits first, and the row hover

Date: 2026-10-26 · Context: the motion tests written to close the last gaps found that the showcase and component grids never played their reveal on a page load (their items were present at the first render, which `AnimatePresence initial={false}` skips, so they appeared without an entrance), that after a filter change the entering cards began while the leaving ones were still closing (the delay meant to hold them sat in a transition prop the variant's own transition overrode), and that the row hover in design-system.md and motion.md was not implemented anywhere.
Decision:
- Grid items present at the first render start hidden and reveal when their grid comes into view, as motion.md and D-058 say; each card carries its own animate state, so nothing depends on a variant passing through the presence boundary.
- After a filter change, entering cards wait for the leaving ones: `afterExits` adds the exit's length (the content's `motion-fast` wipe, then the frame's `motion-base` close) to the entering variant's own delay. Cards that stay keep their element and move with `layout`.
- The row hover applies to rows that lead somewhere, the recent runs list: the `surface-tint` ground extends from the left as a `scaleX` transform over `motion-fast`, and the row's hairline hides. Table rows (checks, compare, evidence) are read, not clicked, and stay still.
Reasoning: the documents describe the product's entrances and hovers; these make the code do what they describe, with every move on an allowed property.
Affects: `docs/design/design-system.md`, `apps/web/lib/motion/moves.ts`, `apps/web/components/home/Showcase.tsx`, `apps/web/components/run/ComponentsSection.tsx`, `apps/web/components/recent/RecentRunRow.module.css`, `tests/e2e/motion.spec.ts`.

## D-080 · Skeleton heights, the published eval results, and the last test seams

Date: 2026-10-26 · Context: closing the last three traceability gaps measured the in-progress run page against a complete one: each RegionSkeleton was 70 to 270 px shorter than a typical result at 1440, so everything below a region jumped when it filled, against motion.md. Separately, the final live eval must be what How it works shows, but every replay in `verify:all` would have overwritten it.
Decision:
- Each skeleton takes the clean fixture's heights at 1440 (the typical result): the color card 483, type 580, spacing 446, the components filter row, cards and Show all, the checks summary 143 and table 374, the exports download row, cards 149 and the MCP card 158. A test holds the in-progress page within 4 px of the complete one for every region but drift, which varies by design and animates its height.
- `fixtures/results.json` holds the final live run. A replay writes it only when it is not a live run's; otherwise it scores and keeps it.
- The showcase script reads its content from `DSE_SHOWCASE_CONTENT` when set, so its `--remote`, `--only` and `--refresh-links` paths run in a test against a stub of the admin API without touching the committed content.
Reasoning: the documents ask for a page that fills without moving and for published numbers from a live run; the seams let tests prove the script's every path.
Affects: `docs/design/components.md`, `docs/evals.md`, `apps/web/components/run/RegionSkeleton.tsx`, `apps/web/components/run/RegionSkeleton.module.css`, `apps/web/components/run/TokensSection.tsx`, `scripts/evals.ts`, `scripts/showcase/index.ts`, `tests/e2e/motion.spec.ts`, `scripts/test/showcase.int.test.ts`.

## D-081 · The motion layer is part of the system

Date: 2026-10-27 · Context: v1.1, the owner's first real runs (linear.app). Transitions, easings, durations, keyframes, entrances and scroll reveals were read and discarded. The v1.1 addendum listed this decision as D-027; that id was already taken (D-089).
Decision: durations and easings are token kinds; keyframes and runtime motion patterns are captured and exported; patterns measured at runtime rather than read from CSS are labeled observed. The motion layer is specified in `docs/specs/motion-capture.md`.
Reasoning: a design system without its motion rebuilds as a static page, which the first real run proved.
Affects: `docs/specs/motion-capture.md`, `docs/specs/data-model.md`, `docs/specs/capture-and-states.md`, `docs/specs/token-clustering.md`, `docs/specs/component-detection.md`, `docs/specs/exports-and-mcp.md`, `docs/specs/drift.md`, `docs/design/pages.md`, `docs/design/components.md`, `docs/design/copy.md`, `docs/glossary.md`, `docs/evals.md`.

## D-082 · The site's own names win

Date: 2026-10-27 · Context: v1.1. The site's own token names (`--color-text-tertiary`, `--radius-rounded`, `--text-small-size`) were discarded in favor of generated hue steps. The addendum's D-028.
Decision: a non-hashed custom property that resolves to a token's value names the token, for every kind, before the deterministic and model names. The model never renames a site-named token.
Reasoning: the site's names are its design system; generated names are a fallback.
Affects: `docs/specs/token-clustering.md`, `docs/specs/model-calls.md`, `docs/specs/data-model.md`, `docs/specs/exports-and-mcp.md`.

## D-083 · Exported component code is the preview CSS

Date: 2026-10-27 · Context: v1.1. Component code shipped with unresolved variables (`var(--ease-out-quad)`, `var(--sx-1fj52yw)`) and with resets (`* { box-sizing }`, a 7,659-character `unset` dump). The addendum's D-029. Supersedes D-069 where they differ: code is still the component's own rules with token variables, never the preview's scaffolding, but it is now the reset-filtered, resolved CSS the preview renders from.
Decision: component code in every export is the preview's rules: scoped selectors, resets filtered, every custom property either a token of that export, a site variable that export declares, or resolved inline. Raw matched CSS is never exported. A test forbids an undeclared `var()` reference in any export.
Reasoning: code a consumer cannot resolve is not code.
Affects: `docs/specs/preview-fidelity.md`, `docs/specs/exports-and-mcp.md`, `docs/design/components.md`.

## D-084 · Names are never numeric

Date: 2026-10-27 · Context: v1.1. Variant and component names leaked the numeric fallback (`Ghost 2` to `Ghost 5`, `Variant 4`, `Button 28`). The addendum's D-030. Supersedes the numbering in D-052 (variant names, the fallback `Card 2`) and in copy.md.
Decision: variants that would share a name get a third word from the first field on which they differ, or merge; fallback component names take a context; a final pass renames any component or variant name that ends in a digit and logs it.
Reasoning: `Button 28` and `Ghost 5` tell a reader nothing.
Affects: `docs/specs/component-detection.md`, `docs/specs/model-calls.md`, `docs/design/copy.md`, `docs/evals.md`.

## D-085 · Components have a tier

Date: 2026-10-27 · Context: v1.1. Page-specific one-offs were presented with the same weight as the core set. The addendum's D-031.
Decision: each component is `core` or `page` by the rule in `component-detection.md`; the UI, the exports and the prompt lead with core components.
Reasoning: a model building from the export should start from the system, not from a one-off.
Affects: `docs/specs/component-detection.md`, `docs/specs/exports-and-mcp.md`, `docs/design/pages.md`, `docs/design/copy.md`.

## D-086 · Translucent colors are overlays

Date: 2026-10-27 · Context: v1.1. Translucent colors were filed as palette steps (`--color-gray-300: #BAC2D699`). The addendum's D-032. Supersedes the part of D-048 that formed color tokens with alpha below 1: those are now overlays, and near-duplicate pairs are formed among opaque palette tokens only.
Decision: a raw color with alpha below 1 is an overlay, filed as a base color plus an alpha, in its own group, never a palette step, and never counted in drift's gray or brand counts.
Reasoning: `gray-300: #BAC2D699` is not a gray.
Affects: `docs/specs/token-clustering.md`, `docs/specs/data-model.md`, `docs/specs/drift.md`, `docs/specs/exports-and-mcp.md`, `docs/design/pages.md`.

## D-087 · Type roles come from size ratios, not tags

Date: 2026-10-27 · Context: v1.1. Type names were tag-derived and meaningless (`h2-4`, `other-10`, an `h2` that is a 15 px label). The addendum's D-033.
Decision: the role set is `display`, `title`, `heading`, `subheading`, `body`, `body-sm`, `label`, `eyebrow`, `caption`, `code`, `text`, assigned from each tuple's size relative to body; tags are recorded as provenance; several tuples of one role take words, never numbers.
Reasoning: sites use heading tags for layout, and tag-derived roles named a 15 px label `h2`.
Affects: `docs/specs/token-clustering.md`, `docs/specs/data-model.md`, `docs/design/copy.md`, `docs/evals.md`.

## D-088 · State diffs track a fixed property set with noise rules

Date: 2026-10-27 · Context: v1.1. State diffs recorded colors only, never transform, filter, opacity or shadow, and carried noise (four `border-*-color` lines, `outline-color` on elements with no outline). The addendum's D-034.
Decision: the state diff tracks the property set in `capture-and-states.md` and nothing else; equal border sides collapse to one entry; outline entries are dropped when there is no outline in either state; each entry carries the transition timing that covers its property.
Reasoning: a hover that lifts and glows was recorded as a color change.
Affects: `docs/specs/capture-and-states.md`, `docs/specs/data-model.md`, `docs/evals.md`.

## D-089 · Rulings from merging the v1.1 addendum

Date: 2026-10-27 · Context: P16's first step merges `docs/v1-1-addendum.md` and `docs/specs/motion-capture.md` into the kit. Read against the documents and the code, the two left some questions open and in a few places contradicted the kit or each other.
Decision:
- Ids. The addendum asked for D-027 to D-034, which P0 to P2 already used; decisions are never renumbered, so they are D-081 to D-088 in the addendum's order, and the plan's P16 names those.
- Pointers. `motion-capture.md` no longer points at the addendum; it names the documents the addendum merged into. Its easing table lives at `packages/pipeline/src/tokens/easing-table.ts`, because `stages/` holds only each stage's entry module (`architecture.md`).
- Freeze and states. The addendum said the freeze happens after state capture and that this "was already the order". It was not: since P3 the freeze comes before states (`capture-and-states.md` steps 3 and 7, `stages/capture.ts`), and it must, because every crop and the full-page screenshot need a still page. The order stays. With CSS transitions and animations disabled, a state's `to` values are the settled ones at once, which is what the transition-aware wait was for. The wait therefore applies to script-driven motion: after the 150 ms settle, while a Web Animations API animation runs on the element or inside it, capture waits for it to end (its longest duration plus delay plus 50 ms, 1,200 ms at most in all). A delta entry's `transition` comes from the element's resolved `transition-*` values, read before the freeze, and from Web Animations records taken during that state. The freeze also ends running Web Animations API animations (finite ones finished, infinite ones cancelled), as "freeze ends every running animation" says. An `open` pattern is recorded from Web Animations records during the `open` capture; a popup's CSS transitions attach to its component as `open` transitions.
- Static motion is read from the computed `transition-*` and `animation-*` longhands of every element in the snapshot taken before the freeze, which are the matched declarations already resolved; usage counts elements.
- Delays are not durations. A `transition-delay` is an offset, and a stagger's delays (0, 60, 120 ms) would otherwise be duration tokens and sprawl on every staggered site; delays stay in `delayMs` and `stagger`.
- Patterns gain `instances` and `pageIds` (deduplication produces them); an `in-view` trigger's value is the fraction of the viewport height from the bottom at which it fired; a `scrolled-header` pattern's trigger is `scroll` with its value in px (400), worded `After {px} px of scrolling`.
- design-system.md puts Motion after Shadow and before Breakpoints, as the addendum's section list and `tokens.css` do; motion-capture.md's "after Breakpoints" is corrected.
- Tier. The type list named `switch`, which is not a component type; it is `toggle`.
- Fallback component names. The first component of a type keeps the bare type label, as before; later ones take `{Type label} ({context})`. A name still shared adds the page's last path segment (`Button (footer, pricing)`), then an ordinal word (`Button (footer, second)`). The home page's segment is `home`.
- Variant words. The third-word rule runs over every set of variants that would share a name, field by field, a field supplying a word only where its rule tells them apart, until each name is unique or the rest merge. The fourth and later brand fills, which were `Variant {n}`, take the hue word of their ground's color token (`Teal`), then the third-word rule.
- Type words. Among tuples that would share a name, ordered by size then weight descending, the first keeps it and each later tuple takes the first word that applies against the first tuple: weight (`-strong` heavier, `-soft` lighter), size (`-lg`, `-sm`), tracking (`-wide`); a name still taken takes the next word that applies, and a tuple with none left merges into the earlier one.
- Site names per kind. A site-named token's name is the variable's name without `--` and without its kind's export prefix (`color-` or `clr-`, `space-` or `spacing-`, `radius-`, `shadow-`, `breakpoint-`), and for type without a trailing `-size` or `-font-size`; durations and easings keep the whole name (`ease-out-quart`). The export prefixes then give back the site's own variable (`--color-text-tertiary`, `--radius-rounded`). A generated name equal to a site name of its kind takes the collision letter (D-051). Names starting `--tw-` (Tailwind's internal plumbing) are listed like hashed names and never name a token. Breakpoints become `BreakpointToken`s (`{ value, usage, maxTwin?, siteName? }`); data-model.md had a bare number list.
- Overlays and contrast. Contrast pairs are recorded for opaque text tokens only; translucent text is left to the checks stage, which composites it.
- The run page. The stage rail has eight rings (`components.md` said seven) with the labels `Motion · reading` and `Motion · {n} durations` (`Motion · none found`). Exports gain two cards, `Motion CSS` and `Motion JSON`; eight cards leave no single-card row at three columns or two. Compare's motion rows are a Motion card under Tokens with Before and After columns. How it works gains a tenth pipeline step, `Motion`, after Cluster tokens. The MCP card lists `get_motion`. The `Core only` filter is a toggle Chip (`aria-pressed`) after the group chips; on phones the Page-specific heading is a disclosure. The `Named by the site` Pill shows in the TokenPopover and on EasingCards (a swatch has no room for it). The Replay dot runs over the run's base duration, 300 ms when the run has none. Replays play a site's own properties inside their chip on demand, an exemption motion.md now states.
- Copy. Token kind labels stay singular like the rest of the list (`Duration`, `Easing`; the addendum wrote the plurals), and the motion export formats are labeled like the other cards, `Motion CSS` and `Motion JSON`, with the file names on the card's second line. copy.md gains what the primitives show and the addendum did not word: the `Overlays` label, the type tags line `Found on {tags}`, the keyframes usage line and the `Unused` Pill, the scrolled-header trigger phrase, the Motion rail labels, the third words and ordinal words.
- Hashed names. The addendum's "6 or more characters of mixed letters and digits with no vowels pattern" is read as 6 or more characters mixing letters and digits; "no vowels pattern" names no test a build can run.
- The gate's "no name ending in a digit" means component and variant names, as component-detection.md's final pass says; token names such as `gray-100` and `duration-160` end in digits by design.
Reasoning: each settles a question the addendum left open, toward the closest faithful reading; the freeze order follows the code and the capture spec because the addendum's premise about it was mistaken, and its goal (settled values, timing attached) holds.
Affects: `docs/specs/motion-capture.md`, `docs/specs/capture-and-states.md`, `docs/specs/token-clustering.md`, `docs/specs/component-detection.md`, `docs/specs/data-model.md`, `docs/specs/exports-and-mcp.md`, `docs/design/pages.md`, `docs/design/components.md`, `docs/design/copy.md`, `docs/design/motion.md`, `docs/plan.md`.

## D-090 · Rulings from building v1.1

Date: 2026-10-27 · Context: building P16 settled questions the merged documents left open, and the first live recording showed naming steps that decided a component's structure by the model's wording alone.
Decision:
- Type roles. `eyebrow` is tried before `label`, `body-sm` and `caption`; "weight 400" in a role rule is read as below 500. Size words are graded (`sm`, `xs`, `xxs`; `lg`, `xl`, `xxl`), a role already ending in `-sm` grades on to `-xs`, and past the words a tuple is named by its size. The role a tuple names itself by is folded into `tokens.type[].name`; there is no separate role-name list.
- Motion reads. An inline-style change is scroll progress only when every value change coincides with a scroll change; an in-view trigger's value comes from the observer's root margin after a class toggle; CSS transitions on one element that start within 50 ms with one timing are one pattern; header motion during the scroll pass belongs to the scrolled header; inline samples split into runs at gaps of 250 ms; the tab walk's focus is not waited for; a stagger needs three or more siblings; a loop's end is its first keyframe that differs from the start. Animations on pseudo-elements are not read (the static read sees elements); an inline-style pattern has no easing to read. A duration that rounds to 0 ms is an instant change and makes no token, nor counts its easing (stripe.com has timings under 2.5 ms, which made a 0 ms token that failed validation). One element's motion read at both viewports is one pattern with the desktop reading, since the element's fingerprint changes with the viewport's styles and would otherwise list the same motion twice.
- Variants and names. Variants that share both words keep the color word before a third word; `muted` needs 10% less contrast than the run's text; the fallback name's context is also given to both component model calls (`in footer`), so the model can tell a footer nav from the header's. Between `badge` and `tag` the rule's reading of the text decides, even when the model answers the other: the prompt states the same rule, so the model's answer there adds only variance. Two `alert` or `toast` clusters of one tag and role whose boxes differ only in color are one component with tone variants, whatever they hold (D-052 already holds `.alert` with and without a link as one alert), checked by the rule types before naming and by the final types after the merge across pages (the second pass changes no model request), so a notice on one page and a notice in another tone on another stay one component however the model words or types them.
- A generated name's page segment reads its hyphens and underscores as spaces (`Card (getting started)`), since a name carries no dash of any kind. A fallback eval run scores the fallback names but not tiers: tiers follow the merge across pages by name, which a fallback run never makes.
- Component code and previews. `Component.borderWidth` carries the default border for the Default line. A component's stored CSS names no token variables; each export writes them for its own set. The universal reset's margin, padding and border are carried onto the component's own tags that have a browser default, and reset values that override a browser default on a matched tag (`a { color: inherit }`, `button { font: inherit }`) are kept; the rest of the reset (box-sizing and the like) is dropped. The preview shell carries the site's box model (`box-sizing` from the snapshot's majority) so a component that depends on it renders as captured.
- Exports, variable resolution. The real-site check (stripe.com) found site variables set on theme classes (empty on the root), chains of site variables, keyframes and component rules that read properties stripe sets on elements at runtime, and SVG attributes in component markup that do the same; the fixtures declare literal values on the root and had none of it. Every export now closes its references over the names it declares (`exports-and-mcp.md`, Variable resolution): theme values, chains, fallbacks, literal values in `tokens.json`, and what can only be known at runtime left out with a comment that names it. A test file holds each case.
- Exports. design-system.md gains a "Tokens as CSS" section so every `var(--…)` it uses is declared in the file. The Default line is written from a literal template, with the fallback words when a part is missing. Breakpoint twins fold their `max-width` side into the `min-width` token.
- Fixtures. clean's button hover lifts and glows on every variant (the first-seen instance is the ghost); clean gains a third neutral `#5F6368` for `--color-text-secondary`; the footer button carries a chevron icon on a gray fill at radius 12, type 16/500; messy's 150 ms transition sits on the logo (hidden menu items are never in a snapshot). tailwind and css-in-js share clean's design and expect its site names under their own variable names.
- Interface. The motion source label is sentence case, `Web animations`. A group of Replay buttons shares one reduced-motion caption (`ReplayCaption`) that each disabled button points at with `aria-describedby`; a Replay button standing alone carries its own. The Motion section's cards are headed `Durations`, `Easings`, `Keyframes` and `Patterns`, the Compare row words, each with its count. A measured duration reads `{ms} ms` from copy. Overlays sit on a ground half `ink`, half `surface` so a light and a dark overlay both show, with each overlay's name a Tag that opens its TokenPopover. The PatternRow's preview chip takes only visual properties from the site's values (opacity, transforms, filter, colors, shadow, clip-path) and never a `url()`.
- Skeleton heights re-measured on the v1.1 clean run at 1440 (D-080): the color card 646 with its overlays row, the motion region 171, 251 and 977, a tier heading in the components skeleton, export cards 146 in three rows.
- The real-site check's prompt (125 KB on stripe.com) is committed whole as `docs/real-site-check/stripe-prompt.md`; STATUS's `P16 real-site check` holds its opening, the Motion section with the first patterns and the first contract, since STATUS is read at every session start.
- A TypeScaleRow shows its token name (`title-sm`) as the sample when the name is not the bare role, so two styles of one role read apart; the DurationStrip staggers its role labels with their values.
- Visual goldens updated once for v1.1 (65 files: every run, component, compare, open and catalog state that shows the Motion section, the tiers, the overlays row or the eighth export card, and both Open Graph images), reviewed in `qa:design` at 1440, 820 and 390 first; and the catalog's goldens are compared section by section (174 goldens, one per catalog entry and width, plus the top of the page) instead of one capture per width: the 1440 catalog is now 68,820 px tall, a 400 MB layer that Chromium rasterizes in tiles, and a 256 px tile was missing from some captures however long the wait. Tall pages also wait after the full-height resize until two captures in a row match.
- A pattern read by sampling inline styles (no timing object to read) differs a little on every run: its start values, its duration and the fraction it fired at. QA masks those three lines (`data-qa-mask="sampled"`) as it masks the clock, so a fresh clone's seed meets the goldens; the eval scores them within its tolerance.
- When a page's capture fails the run (storage down), the other capture worker finishes its page and takes no other before the run fails, so no capture line lands after the run's last event; the motion pass made each page long enough for the chaos test to see the race.
- Landmarks stay unique: the panel's Motion region is named `{name} · Motion` because the run page has a Motion region; the catalog names each Motion section demo by its state and shows one ComponentDetail (the component that moves).
- STATUS keeps the rulings here, not a second copy.
Reasoning: each is the closest faithful reading of the documents; the naming rulings move decisions that set a component's structure from the model's wording to rules a test can hold, which the documents ask for (deterministic merging last) and which the API's refusal of sampling parameters (D-027) makes the only route to stable output.
Affects: `docs/specs/token-clustering.md`, `docs/specs/motion-capture.md`, `docs/specs/component-detection.md`, `docs/specs/model-calls.md`, `docs/specs/preview-fidelity.md`, `docs/specs/exports-and-mcp.md`, `docs/design/copy.md`, `docs/design/components.md`, `docs/evals.md`, `packages/pipeline/src/components/model.ts`, `packages/pipeline/src/stages/components.ts`, `packages/pipeline/src/components/cluster.ts`, `packages/pipeline/src/models/prompts/components.md`, `packages/pipeline/src/models/prompts/collision.md`, `apps/web/components/run/*`.

## D-091 · The owner promotes runs to the showcase

Date: 2026-10-28 · Context: v1.2, the owner's second round of testing. His own runs from the home page are visitor runs, public by link and never listed (D-006, D-020); the only way into the showcase was `pnpm showcase`, which re-crawls the roster.
Decision: `pnpm showcase --add <runId>`, `--remove <runId>` and `--list`, each with `--remote`, change the showcase content without re-crawling. Only a complete, non-sparse run can be added; the newest promotion is the first card; visitors' runs stay unlisted.
Reasoning: the showcase is curated by the owner and must include the runs he is proud of, not only the opening roster.
Affects: `docs/specs/showcase.md`, `docs/design/copy.md`, `docs/design/pages.md`, `docs/deploy-runbook.md`, `scripts/showcase/`, `packages/schema/src/showcase.ts`.

## D-092 · Every read path upgrades stored run documents by their pipeline version

Date: 2026-10-28 · Context: the owner's Compare page errored on his real runs. The Partner traced it on 2026-10-28: `runPayload` (`apps/web/lib/server/runs.ts`) parses every stored document with `RunDocumentPartial`, and the linear.app run `tx4mehptdf`, written by v1.0 before P16, fails the v1.1 schema, so its own page, its API route and Compare all throw. Nothing in the kit said what happens to a stored document when the schema grows.
Verification (the Builder, 2026-10-28, `pnpm runs:parse tx4mehptdf mhxvphzzfr`, a parse through the schema with no server): `tx4mehptdf · linear.app · pipeline 1.0.0 · 447 issues`, first `["tokens","type",0,"role"] · Invalid option: expected one of "display"|"title"|"heading"|"subheading"|"body"|"body-sm"|"label"|"eyebrow"|"caption"|"code"|"text"`; by field: 120 × `components[].tier`, 120 × `components[].slug`, 120 × `components[].motion`, 24 × `tokens.type[].uppercase`, 24 × `tokens.type[].tags`, 21 × `tokens.type[].role`, 10 × `drift.proposal.type[].role`, 6 × `tokens.breakpoints[]` (numbers, not objects), 1 × `drift.proposal.durations`, 1 × `drift.proposal.easings`. `mhxvphzzfr · modernsoftworks.com · pipeline 1.1.0 · parses clean`. The addendum's diagnosis holds exactly. `pnpm runs:parse --all` showed the same failure on all 18 v1.0 documents in the local database (the P13 dry run's and the owner's) and a clean parse on every v1.1 document.
Decision: `upgradeRunDocument` in `packages/pipeline/src/upgrade.ts` brings any stored document to the current shape by its `pipelineVersion` (`data-model.md`, Upgrading stored documents), pure and idempotent, and every read path upgrades before it parses: `runPayload`, Compare, /open, the MCP server, the CLI. Compare renders a StateCard, never a stack trace, when a run cannot be loaded or upgraded. A committed v1.0 fixture document from `0ff300f` and the local corpus test it.
Reasoning: a schema that grows without an upgrade path breaks every page that reads old runs, and the same failure would recur on every future schema change.
Affects: `docs/specs/data-model.md`, `docs/specs/exports-and-mcp.md`, `docs/design/pages.md`, `docs/design/copy.md`, `docs/evals.md`, `docs/plan.md` (Definition of Done 12), `packages/pipeline/src/upgrade.ts`, `apps/web/lib/server/runs.ts`, `apps/web/app/compare/`, `apps/web/components/open/`, `packages/mcp`, `packages/cli`, `scripts/runs-parse.ts`.

## D-093 · Easings are shown as synchronized ambient loops

Date: 2026-10-28 · Context: the v1.1 easing section communicated nothing: one Replay button, one dot crossing a short track in 160 ms, no visible difference between curves. A landing page the owner built from the export showed the right idea: a grid of cards whose dots run in step, forever.
Decision: every easing card holds an EasingStage (the curve with a dot travelling along it, and a track dot) driven by the Web Animations API with the token's own value, on one shared clock for the whole grid: equal distance, equal time (1,400 ms), one direction, a 500 ms hold, a fade reset, paused off screen, compositor-only, still under reduced motion. Each easing names what uses it (`usedBy`). Duration ticks run their real length on the same clock. Patterns keep Replay and gain an auto-preview when they scroll into view.
Reasoning: one short replay shows nothing; simultaneous curves over the same distance and time make the difference between them the thing the eye catches.
Affects: `docs/design/components.md`, `docs/design/motion.md`, `docs/design/pages.md`, `docs/design/copy.md`, `docs/specs/data-model.md`, `docs/evals.md`, `apps/web/components/run/motion/`, `packages/pipeline/src/components/motion.ts`, `packages/schema`.

## D-094 · Previews render on the source element's ground and expose state pins

Date: 2026-10-28 · Context: component previews showed the page background bleeding around rounded corners (an 8 px crop margin, a dark halo around a dark site's button on the app's light ground), and they could not be interacted with: the per-state preview files existed but the main preview showed only the default, no transition played, and nothing could be pinned on touch.
Decision: `ground` is captured per instance (corner samples of the crop margin, else the nearest opaque ancestor, else the body), painted behind live and captured previews and into a 4 px crop margin. The StateBar swaps the per-state preview files, which animate on load from the default values to the state's with the recorded timing (generated keyframes, the state rule without `!important`); `Play` steps Default, Hover, Active, Default once. A Ground toggle and a scale caption join the PreviewFrame. Frames stay `sandbox=""` with no scripts; D-017 is unchanged.
Reasoning: a component is judged by playing with it, and a halo of page background is a defect.
Affects: `docs/specs/preview-fidelity.md`, `docs/specs/capture-and-states.md`, `docs/specs/data-model.md`, `docs/design/components.md`, `docs/design/pages.md`, `docs/design/copy.md`, `docs/evals.md`, `packages/pipeline/src/capture/`, `packages/pipeline/src/previews/`, `apps/web/components/`, `fixtures/sites/messy-after`.

## D-095 · Live rate is measured per reason, render checks run core first by usage, and real sites have thresholds

Date: 2026-10-28 · Context: on real sites too many previews fell back to captured crops. The baseline from the owner's two runs: modernsoftworks.com 45 live of 89 (44 `diff`); linear.app 17 live of 120 (1 `diff`, 26 `fonts-unavailable`, 76 `not-checked`). Nobody measured why.
Decision: every run records `stats.previews` by reason and states it in the previews event. P17 measures three real sites at the showcase timeout before the builder changes, classifies every captured result by cause and adds the builder's handling for each cause found; a substituted font is judged with text masked; render checks run core components first, by instance count. Thresholds: 85% live on the clean, tailwind and css-in-js fixtures (keeping 0.90 where it was higher), and 70% on each real site of the P17 check over the checked components. The measured causes, the handling added for each and the rates before and after are recorded in the build's own P17 rulings (D-098) when the measurement is done, since an entry is never edited.
Reasoning: a fallback nobody measures becomes the default, and a budget cut should land on the components that matter least.
Affects: `docs/specs/preview-fidelity.md`, `docs/specs/data-model.md`, `docs/evals.md`, `docs/design/copy.md`, `packages/pipeline/src/stages/previews.ts`, `packages/pipeline/src/previews/`, `scripts/evals/`.

## D-096 · Check results are a component-level metric and a monochrome mark

Date: 2026-10-28 · Context: the owner wants the check results up front: a component-level metric in the stat strip and a visible mark on each component that passes every check. Copy rule 3 (D-018) forbids `accessible`, `compliant` and `a11y` in product copy, and the chrome is monochrome (D-003).
Decision: a component passes all checks when every applicable check passed (derived, never stored per component); the run stores `stats.componentsPassing`. The stat strip gains a sixth cell, Components passing, linking to the Components section with a new `Passing all checks` filter; the CheckBadge becomes a filled `ink` Pill `All checks` or an outlined Pill `{passed} of {applicable} checks`, and nothing when no check applies; the Checks section opens with the ratio in words; `list_components` gains `passedAll`; the exports state it on each contract and the prompt keeps passing components passing. D-003 and D-018 stand, as the owner confirmed on 2026-10-28.
Reasoning: the owner wants the check results up front; the product's voice and chrome rules still hold, so the mark is distinguished by weight, not color, and states a count the reader can trust.
Affects: `docs/specs/checks.md`, `docs/specs/exports-and-mcp.md`, `docs/design/pages.md`, `docs/design/components.md`, `docs/design/copy.md`, `packages/schema`, `packages/pipeline/src/`, `packages/mcp`, `apps/web/components/run/`.

## D-097 · Rulings from merging the v1.2 addendum

Date: 2026-10-28 · Context: P17's first step merges `docs/v1-2-addendum.md` into the kit. Read against the documents and the code, it left some questions open.
Decision:
- Ids. The addendum's six decisions are D-091 to D-096 in its order; these rulings are D-097. The pipeline version becomes 1.2.0, so the upgrade has two steps (below 1.1.0, below 1.2.0), each checking the shape it fills as well as the version, which is what makes it idempotent; the below-1.2.0 step derives `usedBy`, `stats.componentsPassing` and `stats.previews` from data the document already holds, so a v1.1 run shows the new usage lines and the sixth cell; `ground` cannot be derived and stays optional.
- Showcase. The entry keeps the existing `ShowcaseEntry` shape (the addendum's "title" is its `name`; the ShowcaseCard shows no drift headline, so the entry carries none) and gains an optional `promoted` flag, which is what the caption variant reads. `--name` sets the card's name when the host is not in the roster. Adding a run already listed moves it to the top. With `--remote`, the run is read from production's run API and the current content from the storage object's public URL. The script's refusal and orphan messages are written in `showcase.md`.
- Upgrade. The upgrade is browser-safe (it runs in /open) and lives beside `exports/` in that respect. The MCP server upgrades on `--run` and `--url` as well as `--file`, because a published package may read an older production API; the CLI's `serve` upgrades too, since `/open` reads what it serves.
- Compare's StateCard reasons are `No run with the link {id}.` and `The {host} run of {date} could not be read.`, and it offers `Open {host}` for each run that exists (a missing run has no host to name).
- `usedBy` carries counts: `{ componentTypes: { type, count }[], patternKinds: { kind, count }[] }`, because the usage line writes `2 scroll reveals` and orders types and kinds together by use; the addendum's `string[]` could not. A component type counts the components of that type whose motion uses the easing; a pattern kind counts the patterns. The line takes the three most used across both lists, types first on a tie, and leaves the line out when nothing uses the easing. copy.md gains the plural type words and the singular and plural pattern-kind words the line needs.
- EasingStage. The curve plot is 160 × 96 and the track sits beneath it in the same stage. The curve dot is two animations on nested elements (x linear, y eased): one animation with the token's easing would ease both axes and run the dot down the diagonal. Each loop is one animation of 2,200 ms with per-keyframe easing (fade in 150, travel 1,400 with the token's easing, hold 500, fade out 150), iterating forever from the grid's shared start time.
- DurationStrip. Each tick's dot runs up its own 12 px mark, linear, over the duration's real length: the addendum gave the time and not the path, and a path along the tick keeps the scale readable.
- Ground. When the element has a `box-shadow`, its crop margin is kept as captured rather than painted, because the shadow lives in the margin and painting it would erase it; its four corners still decide the ground. The Ground toggle's `Light` is the `surface` token and `Dark` the `inverse-bg` token, the app's own two grounds, so no color enters the chrome (D-003). The preview document's background becomes transparent and both the app and the render check paint the ground behind it, so the toggle can change it and the live decision is still made against what the app shows.
- State files carry a reduced-motion rule (`animation: none`), so a pinned state under reduced motion shows its end values at once; the StateBar's `Play` holds each state for its longest recorded duration plus 400 ms, 600 ms at least.
- Fonts substituted. A preview can substitute more than one family; `Preview.fontsSubstituted` is a list and the caption is shown once per family.
- Checks. `checkCounts` moves to `packages/schema` so the web app, the pipeline, the exports and the MCP server share one rule; `passedAll` is false when no check applies, and the export's `Checks:` line is left out then.
- Previews event. The reasons follow the counts as `{n} render differed`, `{n} fonts unavailable`, `{n} styles too large` and `{n} not checked in time`, each only when above zero.
- The v1.0 Compare test material is seeded as the complete run `seedv10cln`, not scored and not listed.
- The third real site is stripe.com: the roster site with the weakest live rate in P16 (5 of 120), so the investigation learns the most there.
Reasoning: each settles a question the addendum left open, toward the closest faithful reading of its intent.
Affects: `docs/specs/showcase.md`, `docs/specs/data-model.md`, `docs/specs/preview-fidelity.md`, `docs/specs/capture-and-states.md`, `docs/specs/checks.md`, `docs/specs/exports-and-mcp.md`, `docs/design/components.md`, `docs/design/pages.md`, `docs/design/copy.md`, `docs/design/motion.md`, `docs/evals.md`, `docs/plan.md`, `docs/glossary.md`.

## D-098 · The build's P17 rulings: the measured preview causes, their handling, and the rulings the build needed

Date: 2026-10-28 · Context: D-095 asks P17 to measure why previews fall back on three real sites, add the builder's handling for each cause found and record the causes, the handling and the rates before and after here. Building P17 also needed rulings the documents left open.
Decision:
- The measurement's first finding. `pnpm pipeline:run` served preview documents as `file://`, where Chromium refuses web fonts, so every copied family fell back in the local baseline runs and in P16's stripe.com check. It now serves storage over HTTP on `DSE_STORAGE_PORT` (default 4403), as the worker serves MinIO; the owner's two runs, which went through the worker, are the production-like baseline.
- Handling added, by the cause it answers (counts are the classified captures of the three 15-minute runs, recorded in STATUS `P17 real-site check`):
  - Below the 8,000 px screenshot cut (42 without a reference): the candidates a page reads below the cut are clipped in bands of at most 2,000 px with 128 px around them, so they have crops and references.
  - Font metrics (64): storage over HTTP; the font cap raised from 300 KB to 1 MB (linear.app's `InterVariable.woff2` is 352 KB); the masked comparison (text masked, at least 50% of the box left unmasked to count); the inherited text rendering carried onto the root.
  - A page screenshot left unpainted (13 on linear.app): the page is screenshot in 2,000 px clips and stitched; crops compose across clips.
  - Animations captured mid-way (37 reference mismatches): the freeze settles animations at their end (`animation-duration: 0s` and the rest of the freeze in `capture-and-states.md`) and commits script animations' styles (`commitStyles()`), instead of removing them.
  - Image placeholders (16): the image's own pixels cut from the screenshot and stored beside the preview (over 400 KB the average color alone).
  - Ground (11): the canvas color when nothing sets a background.
  - Boxes outside the viewport or an ancestor's clip (13): the visible part is compared.
  - Snapshot ids reused between the page's two snapshots, so a preview took another element's markup (5): one id counter per page (`window.__dseIds`).
  - Selector handling: `:where()` and `:is()` rescoped (6); the child combinator kept; control box resets kept; cascade layers declared in the page's order with each rule in its own layer, and generated `@layer` blocks; `@container` rules kept; `@starting-style` skipped; a rule the page loads twice sits where its last copy does (4); custom properties never reset-filtered.
  - Units and layout: viewport units and container query units resolved against the capture's viewport and the nearest container (3); an inline root takes its content height as its line height (3); the render placed at the page's sub-pixel phase (3); image placeholders on the border box; an svg `use` that points inside the component inlined and `url(#id)` references prefixed.
  - Transforms and paint: the root's own translation, or a computed `transform: none`, not applied again (with `!important`, since an inline transform otherwise wins); ancestors' opacity carried onto the root above a 0.2 floor; ancestors' uniform scale applied, the element laid out at its own size and scaled (3 on stripe.com).
  - Fourth round, stripe.com. Its drop from 80 to 74 live was 4 previews lost to the svg `var()` handling of the third round (svg children are never in the snapshot, so the attribute was removed and the shape filled black) and 2 from a different set of crawled pages. The handling now keeps a `var()` attribute it has no value for, and capture writes each svg child's computed paint on it (`data-dse-fill`, `data-dse-stroke`) when it reads a custom property or a class rule paints it, which the builder applies and the sanitizer removes; a paint server outside the component is never written. `@container` conditions on a container outside the component are read against that container's box on the page (2); the universal-reset carry keeps the cascade layer of the reset it came from (1); `type="hidden"` inputs stay hidden (1); and rules that differ only in their condition are no longer merged as one.
  - Not handled, and why: an element the page does not show at capture (closed menus, `opacity: 0` tooltips, inactive tabs, 1 × 1 boxes: the reference does not show it), other paint over the element, another animation state on the page, video and canvas (out of scope, D-095), gradients behind a transparent element, external background images (removed by the CSS rules).
- A security finding while building the state files: a value with `{`, `}` or `<` outside a quoted string is refused (it is how a value leaves its rule or its style element), state CSS escapes `</style`, and a container condition that could leave its block drops the rule. The security suite covers each.
- Rates. Live of checked at 15 minutes, before, then after each round, on modernsoftworks.com, linear.app and stripe.com: 32.0, 35.0 and 27.5% before; 80.2, 57.5, 62.5%; 80.0, 69.2, 66.7%; 80.0, 80.0, 61.7%; and after the fourth, 82.7% (62 of 75), 81.7% (98 of 120) and 72.5% (87 of 120), every site over the 70% floor with no component unchecked. linear.app at the visitor timeout checked all 87 core components (0 not checked), against 76 unchecked in the owner's v1.0 run.
- UI rulings. Only the main variant's preview can pin a state (the state files are built for it); a staggered pattern's preview plays at most 6 chips, the row's width, and its line still states the full count; Compare's StateCard has a third reason for a run that is not complete (`The {host} run of {date} has not finished.`); promoting a run whose host already has a showcase card replaces that card; the skeletons were re-measured for the easing stage (358 px), the checks opening line (43 px) and the tier heading (26 px); `qa:design` and `qa:visual` mask the ambient loops (`data-qa-mask="ambient"`), since they never hold still.
- Evals. `messy-after` gains its dark band (`band-button`, `band-card` on `#0B0D10`) for the halo check, with re-recorded extras; its expected drift deltas follow the band (grays 14 to 10 and five new entries in `docs/evals.md`).
Reasoning: D-095 asks for causes measured on real sites, each with its handling, and the rates recorded; every handling above was measured by re-rendering a patched copy of a stored preview against its page crop before it was built, and the full set was re-measured by fresh runs. The UI rulings take the closest faithful reading of the addendum where it was silent.
Affects: `docs/specs/preview-fidelity.md`, `docs/specs/capture-and-states.md`, `docs/evals.md`, `STATUS.md`.

## D-099 · Compare's same-day title and buttons

Date: 2026-10-28 · Context: P17's real-site check compared the owner's v1.1 run with a fresh run of the same day. The title pattern `What changed in {span}` with the span `today` read "What changed in today", and both buttons read `Open the Oct 28 run`; the buttons also took the start date while the run cards show the finish date, so a run that crossed midnight UTC showed two dates.
Decision: when the two runs are less than a day apart the title is `What changed today`. The buttons take the date the run cards show (finished, else created); when both runs share it, they read `Open the earlier run` and `Open the later run`.
Reasoning: the copy rule's own examples are spans of time; "today" is not one, and two buttons with one label cannot be told apart by a screen reader or a reader.
Affects: `docs/design/copy.md`, `docs/design/pages.md`, `apps/web/lib/compare.ts`, `apps/web/components/compare/CompareView.tsx`.

## D-100 · The showcase roster crawls modernsoftworks.com at its www host

Date: 2026-10-28 · Context: the owner's site answers Hostinger's 403 page at `https://modernsoftworks.com/` (checked again at the end of P17) and serves the site at `https://www.modernsoftworks.com/`, where the owner's runs and P17's real-site checks were made. The roster built its URL from the bare host, so step 11 of the runbook would still replace it with an alternate.
Decision: the roster entry keeps the host `modernsoftworks.com` for its card and matching, and crawls `https://www.modernsoftworks.com/`.
Reasoning: the site is the owner's studio and belongs in the opening set; the www host is where it serves pages.
Affects: `scripts/showcase/roster.ts`, `docs/specs/showcase.md`, `docs/deploy-runbook.md`, STATUS (the owner's end list).

## D-101 · The easing stage fills its card and the stages of a row align

Date: 2026-10-29 · Context: v1.3, the owner's third round of testing (`qgc6npq1au`, `d78cp1kh0v`, the local linear.app run). The 160 × 96 plot sat flush left and filled under half the card, leaving about 170 px empty beside it at every viewport, and the stages of a row did not align.
Decision: a card-width plot, 160 px tall, the curve dot 8 px and the track dot 10 px, the stage pinned to the card's bottom, and an always-present usage line (`Declared, not seen in use` when nothing uses the easing).
Reasoning: a fixed 160 × 96 plot left half the card empty and the rows ragged; the curve is the card's content.
Affects: `docs/design/components.md`, `docs/design/motion.md`, `docs/design/copy.md`, `apps/web/components/run/EasingCard.tsx`, `apps/web/components/run/RegionSkeleton.tsx`.

## D-102 · Durations sit on a log axis with a label budget

Date: 2026-10-29 · Context: v1.3. A linear scale from 0 to the longest duration put 10 of 13 ticks on the owner's site within the first 36 px and its labels climbed ten rows; linear.app's 26 durations made the strip about 800 px tall.
Decision: a base-10 log axis from the shortest to the longest duration, two label rows each side, dropped labels counted in the meta line, every tick a TokenPopover trigger, and the Long list adopted only if the measurement on the P18 real-site runs needs it (recorded in the P18 build rulings).
Reasoning: real sites hold 100 ms to 35 s; a linear axis piles every working duration into the first few pixels.
Affects: `docs/design/components.md`, `docs/design/copy.md`, `apps/web/components/run/DurationStrip.tsx`, the catalog.

## D-103 · Radius and Shadow take a row of their own with 72 px swatches

Date: 2026-10-29 · Context: v1.3. 44 px swatches at a 16 px gap in two cards about 275 px wide at 1440 and 170 at 820; a 32 px blur reached the next swatch and the card edge.
Decision: Radius and Shadow share a full-width row under Type and Spacing, each half the width; 72 px swatches; the shadow gap is the smallest spacing token at or above twice the largest blur, never below `space-6`, and the list pads itself by half the gap.
Reasoning: 44 px swatches in a 275 px card, with a 32 px blur, cannot be read; the row below the Type and Spacing cards is free.
Affects: `docs/design/pages.md`, `docs/design/components.md`, `docs/design/design-system.md`, `apps/web/components/run/TokensSection.tsx`, `apps/web/components/run/RegionSkeleton.tsx`.

## D-104 · Pattern chips rest on the start state, the ReplayButton holds its width, and the keyframes list shows six

Date: 2026-10-29 · Context: v1.3. The 40 px chip rested on each pattern's end state, which for every entrance is a plain square; `Replay` to `Stop` reflowed the row at the start and end of every play; the keyframes list was uncapped (47 rows on the owner's site, 264 on linear.app).
Decision: 56 px chips resting on the scaled start state and returning to it after a play; a ReplayButton as wide as its wider label; a KeyframesList of six with `Show all {n} keyframes`.
Reasoning: a chip at rest on the end state is a square; a button that changes width jolts the row; 264 rows is not a list.
Affects: `docs/design/components.md`, `docs/design/motion.md`, `docs/design/copy.md`, `apps/web/components/run/PatternList.tsx`, `apps/web/components/run/ReplayButton.tsx`, `apps/web/components/run/KeyframesList.tsx`.

## D-105 · The synthetic not-found page never names a component, and a pattern belongs to the element it was read from

Date: 2026-10-29 · Context: v1.3. A pattern was labeled `Button (8780d3aa06 does not exist)`. The component exists under that name: the synthetic 404 probe page (`/8780d3aa06-does-not-exist`) was the second Button's naming context, so its path segment became the name and also went into the naming prompt. Separately, a stagger led by a `span` was attributed to a Button because the first owned target of the group was taken as its owner.
Decision: the synthetic not-found page's context is `404 page`, in the generated name and the prompt; a pattern belongs to the component that owns its own selector element (`elementKey`), else to none. The 1.3 upgrade removes pattern ids that resolve to nothing, and a test holds every reference in every fixture run, seed and versioned document to resolve.
Reasoning: a probe path is not context; a stagger's first owned target is not its owner.
Affects: `docs/specs/component-detection.md`, `docs/specs/motion-capture.md`, `docs/specs/data-model.md`, `packages/pipeline/src/components/naming.ts`, `packages/pipeline/src/components/model.ts`, `packages/pipeline/src/components/motion.ts`, `fixtures/recordings/components/`.

## D-106 · Card previews take the pointer

Date: 2026-10-29 · Context: v1.3. Card previews were inert for three reasons, each sufficient: `pointer-events: none` on the frame, the card's `.link::after` overlay over the whole card, and preview documents with no `:hover`, `:focus` or `:active` rules, because matched CSS is collected on the neutral page where those selectors match nothing.
Decision: the default preview document carries the recorded state deltas as `:hover`, `:focus-visible` and `:active` rules on its root, through the state files' sanitizer and timing; the frame takes the pointer; the link overlay covers the card's body on devices that hover and the whole card on touch. Frames stay `sandbox=""` and `tabindex="-1"`.
Reasoning: a live preview that cannot be hovered is a screenshot with extra steps; the product's point is to play with the components.
Affects: `docs/specs/preview-fidelity.md`, `docs/design/components.md`, `docs/design/pages.md`, `docs/design/motion.md`, `packages/pipeline/src/previews/`, `apps/web/components/PreviewFrame.*`, `apps/web/components/run/ComponentCard.*`.

## D-107 · Previews scale no lower than 0.6× on a card and show 1:1 in the drawer

Date: 2026-10-29 · Context: v1.3. The card's preview room is 339 × 119 px at 1440, so an 880 px textarea showed at 0.38× and a 1440 px navigation at 0.23×. The documents said "scaled down when wider"; the code also scaled on height.
Decision: on a card, scale to fit on width and height, never below 0.6×; below that, anchor top-left, clip with a 40 px fade into the ground and caption `Shown at {scale}×, cut to fit`. In the drawer, 1:1 with horizontal scroll.
Reasoning: a navigation at 0.23× is a thumbnail of nothing; a cut at real size shows more than a whole at a quarter.
Affects: `docs/specs/preview-fidelity.md`, `docs/design/components.md`, `docs/design/copy.md`, `apps/web/components/FitPreview.*`, `apps/web/components/PreviewFrame.*`, `apps/web/components/panel/`.

## D-108 · A component hidden until focused previews its focus state; a zero-area box is never a candidate; a preview with no crop has no key

Date: 2026-10-29 · Context: v1.3. The portfolio's skip link is hidden by the `sr-only` pattern at capture, so its default crop was a dark box while its focus crop showed it in full; a second "Skip link" was a 1440 × 0 `header` that passed the candidate filter because only a box with both sides at zero counted as empty; on modernsoftworks.com a skip link's crop could not be cut and its preview recorded 0 × 0 with a key that was never written (a 404).
Decision: the measured hidden-at-capture rule in `capture-and-states.md`; a hidden focusable element stays a candidate flagged `hiddenAtCapture` and previews its focus crop (`hidden-until-focus`); a hidden component no state shows is dropped before naming; a crop that cannot be cut leaves no `cropKey` and the reason `no-crop`, and the card shows its code.
Reasoning: the skip link is a real component that the site shows to keyboard users, and a blank strip is a defect; a key that 404s is a bug.
Affects: `docs/specs/capture-and-states.md`, `docs/specs/component-detection.md`, `docs/specs/data-model.md`, `docs/design/components.md`, `docs/design/copy.md`, `docs/evals.md`, `packages/schema`, `packages/pipeline/src/capture/`, `packages/pipeline/src/stages/`, `fixtures/src/clean-family/`, `apps/web/components/`.

## D-109 · A ground that matches the component's fill is swapped for the opposite tone, and the Ground toggle is on the card

Date: 2026-10-29 · Context: v1.3. Every ground on the owner's two sites is a faithful sample of the page behind the element (`#0C0A09`, `#141414`, `#1A1A1A`); what hides is a component whose own fill is within ΔE 5 of its ground (33 of 74 on modernsoftworks.com, cards and inputs at ΔE 0.4 to 3.3), which is also how the site shows them. The Ground toggle existed only in the drawer.
Decision: capture records `Preview.fill`; when the fill is within ΔE 5 of the ground, the card and the drawer paint the opposite tone (`surface` for a dark ground, `inverse-bg` for a light one) with the ground caption; `Site` on the toggle always returns the sample; the toggle moves onto the card too.
Reasoning: the sample is faithful, and faithfully invisible; a reader must see the component first and its context second.
Affects: `docs/specs/capture-and-states.md`, `docs/specs/preview-fidelity.md`, `docs/specs/data-model.md`, `docs/design/components.md`, `docs/design/copy.md`, `docs/glossary.md`, `packages/pipeline/src/capture/`, `apps/web/components/`.

## D-110 · Rulings from merging the v1.3 addendum

Date: 2026-10-29 · Context: P18's first step merges `docs/v1-3-addendum.md` into the kit. Read against the documents and the code, it left some questions open and named two places wrongly.
Decision:
- Ids. The addendum's nine decisions are D-101 to D-109 in its order; these rulings are D-110. The pipeline version becomes 1.3.0 and the upgrade gains its third step (below 1.3.0), which checks the shape it fills as the others do.
- Paths. The motion components (EasingCard with its stage, DurationStrip, KeyframesList, PatternList with its rows, ReplayButton) live in `apps/web/components/run/`, not `apps/web/components/run/motion/` as D-093 and the P16 and P17 plans in STATUS name it; D-093 is not edited, and the documents written from here name the real folder.
- Motion attachment. The addendum placed the attribution rule in `component-detection.md`; the paragraph that assigns a pattern to a component is `motion-capture.md`, Attachment to components, so the rule is written there. `component-detection.md` keeps the naming context rule and gains a line on hidden candidates.
- The DurationStrip mark is 16 px (`space-4`), as built; D-097's "12 px mark" is the dot's rise along it, and the document now says so.
- The card's Ground toggle needs a Chip smaller than the 32 px filter Chip on a 152 px preview region: the Chip gains a `sm` size (24 high, `caption` weight 600, `space-2` side padding), used there only. The ChipGroup takes the size.
- Ground caption placement. On a card the preview region holds the scale caption at the bottom-left and the toggle at the bottom-right, which leave no room for a 58-character caption; the card shows the fallback by its toggle starting on `Light` or `Dark`, and the ground caption is written under the drawer's stage beside the font caption.
- Enum labels for the two new captured reasons, which copy.md's Enum labels require of every value (D-030): `hidden until focused` and `no capture`, in the lowercase of the other reasons, also in the panel's fidelity caption.
- Live rate on real sites: a `hidden-until-focus` preview counts as checked, as the addendum says; a `no-crop` preview has no reference to check against and is excluded like `not-checked`, with its count stated. `stats.previews` gains the two reasons as optional keys.
- The upgrade's 1.3 step sets `fill: null` on every preview (the contrast fallback never applies to an older run, whose fill was not read) and leaves `hiddenAtCapture` absent.
- The no-capture card's CodeBlock is the component's sanitized HTML, the drawer's Code section's first tab, inside the 152 px region with its own scroll.
- The glossary gains `Fill`, `Contrast fallback` and `Hidden until focus`.
Reasoning: each settles a question the addendum left open, toward the closest faithful reading of its intent, or puts a rule in the document that owns it.
Affects: `docs/design/components.md`, `docs/design/copy.md`, `docs/specs/motion-capture.md`, `docs/specs/component-detection.md`, `docs/specs/data-model.md`, `docs/evals.md`, `docs/glossary.md`, `docs/plan.md`, `STATUS.md`.

## D-111 · The build's P18 rulings

Date: 2026-10-29 · Context: building P18 settled questions the merged documents left open, and the addendum asked for two things to be measured and decided once: the Long list on the durations strip and the skeleton heights.
Decision:
- Hidden at capture. Focusable means it can take focus: a link with `href`, a button or an input that renders (no `display: none` or `visibility: hidden` on it or an ancestor, read with `checkVisibility`); on phones the clean header's dropdown trigger sits in a hidden container and had become a 0 px candidate. The snapshot keeps its own visibility flag for the tokens and the checks, and adds the measured rule as a separate flag that only the candidate filter, clustering and naming read; a 1 px high divider's color is still a palette color. The focusable exception takes elements that can actually receive focus: its own `display` and `visibility` are checked again in the candidate filter. An element hidden until focus is kept apart from visible ones in clustering, the merge by style, the merge by name and the novelty key, as triggers are (D-070): on a site whose class names say nothing, a skip link otherwise joins the button it looks like. A component every instance of which is hidden and that no focus state shows is dropped before naming, with the event `components · {n} hidden until focus and never shown · dropped`. Its focus crop is written at the focus key and is the preview; the default state of a component whose crop could not be cut has no crop key either.
- The clean family's skip link uses the modern core of the `sr-only` pattern, `clip-path: inset(50%)` on an absolutely placed link that keeps its padding, so it is a styled link at rest and reaches 44 px for the tap target, and shows on `:focus` with a 2 px outline. It is the clean, tailwind and css-in-js fixtures' `Skip link` (`link`, core, captured with `hidden-until-focus`); messy and messy-after do not carry it.
- Previews. The state rules are written into the stored default document after the render check, so the check measures the document at rest and a pointer the check never moves cannot hover it. Every link in a preview document points at its own page (`#`), absolute ones included, so a click inside a frame never leaves it; the component's code keeps the site's links. Only the main variant's document carries state rules, since the recorded deltas belong to its instance (D-097).
- Card captions and the toggle. The hidden-until-focus and no-capture captions are too long for the bottom row the scale caption and the Ground toggle share, so they sit at the region's top-left in place of the `Captured` tag. The `sm` toggle sits on a `surface` track with a `line-soft` border: on the dark tone its selected `ink` chip would otherwise vanish into the ground.
- Capture. The neutral state before each probe also clears any text selection: a press on an element hidden at rest lands on the text beneath it and drags a selection, which reached the next crop (the clean fixture's Resources menu fell to a 10.1% diff before the fix).
- The touch overlay. The card body's reveal leaves a `clip-path` on it, which clips the name link's overlay to the body, so on touch devices the card carries a second link over the preview region only (out of the tab order and hidden from screen readers; the name link is the one a reader reaches). The CheckBadge and the StatesStrip keep their place above the body's overlay, and the Ground toggle above both.
- The previews event names the two new reasons, `{n} hidden until focused` and `{n} no capture`.
- The versioned fixture documents are `clean-v1-0.json` and `clean-v1-2.json` (the v1.2 build's clean run, committed before the fixtures were regenerated); the references test runs over every committed run document and, in an integration test, every seeded one. `pnpm runs:parse` prints any unresolved reference.
- Durations. Labels on one row keep 56 px between centers and never touch: two labels' half widths plus 4 px also apply, with the `hex` style's advance as the width. The Long list is adopted. Measured at 1440 on the two P18 runs through the queue (the strip 1,062 px wide), the log scale alone dropped two of fifteen value labels on modernsoftworks.com (`u5wb4o3to9`: 100 to 1,200 ms, then 4,000, 14,000 and 35,000) and none on the portfolio (`5m44rnrxfm`, up to 25,000 ms); so durations over 2,000 ms sit in the `Long` list and the scale ends at 2,000 ms, on every run.
- Duration triggers. A tick's target is 24 px across and must not overlap another (axe `target-size`, WCAG 2.5.8): the most used tick takes a trigger first and each next one only when its center sits 24 px from every trigger taken; the rest are drawn, not pressed. On the clean fixture at 390 the 120 and 160 ms ticks sit 22 px apart. The placeholder that stands in for a crop in /open sits on a `surface` note, as the other preview notes do, so it reads on the dark tone.
- Pattern chips. The chips take as many as fit 40% of the row (the whole row once stacked on a phone), six at most; Stop returns the chip to rest at once.
- The radius value reads `{value} px` (copy.md); the card's contrast fallback swaps when the fill is within ΔE 5 inclusive, and a ground is dark when white text reads better on it than black.
- Skeleton heights re-measured on the clean run at 1440: the duration strip 147 (it was 171), the easing group 424 (358), the keyframes and patterns 978 (977), the Radius and Shadow row 274 for each card (new); the ±4 px test holds them.
Reasoning: each is the closest faithful reading of the documents; the clustering ruling extends an existing distinction to the new flag rather than letting the model's wording decide structure.
Affects: `docs/specs/capture-and-states.md`, `docs/specs/component-detection.md`, `docs/specs/preview-fidelity.md`, `docs/design/components.md`, `docs/design/copy.md`, `docs/evals.md`, `STATUS.md`.

## D-112 · Rulings from fixing the v1.3 review

Date: 2026-10-31 · Context: the Partner's review of v1.3 (`docs/partner-log.md`, 2026-10-29) sent twelve fixes; each names the document it must match, and some left a choice open or reversed an earlier ruling. The entries below are added as the fixes land.
Decision:
- Loaded frames. A preview iframe takes its `src` only after the client has mounted it, so its `load` always reaches PreviewFrame's handler and sets `data-loaded`; an iframe with no `src` loads `about:blank` first, which does not count. QA waits for every frame and crop to be marked (lazy ones far below the fold excepted), and refuses a shot whose live preview region is one flat fill. The hovered card and the scrolling drawer are QA states shot as elements, so the pointer's hover holds.
Reasoning: a golden is evidence only when what it shows was painted.
Affects: `docs/evals.md`, `apps/web/components/PreviewFrame.tsx`, `tests/qa/`.
