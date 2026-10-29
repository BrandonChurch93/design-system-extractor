# V1.3 addendum · the third round of testing

This document amends the kit after the owner's third round of real runs (modernsoftworks.com `qgc6npq1au`, a fresh brandonchurchportfolio.com run `d78cp1kh0v`, and the linear.app run kept locally) on the v1.2 build (commit `24b454c`, Build complete on 2026-10-28). Eleven findings, all in the application and the capture, none in the token or drift pipeline. It follows the same contract as the v1.1 and v1.2 addenda (merged in P16 and P17 and deleted; merge commits `f74c9cb` and `a87c663`): changes to named sections of existing documents, a new phase P18 in `docs/plan.md`, nine decisions to log under the next free ids (named by title, since the Builder logs decisions the Partner cannot number ahead), and deletion of this file once merged. Precedence while it exists: this addendum > every other document. The Partner reproduced every finding against the v1.2 build on 2026-10-28 with four read-only sweeps (the Motion section, the Radius and Shadow cards, the pattern label, the card previews and ground) before writing it; the sweep results are in `docs/partner-log.md`.

The findings, with what the reproduction showed:

1. Easing cards: the 160 × 96 plot sits flush left and fills under half the card, leaving about 170 px empty beside it at every viewport; stages do not align across a row.
2. Durations strip: a linear scale from 0 to the longest duration. On the owner's site 10 of 13 ticks fall within the first 36 px and the labels climb a staircase of ten rows; on linear.app (26 durations) the strip is about 800 px tall.
3. Radius and Shadow cards: 44 px swatches at a 16 px gap in two cards about 275 px wide at 1440 and 170 px at 820; a 32 px blur reaches the next swatch and the card edge.
4. ReplayButton: intrinsic width, in a grid column sized `auto`, so `Replay` to `Stop` reflows the row at the start and end of every play.
5. KeyframesList: every block, uncapped: 47 rows on the owner's site, 264 on linear.app.
6. Pattern rows: the 40 px chip rests on the pattern's end state, which for every entrance is a plain 18 px ink square; its right column is top-aligned.
7. A pattern labeled `Button (8780d3aa06 does not exist)`. Not a dangling reference: the component exists, and that is its name. The synthetic 404 probe page (`/8780d3aa06-does-not-exist`) was the second Button's naming context and its path segment became the name. The same context goes into the naming prompt.
8. Card previews are inert for three reasons, each sufficient: `pointer-events: none` on the frame (`PreviewFrame.module.css`), the card's link overlay (`.link::after` over the whole card), and preview documents that carry no `:hover`, `:focus` or `:active` rules, because matched CSS is collected on the neutral page where those selectors match nothing. The card does hold a real `sandbox=""` frame for live components, as the v1.2 documents require.
9. The scale rule: the card's preview room is 339 × 119 px at 1440, so a 880 px textarea shows at 0.38× and a 1440 px navigation at 0.23×, as the owner measured. The documents say "scaled down when wider"; the code also scales on height.
10. Skip links: the portfolio's skip link is hidden by the `sr-only` pattern at capture, so its default crop is a dark box, while its focus crop (`focus.png`, taken during the Tab walk) shows the link in full. A second "Skip link" is a zero-height `header` (1440 × 0) that passed the candidate filter because only a box with both sides at zero is treated as empty. On modernsoftworks.com the skip link's crop could not be cut, and its preview records a 0 × 0 size with a key that was never written (a 404).
11. The painted ground: every ground on both sites is a faithful sample of the page behind the element (`#0C0A09`, `#141414`, `#1A1A1A`). No transparent component is hidden by its ground. What hides is a component whose own fill is within ΔE 5 of its ground (33 of 74 on modernsoftworks.com, cards and inputs at ΔE 0.4 to 3.3), which is also how the site shows them. The Ground toggle exists only in the drawer.

---

## 1 · Easing cards

### `docs/design/components.md`

