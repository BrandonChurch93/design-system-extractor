# V1.2 addendum · the second round of testing

This document amends the kit after the owner's second round of real runs (linear.app, modernsoftworks.com) and a landing page built from the export, which came back with the motion and feel the first round lacked. Five findings remain, all in the application rather than the pipeline. It follows the same contract as the v1.1 addendum did (merged in P16 and deleted; its merge commit is `f74c9cb`): changes to named sections of existing documents, a new phase P17 in `docs/plan.md`, six decisions to log under the next free ids (this document names them by title, not number, because the Builder has logged decisions since this was written), and deletion of this file once merged. Precedence while it exists: this addendum > every other document. The Partner reviewed it against the v1.1 build (commit `c020ea7`) on 2026-10-28 and the owner approved the corrections; the review is in `docs/partner-log.md`.

The findings:

1. The owner's own runs do not appear on the home page feed. He expects to publish any run he chooses to the showcase; visitors' runs stay unlisted.
2. The Compare page errors on real runs and cannot be tested at all.
3. The easing section does not communicate anything: one replay button, one dot crossing a bar, no visible difference between curves.
4. Component previews show as screenshots with the page background bleeding around rounded corners, and they cannot be interacted with. The point of the product is to play with the extracted components and see their states.
5. The check results are buried. The owner wants a component-level metric in the stat strip and a visible mark on each component that passes every check.

---

## 1 · Publishing runs to the showcase

**Why the feed is empty of his runs.** Locally the home page reads `apps/web/content/showcase.json`, which `pnpm db:seed:fixtures` fills with the six fixture runs; the real roster is only ever written by `pnpm showcase` (local or `--remote`), which re-crawls the roster sites. A run the owner starts from the home page is a visitor run: public by link, never listed. That is the v1 design (D-006, D-020) and it is correct for visitors. What is missing is a way for the owner to promote a run he already has.

### `docs/specs/showcase.md`

**New section "Promoting a run".** `pnpm showcase --add <runId> [--category <id>] [--remote]` adds an existing complete run to the showcase content without re-crawling: it reads the run document, builds the showcase entry (host, title, category, stats, palette strip, drift headline, run link) with the same shape the roster path produces, inserts it at the top of the content file (local) or storage object (`--remote`, through `POST /api/admin/showcase/content` with the admin token), and sets the run's `retention_until` to null so it is never deleted. `--category <name>` is required when the host is not in the roster or alternates; the names are the category names of the roster table (`Personal`, `Developer tools`), the values of `ShowcaseCategory`. `pnpm showcase --remove <runId> [--remote]` removes an entry and restores the default retention. `pnpm showcase --list [--remote]` prints the current content. An added run keeps its original `visitor_id` and `byo_key` fields; the showcase entry does not expose them.

**Roster section.** Add: "The roster is the opening set. After launch the owner curates the showcase with `--add` and `--remove`; the roster is re-run only when he wants fresh captures of the opening set."

**Rules.** A run can be promoted only when `status = complete` and the document's `sparse` is false (`sparse` lives in the document, not in a column); the script refuses otherwise and says why. The home page's showcase grid orders entries by their `order` field; `--add` assigns the lowest order and renumbers the rest, so the newest promotion is the first card. The grid's orphan-row rule (no orphan at 3 and 2 columns) still applies: the script warns when the count leaves an orphan and suggests adding or removing one.

### `docs/design/copy.md`

Add under Home: the showcase caption gains the variant `Sites I have run it on. Yours stays private unless you share the link.` used when the content file has at least one promoted entry.

### `docs/deploy-runbook.md`

Step 11 gains, after the roster run: "To publish any run you did yourself: `env DOTENV_FILE=.env.production.local pnpm showcase --add <runId> --remote`. The run must be complete and not sparse. `--remove <runId> --remote` takes it down."

### `docs/specs/caps-and-budget.md`

No change: promoted runs are not re-run and cost nothing.

## 2 · Compare errors on real runs

**Cause, confirmed by the Partner on 2026-10-28.** The owner's first real run (linear.app, run `tx4mehptdf`) was produced by v1.0 before P16; his second (modernsoftworks.com, run `mhxvphzzfr`) by v1.1. `runPayload` in `apps/web/lib/server/runs.ts` parses every stored document with `RunDocumentPartial`, so the v1.0 run fails on its own page, its API route and Compare alike; Compare is only where it was noticed. The first error, which is what the page throws:

```
ZodError at ["tokens","type",0,"role"]: Invalid option: expected one of "display"|"title"|"heading"|"subheading"|"body"|"body-sm"|"label"|"eyebrow"|"caption"|"code"|"text"
```

The failing fields, 447 issues in all: the v1.1 role set on `tokens.type[].role` (21) and `drift.proposal.type[].role` (10); `uppercase` and `tags` missing on every type token (24 each); `tokens.breakpoints[]` stored as numbers where v1.1 expects objects (6); `tier`, `slug` and `motion` missing on every component (120 each); `drift.proposal.durations` and `drift.proposal.easings` missing. The v1.1 document parses clean. Nothing in the kit defined what happens to a stored document when the schema grows. The Builder verifies this before fixing by parsing the two documents through the schema (a parse, no server needed), records the result in the decision, and does not re-diagnose. The upgrade path below is required because the same failure recurs on every future schema change.

### `docs/specs/data-model.md`

**Run document.** The document already carries `pipelineVersion` (`1.0.0` for v1.0 runs, `1.1.0` for v1.1), which identifies its shape; no `schemaVersion` field is added and `packages/pipeline/src/version.ts` stays the one version file. Add a section "**Upgrading stored documents.**" `upgradeRunDocument(doc)` in `packages/pipeline/src/upgrade.ts` (it uses the tokens rules, which `packages/schema` cannot import) brings any stored document to the current shape by its `pipelineVersion`, filling defaults. A document below 1.1.0 gains: `motion: { patterns: [], truncatedPages: [], intersectionObservers: 0 }`; `tokens.overlays`, `tokens.duration`, `tokens.easing`, `tokens.keyframes` and `tokens.siteVariables` as empty arrays; each `tokens.breakpoints[]` number becomes `{ value, usage: 0 }`; each type token gains `uppercase` (true when its `textTransform` is `uppercase`) and `tags: []`, and its `role` and `name` are recomputed from the stored tuples with the v1.1 rules (ids unchanged, so component token references still resolve; site names are not recomputed, because a v1.0 document captured no site variables); the proposal's `type[].role` is recomputed the same way and the proposal gains `durations: []` and `easings: []`; every component gains `tier: 'core'`, `slug` (the kebab case of its name, unique in the run) and `motion: null`. `pipelineVersion` is left as it was, so the document still says which build produced it. Every read path (`runPayload` for the pages and the API, Compare, /open, the MCP server with `--file`, the CLI `export` command) upgrades before parsing; nothing else in the app touches a document below the current shape. The upgrade is pure and idempotent and is unit-tested against a committed v1.0 fixture document, `packages/pipeline/test/fixtures/runs/clean-v1-0.json`, produced by checking out `0ff300f` (the v1.0 build) in a worktree and running the clean fixture through it in replay, so the repository carries no third-party markup and the document is complete. `CapturedReason` is unchanged: the reason for a preview the time budget cut is the existing `not-checked` (D-066).

### `docs/design/pages.md`

**Compare.** Add: "Compare never throws on a document it can upgrade. If either run cannot be loaded or upgraded, the page renders the StateCard `We could not compare these runs.` with the reason and the two run links, never a blank page or a stack trace."

### `docs/design/copy.md`

Compare: add the StateCard title `We could not compare these runs.` with the body `{reason}` and the two run links as ghost Buttons `Open {host}`.

### `docs/evals.md`

**New test material.** The v1.0 fixture document above, and a Playwright test that opens Compare with it against a current fixture run and asserts every row renders, including the Motion rows, which read as `0` for the old run. (The dark band for the halo check is in section 4.)

### Gate addition

The root cause above is written into `docs/decisions.md` as part of the document-upgrade decision with the Builder's verification (the parse of both documents, its first error line) and the fix, so the owner can read what it was.

## 3 · Easings that can be seen

