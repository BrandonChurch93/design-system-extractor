# STATUS

This is the single live file for the build. A fresh session with no memory must be able to continue from this file plus the docs. Keep every section current. Update it before any stop.

## Blocker

None.

(When a hard blocker exists, replace the line above with `BLOCKER:` followed by exactly what is needed from Brandon and what was tried. Then stop.)

## Current phase

P4 · Token clustering. Started 2026-10-25.

## Next action

Start P4: read `docs/specs/token-clustering.md` and `docs/specs/model-calls.md` in full, then build `packages/pipeline/src/tokens/` (constants, colors, type, space, radius, shadow, breakpoints, naming with the deterministic fallback, the `tokens` stage in `run.ts`) on top of `collect.ts` and `sources.ts`, with unit tests, then the token metrics in `scripts/evals/metrics.ts`, then record the color-naming call for the five fixtures and move `evals:gate` to `--through tokens`.

## Phase checklist

P4 exit criteria (from `docs/plan.md`), plus the standing gate items:

- [ ] Token precision and recall meet the `docs/evals.md` thresholds on all five fixtures (`pnpm evals --through tokens`), against the token sections of `expected.json` (D-046, D-047).
- [ ] Unit tests: clustering (20 colors with 6 within ΔE 2 yield 15 clusters with the right representatives and counts), neutral and semantic classification (including `aria-invalid` context, D-049), naming uniqueness, base grid inference on 4-grid, 8-grid and noisy sets.
- [ ] The deterministic naming fallback produces valid unique names on every fixture with the model disabled.
- [ ] The color-naming call recorded for the fixtures (`env DSE_MODEL_MODE=record`), replayed by evals; prompts in `packages/pipeline/src/models/prompts/`, voice rules, `pnpm prompts:build`.
- [ ] Contrast pairs, provenance (pages and raw values), raw counts, families with loaded flags, events with the exact line shapes.
- [ ] `evals:gate` runs `--through tokens`.
- [ ] Handoff consistency sweep, `pnpm check`, `pnpm qa:copy`, `pnpm verify:all`, `pnpm qa:design` reviewed for touched pages, commit naming P4, STATUS updated.

Notes carried from P3 for P4: the type role `display` must come from the home page's main snapshot, not from the revealed-menu snapshots that `sourcesFrom` also yields; spacing tokens need weight above zero; library breakpoints are counted per capture, and the top six are expected as [768, 769, 1023, 1024, 1216, 1408].

## Gates passed

- P3 · Crawler, selection and capture · 2026-10-25 · selection exact on all five fixtures (`evals:gate`, replay) · capture, blocked-state, private-range, politeness, form and dialog, select model-call tests green (unit and integration) · expected.json complete for all five fixtures · D-040 to D-050 logged with documents fixed · catalog unchanged (qa:visual against goldens, qa:design reviewed at three viewports) · axe zero violations · verify:all green. Fixed during the gate: nested `run.mjs` runs lost the record of which variables came from `.env.local`, so `verify:all` ran evals live once ($0.0002); now kept and tested (`scripts/test/run-env.test.ts`).
- P2 · Design system in code and the catalog · 2026-10-25 · tokens.css diffed against design-system.md and motion.md both ways (mutation-checked) · contrast table recomputed within 0.05 · 23 primitives plus a Motion section in /catalog with 390 px frames · axe zero violations on the catalog at 1440, 820, 390 and on all 25 frame routes · reduced-motion Playwright test with a no-preference control · catalog goldens committed · qa:design reviewed at three viewports with a 60-stop keyboard focus walk · verify:all green.
- P1 · Schema and data model · 2026-10-25 · 42 tests (schema, enums and labels verbatim from copy.md, every data-model type by name, migrations clean and idempotent, db:reset, patch merge and concurrency, events, unpublished runs hidden, storage text and binary round trip with content types) · verify:all green.
- P0 · Preflight · 2026-10-25 · `pnpm run doctor` all services connected (Postgres 16, Redis 7, MinIO with both buckets and public read, Anthropic key with both model ids live) · `pnpm check` green · `pnpm verify:all` green end to end with empty suites · worker image builds and runs · `pnpm --filter web build` green.

## Decisions made during this build

Mirror of the entries added to `docs/decisions.md`, newest first.

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
- Dev helpers: `pnpm exec tsx scripts/shot.ts <url> <out.png> [w] [h]` and `scripts/tile.ts` to cut tall screenshots for review.
- Fixture authoring aids (need `pnpm fixtures:serve` or start the server themselves through the pipeline): `pnpm exec tsx scripts/fixtures-inventory.ts <site> [--where=10,18] [--color=#HEX,...]` prints every raw token value, the ΔE 2.3 clusters and the drift near-duplicate pairs; `scripts/fixtures-candidates.ts <site> [desktop|mobile]` prints every element candidate with its rules, box and states. Re-run both after any fixture change and keep `expected.json` in step (D-046, D-047).

- Node 22.14, pnpm 9.15.9, TypeScript 5.9.3 (the native 7.x compiler is not yet supported by Next.js tooling), ESLint 9 (ESLint 10 is not supported by the React, jsx-a11y and import plugins that `eslint-config-next` uses), Next.js 16.4, React 19.3, Zod 4.6, Vitest 5, Playwright 1.64 with its Chromium.
- Internal packages `@dse/schema` and `@dse/pipeline` are consumed as TypeScript source; the worker, MCP and CLI bundles inline them with tsup.
- Root scripts load `.env.local` (or `DOTENV_FILE`) through `scripts/run.mjs` without overriding variables already set, so `env DSE_MODEL_MODE=live pnpm evals` wins.

## What Brandon must do at the end

Keep this list current. It is the only hands-on work he will do.

1. Follow `docs/deploy-runbook.md`.

## Session log

Newest first. One line per session start, one per gate passed, one per stop. Keep it short.

- 2026-10-25 · Gate passed · P3 · selection exact, capture and blocked-state tests, expected.json complete, verify:all green.
- 2026-10-25 · P3 · expected.json authored for all five fixtures (fixtures adjusted per D-046), decisions D-040 to D-050 logged and documents fixed, new unit tests (candidates, color, collect, expected files), verify:all started.
- 2026-10-25 · Session started (after compaction) · P3 · read CLAUDE.md, STATUS, decisions, plan, handoff, evals, crawler, page-selection, capture-and-states, caps-and-budget, model-calls · tree reconciled (P3 work since 0377500 uncommitted: tests, color parse, token collect, fixture fixes).
- 2026-10-25 · Gate passed · P2 · tokens, contrast, catalog, axe, reduced motion, goldens, verify:all green.
- 2026-10-25 · Gate passed · P1 · tests, migrations, storage round trip, verify:all green.
- 2026-10-25 · Gate passed · P0 · doctor, check and verify:all green.
- 2026-10-25 · Session started · P0 · read CLAUDE.md, 00-start-here, STATUS, handoff, decisions, quality-bar, glossary, brief, plan, evals, deploy-runbook, v2-plan, every design and spec document, reference READMEs · tree clean (new repository).