**EasingStage, replace the sentence that fixes the plot at 160 × 96 with:** "A plot as wide as the card's inner width (the stage measures it with a ResizeObserver, as the DurationStrip does) and 160 px tall, holding the curve drawn as a 1.5 px `ink` stroke on a `surface-tint` ground with a `line` baseline and left edge; the plot keeps room above and below for curves that overshoot, at least 15% of its height on each side. The dot on the curve is 8 px `ink`. Below the plot, at the same width, a `line` hairline track with a 10 px `ink` dot; the track dot travels the full track width. Both dots keep the loop rules in `motion.md` (Ambient loops)." The curve path is computed in pixels from the measured width, never stretched from a fixed viewBox, so the stroke stays 1.5 px.

**EasingCard.** Replace the order with: "the name (`h3`) with the `Named by the site` Pill when it applies, the value in `code` (wrapping at commas), the usage line in `caption` `muted`, always present (`Declared, not seen in use` when `usedBy` is empty), then the EasingStage pinned to the card's bottom edge (`margin-top: auto` in the card's grid), so every stage in a row sits at the same height and every card in a row is the same height. Card padding is the Card's own (`space-5`, `space-4` phone), the stage inset by nothing more."

**EasingGrid.** Unchanged (3 / 2 / 1, `space-5` gap, one clock). Add: "Grid items stretch; the stage is what absorbs the difference between cards."

### `docs/design/motion.md`

Ambient loops: the track travel sentence now reads "the track dot crosses the full track width" instead of a fixed 112 px; the e2e assertion reads the track's width instead of a constant.

### `docs/design/copy.md`

Easing card: add the empty usage line `Declared, not seen in use`.

### Skeletons

The RegionSkeleton's easing height (358 px in D-098) is re-measured once the stage is 160 px tall and recorded the same way; the ±4 px e2e test keeps holding it.

## 2 · Durations on a log scale

### `docs/design/components.md`

**DurationStrip, replace the paragraph with:** "One horizontal scale on a base-10 log axis from the shortest duration to the longest (a single duration sits at the center), so 150, 1,000 and 10,000 ms are evenly spaced; every duration a tick: a 16 px 1 px `ink` mark, the `hex` value (`{ms} ms`) above it, the role under it in `caption` `muted` when it has one (Faster, Fast, Base, Slow, Slower), the most used marked with a filled 8 px `ink` dot on the baseline. Each tick is a TokenPopover trigger, so a tick whose label is dropped still answers. Labels stagger: value labels take at most two rows above the scale and role labels at most two rows below, assigned greedily by x position with a minimum of 56 px between labels on one row; a value label that fits on neither row is dropped (the tick, its dot and its popover stay), and the strip's meta line says `{n} durations · {k} labeled` when any is dropped. Each tick carries the 4 px `ink` dot that runs up its mark over the duration's real length on the grid's clock (D-093, D-097), unchanged. The Long list: when the log scale alone still drops a value label at 1440 on the P18 real-site runs, durations over 2,000 ms leave the scale and sit in a `Long` list to its right (name, value, role, each a TokenPopover trigger, in `meta`), the scale ending at 2,000 ms; the Builder measures and decides once, in the P18 decision, and the rule is then fixed. Phone: the scale keeps the full width; the Long list, when it exists, sits below the scale."

### `docs/design/copy.md`

Durations: add `{n} durations · {k} labeled` (the meta line when a label is dropped; otherwise the count alone, as today) and the list head `Long`.

### `docs/decisions.md` merge ruling

The mark is 16 px (`space-4`), as built; D-097's 12 px is the dot's rise, not the mark. The documents say so after the merge.

### Catalog

The `duration-strip` demo gains two states from the real runs: `Wide range` (the owner's site: 150, 200, 300, 350, 400, 500, 700, 900, 1000, 1200, 4000, 14000, 35000 ms, with 150 base, 200 slow, 300 slower, 150 most used) and `Dense` (linear.app's 26: 100, 120, 150, 160, 200, 250, 260, 300, 320, 350, 400, 450, 500, 700, 800, 960, 1000, 1200, 1250, 1300, 1500, 2000, 2200, 6000, 10000, 30000 ms, with 100 base, 120 slow, 150 slower). Both are in the screenshot review at three viewports.

## 3 · Radius and Shadow cards

### `docs/design/pages.md`

