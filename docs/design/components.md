# App components

Every component of the app's own interface. Each has anatomy, states, responsive behavior, tokens, and motion. All of them render in `/catalog` from sample data. Component names here are the component file names in `apps/web/components/` (PascalCase) and the names used in `docs/design/pages.md`.

Shared rules: every interactive element is a real `button`, `a[href]`, `input` or `label`; every icon-only control has `aria-label`; every component respects reduced motion; every component works at 390 px; nothing is available only on hover (anything a tooltip would show is shown by a Popover that opens on click and on focus, and the same information exists elsewhere on the page).

Type styles and sizes named below are the ones in `docs/design/design-system.md`. No other sizes exist.

## Primitives

**TopNav** · Wordmark "Design System Extractor" (`h3` weight 700) on the left, links on the right: Showcase, Recent runs, How it works, GitHub. Height 68, `line` rule below drawn on load. Phone: wordmark plus a menu button (Lucide `menu`) that opens a disclosure list under the bar, slide from top, `motion-base`. Not sticky; the run page's SectionNav is the sticky element.

**Footer** · Two lines on `bg` above a `line` rule: left, "Open source · MIT · Built by Brandon Church" (link to his portfolio), "About · Privacy · Terms", and "Built with" linking `/catalog`, all `caption`; right, context text the page supplies (a share link, a cost line). Phone: stacks.

**SectionNav** · The run page's section links: Tokens, Components, Checks, Drift, Exports. Pills (`radius-pill`), `label` weight 500; the active section has `ink` ground and `inverse-ink` text. Sticky at top 0 once the header scrolls past, on `bg` with a `line` rule beneath that draws in when it sticks. Active state follows scroll position (IntersectionObserver). Phone: horizontally scrollable, no wrap, 20 px edge fade.

**Button** · Variants `primary` (`ink` ground, `inverse-ink` text), `ghost` (`surface` ground, `line` border, `line-strong` on hover), `inverse` (on `inverse-bg`: `inverse-ink` ground, `ink` text). Sizes `md` 44 high `space-5` side padding, `sm` 36 high `space-4`, `xl` 56 high `space-6` (the Extract button only). Optional leading Lucide icon 16. States: hover, focus-visible, active (scale 0.985), disabled (50% opacity, no pointer). Never full width except, on phones, the Extract button and the buttons of the state pages' forms (D-059).

**Chip** · A filter pill: 32 high, `label`, `line` border, `surface` ground. Selected: `ink` ground, `inverse-ink` text. A count may follow the label in `meta`: "Buttons · 6". A ChipGroup is a single-select radio group with arrow-key movement. Phone: the row scrolls horizontally.

**Tag** · A token or category chip: 24 high, `tag` mono, `surface-tint` ground, `radius-pill`. Static text, except inside the component panel where a Tag is a button that opens the token's Popover.

**Pill** · A status marker: 24 high, `caption` weight 600, `radius-pill`, transparent ground, 1 px border. Variants: `solid` (`ink` border and text: Complete, New) and `soft` (`line-strong` border, `muted` text: Changed, Removed, Blocked, Running, Failed, Cancelled, Deterministic). A Pill with a filled ground (`ink` ground, `inverse-ink` text) is the `inverse` variant, used for "Model · Haiku" and "Model · Sonnet".

**Card** · `surface`, `line-soft` border, `radius-lg`, `shadow-card`. Padding `space-5` (`space-4` phone). A Card that is a link lifts on hover and carries the focus ring. Cards never nest more than one level.

**Input** · Sizes `md` 44 high and `xl` 56 high (the URL field in the home headline block only). `surface` ground, `line` border, `radius-md`, `body` text, `muted` placeholder. Hover `line-strong`, focus ring. Always paired with a `label` element, visually hidden where the design shows none. Error: a `caption` line below in `ink-2` with a Lucide `circle-alert` icon; the border does not change color (there is no red).

**Tabs** · A row of text tabs for switching content in place (the Code tabs in the panel, the compare mode is a separate control): `label` weight 500, `ink-2`, 2 px underline in `ink` on the active tab that slides between tabs over `motion-base`. `role="tablist"` with arrow-key movement; panels are `role="tabpanel"`.

**Popover** · A floating Card (`shadow-card`, max width as the caller says) anchored to its trigger with 8 px offset, flipping to stay in the viewport. Opens on click and on Enter or Space; closes on Escape, on outside click, and when focus leaves; focus moves into it on open and returns to the trigger on close. Entrance: slide 8 px from the anchor side plus opacity, `motion-fast`. On phones, a Popover wider than 320 px opens as a Sheet instead. Used by KeyPopover, PageListPopover, TokenPopover, SharePopover, StatesStrip, CheckBadge, SpacingBar.