**What is wrong.** A single replay of a 160 ms easing across a short track is over before the eye registers it, and one easing at a time gives nothing to compare against. The landing page built from the export showed the right idea, and it was reviewed for this addendum: a three-column grid of cards (two at tablet, one at phone), each with the easing name, its value in mono, a one-line usage note ("Buttons, cards, accordions and entrances"), and a thin track with a dot that runs the track over 1,200 ms, forever, with no button, every card in step with the others. Keep all of that. Two things change: the dot moved with `left` and ping-ponged with `animation-direction: alternate`, which plays an ease-out as an ease-in on the way back and misrepresents the curve; the app's version moves with `transform`, runs one direction, and adds the curve itself.

### `docs/design/components.md`

**EasingCard** is replaced. New shape: a Card with the easing name (and `Named by the site` Pill when it applies), the value in mono, and an **EasingStage**: a 160 × 96 area holding the curve drawn as a 1.5 px `ink` stroke on a `surface-tint` ground with a `line` baseline and left edge, a 6 px `ink` dot that travels along the curve, and below it a 120 px horizontal track with an 8 px `ink` dot that travels left to right with the same easing. Both dots are driven by one Web Animations API animation each (`easing` set to the token's value), so what the reader sees is the browser applying the real curve, not an approximation.

**EasingGrid** gains a shared clock: every card's animations are created with the same `startTime` on `document.timeline`, so they never drift apart; each runs for 1,400 ms, holds at the end for 500 ms, fades the dots out over 150 ms, resets, fades them in over 150 ms, and runs again, forever, while the section is in the viewport (an IntersectionObserver pauses them off screen). Because every curve runs the same distance in the same time, the differences between curves are the thing the eye catches: the out-quad arrives early and waits, the in-out hangs in the middle, linear is the plain one. A caption under the grid: `Every curve runs the same distance in the same time, so the differences are the point.` Each card carries a usage line computed from the run: the component types and pattern kinds that use the easing, most used first, at most three (`Buttons, cards and 2 scroll reveals`), from the `usedBy` field below.

**DurationStrip** gains the same treatment in miniature: each duration is a tick with a tiny dot that runs its real length (`120 ms` runs 120 ms) on the shared clock, so the strip shows what "fast" means. It loops with the grid. A duration longer than the 1,400 ms travel runs for the travel and stops where it got to; its tick carries `{ms} ms` as before, and the strip never waits for it (stripe.com has a 24-hour duration).

**PatternRow** keeps Replay but gains an auto-preview: the row's preview chip plays start → end once when the row scrolls into view, then shows a Replay button. Patterns with `stagger` play their count of chips with the step.

**ReplayButton** stays for patterns. The easing and duration loops have no button; they are ambient. Under `prefers-reduced-motion: reduce`, every loop is replaced by the static curve with the dot drawn at 60% progress and the track dot at the matching position, and the caption from copy explains why.

**Performance.** All loops use `transform` and `opacity` only, run on the compositor, and are paused when the section is not in the viewport. A Playwright test asserts no long task over 50 ms while the grid loops with 12 easings, on a catalog sample run that carries 12 (no fixture has more than seven).

### `docs/specs/data-model.md` (motion)

`EasingToken` gains `usedBy: { componentTypes: string[], patternKinds: MotionKind[] }`, filled in the `components` stage when motion is attached to components (`components/motion.ts`), like `patternIds`; the tokens stage leaves it empty.

### `docs/design/motion.md`

Add a section "**Ambient loops**" stating the rules above (shared clock, 1,400 ms travel, 500 ms hold, fade reset, pause off screen, compositor-only properties, reduced motion fallback) as part of the app's motion grammar so the catalog and the quality bar cover them.

### `docs/design/copy.md`

Motion section: add the grid caption, the usage line templates (`{types}` joined with commas and `and`; pattern kinds as `{n} {kind label, plural}`), and the reduced-motion caption `Curves are shown still because your system prefers reduced motion.` The Replay strings stay for PatternRow, and ReplayCaption stays for the pattern list; the easing grid shows the curve caption instead.

### `reference/`

The landing page's easing section is described above; no reference file is needed.

## 4 · Components you can touch

**What is wrong.** Two separate things. First, too many components on real sites fall back to `captured` (a crop) instead of `live` (the sanitized markup and CSS in a sandboxed frame), and the crop carries 8 px of the source page around the element, which on a dark site shows as a dark halo around a rounded button on the app's light ground. Second, the panel's States grid already shows each captured state's end values as its own frame (a live component has one `preview-{state}.html` per captured state), but the main preview shows only the default, the transition never plays, and nothing can be pinned on touch.

### `docs/specs/preview-fidelity.md`

**Live rate on real sites.** Add a section "**Why previews fall back, measured.**" Every run records the count of previews by mode and `capturedReason` in `stats.previews` (`live`, `diff`, `css-too-large`, `fonts-unavailable`, `not-checked`), an optional field because `Stats` is also the shape of `ShowcaseEntry.stats` and of the `stats` column on runs seeded before P17, and the run's event log states them. The Partner's baseline from the owner's two runs, before any change:

| Run | live | diff | fonts-unavailable | not-checked | total |
| --- | --- | --- | --- | --- | --- |
| modernsoftworks.com (v1.1, visitor timeout) | 45 | 44 | 0 | 0 | 89 |
| linear.app (v1.0, visitor timeout) | 17 | 1 | 26 | 76 | 120 |

On modernsoftworks every fallback is a real render difference (median diff 2.5 %, at the threshold); on linear.app most are the budget. P17 runs the pipeline against three real sites (modernsoftworks.com, linear.app and one roster site the Builder picks) at the showcase timeout (`DSE_SHOWCASE_TIMEOUT_MS`, priority 10, D-071), so `not-checked` measures the budget and not fidelity, and investigates every `captured` result by reason:

- `diff`: compare the storage render against the crop and classify the cause (missing background image, a parent's background the element relied on, a pseudo-element, a font metric, an SVG icon with external `use`, a CSS variable resolved on an ancestor outside the markup). For each cause found, add the handling to the preview builder (carry the nearest opaque ancestor background into `.dse-root`; inline `use` references; copy pseudo-element rules; resolve variables on the element's ancestors, not only the element). Re-run and record the new live rate.
- `fonts-unavailable`: when a font cannot be copied, substitute the fallback stack and run the pixel comparison with text-node bounding boxes masked out, so a component is not demoted for a font swap alone; the panel's caption says the font was substituted.
- `css-too-large`: raise the cap after reset filtering (v1.1) and measure again; a cap that demotes a plain button is too low.
- `not-checked`: the previews share of the time budget ran out (D-066). Not a fidelity cause: the order of render checks below decides which components are checked before the cut. If the upload-then-render check is the cost, batch the renders.

**Order of render checks.** The previews stage builds and checks live previews for core components first, then page-specific components, by usage (instance count, most used first) within each tier, so a run that reaches the previews share of its time budget has checked the components that matter; components past the cut keep their crops with `not-checked` as before. The three render lanes (D-066) take the next component in that order.

The target is written as a threshold in `docs/evals.md`: at least 85% live on the clean, tailwind and css-in-js fixtures (keep the existing threshold where it is already higher) and at least 70% live on each of the three real sites in the P17 real-site check, counted over the components whose preview was checked (`not-checked` excluded, with its count stated), with the per-reason counts pasted into STATUS. If a real site cannot reach 70%, the gate still passes only when every remaining captured preview on it has a named cause that the preview decision lists as out of scope (a background video, a canvas, a third-party embed), with the counts.

**The halo fixture.** `messy-after` gains a dark-ground section (a `#0B0D10` band holding a rounded primary button and a card) for the halo check. It is not scored by evals, so no `expected.json` or eval recording is re-derived; its extra recordings are re-recorded with `scripts/record-extra.ts messy-after`, and its seed, its showcase entry, the goldens that show it and the Compare e2e's expected deltas (D-021) are re-checked and updated once if the band changes them, logged in STATUS.

**Preview ground.** The preview frame's ground is the source element's effective background, recorded per instance as `ground` at capture time: the page screenshot is sampled at the four corners of the crop margin, and if the four agree within ΔE 2 that color is the ground; otherwise the nearest ancestor with an opaque `background-color` supplies it; otherwise the page's `body` background. The component's `ground` is the most common instance ground. The frame paints that color behind the component (live and captured alike), so a dark site's button sits on its own dark ground inside a light app, with no halo. The crop itself is taken with a 4 px margin instead of 8, and the margin is painted with `ground` at crop time (the capture samples the ground before cropping), so even a captured preview shows no page bleed. The panel offers a `Ground` toggle (`Site`, `Light`, `Dark`) for reading a light component against a dark ground and the reverse; the default is `Site`.

**State pins for live previews.** The security posture does not change: frames stay `sandbox=""` with no scripts, served from the storage origin (D-017), so pins are done with files, not messages. V1 already stores one preview file per captured state (`preview-{state}.html`, `data-model.md` storage keys). The PreviewFrame gets a StateBar (`Default`, `Hover`, `Focus`, `Active`, `Open`, `Disabled`; only the states captured for that component) that swaps the frame's `src` to that state's file. Each state file is built so that, on load, the root element animates from the default values to the state values with the component's recorded transition timing (v1.1): the preview builder emits a generated `@keyframes` from the state delta and applies it with `animation: {duration} {easing} both` on the root, so loading `preview-hover.html` shows the hover transition as the site plays it, and reloading replays it. Today the state rule applies the delta with `!important`, which an animation cannot override; the state rule drops `!important` and keeps its specificity through the `.dse-root > :first-child` selector. `preview-fidelity.md`'s sentence that `@keyframes` never reach a preview (D-076) is amended to except this one generated block; a site's own keyframes still never do. The delta entries already carry each property's `transition` timing (D-088), which is what the animation uses; an entry without one is applied at once. Real pointer hover still works inside the frame because CSS `:hover` needs no script; pinning is for touch and for comparison. For captured previews the StateBar switches between the state crops. For a component with `motion.transitions`, the StateBar shows a `Play` control that steps Default → Hover → Active → Default by swapping files at the recorded timings, once.

**Sizing.** A live preview renders at the component's captured size at the desktop viewport, scaled down to fit the card when wider than the card (never scaled up; FitPreview already does this), with the scale shown as a caption (`Shown at 0.8×`), which is new, so the reader knows a 44 px button is 44 px.

### `docs/specs/capture-and-states.md`

**What is written.** Each instance records `ground` (the effective background color as hex) and the crop margin is 4 px painted with it.

### `docs/design/components.md`

PreviewFrame gains the StateBar, the Ground toggle and the scale caption; ComponentCard shows the preview on its `ground`. New primitive **StateBar** (a ChipGroup of state Chips with the `Play` control), with catalog entries in every state at desktop and 390.

### `docs/design/pages.md`

Components section: cards render live previews with the `ground`; the panel shows the PreviewFrame with StateBar and Ground toggle above the states list; the states list stays as the record of what changed (the StateBar is how it is seen).

### `docs/design/copy.md`

Add: StateBar labels (the State enum labels already exist), `Play`, `Ground`, `Site`, `Light`, `Dark`, the scale caption `Shown at {scale}×`, the font caption `Font substituted: {family} was not available.`, and the live-rate line `{live} of {total} components are live previews; {captured} are captured images.` in the design-system.md export's How this was made paragraph and in the run page's footer context line.

## 5 · Check results, up front

**The rule that constrains this.** Copy rule 3 (D-018) forbids the words `accessible`, `compliant` and `a11y` in product copy, and the chrome is monochrome (D-003): the extracted palette is the only chroma on the page. So the mark is not a green "Accessible" badge. It is a count the reader can trust, stated in the app's own voice, and distinguished by weight rather than color. Both decisions stand. The owner confirmed on 2026-10-28 that D-003 is not reopened; P17 builds the monochrome version and the Builder does not revisit it.

### `docs/specs/checks.md`

**Per-component result.** A component passes all checks when every applicable check passed; a component with no applicable check is excluded from the ratio. This is derived from `components[].checks` by `checkCounts` (`apps/web/lib/doc.ts`, and the same counting in the pipeline and the MCP server), never stored, because `checks` is an array of results. The stored addition is the run-level `stats.componentsPassing: { passed, applicable }`, written with the other stats.

### `docs/design/pages.md`

**Stat strip.** Six cells in the one Card: Colors, Type styles, Spacing steps, Components, Checks passed (unchanged: `95 of 167`), and new **Components passing** (`20 of 30` with the caption from copy). At tablet the strip wraps to 3 + 3; at phone to 2 columns, three rows, no spanning cell. The Components-passing cell links to the Components section with the `Passing all checks` filter applied.

**Components section.** ComponentFilter gains a `Passing all checks` toggle Chip beside `Core only`. The CheckBadge on each ComponentCard (beside the name, where it is today) is restyled so it reads at a glance: a filled `ink` Pill with the check glyph and `All checks` when every applicable check passes; an outlined Pill reading `{passed} of {applicable} checks` otherwise; nothing when no check applies. It keeps its Popover with the per-check list. The `Captured` tag stays on the preview. The panel's Checks block keeps the full per-check list and gets the same Pill at its head.

**Checks section.** Keeps its place in the section order (Tokens, Motion, Components, Checks, Drift, Exports) and gains an opening line: `{passed} of {applicable} components pass every check that applies to them.`

### `docs/design/components.md`

**CheckBadge** is amended to the two looks above (filled when all pass, outlined otherwise, none when nothing applies); its catalog entry shows all three. No new primitive.

### `docs/design/copy.md`

Stat card: `Components passing` with caption `pass every check that applies`; filter Chip `Passing all checks`; CheckBadge strings `All checks` and `{passed} of {applicable} checks` (the existing `{passed} of {applicable}` badge string is replaced); the Checks section opening line above. None of these use a forbidden word; `pnpm qa:copy` enforces it.

### `docs/specs/exports-and-mcp.md`

`list_components` gains `passedAll` (derived, as above); `design-system.md` and `prompt.md` component sections state `Checks: all pass` or `Checks: {passed} of {applicable}` on the contract line, and the prompt's Rules gain `Keep every component that passes all checks passing: contrast pairs, focus visibility, tap target size.`

---

## `docs/plan.md`

Add after P16:

### P17 · The second testing round: showcase promotion, document upgrades, easings, touchable previews, check visibility

Follows: `docs/v1-2-addendum.md` (first), then every document it amends.

Build:

- Merge this addendum into the named documents, log the six decisions below under the next free ids in `docs/decisions.md`, delete the addendum, commit (`P17 · docs merged`).
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

## `docs/plan.md` · Definition of Done

Add item 12: "Every read path upgrades stored run documents to the current shape by their `pipelineVersion`, and Compare renders any two complete runs of any version."

## `docs/decisions.md`

Append, under the next six free ids, in this order:

- **The owner promotes runs to the showcase.** `pnpm showcase --add/--remove/--list`, no re-crawl, complete and non-sparse only; visitors' runs stay unlisted. Reasoning: the showcase is curated by the owner and must include the runs he is proud of, not only the opening roster.
- **Every read path upgrades stored run documents by their pipeline version.** Includes the Compare root cause as confirmed in this addendum, the Builder's verification and the fix. Reasoning: a schema that grows without an upgrade path breaks every page that reads old runs.
- **Easings are shown as synchronized ambient loops.** Shared clock, equal distance and time, one direction, compositor-only, paused off screen, static under reduced motion; each easing names what uses it. Reasoning: one short replay shows nothing; simultaneous curves show the difference.
- **Previews render on the source element's ground and expose state pins.** `ground` captured per instance, painted behind live and captured previews and into the crop margin; the StateBar swaps per-state preview files that animate on load with the recorded timing; no scripts in frames, D-017 unchanged. Reasoning: a component is judged by playing with it, and a halo of page background is a defect.
- **Live rate is measured per reason, render checks run core first by usage, and real sites have thresholds.** Reasoning: a fallback nobody measures becomes the default, and a budget cut should land on the components that matter least.
- **Check results are a component-level metric and a monochrome mark.** `componentsPassing` stat cell, `Passing all checks` filter, the CheckBadge restyled in ink; D-003 and D-018 stand, confirmed by the owner. Reasoning: the owner wants the check results up front; the product's voice and chrome rules still hold.

## `STATUS.md`

Current phase `P17 · Second testing round. Not started.`; Next action `Read docs/v1-2-addendum.md, then merge it as P17's first step.`; the P17 checklist copied in.

## `docs/partner-log.md`

The Partner's review entry is already there (2026-10-28). The Builder reads it at session start like the rest of `docs/`.
