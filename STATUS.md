# STATUS

This is the single live file for the build. A fresh session with no memory must be able to continue from this file plus the docs. Keep every section current. Update it before any stop.

## Blocker

None.

(When a hard blocker exists, replace the line above with `BLOCKER:` followed by exactly what is needed from Brandon and what was tried. Then stop.)

## Current phase

P18 · Third testing round (v1.3). In progress. Done and committed: docs merged (D-101 to D-109, merge rulings D-110), the addendum deleted; schema 1.3.0 and the upgrade's 1.3 step (with `clean-v1-2.json`, the v1.2 fixture document) and the references test; the 404 page naming context and pattern attribution; the hidden-at-capture rule, hidden-until-focus previews, no-crop, the fill; the clean family's skip link; state rules in the default preview and inert links, the security suite over both; the web previews (pointer, overlay, 0.6× floor, drawer 1:1, contrast fallback, card Ground toggle, no-crop card), the Motion components (stage, log-axis strip, Replay width, six keyframes, chips at rest), the Radius and Shadow row, the catalog states, `tests/e2e/v13.spec.ts` (not yet run).

v1.2 (P17) passed its gate and the Definition of Done (twelve items) on 2026-10-28; v1.1 (P16) passed its gate and the Definition of Done on 2026-10-27; v1.0 (P0 to P15) on 2026-10-26.

## Next action