**Sheet** · A bottom panel for phones and for large popovers: rises from the bottom to the height the caller says (92% for the component sheet, content height otherwise, max 80%), `surface`, `radius-lg` top corners, `shadow-sheet`, a 36 × 4 grab handle in `line-strong` with an `aria-label`, the `scrim` behind it (never blurred). Closes on the handle drag, Escape, scrim click. Focus trapped inside; returns to the trigger on close. Slide entrance, `motion-slow`.

**Toast** · Bottom right, `inverse-bg` ground, `inverse-ink` text, `radius-md`, slide in from bottom, auto-dismiss 4 s, pause on hover, one at a time, `role="status"`. Used for "Copied", "Link copied", and the mock sign-in message.

**Skeleton** · `skeleton` on `bg`, `surface-tint` on `surface`, `radius-sm`, exact height of the content it stands for. No shimmer; skeletons are still. They leave by shrinking (extend reverse).

**PreviewFrame** · The sandboxed iframe that shows a live preview: `sandbox=""`, `src` on the storage origin (or the local `dse serve` base), `title="{component name} preview"` (or `"{name} · {state} preview"`), sized to the preview's recorded width and height, `loading="lazy"` below the fold. A captured preview uses an `img` with the crop and the same alt text instead.

**CaptureViewer** · A full-screen lightbox (a Sheet on phones) showing one page capture image at its viewport width, scrolled so a given bounding box is in view, with that box outlined by a 2 px `ink` rectangle; a Close icon button; Escape closes; focus returns to the opener. `img` alt is "{path} at {viewport} px".

**Meter** · 8 px track `skeleton`, fill `ink`, `radius-pill`; fill extends. Used for the daily budget on the budget-reached state and the dev spend readout in `/catalog`.

**CodeBlock** · `surface-tint` ground, `line-soft` border, `radius-sm`, `code` text, horizontal scroll, a copy button top right (icon-only, `aria-label="Copy"`). Lines never wrap.

**LiveLog** · `inverse-bg` ground, `inverse-ink` text at `code`, timestamps in `inverse-muted`, `radius-lg`, max height 320 with internal scroll, collapsible with a disclosure in the header row; collapsed shows the last line only. Autoscroll only when already at the bottom.

**EmptyState** · Inside a Card: `h3` sentence, `body-sm` `muted` line, one Button. Used by Recent runs with no runs. A category chip on the home page with zero showcase cards is not rendered at all, so the showcase never needs an empty state.

**StateCard** · The blocked-state layout: a 640-wide Card centered with `space-7` padding: `label` eyebrow, `title-sm` title, `body` `muted` explanation, a detail region (CodeBlock, Meter, or a list), one primary action, secondary actions after a `line-soft` rule. Used by every `/state/*` route and the failed, cancelled and not-found run states.

## Home

**UrlForm** · Input `xl` plus the Extract Button `xl`, in a row that wraps on phones (button becomes full width beneath). Below it the caps caption from `docs/design/copy.md`, where "Use your own key" is a button that opens KeyPopover. An "Also include pages" disclosure beneath (Lucide `chevron-down`) reveals a textarea for up to 5 same-host URLs with the caption "Pages the crawler might not find. Same site only, up to 5."

**KeyPopover** · A 360-wide Popover: a password Input with the label from copy, "Save in this browser" Button, and the key caption. A saved key shows "Key saved · Remove". The key is stored in `localStorage` under `dse_key`, wrapped in try/catch.

**ShowcaseCard** · A Card that is a link to a run. Top: a PaletteStrip 64 high, flush with the card's top edge, corners clipped by the card radius. Body: site name (`h3`), domain (`meta` `muted`), the stats line (`caption`), bottom row with the category Tag and the checks line in `caption`. Reveal entrance, staggered in the grid.

**PaletteStrip** · Up to 8 extracted colors as horizontal bands whose widths are proportional to usage (minimum 8% each), no gaps, no labels. Used on ShowcaseCard and RecentRunRow (as a 56 × 40 block).

**ShowcaseGrid** · 3 columns desktop, 2 tablet, 1 phone, `space-5` gap. The showcase content is kept at a multiple of six so neither grid orphans; the grid still handles any count by letting the last row align left.

**CategoryFilter** · A ChipGroup: All, then every category that has at least one card, in the order from copy. Filtering runs exits then entrances per the motion grammar.

## Run page