**Run page, Tokens, replace the two-column row sentence with:** "then a two-column row: Type Card (TypeScaleRow list, families line) and Spacing Card (SpacingBar list); then a row of its own, full content width, holding Radius Card (RadiusSample) and Shadow Card (ShadowSample) side by side, each half the width (`space-5` gap); a Radius or Shadow card with no tokens is left out and the other takes the full row (D-059). Tablet: the same; phone: everything in one column."

### `docs/design/components.md`

**RadiusSample.** "72 × 72 outlined boxes (2 px `ink` border) at each radius, `space-6` apart, with the value beneath in `hex` as `{value} px` (`pill` for the pill token); a radius at or above half the box draws as a pill. Each box is a TokenPopover trigger, as today."

**ShadowSample.** "72 × 72 `surface` boxes carrying each extracted shadow, labeled beneath in `hex` with the name (sm, md, lg, or the site's own name) and under it the shadow's value in `tag` (wrapping, one layer per line). The gap between boxes is the smallest spacing token at or above twice the largest blur radius in the run's shadows (`space-7` for a 16 px blur, `space-8` for 32, `space-9` for 48), never below `space-6`; the list carries half that gap as padding on every side, so no shadow leaves the card. The blur radius is read from the stored value (the third length of each layer, after `inset`), with 0 when the value cannot be read."

Both cards' skeletons are re-measured (components.md, Skeleton: the exact height). The `sample44` class name goes.

### `docs/design/design-system.md`

Spacing scale: add the sentence "A gap derived from a measurement (the shadow list) rounds up to the next token on this scale."

## 4 · ReplayButton

### `docs/design/components.md`

**ReplayButton.** Add: "Its width is fixed at the wider of its two labels: both labels are rendered in the button, stacked in one grid cell, the inactive one `visibility: hidden` and `aria-hidden`, so the label changes and nothing moves. The pattern row's right column is sized by the button at rest and never reflows." Add: "A play is cut at 12 s and snaps to the end state (a loop longer than that shows its first 12 s)." (This is the built behavior; the document now says it.)

## 5 · Keyframes

### `docs/design/components.md`

**KeyframesList.** Add: "Six rows by default, used blocks first; beneath, a ghost Button `Show all {n} keyframes` that expands the list (reveal in staggers of 12, as the ComponentGrid does) and reads `Show fewer` when open; collapsing closes any open disclosure. The pages line keeps its first three paths and `· {n} more` after them when there are more."

### `docs/design/copy.md`

Keyframes: add `Show all {n} keyframes` · `Show fewer` · pages overflow `· {n} more`.

## 6 · Pattern rows

### `docs/design/components.md`

**PatternRow, replace the chip sentences with:** "The row's right column (the chips and the ReplayButton) is centered on the row's height, not its first line. The preview chip is 56 × 56 `surface-tint` `radius-sm` with `overflow: hidden`, carrying a 28 × 28 `ink` block. At rest the block shows the pattern's start state, scaled to the chip: translations in px multiplied by 0.35 and clamped to ±14 px per axis, percentage translations as they are, `blur()` halved and clamped at 6 px, scale and rotate as they are, opacity floored at 0.25 so a rest state is never empty; colors, shadows and clip-path as the allowlist in D-090 already says. A play runs from the true scaled start (opacity as recorded) to the end over the pattern's duration, delay and easing, holds 500 ms, then returns to rest through a 150 ms fade (the ambient fade and hold values). It plays once when the row scrolls into view and again on Replay; patterns with `stagger` play as many whole chips as fit the column, six at most, each starting `stepMs` after the one before, and the row's line still states the full count (D-098). Phone: the chips and Replay stack under the text, as today."

### `docs/design/motion.md`

Pattern chips: "A chip rests on the pattern's start state and plays start to end, so what the reader sees before the play is where the site's element begins (faded in, slid, blurred), and the play is the site's own motion scaled to the chip."

## 7 · The synthetic page's name

### `docs/specs/component-detection.md`

**Naming, the context rule (the sentence that takes "the page's last path segment").** Replace with: "the page's last path segment for a crawled page; for the synthetic not-found page (`discover.ts`, `syntheticNotFoundPath`) the context is `404 page`, never its path." The same `contextOf` goes into the naming prompt (`components/model.ts`), so the prompt reads `in 404 page` for those components; the affected recordings are re-recorded (six in `fixtures/recordings/components/` contain the old text) within the reserve.