Finish the record-mode evals (the clean family's naming requests changed), then `pnpm fixtures:runs`, the export goldens, stop `pnpm dev` and `pnpm db:seed:fixtures`, run the e2e suite, re-measure the skeleton heights, qa:design review at three viewports.

Environment note: the repository sits on an iCloud-synced Desktop and macOS evicts files (`ls -lO` shows `dataless`); a read then blocks while iCloud downloads. `find . -type f -flags +dataless -print0 | xargs -0 cat > /dev/null` brings them back.

### P18 plan

Read for P18: CLAUDE.md, STATUS, decisions D-001 to D-100, handoff, the v1.3 addendum, partner.md, partner-log.md, plan (P17, the Definition of Done), and every document it amends (components, motion, copy, pages, design-system, preview-fidelity, capture-and-states, component-detection, motion-capture, data-model, evals, glossary).

1. Docs merged (done): D-101 to D-109 (the addendum's nine, in its order) and D-110 (merge rulings); the addendum deleted.
2. Schema and upgrade (`packages/schema/src/run-document.ts`, `enums.ts`, `labels.ts`; `packages/pipeline/src/version.ts`, `upgrade.ts`): `Preview.fill`, `cropKey` optional, `Instance.hiddenAtCapture`, `hidden-until-focus` and `no-crop`, `stats.previews` keys; the 1.3 step. Tests: `upgrade.test.ts` (v1.0 and v1.1 fixture documents, idempotent, the unwritten-key preview, dangling pattern ids), a references test over every fixture run, the seed documents and the versioned fixtures.
3. Pipeline naming and attribution (`components/naming.ts`, `components/model.ts`, `components/motion.ts`): `404 page` context, the pattern's own element; recordings re-recorded for the affected requests. Tests in `components.test.ts` and the motion attachment tests.
4. Capture (`capture/snapshot-script.ts`, `capture/candidates.ts`, `stages/capture.ts`, `stages/components.ts`, `stages/previews.ts`): the hidden-at-capture rule with `clip` and `clip-path`, the focusable exception, the focus crop as the preview, the drop rule, the `no-crop` form, the fill read. Tests: snapshot rule unit tests, the clean fixture's skip link (`fixtures/src/clean-family/`, the generated sites, `expected.json`).
5. Previews (`previews/build.ts`, the state rule writer, `previews/sanitize.ts`): `:hover`, `:focus-visible`, `:active` rules in the default document; security suite cases; the link-click frame test.
6. Web, previews (`PreviewFrame`, `FitPreview`, `ComponentCard`, `ChipGroup` sm, panel stage): pointer, overlay on the body with the touch rule, the 0.6× floor with clip and fade, captions, the drawer at 1:1 with horizontal scroll, the contrast fallback (a pure function in `apps/web/lib`) and the card Ground toggle, the `no-crop` CodeBlock card, the hidden-until-focus caption.
7. Web, Motion (`EasingCard`, `DurationStrip`, `ReplayButton`, `KeyframesList`, `PatternList`): stage at card width, log axis with the label budget (pure layout function, unit-tested), popover ticks, fixed-width Replay, six keyframes with the toggle, the chip at rest on the scaled start state. Catalog states `Wide range`, `Dense`, `Dark on dark`, a long keyframes list.
8. Web, tokens (`TokensSection`): the Radius and Shadow row, 72 px swatches, the blur gap (pure function, unit-tested), the dead `sample44` class removed.
9. Skeleton heights re-measured (easing stage, keyframes list, token cards) and the ±4 px test.
10. e2e (`tests/e2e/v13.spec.ts`): Replay width, chip rest and return, card frame hover, touch tap and name click open the drawer, card Ground toggle, drawer horizontal scroll, long-task with 12 easings at card width.
11. Copy (`strings.ts`), qa:copy; evals in replay with the skip link; seed and fixture runs regenerated; qa:design review at three viewports; goldens updated once and logged; axe.
12. Real-site check: the owner's portfolio and modernsoftworks.com fresh through the queue, `P18 real-site check` in STATUS; the Long list measured and decided; traceability, README, CHANGELOG 1.3.0, verify:all on a fresh clone, the Definition of Done (thirteen items).

### P17 plan

Read for P17: CLAUDE.md, STATUS, decisions D-001 to D-090, handoff, plan, the v1.2 addendum, partner.md, partner-log.md, and every document it amends (showcase, data-model, preview-fidelity, capture-and-states, checks, exports-and-mcp, evals, pages, components, motion, copy, runbook, glossary).

1. Docs merged (done): D-091 to D-096 (the addendum's six, in its order) and D-097 (merge rulings); the addendum deleted; `pnpm runs:parse` added and the root cause verified on `tx4mehptdf` and `mhxvphzzfr` (447 issues and a clean parse, recorded in D-092).
2. Upgrade (`packages/pipeline/src/upgrade.ts` new, `version.ts` to 1.2.0, `apps/web/lib/server/runs.ts`, `apps/web/app/compare/page.tsx` and CompareView's StateCard, `apps/web/components/open/OpenView.tsx`, `packages/mcp/src/index.ts`, `packages/cli/src/index.ts`): the v1.0 fixture document from `0ff300f` in a worktree (`packages/pipeline/test/fixtures/runs/clean-v1-0.json`); tests: `upgrade.test.ts` (complete parse, idempotent, references resolve, roles recomputed, slugs unique), `pnpm runs:parse --all` clean after upgrade, the seed's `seedv10cln`, e2e Compare v1.0 against v1.1 with Motion rows at 0, `/r/tx4mehptdf` and Compare on the owner's two runs.
3. Schema (`packages/schema/src/run-document.ts`, `showcase.ts`, `labels.ts`, a shared `checkCounts`): `usedBy`, `ground`, `Preview.ground`, `fontsSubstituted`, `stats.previews`, `stats.componentsPassing`, `promoted`. Tests: schema and labels.
4. Showcase (`scripts/showcase/index.ts`, `plan.ts`): `--add`, `--remove`, `--list`, local and `--remote`; tests in `scripts/test/showcase*.test.ts` (first card, renumbering, sparse and incomplete refusals, orphan warning, retention through the sync, remote paths against the stub). Home caption variant.
5. Previews, measured: the baseline table (three real sites at 15 min, before any builder change) into STATUS; classify every captured result by cause (a `scripts/previews-inspect.ts` mode for real runs); per-cause handling in `previews/build.ts`; the masked font comparison; the CSS cap measured; render check order core first by usage (`stages/previews.ts`); `stats.previews` and the event line; re-run and record.
6. Ground and state files (`capture/states.ts`, `capture/crop` and the instance writer, `stages/capture.ts`, `components` stage, `previews/build.ts`, `previews/render-check`): ground sampling and the 4 px painted margin; transparent preview documents with the ground painted by the app and the check; state files with generated keyframes and no `!important`; the security suite on state files; the halo band on `messy-after` with its extra recordings, seed and goldens.
7. Web, previews (`PreviewFrame`, `StateBar` new, Ground toggle, scale caption, ComponentCard ground, panel): catalog entries; e2e: pinning Hover reaches the recorded values after the recorded duration.
8. Motion UI (`apps/web/components/run/motion/*`: EasingStage new, EasingGrid clock, EasingCard, DurationStrip, PatternRow auto-preview, ReplayButton for patterns only; `components/motion.ts` `usedBy`): catalog sample with 12 easings; e2e: long tasks, shared start, pause off screen, reduced motion still.
9. Checks (`checkCounts` shared, `stats.componentsPassing`, StatStrip sixth cell, ComponentFilter `Passing all checks`, CheckBadge restyle, ChecksSection opening line, exports `Checks:` line and rule, MCP `passedAll`): tests and goldens.
10. Copy (`strings.ts` from copy.md), qa:copy; evals thresholds (css-in-js 0.85) and the live-rate floor on the three fixtures.
11. Screenshot review at 1440, 820, 390 (Motion, components, panel, stat strip, Compare, home), goldens updated once and logged; axe.
12. Real-site check: modernsoftworks.com fresh through the queue, with the live-rate table, components passing and the Compare link against `mhxvphzzfr`; linear.app at the visitor timeout with every core component checked; traceability, README, CHANGELOG 1.2.0, verify:all on a fresh clone, the Definition of Done (twelve items).

### P16 plan

Read for P16: CLAUDE.md, STATUS, decisions (D-001 to D-080), handoff, plan, the addendum and motion-capture.md in full, then every document they amend (data-model, capture-and-states, token-clustering, component-detection, preview-fidelity, exports-and-mcp, drift, model-calls, evals, pages, components, copy, motion, design-system, quality-bar, glossary, showcase, architecture).

1. Docs merged (done): D-081 to D-088 (the addendum's D-027 to D-034, whose ids were taken) and D-089 (merge rulings: the freeze stays before states, delays are not durations, fallback and variant and type naming words, site names per kind, eight rail rings and export cards, and the rest).
2. Schema (`packages/schema/src/enums.ts`, `run-document.ts`, `labels.ts`, `exports.ts`, `expected.ts`, `stages.ts`): TokenKind, TypeRole, ExportFormat, Substage, MotionKind, MotionSource, ComponentTier; OverlayToken, DurationToken, EasingToken, Keyframes, BreakpointToken, SiteVariable, MotionPattern, ComponentMotion, `tier`, `slug`, delta `transition`, `motion` on the document. No SQL migration: the document is one JSONB column (stated in data-model.md). Tests: schema and labels tests extended.
3. Fixtures (`fixtures/src/clean-family/*`, `fixtures/src/messy/generate.ts`, the generated sites, every `expected.json`, `packages/schema/src/expected.ts`, `scripts/test/expected.test.ts`): the clean motion, site-variable, overlay, twin, ghost and footer-button layer shared by tailwind and css-in-js; messy's sprawl, reset, translucent grays and `other` tuples; expectations re-derived and checked by hand with the inventory scripts.
4. Capture (`capture/motion-script.ts` new, `capture/states.ts`, `capture/snapshot-script.ts`, `capture/sheet-scan.ts`, `stages/capture.ts`): init script, read-outs, freeze ends Web Animations, state property set and noise rules, transition timing, the script-motion wait. Tests: states unit table, motion classification unit tests, the freeze interaction test, the clean fixture's planted motion.
5. Tokens (`tokens/site-vars.ts`, `tokens/overlays.ts`, `tokens/motion.ts`, `tokens/easing-table.ts` new; `tokens/type.ts`, `colors.ts`, `space.ts`, `naming.ts`, `stages/tokens.ts`, `models/prompts`): tests for site naming, hashed names, overlays, roles and words, twins, durations, easings table, keyframes.
6. Components (`components/variants.ts`, `components/model.ts`, `stages/components.ts`, `components/motion.ts` new): tier, slug, third words, context names, final pass, motion attachment. Tests from component-detection.md.
7. Previews (`previews/build.ts`): reset filtering, the 7,000-character test.
8. Drift (`drift/findings.ts`, `proposal.ts`): motion sprawl and proposed motion.
9. Exports (`exports/*`), MCP (`packages/mcp`), CLI: every format, `motion.css`, `motion.json`, Default line, core first, site variables block, set re-mapping, the variable-resolution test on every fixture and the frozen documents; goldens.
10. Evals (`scripts/evals/metrics.ts`, `scripts/evals.ts`): the new rows and thresholds; recordings re-recorded live for the fixtures.
11. Web (`apps/web/components/run/motion/*` new, TokensSection, ComponentsSection, panel, StageRail, RegionSkeleton, ExportsSection, compare, how, catalog, `copy/strings.ts`): every primitive and placement; e2e for Replay under reduced motion; seed re-run; qa:design review at three viewports; goldens updated once and logged.
12. Real-site check on stripe.com, prompt pasted below; traceability regenerated; README, CHANGELOG 1.1.0; verify:all; the Definition of Done in full.

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

## P18 real-site check

### The owner's portfolio and modernsoftworks.com, fresh through the queue (2026-10-29)

`pnpm dev` (web and worker), `POST /api/runs` at the visitor timeout, on the final P18 pipeline.

| Run | time · cost | pages · components | live | diff | hidden-until-focus | no-crop | not-checked | live of checked | core live |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brandonchurchportfolio.com `5m44rnrxfm` (v1.3) | 144 s · $0.0072 | 4 · 15 | 11 | 3 | 1 | 0 | 0 | 11 of 15 · 73.3% | 7 of 10 |
| brandonchurchportfolio.com `d78cp1kh0v` (owner, v1.2) | 171 s · $0.0074 | 4 · 16 | 11 | 5 | n/a | n/a | 0 | 11 of 16 · 68.8% | 7 of 10 |
| modernsoftworks.com `u5wb4o3to9` (v1.3) | 253 s · $0.0086 | 12 · 93 | 75 | 17 | 1 | 0 | 0 | 75 of 93 · 80.6% | 51 of 65 |
| modernsoftworks.com `qgc6npq1au` (P17, v1.2) | 234 s · $0.0112 | 12 · 74 | 60 | 13 | n/a | 1 | 0 | 60 of 73 · 82.2% | 42 of 52 |

- The skip link. Portfolio: one `Skip link`, `captured` with `hidden-until-focus`, its focus crop 146 × 29 (2 hidden instances); the v1.2 run had two (a 59 × 27 dark box captured `diff`, and a 1,440 px wide strip that was the zero-height header), and the second is no longer a component. modernsoftworks.com: `Skip link`, `captured` with `hidden-until-focus`, 207 × 57, where P17's run had it `no-crop` at 0 × 0 with a key never written.
- Cards on the contrast fallback: 36 of 93 on modernsoftworks.com (cards, inputs, the navigation and footer, `#1A1A1A` on `#141414` and the like), 0 of 15 on the portfolio.
- The 404 page: modernsoftworks.com's second Button, first seen on `/8780d3aa06-does-not-exist`, is `Button (404 page)` (P17: `Button (8780d3aa06 does not exist)`); no name in either run contains the probe path, and no pattern reference dangles.
- Durations: on the log scale alone, modernsoftworks.com's fifteen (100 ms to 35,000 ms) dropped 2 value labels at 1440 (the strip 1,062 px wide) and the portfolio's fifteen dropped none; the Long list is adopted (D-111). With it, both strips label every value at 1440 (86 and 104 px tall); at 390 they label 12 of 15 and 10 of 15, and stay under 220 px.
- Components passing: 8 of 15 on the portfolio, 40 of 87 on modernsoftworks.com.
- Screenshots: `docs/real-site-check/p18-modernsoftworks-cards.png` (the core cards at 1440: the dark site's grounds, a FAQ trigger cut to fit at 0.6×, the skip link shown focused, the Ground toggle on every card), `docs/real-site-check/p18-portfolio-skip-link.png` (the portfolio's skip link card), `docs/real-site-check/p18-modernsoftworks-durations.png` (the strip with its Long list at 1440).

## P17 real-site check

### Baseline, before any preview builder change (2026-10-28)

Measured on the v1.1 code (the main tree before step 5, and a worktree at `a87c663` for the modernsoftworks.com re-run) with `env DSE_MODEL_MODE=live DSE_RUN_TIMEOUT_MS=900000 pnpm pipeline:run <url>`, the showcase timeout, so `not-checked` measures the budget and not fidelity; counted by `pnpm live-rate`. The owner's two runs are the addendum's starting point (visitor timeout).

| Run | live | diff | css-too-large | fonts-unavailable | not-checked | total | live of checked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| modernsoftworks.com `mhxvphzzfr` (owner, v1.1, 6 min) | 45 | 44 | 0 | 0 | 0 | 89 | 45 of 89 · 50.6% |
| linear.app `tx4mehptdf` (owner, v1.0, 6 min) | 17 | 1 | 0 | 26 | 76 | 120 | 17 of 44 · 38.6% |
| www.modernsoftworks.com `yogi9d534h` (15 min) | 24 | 51 | 0 | 0 | 0 | 75 | 24 of 75 · 32.0% |
| linear.app `ish379diwx` (15 min) | 42 | 7 | 0 | 71 | 0 | 120 | 42 of 120 · 35.0% |
| stripe.com `vj12gtw3u4` (15 min) | 33 | 83 | 0 | 4 | 0 | 120 | 33 of 120 · 27.5% |

At the showcase timeout nothing is cut by the budget on any of the three: linear.app's fallbacks are fonts (71), stripe.com's and modernsoftworks.com's are render differences. The bare host modernsoftworks.com still answers Hostinger's 403 to the crawler (a 17 s sparse run); the owner's run and this one use `https://www.modernsoftworks.com/`.

### linear.app at the visitor timeout (2026-10-28, 6 min, `3niiwooj5r`)

Complete in 292 s. The budget cut fingerprints (48 of 59) and the states of later pages; previews were not cut: 86 live, 33 render differed, 1 styles too large, 0 not checked of 120 (71.7% of the checked), and all 87 core components checked (57 live), since render checks run core first by use (D-095). The owner's v1.0 run of this site at the same timeout left 76 unchecked.

### qa:design and the qa:visual goldens (2026-10-28)

`pnpm qa:design` 165 of 165 captured on the final builder and seed, reviewed at 1440, 820 and 390 (run page, panel, Compare, home; the StateBar's chips scroll on phones with Play at the row's end as specified). `pnpm qa:visual` then differed on the v1.2 surfaces, and the goldens were updated once (`--update-snapshots=all`, 128 passed): 3 new (the catalog StateBar at three widths), 128 resized (the six-cell stat strip, the checks opening line, the easing stages and the 12-easing catalog sample, the Compare Motion card, `messy-after`'s dark band, and 1 px rounding on section crops), the rest unchanged or under 3% of pixels (anti-aliasing and the seed's re-recorded content).

After D-099, the first fresh-clone `verify:all` found the catalog Compare goldens out of date (the sample's later run kept its finish date of Oct 12, so its buttons fell to `Open the earlier run`); the sample now finishes on Nov 23, and the review of that golden found the Added card's path running into the token name in a narrow card, so the path now sits under the name. The three catalog Compare goldens and the four Compare page goldens were updated for these two changes and reviewed.

### axe (2026-10-28)

`pnpm qa:axe`: 185 of 185 pages and states with zero violations, the StateBar, the Ground toggle, the check Pills and the Compare StateCard included.

### The halo check (2026-10-28)

`messy-after`'s dark band: the Band button (`t8l06oxn`) and the Feature card (night mode) are live with ground `#0B0D10`; at device scale 2 the rounded white button sits on its own dark ground in the panel's PreviewStage and on its card, with no ring of another color at its corners (screenshot review).

### The owner's two runs after the upgrade (2026-10-28)

On the production build against the local database: `/compare?a=tx4mehptdf&b=mhxvphzzfr` answers 200 and renders every row (two sites; Colors · 49 fewer; the Motion card's Durations 0 → 15, Easings 0 → 6, Keyframes 0 → 45, Patterns 0 → 43; the component table); `/r/tx4mehptdf` and `/api/runs/tx4mehptdf` answer 200; no page error. Before the upgrade all three threw (D-092).

### Showcase promotion on the local database (2026-10-28)

`pnpm showcase --add z1ud0oz4vu` (the sparse v1.0 modernsoftworks.com run) answered `z1ud0oz4vu is sparse (0 components). A sparse run is not added to the showcase.` and exited 1. `pnpm showcase --add mhxvphzzfr` made Modern Softworks the first card on the home page with the promoted caption (`Sites I have run it on. Yours stays private unless you share the link.`), `is_showcase` true and null retention, and warned `7 entries leave an orphan at 3 or 2 columns. Add 5 more or remove 1.`; `--list` showed it as promoted; `--remove mhxvphzzfr` took it down with its 90-day retention back.

### modernsoftworks.com, fresh through the queue (2026-10-28, `qgc6npq1au`)

`pnpm dev` (web and worker), `POST /api/runs` with `https://www.modernsoftworks.com/` at the visitor timeout: complete in 234 s for $0.0112, 12 pages, 74 components (53 core, 21 page-specific), 23 colors, 18 type styles, 12 spacing steps; the states budget cut later pages' states (logged).

| Run | live | diff | css-too-large | fonts-unavailable | not-checked | total | live of checked | core live of checked |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| modernsoftworks.com `qgc6npq1au` (v1.2, fresh) | 60 | 14 | 0 | 0 | 0 | 74 | 60 of 74 · 81.1% | 42 of 53 |
| modernsoftworks.com `mhxvphzzfr` (owner, v1.1) | 45 | 44 | 0 | 0 | 0 | 89 | 45 of 89 · 50.6% | 35 of 69 |

Components passing: 30 of 71 pass every check that applies (82 of 136 checks passed). Compare against the previous run: `/compare?a=mhxvphzzfr&b=qgc6npq1au` answers 200 with every row (Colors 31 → 23, Type styles 20 → 18, Spacing 12 → 12, Components 89 → 74, Checks passed 95 → 82, the Motion card and the component table); `/r/qgc6npq1au` answers 200. Its title read "What changed in today" and both buttons "Open the Oct 28 run", fixed under D-099.

### After the fourth round of handling (2026-10-28, 15 min)

Counted by `pnpm live-rate` on the run files.

| Run | live | diff | css-too-large | fonts-unavailable | not-checked | total | live of checked | core live of checked |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| www.modernsoftworks.com `9rx5lsdzlc` | 62 | 13 | 0 | 0 | 0 | 75 | 62 of 75 · 82.7% | 44 of 54 |
| linear.app `3ekye7ii3n` | 98 | 21 | 1 | 0 | 0 | 120 | 98 of 120 · 81.7% | 65 of 83 |
| stripe.com `9bwlr9x7rq` | 87 | 33 | 0 | 0 | 0 | 120 | 87 of 120 · 72.5% | 73 of 101 |

Every site is over the 70% floor (D-095), with no component unchecked. stripe.com's third-round drop was 4 previews lost to the svg `var()` handling (svg children are never in the snapshot, so the attribute was removed and the shapes filled black) and 2 from a different set of crawled pages; the fourth round corrected the svg handling and added ancestors' scale, container conditions read against the page's container, the reset carry in its layer and hidden inputs kept hidden, each measured on stored previews first (74 to 86 projected, 87 measured).

### After the third round of handling (2026-10-28, 15 min)

| Run | live | diff | css-too-large | fonts-unavailable | not-checked | total | live of checked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| www.modernsoftworks.com `z2mr4izraq` | 76 | 19 | 0 | 0 | 0 | 95 | 76 of 95 · 80.0% |
| linear.app `gzxicnh0nd` | 96 | 23 | 1 | 0 | 0 | 120 | 96 of 120 · 80.0% |
| stripe.com `ifvxvvhux7` | 74 | 46 | 0 | 0 | 0 | 120 | 74 of 120 · 61.7% |

modernsoftworks.com and linear.app meet the floor. stripe.com fell from 66.7%; a fourth round on it follows (regression or variation, and the remaining causes).

### After the second round of handling (2026-10-28, 15 min)

| Run | live | diff | css-too-large | fonts-unavailable | not-checked | total | live of checked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| www.modernsoftworks.com `89oeabwdea` | 60 | 15 | 0 | 0 | 0 | 75 | 60 of 75 · 80.0% |
| linear.app `ydbxpnubjo` | 83 | 36 | 1 | 0 | 0 | 120 | 83 of 120 · 69.2% |
| stripe.com `dk3a8fecyk` | 80 | 40 | 0 | 0 | 0 | 120 | 80 of 120 · 66.7% |

linear.app and stripe.com are below the 70% floor and their remaining captures are not the out-of-scope kinds, so a third round followed.

### After the first round of handling (2026-10-28, 15 min, storage over HTTP)

| Run | live | diff | css-too-large | fonts-unavailable | not-checked | total | live of checked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| www.modernsoftworks.com `366sqcl8tb` | 73 | 18 | 0 | 0 | 0 | 91 | 73 of 91 · 80.2% |
| linear.app `9tgcgu3m6g` | 69 | 51 | 0 | 0 | 0 | 120 | 69 of 120 · 57.5% |
| stripe.com `wjn7p14ocv` | 75 | 45 | 0 | 0 | 0 | 120 | 75 of 120 · 62.5% |

### Third classification, after the second round (2026-10-28)

The 77 captured previews of `ydbxpnubjo` (linear.app, 37, 20 core) and `dk3a8fecyk` (stripe.com, 40, 33 core), each fix measured by re-rendering a patched copy of the stored preview against the page crop.

| Cause | linear.app (core) | stripe.com (core) | Handling (D-098) |
| --- | --- | --- | --- |
| element not shown on the page (clipped away, closed menu, opacity 0 tooltip, inactive tab, 1 × 1) | 3 (0) | 11 (10) | none possible: the reference does not show it |
| other paint over the element | 6 (3) | 4 (4) | not handled |
| the page shows other content (animation, cycling deck) | 4 (2) | 4 (2) | not handled |
| images (video, popups, over the cap) | 3 (1) | 3 (3) | not handled |
| ground behind gradients or parent paint | 2 (0) | 4 (4) | not handled |
| duplicate stylesheets reorder rules | 4 (3) | 0 | the last copy decides |
| container query units | 3 (3) | 0 | resolved against the container |
| inline roots | 3 (1) | 0 | content height as line height |
| sub-pixel position | 1 (1) | 2 (1) | the render placed at the page's phase |
| external background images removed | 0 | 3 (2) | not handled |
| other single causes | 8 (6) | 9 (7) | border-box placeholders, custom properties kept, svg var(), transform none, ancestor opacity handled |

Measured, the handled causes would make 12 more live on linear.app and 4 on stripe.com. Two proposals were left out: a 24 × 2 bar matched without alignment slack (a flat bar's match says little) and an emulated specificity change that could not be measured on real selectors.

### Second classification, after the first round (2026-10-28)

The 96 captured previews of `9tgcgu3m6g` (linear.app, 51 captured, 43 core) and `wjn7p14ocv` (stripe.com, 45 captured, 41 core); fonts now load on both, so font metrics fell from 46 to 2.

| Cause | linear.app (core) | stripe.com (core) | Handling (D-098) |
| --- | --- | --- | --- |
| page screenshot left unpainted (one tall capture at scale 2) | 13 (12) | 0 | the screenshot in 2,000 px clips |
| reference mismatch | 4 (4) | 10 (10) | not handled |
| ground (gradients, ancestor clips) | 4 (2) | 7 (6) | not handled |
| box outside the viewport or a clip | 3 (3) | 6 (6) | the visible part compared |
| image placeholder or resample | 5 (2) | 7 (6) | not handled further |
| snapshot id collision (another element's markup) | 5 (5) | 0 | one id counter per page |
| overlap | 3 (3) | 1 (1) | not handled |
| script animation end state | 0 | 3 (3) | `commitStyles()` at the freeze |
| variable in markup, background image | 2 (2) | 4 (3) | not handled |
| inline root, media order | 4 | 0 | not handled |
| one each (child combinator, control resets, `@container`, cascade layer, own transform, other) | 8 | 3 | the first four handled |
| font metrics | 0 | 2 | (masked comparison) |

### Causes of the captured previews, classified (2026-10-28)

Every captured preview of the three 15-minute runs, by its reference crop, its storage render and their pixel diff, one primary cause each (174 classified; the 42 boxes below the 8,000 px cut counted apart). Two findings change the baseline's reading: `pnpm pipeline:run` served previews as `file://` documents, which Chromium refuses fonts in, so every copied family fell back in these three runs (the owner's runs went through the worker and MinIO over HTTP and are the production-like baseline; P16's stripe.com check was measured the same flawed way); and linear.app's `InterVariable.woff2` is 352 KB with CORS, refused only by the 300 KB cap.

| Cause | linear.app | stripe.com | modernsoftworks.com | All (core) | Handling (D-098) |
| --- | --- | --- | --- | --- | --- |
| below the 8,000 px cut (no reference) | 9 | 25 | 8 | 42 | clips below the cut for crops and references |
| font metrics (font not loaded, or substituted) | 23 | 23 | 18 | 64 (45) | storage over HTTP in pipeline:run; 1 MB font cap; masked comparison; inherited text rendering on the root |
| reference mismatch (entrance not played, closed menu, hidden tooltip, marquee, focus, occluded) | 7 | 15 | 15 | 37 (26) | the freeze settles animations at their end instead of removing them; the rest out of the builder's reach |
| image placeholder | 8 | 6 | 2 | 16 (13) | the image's own pixels from the screenshot |
| box outside the viewport or a clip, or 1 × 1 | 5 | 7 | 1 | 13 (12) | not handled |
| ground | 6 | 5 | 0 | 11 (6) | the canvas color when nothing sets a background; gradients behind remain |
| layout (`vw` units, empty serialized longhands, rule order) | 2 | 0 | 7 | 9 (7) | viewport units resolved; the rest not handled |
| `:where()` reset dropped | 6 | 0 | 0 | 6 (6) | `:where()` and `:is()` rescoped |
| variable used only in markup | 1 | 2 | 0 | 3 (3) | not handled |
| SVG `use` | 2 | 0 | 0 | 2 (1) | a symbol inside the component inlined; `url(#id)` prefixed |
| other (markup mismatch, cascade layers, ancestor transform, overlap, undetermined) | 7 | 4 | 0 | 11 (5) | not handled |
| out of scope (video) | 1 | 0 | 0 | 1 (0) | out of scope |

## P16 real-site check

A fresh local run of stripe.com (`env DSE_MODEL_MODE=live pnpm pipeline:run https://stripe.com`, run `uno14531eh`, 2026-10-27): complete in 324 s for $0.0097, 12 pages, 120 components (95 core, 25 page-specific), 80 patterns, 46 of them observed. The prompt export has a Motion section, zero `var(--` references to undeclared names in any export of either set or any component prompt, no component or variant name ending in a digit, no type token named `other`, and every component has a tier and a slug. Naming reached its time budget on this site, so the components carry the rules' names (D-066, D-078). The first run of this check failed validation on a 0 ms duration and the exports named stripe's theme and runtime variables without declaring them; both are fixed (D-090). The whole prompt (125 KB) is `docs/real-site-check/stripe-prompt.md`; STATUS holds its opening, the Motion section with the first patterns, and the first contract, because the whole file would bury this one (D-090).

````markdown
You are building an interface that must match this design system exactly.

## Motion

Durations:

| Name | Value | Role |
| --- | --- | --- |
| duration-50 | 50 ms | Faster |
| duration-120 | 120 ms | Fast |
| duration-150 | 150 ms | Base |
| navigation-duration | 240 ms | Slow |
| duration-250 | 250 ms | Slower |
| accordionCollapseAnimationDuration | 300 ms |  |
| duration-325 | 325 ms |  |
| duration-375 | 375 ms |  |
| duration-400 | 400 ms |  |
| duration-450 | 450 ms |  |
| duration-500 | 500 ms |  |
| duration-600 | 600 ms |  |
| duration-700 | 700 ms |  |
| duration-750 | 750 ms |  |
| card-duration | 800 ms |  |
| duration-850 | 850 ms |  |
| duration-1000 | 1000 ms |  |
| duration-1100 | 1100 ms |  |
| duration-1200 | 1200 ms |  |
| duration-1250 | 1250 ms |  |
| duration-1420 | 1420 ms |  |
| duration-2000 | 2000 ms |  |
| duration-2260 | 2260 ms |  |
| duration-2500 | 2500 ms |  |
| duration-3000 | 3000 ms |  |
| duration-4000 | 4000 ms |  |
| duration-5000 | 5000 ms |  |
| duration-7000 | 7000 ms |  |
| duration-11700 | 11700 ms |  |
| duration-11950 | 11950 ms |  |
| duration-86400000 | 86400000 ms |  |

Easings:

| Name | Value |
| --- | --- |
| ease-out-cubic | cubic-bezier(0.215, 0.61, 0.355, 1) |
| ease-custom-1 | cubic-bezier(0.25, 1, 0.5, 1) |
| ease | ease |
| linear | linear |
| ease-custom-2 | cubic-bezier(0.4, 0, 0.2, 1) |
| ease-in-out | ease-in-out |
| ease-custom-3 | cubic-bezier(0.33, 1, 0.68, 1) |
| navigation-easing | cubic-bezier(0.45, 0.05, 0.55, 0.95) |
| ease-custom-5 | cubic-bezier(0.7, 0, 0, 1) |
| ease-out | ease-out |
| steps-1 | steps(1) |
| accordionCollapseAnimationEasing | cubic-bezier(0.65, 0, 0.35, 1) |
| card-ease | cubic-bezier(0.165, 0.84, 0.44, 1) |
| ease-custom-7 | cubic-bezier(0.3, 0, 0.2, 1) |
| steps-1b | steps(1, start) |
| ease-custom-10 | cubic-bezier(0.22, 1, 0.36, 1) |
| ease-custom-11 | cubic-bezier(0.61, 1, 0.88, 1) |
| ease-custom-12 | cubic-bezier(0.9, 0, 0.1, 1) |
| ease-custom-8 | cubic-bezier(0, 0.09, 0.4, 1) |
| ease-custom-9 | cubic-bezier(0.16, 1, 0.3, 1) |
| ease-in | ease-in |
| ease-custom-13 | cubic-bezier(0.2, 0, 0, 1) |
| ease-custom-15 | cubic-bezier(0.78, 0, 0.22, 1) |
| ease-custom-16 | cubic-bezier(0.12, 0, 0.39, 0) |

Keyframes: (32 blocks, in the full file)

Patterns:

- Entrance · div.UniversalChatCtaCard__container.UniversalChatCtaCard__container--fixed · on load · opacity 0 → 1, transform translateY(16px) → translateY(0px) · 300 ms · ease-custom-1
- Entrance · div.EnterpriseHubTicker__track > div:nth-of-type(1) · on load · transform translateX(-2.90533%) → translateX(-13.2013%) · about 4758 ms · easing not recorded, nearest token suggested: ease-out-cubic · observed
- Entrance · div.dom-graphic.dom-graphic--variant-default.crypto-hero-phone-animation__graphic · on load · transform translateY(160px) → translateY(0px) · 1,100 ms · ease-out · observed
- Entrance · div.dom-graphic.dom-graphic--variant-default.crypto-hero-phone-animation__graphic · on load · opacity 0 → 1 · 1,100 ms · ease-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-input-screen · on load · opacity 1 → 0 · 11,950 ms · ease-in-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-input-screen · on load · transform translateX(0px) → translateX(-266px) · 11,950 ms · ease-in-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-review-screen · on load · transform translateX(266px) → translateX(-266px) · 11,950 ms · ease-in-out · observed
- Entrance · div.crypto-hero-phone-animation__phone-success-screen · on load · opacity 0 → 1 · 11,950 ms · ease-in-out · observed

- … 72 more patterns in the full file

## Core components

### Button (nav, second)

Button. Variants: Primary, Secondary, Tertiary, Blue, Pink, Cyan.
States: Default, Hover, Focus, Active.
- Hover: background-color #0A2540 (300 ms); opacity 0.6 (300 ms)
- Focus: box-shadow 0px 0px 0px 2px #4D90FE, inset 0px 0px 0px 2px #FFFFFFE6
- Active: background-color #0A2540 (300 ms); opacity 0.6 (300 ms)
Tokens: hds-color-core-brand-500 for background-color, color-gray-50 for color, radius-pill for border-radius, hds-space-core-150 for padding-right, listSpacing for padding-bottom, columnPaddingNormal for padding-left, type-text-15 for font, accordionCollapseAnimationDuration for transition-duration, ease-custom-1 for transition-timing-function.
Default: background hds-color-core-brand-500 · text color-gray-50 · radius radius-pill · padding 3px hds-space-core-150 listSpacing columnPaddingNormal · font type-text-15
Motion: hover · background-color · 300 ms · ease-custom-1; hover · opacity · 300 ms · ease-custom-1; active · background-color · 300 ms · ease-custom-1; active · opacity · 300 ms · ease-custom-1; 1 motion pattern in the Motion section

```css
.dse-root .CtaButton { display: flex; align-items: center; justify-content: center; }
.dse-root .CtaButton { transition-property: opacity, color, background-color, border, fill, stroke; transition-duration: var(--accordionCollapseAnimationDuration); transition-timing-function: var(--ease-custom-1); transform: translateZ(0px); }
.CtaButton { display: inline-block; padding: 3px 0px 6px; border-radius: 16.5px; font: var(--ctaFont); color: var(--buttonColor); transition: var(--hoverTransition); outline: none; }
.CtaButton.variant--Button { padding-left: var(--columnPaddingNormal); padding-right: var(--columnPaddingNormal); background-color: var(--buttonColor); color: var(--knockoutColor); white-space: nowrap; transition-property: background-color, opacity; }
.CtaButton.variant--Button.CtaButton--arrow { padding-right: var(--hds-space-core-150); }
.nobr { white-space: nowrap; line-height: 0; }
.dse-root .HoverArrow { --hoverTransition: 150ms cubic-bezier(0.215,0.61,0.355,1); }
.HoverArrow { --arrowSpacing: 5px; position: relative; top: 1px; margin-left: var(--arrowSpacing); stroke-width: 2px; fill: none; stroke: currentcolor; }
a { text-decoration: none; }
```

````

## Phase checklist

P18 gate (docs/plan.md):

- [ ] Screenshots at 1440, 820 and 390 of the Motion section (clean, `Wide range`, `Dense`, 12 easings), Tokens with Radius and Shadow, a hovered card, a clipped wide component, a `Dark on dark` card, a hidden-until-focus card and a `no-crop` card, reviewed; easing stages of a row at one height; no value label dropped on `Wide range` at 1440; `Dense` under 300 px tall at 390.
- [ ] Playwright: ReplayButton width constant through a play; chip rest equals the scaled start and returns to it; card frame hover changes the root's computed style; a touch tap on the preview and a click on the name row open the drawer; the card Ground toggle repaints without opening the drawer; the drawer stage scrolls horizontally; the long-task test with 12 easings at card width.
- [ ] Unit: scale function; contrast fallback; shadow gap; log axis and label budget; synthetic page context; hidden-at-capture rule; every reference resolves in every fixture run, seed and versioned document.
- [ ] Security: `pnpm test:security` over default previews with state rules; a link click inside a card frame leaves its URL unchanged.
- [ ] Evals in replay at thresholds with the clean fixture's skip link; live-rate floor unchanged on the three fixtures.
- [ ] Real-site check: the portfolio and modernsoftworks.com fresh through the queue, under `P18 real-site check` (skip link mode and reason, cards on the contrast fallback, Button names on the 404 page, dropped-label count and the Long list ruling, three screenshots).
- [ ] `pnpm qa:copy`, axe zero on the run page with the new controls, `pnpm verify:all` green; the Definition of Done re-run in full (thirteen items).

P17 gate (docs/plan.md):

- [x] `pnpm showcase --add` on a local run puts it first on the home page; `--remove` takes it down; a sparse run is refused with the stated message.
- [x] Compare renders `tx4mehptdf` (v1.0) against `mhxvphzzfr` (v1.1) with every row; `/r/tx4mehptdf` renders; the v1.0 fixture document test passes; `upgradeRunDocument` is idempotent.
- [x] The Motion section loops in sync, pauses off screen, passes the long-task test, and is still under reduced motion (Playwright: the dot does not move); screenshots at 1440, 820, 390 reviewed.
- [x] Live rate meets the thresholds on clean, tailwind and css-in-js and on the three real sites; the per-reason table below; linear.app at the visitor timeout has every core component checked; the `messy-after` dark-band button has no halo at 2× zoom; pinning Hover reaches the recorded values after the recorded duration; `pnpm test:security` passes on the state files.
- [x] The stat strip shows six cells at every viewport with no orphan; the `Passing all checks` filter and the restyled CheckBadge render per spec; `pnpm qa:copy` passes.
- [x] Real-site check: modernsoftworks.com fresh, pasted under `P17 real-site check` with the live-rate table, components passing and the Compare link against `mhxvphzzfr`.
- [x] `pnpm verify:all` green; goldens updated once and logged; Definition of Done re-run in full (twelve items).

P16 gate (docs/plan.md):

- [x] `pnpm evals` passes every threshold in `docs/evals.md` including the new rows: final live (record) run 55 of 55, replay 55 of 55, fallback 55 of 55 (2026-10-27).
- [x] The export variable-resolution test passes on every fixture (evals, export integrity, every format, both sets, every component prompt) and on the three frozen partial documents (`exports.test.ts`).
- [x] No component or variant name ending in a digit in any fixture run; no type token named `other`; every component has `tier` and `slug` (evals naming row; the stripe.com run too).
- [x] `motion.css` and `motion.json` goldens committed; `tokens.w3c.json` validates.
- [x] The Motion section screenshotted at 1440, 820 and 390 on a fixture run and reviewed (`qa:design`; the duration labels fixed after review); Replay works and respects reduced motion (`tests/e2e/reduced-motion.spec.ts`, both halves).
- [x] Panel Motion block, Compare rows and /open reviewed the same way.
- [x] Fresh local run on stripe.com: prompt with a Motion section, 46 observed patterns, zero undeclared `var(--`, no numeric names; under `P16 real-site check` above.
- [x] `pnpm verify:all` green on a fresh clone; goldens updated for v1.1 and logged (D-090: the final set follows the final live eval); Definition of Done re-run in full (eleven items, below).

v1.2 Definition of Done (P17), all true at once on a fresh clone of `622bef2` with the Docker services running and `DSE_MODEL_MODE=replay` (2026-10-28):

- [x] 1. `pnpm verify:all` green on a fresh clone in 3,800 s: check, seed check, 751 tests (613 unit), security 51, e2e 235, full evals at thresholds with the motion, naming, export-integrity and live-rate rows (live rate clean 28 of 28, messy 30 of 31, tailwind 28 of 28, css-in-js 28 of 28, library 22 of 22), build, visual 128, axe 185, billing 17, Lighthouse (home 100/100/100/100, run 99/100/100/100), copy, audit (no high; one moderate, GHSA-67mh-4wv8-2f99, as in v1.0).
- [x] 2. Every phase gate P0 to P17 recorded below with its date.
- [x] 3. `docs/traceability.md` maps every `##` and `###` section of the 21 spec and design documents, the P17 changes included, with no gap (`scripts/test/traceability.test.ts`).
- [x] 4. `docs/decisions.md` records every deviation (D-001 to D-100); Known limitations lists each with its decision id.
- [x] 5. `pnpm docker:smoke` builds the worker image from the root and completes the clean fixture in it (9 pages, 9 colors, 28 components, 28 live previews, 47 of 49 checks); `pnpm --filter web build` succeeds.
- [x] 6. The flag-off test passes (inside verify:all).
- [x] 7. `pnpm qa:copy` passes (620 files).
- [x] 8. `pnpm run doctor --production --env fixtures/env/production.sample` passes.
- [x] 9. The working tree is clean and committed; there is no remote, nothing was pushed.
- [x] 10. STATUS says `Build complete`, and the owner's end list below is exactly what remains.
- [x] 11. The prompt export of every fixture run has a Motion section, a Site variables block, a Default line per component, core components before page-specific ones, and no `var(--` to an undeclared name (the export-integrity eval row: 0 undeclared on all five fixtures).
- [x] 12. Every read path (the run page and its API, Compare, /open, MCP `--run`, CLI `serve`) upgrades a stored document by its `pipelineVersion` (`upgrade.test.ts`: the v1.0 fixture document parses, the upgrade is idempotent); Compare renders `tx4mehptdf` (v1.0) against `mhxvphzzfr` (v1.1) with every row, `mhxvphzzfr` against the fresh `qgc6npq1au` (v1.2), and the seed's `seedv10cln` against `seedclean0` (e2e).

v1.1 Definition of Done (P16), all true at once on a fresh clone of `570874d` with the Docker services running and `DSE_MODEL_MODE=replay` (2026-10-27):

- [x] 1. `pnpm verify:all` green on a fresh clone in 3,715 s: check, seed check, 716 tests (579 unit), security, e2e 225, full evals at thresholds with the motion, naming and export-integrity rows, build, visual 128 (the catalog section by section), axe 184, billing 17, Lighthouse, copy, audit (no high; one moderate, GHSA-67mh-4wv8-2f99, as in v1.0).
- [x] 2. Every phase gate P0 to P16 recorded below with its date.
- [x] 3. `docs/traceability.md` maps every `##` and `###` section of the 21 spec and design documents, `motion-capture.md` included, with no gap (`scripts/test/traceability.test.ts`).
- [x] 4. `docs/decisions.md` records every deviation (D-001 to D-090); Known limitations lists each with its decision id.
- [x] 5. `pnpm docker:smoke` builds the worker image from the root and completes the clean fixture in it (28 components, 27 live previews); `pnpm --filter web build` succeeds.
- [x] 6. The flag-off test passes (inside verify:all).
- [x] 7. `pnpm qa:copy` passes.
- [x] 8. `pnpm run doctor --production --env fixtures/env/production.sample` passes.
- [x] 9. The working tree is clean and committed; there is no remote, nothing was pushed.
- [x] 10. STATUS says `Build complete`, and the owner's end list below is exactly what remains.
- [x] 11. The prompt export of every fixture run has a Motion section, a Site variables block, a Default line per component, core components before page-specific ones, and no `var(--` to an undeclared name (the export-integrity eval row, every fixture; the stripe.com run too).

v1.0 Definition of Done (P15):

P15, the Definition of Done in `docs/plan.md`, all true at once on a fresh clone with the Docker services running and `DSE_MODEL_MODE=replay` (2026-10-26):

- [x] 1. `pnpm verify:all` green on a fresh clone: check, seed check, 651 tests (518 unit), security, e2e 219, full evals at thresholds, build, visual 125, axe 175, billing 17, Lighthouse, copy, audit (no high; one moderate, GHSA-67mh-4wv8-2f99, listed under Known limitations).
- [x] 2. Every phase gate P0 to P15 recorded below with its date.
- [x] 3. `docs/traceability.md` maps every `##` and `###` section of the 20 spec and design documents to code and tests; all 136 gaps the sweep found are closed, and `scripts/test/traceability.test.ts` fails on any heading without a row, any missing path, or any open gap.
- [x] 4. `docs/decisions.md` records every deviation (D-001 to D-080); Known limitations lists each with its decision id.
- [x] 5. `pnpm docker:smoke` builds `apps/worker/Dockerfile` from the root and completes the clean fixture in the image; `pnpm --filter web build` succeeds.
- [x] 6. The flag-off test passes (unit and browser halves, inside verify:all).
- [x] 7. `pnpm qa:copy` passes.
- [x] 8. `pnpm run doctor --production --env fixtures/env/production.sample` passes.
- [x] 9. The working tree is clean and committed; there is no remote, nothing was pushed.
- [x] 10. STATUS says `Build complete`, and the owner's end list below is exactly what remains.

## Gates passed

- P17 · Second testing round (v1.2) · 2026-10-28 · addendum merged and deleted (D-091 to D-096, merge rulings D-097), the build's rulings D-098 to D-100 · root cause verified (`tx4mehptdf` 447 issues, `mhxvphzzfr` clean) and the upgrade on every read path; Compare and `/r/tx4mehptdf` on the owner's runs · showcase `--add`, `--remove`, `--list` on the local database · previews measured per cause on three real sites at 15 min and handled in four rounds: 32.0, 35.0, 27.5% live of checked before, 82.7, 81.7, 72.5% after (floor 70%) · linear.app at the visitor timeout, all 87 core components checked · ground and the `messy-after` halo check · state files, pinning Hover e2e, security suite on state files · ambient easing loops (long-task, shared start, off screen, reduced motion e2e) · checks up front (six cells with no orphan, the filter, CheckBadge, opening line) · modernsoftworks.com fresh through the queue (`qgc6npq1au`, 60 of 74 live, 30 of 71 passing, Compare against `mhxvphzzfr`) · final record-mode evals in `fixtures/results.json` and the README · qa:design 165 reviewed at 1440, 820 and 390, goldens updated once and logged (plus the Compare goldens after D-099) · axe 185 zero violations · traceability · CHANGELOG 1.2.0, version 1.2.0 · verify:all green on a fresh clone, Docker smoke, web build, doctor on the production sample · P17 model spend about $0.30 (18 local real-site runs $0.286, the queue run $0.011, plus the record evals); build spend under $1 of $20.

- P16 · Fidelity: motion, site variables, naming, export integrity (v1.1) · 2026-10-27 · addendum merged and deleted (D-081 to D-089), the build's rulings D-090 · evals: final live (record) run 55 of 55 published in `fixtures/results.json` and the README, replay 55 of 55, fallback 55 of 55 · variable resolution on every fixture export, every component prompt and the three frozen partial documents · `motion.css` and `motion.json` goldens · Motion section, panel Motion block, Compare and /open reviewed at 1440, 820 and 390 (duration labels and type row names fixed after review) · Replay under reduced motion (e2e, both halves) · stripe.com real-site check pasted above, two real-site defects fixed (0 ms durations, undeclared theme and runtime variables) · skeleton heights re-measured · axe zero violations (landmarks named apart) · visual goldens updated after the final live eval, the catalog compared section by section · README features, Motion screenshot and table, CHANGELOG 1.1.0, version 1.1.0 · verify:all green on a fresh clone, Docker smoke, web build, doctor on the production sample · build spend $0.56 of $20.

- P15 · Final consistency, README, runbook, Definition of Done · 2026-10-26 · traceability for every section of every spec and design document, 136 gaps closed by tests or by fixes logged in D-076 to D-080 (intermediate files deleted, snapshot cap, structural rule forms, blocked-run redirect, toast replacement, worker connections in the seed and showcase, budget cut events, grid entrances, exits first, row hover, skeleton heights, font CORS, the synthetic 404 under the cap, `radius-xs`, run ids in mono) · final live eval: every threshold passed on all five fixtures, $0.023, committed to `fixtures/results.json` · README with screenshot and results, CHANGELOG 1.0.0, runbook verified (showcase time, timeout variable, the modernsoftworks.com restore) · Known limitations complete · goldens for the run pages and the catalog reviewed · verify:all green on a fresh clone, Docker smoke, web build, doctor on the production sample · build spend $0.40 of $20.

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

- D-111 · The build's P18 rulings: focusable means rendered; the hidden flag kept apart from tokens and checks and in clustering; the clean family's skip link; state rules written after the check and inert links; the touch cover link; card captions at the top and the toggle's surface track; the neutral state clears a selection; the event words; `clean-v1-2.json` and the references tests; the 56 px label rule; chips by row width; the Long list adopted by measurement; skeleton heights re-measured.
- D-110 · Rulings from merging the v1.3 addendum: ids and the 1.3.0 upgrade step, the motion components' real folder, the attribution rule in motion-capture.md, the 16 px duration mark, a `sm` Chip for the card's Ground toggle, the ground caption in the drawer only, labels for the two new reasons, `no-crop` excluded from the real-site live rate, `fill: null` on upgrade, the no-capture CodeBlock, three glossary entries.
- D-109 · A ground within ΔE 5 of the component's fill is swapped for the opposite tone; `Preview.fill` recorded; the Ground toggle on the card.
- D-108 · Hidden-at-capture rule; a hidden focusable element previews its focus crop (`hidden-until-focus`); unseen hidden components dropped; `no-crop` with no key.
- D-107 · Card previews no lower than 0.6×, clipped with a fade and captioned; the drawer at 1:1 with horizontal scroll.
- D-106 · Card previews take the pointer: state rules in the default preview, the link overlay on the card body (whole card on touch); frames stay `sandbox=""` and `tabindex="-1"`.
- D-105 · The synthetic not-found page's naming context is `404 page`; a pattern belongs to the component that owns its own element.
- D-104 · Pattern chips at rest on the scaled start state; a fixed-width ReplayButton; six keyframes with Show all.
- D-103 · Radius and Shadow in a full-width row with 72 px swatches and a blur-derived gap.
- D-102 · Durations on a log axis with a two-row label budget; the Long list only if the measurement needs it.
- D-101 · The easing stage at card width, 160 px tall, pinned to the card's bottom; the usage line always present.
- D-100 · The showcase roster crawls modernsoftworks.com at `https://www.modernsoftworks.com/`; the bare host still answers 403.
- D-099 · Compare's same-day title is `What changed today`; the open buttons take the run cards' date, and by order (`Open the earlier run`, `Open the later run`) when both runs share it.
- D-098 · The build's P17 rulings: `pipeline:run` served previews as `file://` (fonts never loaded) and now serves storage over HTTP; every measured preview cause with its handling (clips below the cut, the 1 MB font cap, the masked comparison, the clipped page screenshot, the freeze settling animations, image pixels, layers, `:where()`, units, transforms, ancestors' opacity and scale, svg paint, container conditions, the layered reset carry, hidden inputs) and the causes not handled; the state-file security fix; the rates per round, ending 82.7, 81.7 and 72.5% live of checked; UI rulings (main-variant pinning, six stagger chips, Compare's unfinished reason, same-site promotion replaces the card, skeletons re-measured, the ambient QA mask); `messy-after`'s dark band and its drift deltas.
- D-097 · Rulings from merging the v1.2 addendum: ids and the 1.2.0 upgrade step, the showcase entry's shape and `promoted`, the upgrade on every read path including MCP `--run` and CLI `serve`, Compare's StateCard reasons, `usedBy` with counts, the EasingStage's two animations and 2,200 ms cycle, the duration tick's path, shadowed crops keep their margin, the Ground toggle's two app grounds, reduced motion in state files, `fontsSubstituted` as a list, `checkCounts` in the schema, the previews event words, `seedv10cln`, stripe.com as the third real site.
- D-096 · Check results are a component-level metric and a monochrome mark (D-003 and D-018 stand).
- D-095 · Live rate is measured per reason, render checks run core first by usage, and real sites have thresholds.
- D-094 · Previews render on the source element's ground and expose state pins.
- D-093 · Easings are shown as synchronized ambient loops.
- D-092 · Every read path upgrades stored run documents by their pipeline version; the root cause verified by a parse (447 issues on `tx4mehptdf`, clean on `mhxvphzzfr`, and on all 18 v1.0 documents in the local database).
- D-091 · The owner promotes runs to the showcase.

- D-090 · Rulings from building v1.1: type role words and order, motion reads (grouping, gaps, stagger of three, loop ends, one pattern per element across viewports, instant timings make no duration), naming made deterministic where it decides structure (context in both model calls, badge and tag by the rule, notices merged by their box before and after naming, page segments read as words), export variable resolution found on stripe.com (theme values, chains, fallbacks, literal tokens.json, runtime properties left out with a comment), preview reset carry and box model, UI wording (card heads, graded type names, staggered duration roles, shared Replay caption, overlays ground), skeleton heights, QA (sampled readings masked, the catalog compared section by section), capture stopping both workers on a failure, the real-site prompt excerpted in STATUS.
- D-089 · Rulings from merging the v1.1 addendum: ids, pointers, the freeze stays before states, delays are not durations, pattern fields, Motion before Breakpoints, `toggle` in the tier list, fallback, variant and type words, site names per kind, BreakpointToken, opaque contrast pairs, eight rail rings and export cards, Compare's Motion card, copy labels, hashed names.
- D-088 · State diffs track a fixed property set with noise rules (the addendum's D-034).
- D-087 · Type roles come from size ratios, not tags (the addendum's D-033).
- D-086 · Translucent colors are overlays (the addendum's D-032).
- D-085 · Components have a tier (the addendum's D-031).
- D-084 · Names are never numeric (the addendum's D-030).
- D-083 · Exported component code is the preview CSS (the addendum's D-029).
- D-082 · The site's own names win (the addendum's D-028).
- D-081 · The motion layer is part of the system (the addendum's D-027).

- D-080 · Skeletons at the typical result's height; the live eval results kept through replays; the showcase content seam.
- D-079 · Grid items reveal on page load; entering cards wait for leaving ones; the row hover on the recent runs list.
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

Things implemented differently from the original spec, or that the product does not do, each with the decision that explains it. Brandon reads this list at the end.

Model calls
- No `temperature` or forced tool use: the current API refuses both on these models, so naming and the narrative are held steady by prompts, schemas, validation and recordings (D-027).
- The model's `variantHint` describes what sets variants apart but never renames one; variant names come only from the deterministic rules (D-076).
- Naming batches go in first-seen order across pages, four at a time, not one page group at a time (D-066, D-076).

Motion and naming (v1.1)
- Animations on pseudo-elements (`::before`, `::after`) are not read: the static read and the snapshot see elements (D-090).
- An inline-style pattern (GSAP, hand-written requestAnimationFrame) has no readable easing; it is labeled observed, its duration reads "about {n} ms" and the nearest token is suggested (motion-capture.md, Honesty rules).
- Motion on elements a page never shows during the crawl (a closed menu's items) is never in a snapshot, so it is not captured (D-090).
- The tab walk's focus is not waited for, so a focus transition longer than the hover wait is read mid-way; hover and open states wait for their transitions (D-090).
- Component names come from a model and can differ in wording between two runs of one site; what decides structure (tone variants, badge or tag, the merge across pages by style) is held by rules (D-090), and the evals replay recorded answers.

Large and real sites
- A site that needs more than its timeout's shares takes the lighter paths: later pages without states, names from the rules, previews captured instead of checked, the narrative from its template. Each cut is logged and shown honestly (D-066, D-078). On stripe.com in P13 about 30% of previews were live; the color names fell back to the rules there. On stripe.com in P16 the run finished in 324 s of its 360, with 5 of 120 previews live and every component named by the rules: the motion pass adds its reads and waits to each page's capture, which leaves less of the budget for naming.
- Showcase runs get 15 minutes; a visitor's run gets 6 (D-071).
- A page that answers 403, 429 or 503 without a known challenge marker is a failed page, not a bot block; a site whose start page does that comes back sparse (modernsoftworks.com in P13). An interstitial that never settles is caught only through its marker or as unreachable (D-076).
- A font served from another origin without CORS is not copied; its preview uses the fallback stack and may be captured as fonts unavailable (D-077).
- Drift evidence keeps 40 rows in the document; the numbers count every finding (D-077).

Detection
- The fingerprint has no box-size buckets and a card's structure lists child tags, not child clusters; size enters through the variant split (D-076).
- Component ids are a hash of the cluster's group key, stable across repeated runs, not numbers in run order (D-076).

Storage and platform
- Stored objects cannot carry `X-Content-Type-Options: nosniff` (S3 metadata); every upload has the right Content-Type instead (D-035).
- `pnpm audit` reports one moderate advisory, GHSA-67mh-4wv8-2f99 (esbuild's dev server, reached only through drizzle-kit's dev tooling, never in the app or the worker); no high (P14).
- jsdom stays at 29.1.1 because jsdom 30 needs Node 22.22 (D-053).

Interface
- The row hover is on the recent runs list only; table rows are read, not clicked, and stay still (D-079).
- `/open` loads a local run's files only from `http://localhost:4300`, the port `dse serve` uses (by design, `docs/specs/preview-fidelity.md`, Serving).
- The MCP install line in Claude Code is the one check the build could not run itself; the runbook's step 12 has Brandon run it once (by design, `docs/specs/exports-and-mcp.md`, The MCP server).

Previews and v1.2 (D-098)
- Causes the builder does not handle, which keep a preview captured on real sites: a reference crop that does not show the element as its markup does (an entrance a script never played, a closed menu, a hidden tooltip, a marquee mid-move, a sticky element on top), an element moved by an ancestor's translation or rotation (a uniform scale is handled), a longhand Chromium serializes empty after a shorthand with a `var()`, a gradient or external image behind a transparent element (a flat ground cannot reproduce it), video and canvas. Counts are in `P17 real-site check`.
- An svg child's paint that came from a class rule or a custom property is its computed color in the preview and in the exported markup, not the site's rule or variable (D-098).
- A container query the builder cannot read (a style query, `or`, `not`) keeps its wrapper in the preview and, with no container around it there, does not apply (D-098).
- A crop margin is not painted when the element casts a shadow, since the shadow lives in the margin (D-097).
- The StateBar pins states on the variant that shares the component's preview (its first-seen instance, which the state files are built from); the panel opens on it, and other variants show their default only (D-097).
- A staggered pattern previews six chips at most (D-098).
- Exported component code is not wrapped in the site's cascade layers; only the preview is (D-098).
- P16's stripe.com check (5 of 120 live) and the P17 baseline runs were measured with `pnpm pipeline:run` before it served storage over HTTP, so copied fonts never loaded in them; the owner's runs through the worker are the production-like baseline (D-098).

Previews and capture (v1.3, D-108, D-109, D-111)
- A component hidden until focus is checked as it sits at rest: the tap target of an `sr-only` link whose box is 1 px reads as a failure, though a keyboard user sees it full size (D-111).
- Every link inside a preview document points at its own page, so a site rule that selects links by their `href` value no longer matches in the preview; the exported code keeps the site's links (D-111).
- Runs made before v1.3 have no recorded fill, so the contrast fallback never applies to them; their cards keep the sampled ground (D-110).

## Toolchain notes

- `next.config` sets `agentRules: false` (Next 16 would write an AGENTS.md with em dashes into apps/web) and `devIndicators: false`. Next 16's own docs are in `apps/web/node_modules/next/dist/docs`; read them before writing routes (P11), because the API differs from older Next.
- QA (`qa:design`, `qa:visual`, `qa:axe`) and `test:e2e` start a fresh production build on port 3100 through `scripts/qa-server.mjs` (rebuilds when sources are newer). Kill any stray server on 3100 before running them.
- Dev helpers: `pnpm exec tsx scripts/shot.ts <url> <out.png> [w] [h]`, `scripts/tile.ts` to cut tall screenshots for review and `scripts/montage.ts` to set several side by side.
- Fixture authoring aids (need `pnpm fixtures:serve` or start the server themselves through the pipeline): `pnpm exec tsx scripts/fixtures-inventory.ts <site> [--where=10,18] [--color=#HEX,...]` prints every raw token value, the ΔE 2.3 clusters and the drift near-duplicate pairs; `scripts/fixtures-candidates.ts <site> [desktop|mobile]` prints every element candidate with its rules, box and states. Re-run both after any fixture change and keep `expected.json` in step (D-046, D-047).

- v1.1 helpers: `pnpm exec tsx scripts/expected-draft.ts <fixture> <run.json>` prints the expected.json fields a run shows, beside what the file says, for checking by hand against the fixture source (it never writes). `pnpm fixtures:runs` copies the last `pnpm evals` run of clean and messy into `packages/pipeline/test/fixtures/runs/` with fixed times; then `env DSE_UPDATE_GOLDENS=1 pnpm test:unit packages/pipeline/test/exports.test.ts` rewrites the export goldens.
- jsdom is 29.1.1: jsdom 30 needs Node 22.22 (D-053). `pnpm exec tsx scripts/previews-inspect.ts <fixture> <outDir>` renders a fixture run's previews beside their crops after `pnpm evals --through previews`.
- Node 22.14, pnpm 9.15.9, TypeScript 5.9.3 (the native 7.x compiler is not yet supported by Next.js tooling), ESLint 9 (ESLint 10 is not supported by the React, jsx-a11y and import plugins that `eslint-config-next` uses), Next.js 16.4, React 19.3, Zod 4.6, Vitest 5, Playwright 1.64 with its Chromium.
- Queue and API (P10): tests use Redis logical database 15 and `dse_test`; the API route handlers are plain `Request`/`Response` functions, so integration tests call them directly with the harness in `apps/web/test/helpers/harness.ts`. `pnpm db:seed:fixtures` takes about ten minutes (six runs, concurrency 1) and refuses to run while a worker heartbeat is live: stop `pnpm dev` first. `pnpm db:seed:check` seeds only when the seed is missing. Sites outside the eval fixtures are recorded with `env DSE_MODEL_MODE=record pnpm exec node scripts/run.mjs tsx scripts/record-extra.ts messy-after walled` (listed in `fixtures/recordings/extra.json`, kept by prune). Next 16 rejects unknown exports from `route.ts` files: keep helpers in `lib/`.
- Internal packages `@dse/schema` and `@dse/pipeline` are consumed as TypeScript source; the worker, MCP and CLI bundles inline them with tsup.
- Root scripts load `.env.local` (or `DOTENV_FILE`) through `scripts/run.mjs` without overriding variables already set, so `env DSE_MODEL_MODE=live pnpm evals` wins.

## What Brandon must do at the end

Keep this list current. It is the only hands-on work he will do.

1. Follow `docs/deploy-runbook.md`.
2. modernsoftworks.com still answers Hostinger's 403 at the bare host (checked 2026-10-28); the www host serves the site, and the roster crawls `https://www.modernsoftworks.com/` (D-100), so step 11 of the runbook includes it. Pointing the bare host at the site (a redirect to www in Hostinger) is optional.

## Session log

Newest first. One line per session start, one per gate passed, one per stop. Keep it short.

- 2026-10-29 · P18 · docs merged: the addendum's changes are in their documents, D-101 to D-110 logged, the addendum deleted.
- 2026-10-29 · Session started · P18 · read CLAUDE.md, STATUS, decisions (D-001 to D-100), handoff, the v1.3 addendum, partner.md, partner-log.md, plan (P17 and the Definition of Done), components, motion, copy, pages, design-system, preview-fidelity, capture-and-states, component-detection, motion-capture, data-model, evals, glossary · tree reconciled (`apps/web/next-env.d.ts` rewritten by the dev server, restored; the addendum and prompts/v1-3.md committed by the Partner in `12b2667`) · `pnpm check` green.
- 2026-10-28 · Build complete · v1.2 · the Definition of Done (twelve items) is green on a fresh clone of `622bef2`; nothing pushed.
- 2026-10-28 · Gate passed · P17 · real-site live rates over the floor, upgrade and Compare on the owner's runs, modernsoftworks.com through the queue, screenshot review, verify:all on a fresh clone (third attempt: the first two found the reduced-motion network-idle wait and the catalog Compare goldens, both fixed).
- 2026-10-28 · Session continued (after compaction) · P17 · re-read CLAUDE.md, STATUS, decisions D-091 to D-100, plan P17 and the Definition of Done · tree clean at `622bef2`.
- 2026-10-28 · Session started · P17 · read CLAUDE.md, STATUS, decisions (D-001 to D-090), handoff, plan, the v1.2 addendum, partner.md, partner-log.md, showcase, data-model, preview-fidelity, capture-and-states, checks, exports-and-mcp, pages, components, motion, copy, evals, the runbook's step 11, glossary · tree reconciled (`apps/web/next-env.d.ts` rewritten by the dev server, restored; the addendum and prompts/v1-2.md committed by the Partner in `6b25fc6`) · `pnpm check` green.
- 2026-10-27 · Build complete · v1.1 · the Definition of Done is green on a fresh clone; nothing pushed.
- 2026-10-27 · Gate passed · P16 · evals 55 of 55 live, replay and fallback, stripe.com check, screenshot review, verify:all on a fresh clone.
- 2026-10-27 · Session continued (after compaction) · P16 · re-read CLAUDE.md, STATUS, decisions D-081 to D-089, plan P16, motion-capture, pages, components, copy, component-detection, model-calls · first live recording: 53 of 55 rows, naming variance on tailwind and css-in-js, fixed by D-090's deterministic rules.
- 2026-10-27 · P16 · docs merged: the addendum's changes are in their documents, D-081 to D-089 logged, the addendum deleted.
- 2026-10-27 · Session started · P16 · read CLAUDE.md, STATUS, decisions, handoff, plan, the v1.1 addendum, motion-capture, data-model, capture-and-states, token-clustering, component-detection, preview-fidelity, exports-and-mcp, drift, model-calls, evals, pages, components, copy, motion, design-system, quality-bar, glossary, showcase, architecture · tree reconciled (`apps/web/next-env.d.ts` rewritten by the dev server, restored; the addendum, motion-capture.md and prompts/v1-1.md new) · `pnpm check` green but the traceability test, which fails only on the new motion-capture.md.

- 2026-10-26 · Build complete · the Definition of Done is green on a fresh clone; nothing pushed.
- 2026-10-26 · Gate passed · P15 · traceability with no open gap, live eval, README, CHANGELOG, runbook, verify:all on a fresh clone.
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