**RunHeader** · Breadcrumb line (`caption`, rule in `pages.md`), the site as `title`, the meta line (`meta`), where the "{n} pages" segment is a button that opens PageListPopover. Right: Buttons Share (ghost, icon `share`), Run again (ghost, icon `refresh-cw`), Compare (ghost), Export (primary, scrolls to Exports). Phone: buttons wrap under the title, Export first.

**PageListPopover** · A 480-wide Popover (a Sheet on phones) listing every crawled page: path (`meta`), the reason it was chosen (`caption` `muted`), the template group if folded ("docs template, 1 of 212"). Footer line from copy.

**StatStrip** · A Card divided into five cells by `line-soft` rules: Colors, Type styles, Spacing steps, Components, Checks passed ("118 of 132", where 132 is the applicable count). Numbers `stat`, labels `label` `muted`. Numbers count in; cells extend in a stagger. Phone: a 2-column grid, the fifth cell spanning both columns.

**PaletteRow** · `label` "Palette" then up to 8 Swatch `xl` with hex and usage caption. Swatches extend in a stagger. Phone: 4 per row.

**Swatch** · Sizes: `xl` 96 high fluid width with `radius-md` and `shadow-swatch`; `token` 96 wide × 48 high with `radius-sm` (the width carries the hex and usage caption beneath, D-037); `mini` 36 × 36 with `radius-sm`; `strip` (used by PaletteStrip). Near-white values get the inner `line-soft` border. Below `xl` and `token`: hex (`hex`) and a usage caption ("navy · 412 uses"). Every Swatch except `strip` is a button that opens TokenPopover.

**TokenPopover** · The provenance of a token (D-008): value, name, usage count, the pages it appears on with counts, the raw values it absorbed, and for colors the contrast ratios of the text pairs it is used in. A 360-wide Popover (a Sheet on phones).

**DriftHeadline** · A Card on `inverse-bg`: the headline sentence (`drift`, `inverse-ink`), a supporting line (`body-sm`, `inverse-muted`), and an `inverse` Button "Read the drift report" that scrolls to Drift. Wipe entrance for the sentence. Phone: stacks, button full width.

**TokenGroup** · Inside the Color card: a `label` group name over a wrapping row of Swatch `token`. Neutral uses Swatch `mini` with hex only when the count exceeds 8.

**TypeScaleRow** · Grid: a 112-wide mono spec cell ("56 / 64 · 700"), then the style rendered at its own size, weight, family and line height, in `ink`, showing its role label from copy as the sample. Below the list, "Show all {n} styles" when more than 8. Rows wipe in.

**SpacingBar** · A mono value cell (right aligned, 28 wide) and a 12-high `ink` bar with a 2 px radius (the one radius that is not a token). Bars are scaled so the largest step fills the available width and every bar is at least 4 px; the value cell carries the number, so the bar is proportion, not measurement. Bars extend in a stagger. Off-grid values show a Lucide `triangle-alert` button after the bar that opens a Popover with "Off the {base} px grid" and the pages it appears on.

**RadiusSample** · 44 × 44 outlined boxes (2 px `ink` border) at each radius with the value beneath in `hex`.