**Motion attachment (the paragraph that assigns a pattern to a component).** Replace "the first owned element among the group's targets" with: "A pattern belongs to the component that owns the pattern's own selector element (`elementKey`); when no component owns it, the pattern has no `componentId` and the row shows the selector, even when another target of a staggered group is owned." A stagger led by a `span` is not a Button pattern.

### `docs/specs/data-model.md`

**Upgrading stored documents.** Add to the list: "a `motion.patterns[].componentId` that resolves to no component is removed (the row then shows the selector); `components[].motion.patternIds` keep only ids that exist." `pnpm db:seed:fixtures` drops the patterns of the components it cuts for the sparse seed, so the seed documents pass the same test.

### Tests

`components.test.ts` gains the synthetic page case; a document-level test over every fixture run, the seed documents and the v1.0 fixture asserts that every `componentId`, `patternIds` entry, `tokensUsed.tokenId`, instance `pageId` and `checks.byCheck.failing` id resolves.

## 8 · Card previews that take the pointer

### `docs/specs/preview-fidelity.md`

**New section "State rules in the default preview".** The default preview document carries the component's recorded state deltas as pseudo-class rules on its root, `.dse-root > :first-child:hover { … }`, `:focus-visible` from the `focus` delta, `:active` from the `active` delta, each with the recorded transition timing (the same values the state files write, D-088, D-094), through the same CSS sanitizer and the same `!important`-free rule as the state files. A state the component never captured writes no rule. The `open` and `disabled` states are not pseudo-classes and stay in their state files and the StateBar. The security suite covers the state rules as it covers the state files (no scripts, zero outbound requests, a value with `{`, `}` or `<` outside a quoted string refused). Frames stay `sandbox=""`: a click on an anchor inside the frame goes to `#` (relative `href` values are already rewritten) and a form cannot submit; a test clicks a link inside a card frame and asserts the frame's URL did not change.

**Preview ground.** Unchanged here; see section 11.

### `docs/design/components.md`

**PreviewFrame.** Remove `pointer-events: none` from the frame: the pointer reaches the frame, so the site's hover and active styles play inside it on the card and in the drawer. The frame keeps `tabindex="-1"`, so the page's tab order does not grow by every component's inner controls; keyboard users reach the focus state through the StateBar in the drawer, and a pointer click inside the frame focuses the element (`:focus-visible` shows only for keyboard focus, as on the site).

**ComponentCard, replace "A Card that is a link to the component" with:** "A Card whose body (the name row through the tags, the whole area under the preview) is the link to the component: the link overlay (`::after`) covers the body, not the preview region, on devices that hover (`@media (hover: hover)`). On touch devices (`@media (hover: none)`) the overlay covers the preview too, so a tap anywhere on the card opens the drawer, since there is no hover to lose. The card still lifts on hover and carries the focus ring (the name link is the focus target). The CheckBadge, the StatesStrip, the Ground toggle and the scale caption sit above the overlay."

### `docs/design/pages.md`

Run page, components: add "Live previews on cards answer the pointer: hover and active states play inside the frame (the card-pointer decision below)."

### Tests

e2e: hovering a card's frame on a fixture component with a recorded hover delta changes the computed style of the root inside the frame (Playwright reads it before and after, as the v1.2 pin test does); a click on the name row opens the drawer; at a touch emulation (`hasTouch`, `(hover: none)`), a tap on the preview opens the drawer; `preview-frame.test.ts` still asserts `sandbox=""` with no flags.

## 9 · The scale floor

### `docs/specs/preview-fidelity.md`

**Sizing, replace the paragraph with:** "A live preview renders at the component's captured size at the desktop viewport. On a card it is scaled down to fit its region, on width and on height, never up and never below 0.6×: a component that does not fit at 0.6× renders at 0.6× anchored to the region's top-left (`space-4` inset) and is clipped at the region's edge, with a 40 px fade into the ground on each clipped edge (a gradient from transparent to the painted ground, so the cut reads as a cut and not as the component's end). The scale caption reads `Shown at {scale}×` and, when clipped, `Shown at {scale}×, cut to fit`. In the drawer the preview renders at 1:1 and the stage scrolls horizontally when the preview is wider than it (a scrollbar in the app's `line` color, no caption), so the reader can see the whole component at its real size."