**ShadowSample** · 44 × 44 `surface` boxes carrying each extracted shadow, labeled sm, md, lg (or the site's own names if they could be inferred).

**ComponentFilter** · A ChipGroup by type group with counts, from copy. Groups with zero are omitted.

**ComponentCard** · A Card that is a link to the component. Preview region 152 high on `surface-tint` with the component's default-state preview centered (live or captured, per `docs/specs/preview-fidelity.md`), a `line-soft` rule below. Body: name (`h3`) left and CheckBadge right; the source line (`caption` `muted`) from copy; StatesStrip; a wrapping row of up to 4 Tag tokens. Reveal entrance. A captured preview shows a `tag` "Captured" at the preview's top right.

**ComponentGrid** · 3 / 2 / 1 columns, `space-5` gap, 6 shown by default with "Show all {n} components" (ghost Button) beneath; showing all reveals the rest in staggers of 12.

**StatesStrip** · A row of state names in `caption` `muted`, each preceded by an 8 px dot: filled `ink` for a captured state, outlined (`muted` 1 px border) for a state the component has but was not captured. Each state is a button that opens a Popover with the state's crop and, for an uncaptured state, the reason. Order follows the state enum.

**CheckBadge** · A button reading "{passed} of {applicable}" in `caption` weight 600 with a Lucide `check` when every applicable check passes, or `x` when any fails. `ink` both ways. Opens a Popover listing each check with its status and detail; the same list is the panel's Checks section.

**ChecksSummary** · The three-cell StatStrip variant: Passed, Failed, Applicable, with the caption "of {components} components × up to 5 checks". Followed by the disclaimer sentence from copy.

**ChecksTable** · Columns: Check, What it measures, Passed (mono "38 of 46"), Failing (component names with the measured detail, truncated to 3 plus "· {n} more" as a button that opens a Popover listing every failing component for that check, read from `components[].checks` rather than the truncated `byCheck` list). Rows draw their rule then wipe.

**DriftNumbers** · Up to three Cards in a row: a before number, the arrow, an after number in `stat`, with the words between in `drift-sub` `muted`, and a `caption` explanation. Numbers count. Phone: stacked.

**DriftProposal** · A two-column Card: left "Current · {n} grays" with a Swatch `mini` row and the spread caption from copy; right "Proposed · {m} grays" as rows of Swatch `mini`, token name (`hex`), and the absorb line (`caption` `muted`); footer caption from copy. Phone: stacks.

**EvidenceTable** · Columns from copy. Mono values. Same row motion as ChecksTable.

**VariantCollapseList** · For variant and type merges: each row shows the two variants side by side as previews and the delta in words.

**ExportCard** · A Card: name (`h3`), file name and size (`meta` `muted`), a `sm` ghost Button "Download" or "Copy prompt". The MCP card spans the full width with a CodeBlock holding the install line and a caption listing the tools. Above the grid: the set toggle (a two-Chip ChipGroup "Proposed set" / "Raw extraction") on the left and a `sm` ghost Button "Download all" on the right.

**SharePopover** · Opened by Share: the run URL in a read-only Input with a Copy button, and "Copy as markdown".

## In-progress run

**StageRail** · A Card holding seven stages in a row: a ring (20 px: filled `ink` with a check for done, dashed `ink` border for running, `line-strong` border for pending) and a label (`label` weight 600 for done and running, `muted` for pending) with a live count where known. A hairline connector draws between rings as stages complete. The stage-to-ring mapping is in `pages.md`. Phone: wraps to two rows.

**PagesCard** · The list of selected pages with reasons, filling as discovery completes, same rows as PageListPopover.

**RegionSkeleton** · The skeleton for each run page region at its real height: palette (8 swatches at 96 high), type (8 rows), spacing (9 bars), components (the filter row, 6 cards in two rows at desktop, the Show all button), checks (summary plus 5 rows), drift (3 numbers), exports (the download row, 6 cards plus the MCP card). Heights are the clean fixture's at 1440, the typical result, so nothing below a region moves when it fills; drift varies with what a site gets wrong and animates its height (D-080).

## Component panel and page

**ComponentPanel** · 560 wide (480 tablet) from the right, full height, `surface`, `line-soft` left border, `shadow-panel`, internal scroll. Header: eyebrow (`label` `muted`: "Buttons · 1 of 6"), name (`h2`), icon buttons Previous, Next, Open as page (Lucide `external-link`), Close. Body sections in order:

1. **Variants** · ChipGroup of variant names and a preview ground (`surface-tint`, `radius-lg`, `space-6` padding) showing the selected variant's default state at 1:1. Caption at right: the fidelity caption from copy.
2. **Source** (D-008; the UI name for provenance) · The source crop with the component outlined by a 2 px `ink` rectangle. The crop is the element's bounding box plus 16 px on every side, never smaller than 320 × 240 CSS px, scaled to fit the panel width. Beneath: the page path as a link to the full capture, the viewport, the CSS selector in `code`, and the page list with a "{n} more" button that expands it. A "Show on page" Button opens the CaptureViewer: a full-screen lightbox (Sheet on phones) showing the page capture image for that viewport, scrolled so the component is in view, with the component outlined by a 2 px `ink` rectangle and a Close button; Escape closes it.
3. **States** · A 5-column grid of the captured states rendered (live) or cropped (captured), each labeled in `caption`. Missing states are listed after with reasons.
4. **Checks** · Rows: check name left, result right with the detail string from `docs/specs/checks.md`. Rows for other variants that fail are listed after a rule with the variant name in `muted`.
5. **Tokens used** · Tag row; each opens TokenPopover. Values that map to no token are listed after a rule as "Unmapped" with the raw value in `hex`.
6. **Code** · Tabs HTML, CSS, and Tailwind (the Tailwind tab only when the run's framework hint is `tailwind`) over a CodeBlock. The HTML is the sanitized extracted markup; the CSS is the extracted declarations with token variables substituted where a value maps (the component's own rules, no preview scaffolding; colors, space steps in padding, margin and gap, radius steps and whole shadows, named as `tokens.css` names them, D-069).
7. Actions: primary "Copy prompt for this component", ghost "Copy code".
8. Footer caption from copy.

Phone: a Sheet at 92% height with the same sections, the states grid at 3 columns.

**ComponentPage** · `/r/{id}/c/{componentId}`: the same content as the panel laid out as a page at 760 max width with the breadcrumb "{host} / Components / {name}", so a component has a share link. The panel offers "Open as page".

## Compare

**CompareModeToggle** · A two-segment control (`role="radiogroup"`): "Two runs of one site" / "Two sites". `line-strong` border, selected segment `ink` ground, `inverse-ink` text.

**CompareColumns** · Two Cards side by side labeled per copy: site, run id (`meta`, the full id), date, pages, viewports. The After card has an `ink` border.

**DeltaStrip** · The StatStrip variant with "38 → 31" pairs and a caption with the delta in words. Numbers count.

**TokenDiff** · Three Cards: Added (swatches with name and where), Removed (a swatch row and a caption), Unchanged (a sentence).

**ChangeTable** · Columns from copy; the Change column holds a Pill: `solid` New, `soft` Changed or Removed.

Phone: Compare renders the two CompareColumns stacked, then a StateCard-style notice from copy with the two run links. Nothing else.

## Recent runs

**RecentRunRow** · A grid row: PaletteStrip block 56 × 40 (a dashed `line-strong` empty block for runs with no palette), site (link, `h3` weight 600) with the full run id and page count (`meta`), the result line (`caption`), when (`caption`), a status Pill (`solid` Complete; `soft` Running, Blocked, Failed, Cancelled) and a `sm` ghost Button: "Compare" for complete runs, "Details" for blocked ones, none for running, failed or cancelled. The row lays out by the width of its list (D-059): narrow lists put the status Pill and the button on a last line under the result, so the host keeps the full width.

## How it works

**PipelineStep** · A numbered ring (36 px, 1 px `ink` border, mono number), `h3` step name, `body-sm` `muted` description, and a Pill at right: `soft` "Deterministic" or `inverse` "Model · Haiku" / "Model · Sonnet". Rules between steps draw as they enter the viewport.

**EvalTable** · Columns: Fixture site, What it proves, Tokens (mono "precision 1.00 · recall 0.98"), Components (the same shape), Live previews (mono "38 of 46"). Values come from `fixtures/results.json`, never typed by hand. Lays out by its own width (D-064): stacked below 560 px, each measured cell labeled with its column name; a value wraps only at its interpunct.

## Flagged v2 surfaces (BILLING_ENABLED only)

Built in P12, rendered in `/catalog` always (so they are reviewed), rendered in the app only when the flag is on. Each carries `data-testid="v2-surface"` so the flag-off test can assert their absence.

**PricingSection** · Three Cards in a row (Free, Pro, Team; the runs and pages lines read from entitlements, D-060): plan name (`h3`), a price line (`stat` for the number, `label` for the period, set beneath the number in every card when a card is under 280 px wide, D-062; placeholders "[PRICE]" until set), a feature list with Lucide `check` marks, a Button (Free: "Current plan" disabled; Pro and Team: "Choose Pro" / "Choose Team" primary, which open the SignInSheet when there is no session and the adapter's checkout otherwise). Phone: stacked. A caption beneath: "Prices are placeholders until plans launch."

**PlanBadge** · A Pill `soft` with the plan name, shown in TopNav next to the account menu.

**AccountMenu** · A TopNav button (Lucide `user`) opening a Popover: email, plan with PlanBadge, "Billing", "Sign out". Hidden when the viewer has no user. Without a user, TopNav shows a `sm` ghost Button "Sign in" that opens the SignInSheet instead (D-060); v1's mock adapter never has a user, so the menu and the badge are seen only in the catalog.

**SignInSheet** · A Sheet with an email Input and "Send a sign-in link" Button plus "Continue with GitHub" ghost Button; both are wired to the auth adapter, which in v1 is a mock that shows the Toast "Sign-in is not enabled yet."

**BillingPage** · `/account/billing`: current plan, usage this period (runs, pages, a Meter against the plan's cap), "Manage subscription" Button (opens the billing adapter's portal URL; the mock returns `#`), invoices list (empty state in v1). Three Cards at 760 max width under a `title`. Without a session it shows the visitor's free plan, the runs this visitor started since the budget day began with their captured pages, and "Manage subscription" disabled (D-060).

**UpgradePrompt** · A StateCard variant (a `surface-tint` block with a `line` border inside the StateCard, above the key form, since Cards do not nest, D-060) used on the budget-reached and run-limit states when the flag is on: "Pro runs skip the queue and the daily budget." with a "See plans" Button. When the flag is off, those states show the BYO key form instead.