### `docs/design/components.md`

**PreviewFrame**: the caption sits inside the ground at its bottom-left (as built; the document said "beneath" and now says what the code does). **ComponentPanel, Variants**: "at 1:1, scrolling horizontally when wider than the panel's stage" replaces "scaled down only when wider than the panel".

### `docs/design/copy.md`

Preview controls: add the clipped caption `Shown at {scale}×, cut to fit`.

### Tests

A unit test on the scale function (floor, anchor, which edges clip) and the e2e shape test's card heights unchanged (the region is still 152 high).

## 10 · Components hidden until focused

### `docs/specs/capture-and-states.md`

**Candidates (the sentence listing visibility).** Replace "zero size, off-screen" with the measured rule: "a box with width or height at or below 1 px, a box entirely outside the document (right or bottom at or below 0, left at or beyond the page width), `visibility: hidden`, `display: none`, `opacity: 0`, `clip: rect(0px, 0px, 0px, 0px)` or a `clip-path` of `inset(50%)` or more, is hidden at capture (`clip` and `clip-path` join the snapshot's recorded styles). A hidden element is not a candidate, except when it is focusable (a link with `href`, a button, an input): it stays a candidate flagged `hiddenAtCapture` and its states are captured as usual, so the Tab walk's focus crop shows it." A 1440 × 0 header is therefore never a candidate (the P17 portfolio run's second "Skip link").

**States, the `focus` row.** Add: "For a component flagged `hiddenAtCapture`, the focus crop is the preview (mode `captured`, reason `hidden-until-focus`, a new `CapturedReason`), its size the crop's, and the card and drawer caption reads `Shown focused: hidden on the page until focused.` When no state shows it (no focus crop, or the focus box still hidden), the component is dropped before naming: a reader can never see it, so it is not a design element." The portfolio's skip link then shows as the site shows it to a keyboard user.

**Crops.** "A crop that cannot be cut (the box lies outside the screenshot) leaves the preview with no `cropKey` and a size of 0 × 0, the reason `no-crop`; the card shows the component's code (the CodeBlock of its markup, as the drawer's Code section does) with the caption `No capture: the element sits outside the page at rest.`" `Preview.cropKey` becomes optional in the schema; the app never requests a key it does not have.

### `docs/specs/data-model.md`

`Instance.hiddenAtCapture?: boolean`; `CapturedReason` gains `hidden-until-focus` and `no-crop`; `Preview.cropKey` optional; the upgrade step for documents below 1.3.0 leaves `hiddenAtCapture` absent (false) and turns a preview whose `cropKey` was never written (width and height 0) into the `no-crop` form. `pipelineVersion` becomes `1.3.0` in `packages/pipeline/src/version.ts`.

### `docs/design/copy.md`

Preview captions: `Shown focused: hidden on the page until focused.` · `No capture: the element sits outside the page at rest.`

### `docs/evals.md`

The clean fixture gains a skip link (`a.skip-link`, the `sr-only` pattern with `:focus` reveal, first in `body`) so the rule is proven in replay: expected components unchanged in count (the skip link is a `link` the fixture already counts, or the expectation is re-derived and logged), its preview `captured` with reason `hidden-until-focus`. The live-rate thresholds count a `hidden-until-focus` preview as checked.

## 11 · A ground that hides the component

### `docs/specs/capture-and-states.md`

**Ground.** Add after the sampling rules: "The preview also records the element's own fill, `Preview.fill`: the root's computed `background-color` at capture when its alpha is at least 0.9, composited over the ground otherwise when the alpha is above 0.1, and null when the element is transparent. The ground stays the sampled ground; the fill is what the app needs to judge contrast."

### `docs/specs/preview-fidelity.md`

**Preview ground.** Add: "**Contrast fallback.** When the component's `fill` is within ΔE 5 (the pipeline's OKLab distance, `color/parse.ts`) of its `ground`, the card and the drawer paint the opposite tone instead: the app's `surface` for a dark ground, its `inverse-bg` for a light one (the toggle's Light and Dark grounds), and the caption reads `On a light ground: the site's ground matches the component.` (or `On a dark ground: …`). The Ground toggle's `Site` returns the sampled ground. A transparent component (`fill` null) keeps its sampled ground: it is its text and border that must be seen, and the sweep found none below 3.2:1 on the real sites."

### `docs/design/components.md`

**ComponentCard.** Add: "The Ground toggle (`Site` · `Light` · `Dark`, the panel's ChipGroup at its `sm` size) sits at the preview region's bottom-right, above the overlay, and holds per card; it starts on `Site`, or on the fallback tone when the contrast fallback applied. The scale caption keeps the bottom-left."

### `docs/design/copy.md`

Preview controls: add `On a light ground: the site's ground matches the component.` · `On a dark ground: the site's ground matches the component.`

### Tests

A unit test on the fallback rule (ΔE just under and over 5, a transparent fill, a light ground); the catalog `component-card` demo gains a `Dark on dark` state from the owner's site values (`#1A1A1A` on `#141414`); e2e: the toggle on a card changes the painted ground and does not open the drawer.

## `docs/plan.md`

Add after P17:

### P18 · The third testing round: the Motion section, token cards, previews that answer

Follows: `docs/v1-3-addendum.md` (first), then every document it amends.

Build:

- Merge this addendum into the named documents, log the nine decisions below under the next free ids in `docs/decisions.md` with the merge rulings after them, delete the addendum, commit (`P18 · docs merged`). Fix the two paths the documents get wrong while there: the motion components live in `apps/web/components/run/`, not `apps/web/components/run/motion/` (D-093 Affects, STATUS).
- Schema and upgrade: `Preview.fill`, `Preview.cropKey` optional, `Instance.hiddenAtCapture`, the two `CapturedReason` values, `pipelineVersion` 1.3.0, the 1.3 upgrade step (fill null, dangling pattern ids removed, the unwritten-key preview to `no-crop`), tests on the v1.0 and v1.1 fixture documents.
- Pipeline: the synthetic page's naming context and the re-recorded recordings; pattern attribution by the pattern's own element; hidden-at-capture candidates, `clip` and `clip-path` in the snapshot, the focus crop as the preview, the drop rule; the `no-crop` form; the fill read; state rules in the default preview document and the security suite over them; the clean fixture's skip link with its expectation.
- Web, Motion: the EasingStage at card width and 160 px, dots 8 and 10, the stage pinned to the bottom, the empty usage line; the DurationStrip's log axis, label budget, popover ticks and the Long list measured once; the ReplayButton's fixed width; the KeyframesList's six and toggle; the PatternRow's centered column, 56 px chips at rest on the scaled start state, the play's return to rest; the catalog states (`Wide range`, `Dense`, `Dark on dark`, the long keyframes list); the skeleton heights re-measured.
- Web, tokens: the Radius and Shadow row, 72 px swatches, the blur-derived gap and padding, values under the swatches, the dead class removed, skeletons re-measured.
- Web, previews: the pointer reaching the frame, the overlay on the body with the touch rule, the 0.6× floor with clip and fade, the clipped caption, the drawer at 1:1 with horizontal scroll, the contrast fallback and the Ground toggle on the card, the code-only card for `no-crop`, the two captions.
- Copy (`strings.ts` from copy.md), `pnpm qa:copy`; goldens updated once and logged; traceability regenerated; README; CHANGELOG `1.3.0`.

Gate:

- Screenshots at 1440, 820 and 390 of the Motion section (the clean fixture, the `Wide range` and `Dense` strips, a 12-easing grid), the Tokens section with Radius and Shadow, a component card hovered, a clipped wide component, a `Dark on dark` card, a hidden-until-focus card and a `no-crop` card, reviewed against `docs/design/*` and `docs/quality-bar.md`; every easing stage in a row at the same height; no value label dropped on the `Wide range` strip at 1440; the `Dense` strip under 300 px tall at 390.
- Playwright: the ReplayButton's width is identical before, during and after a play; the pattern chip's computed style at rest equals the scaled start state and returns to it after the play; hovering a card frame changes the root's computed style inside the frame; a tap on the preview under touch emulation opens the drawer and a click on the name row does too; the card Ground toggle repaints and does not open the drawer; the drawer stage scrolls horizontally on a component wider than it; the long-task test still passes with 12 easings at card width.
- Unit: the scale function (floor, anchors, clipped edges); the contrast fallback; the shadow gap from the stored value; the log axis positions and the label budget; the synthetic page context; the hidden-at-capture rule on the snapshot; every reference in every fixture run, seed and versioned fixture document resolves.
- Security: `pnpm test:security` passes over the default preview documents with state rules; a click on a link inside a card frame leaves the frame's URL unchanged.
- Evals in replay at thresholds with the clean fixture's skip link; the live-rate floor unchanged on the three fixtures.
- Real-site check: the owner's portfolio and modernsoftworks.com run fresh through the queue; pasted into STATUS under `P18 real-site check`: the skip link's preview mode and reason, the count of cards on the contrast fallback, the Button names on the 404 page, the durations strip's dropped-label count and whether the Long list was adopted, and three screenshots named in the log.
- `pnpm qa:copy`, axe at zero violations on the run page with the new controls, `pnpm verify:all` green; the Definition of Done re-run in full.

## `docs/plan.md` · Definition of Done

Item 12 stands. Add item 13: "A live component's card frame answers the pointer with the site's own hover and active styles, and no card preview renders below 0.6×."

## `docs/decisions.md`

Append, under the next nine free ids, in this order:

- **The easing stage fills its card and the stages of a row align.** Card-width plot, 160 px tall, 8 and 10 px dots, the stage pinned to the card's bottom, an always-present usage line. Reasoning: a fixed 160 × 96 plot left half the card empty and the rows ragged; the curve is the card's content.
- **Durations sit on a log axis with a label budget.** Base-10 log from the shortest to the longest, two label rows each side, dropped labels counted in the meta line, every tick a popover, the Long list adopted only if the measurement needs it. Reasoning: real sites hold 100 ms to 35 s; a linear axis piles every working duration into the first few pixels.
- **Radius and Shadow take a row of their own with 72 px swatches.** The blur-derived gap rounds up to a spacing token and the list pads itself by half the gap. Reasoning: 44 px swatches in a 275 px card, with a 32 px blur, cannot be read; the row below the Type and Spacing cards is free.
- **Pattern chips rest on the start state, the ReplayButton holds its width, and the keyframes list shows six.** Reasoning: a chip at rest on the end state is a square; a button that changes width jolts the row; 264 rows is not a list.
- **The synthetic not-found page never names a component, and a pattern belongs to the element it was read from.** Reasoning: a probe path is not context; a stagger's first owned target is not its owner.
- **Card previews take the pointer.** State rules in the default preview document, the link overlay on the card body, the preview included on touch; frames stay `sandbox=""` and out of the tab order. Reasoning: a live preview that cannot be hovered is a screenshot with extra steps; the product's point is to play with the components.
- **Previews scale no lower than 0.6× on a card and show 1:1 in the drawer.** Clipped with a fade, captioned as cut. Reasoning: a navigation at 0.23× is a thumbnail of nothing; a cut at real size shows more than a whole at a quarter.
- **A component hidden until focused previews its focus state; a zero-area box is never a candidate; a preview with no crop has no key.** Reasoning: the skip link is a real component that the site shows to keyboard users, and a blank strip is a defect; a key that 404s is a bug.
- **A ground that matches the component's fill is swapped for the opposite tone, and the Ground toggle is on the card.** The sampled ground stays the record and the `Site` option; `fill` is recorded so the app can judge. Reasoning: the sample is faithful, and faithfully invisible; a reader must see the component first and its context second.

## `STATUS.md`

Current phase `P18 · Third testing round. Not started.`; Next action `Read docs/v1-3-addendum.md, then merge it as P18's first step.`; the P18 checklist copied in.

## `docs/partner-log.md`

The Partner's entry for this round is already there (2026-10-28, the second entry). The Builder reads it at session start like the rest of `docs/`.
