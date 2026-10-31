# Automated checks

Stage `checks`. Five measurements on every component, with exact thresholds, exact wording, and a status of `pass`, `fail` or `na`. These are the measurable subset of WCAG 2.2. The product never uses the forbidden words in `docs/design/copy.md` rule 3; it reports numbers. This document is the single source for every check result detail string; the check names, descriptions, section headings, summary labels and table headers live in `docs/design/copy.md`.

Placeholders: `{ratio}` is already formatted ("5.4:1"); `{w}`, `{h}`, `{px}` and `{shortfall}` are integers in CSS px (`{shortfall}` is 44 minus the measured dimension); `{ground}` is the name of the background token the ring sits against, or its hex when unmapped; `{bgToken}` likewise for text; `{threshold}` is "4.5:1" or "3:1".

## Applicability

A check is `na` when it does not apply, with the detail `Not applicable`, and `na` results are excluded from every count. Counts everywhere are passed of applicable. Each component carries one result per check: its first-seen instance, its variants' representatives and, where the check reads them, its other instances are measured, and the worst result decides, with `variantId` naming the variant when it is not the first-seen one (D-054).

| Check | Applies to |
| --- | --- |
| `contrast` | any component with visible text |
| `focus-visible` | any interactive component (button, link, input, select, textarea, checkbox, radio, toggle, tabs, menu items, pagination links) |
| `tap-target` | interactive components that are not inline text links; measured at the mobile viewport |
| `label` | input, select, textarea, checkbox, radio, toggle, and icon-only buttons and links |
| `reduced-motion` | components with an animation or a hover transition |

## 1 · Contrast AA

For every text node inside the component's first-seen instance (and each variant's representative), except text inside a nested component, which is measured as that component (D-054), compute the foreground color (computed `color`, alpha composited over the effective background) and the effective background: walk ancestors until an opaque `background-color` is found, compositing semi-transparent layers in order. If any layer between is a gradient or image, sample the captured crop instead: take the median of pixels in the text's bounding box after excluding pixels within ΔE 10 of the foreground, and use that as the background.

Ratio: WCAG 2.x relative luminance contrast. Threshold: 4.5:1 for text under 24 px (under 18.66 px when weight ≥ 700), 3:1 at or above. The component's result is its worst text node. `measured: { ratio, fg, bg, size, weight }`. Placeholder text in inputs is measured too (it is text).

Detail strings: pass `{ratio} on {bgToken}` · fail `{ratio} on {bgToken}, needs {threshold}`. `{bgToken}` is the background token's name, or its hex when unmapped.

## 2 · Focus visible

From the `focus` state capture: compare the computed `outline-width`, `outline-style`, `outline-color`, `box-shadow`, `border-color`, and `background-color` to the default state. The indicator is the first of these that changed. Pass when an indicator exists and its contrast against the element's adjacent background is ≥ 3:1 (outline or shadow color vs. the effective background outside the element; for a background change, new vs. old background ≥ 3:1). Fail when nothing changed, or the change is under 3:1, or `outline: none` is set with no other indicator. If the element was not reached by the Tab walk, the result is `fail` with the keyboard detail regardless of styles.

Detail strings: pass `{px} px ring, {ratio} against {ground}` · pass `Background change, {ratio}` · fail `No visible change on focus` · fail `{ratio} ring, needs 3:1` · fail `Not reachable by keyboard`.

## 3 · Tap target

At the mobile viewport, the instance's bounding box must be at least 44 × 44 CSS px. Exempt: links inside a sentence of prose, which are not components anyway. Components with no mobile instance are `na`. An instance flagged `hiddenAtCapture` (a skip link) is measured in its focus state at 390, the state the reader can reach: its box with the width and height its focus delta records; with no focus state that shows it, the result is `na` (D-112).

Detail strings: pass `{w} × {h} at 390 px` · fail `{h} px tall, {shortfall} short` or `{w} px wide, {shortfall} short` (the smaller dimension) · na `Not present at 390 px` · na `Hidden at rest; no focus state`.

## 4 · Label present

A name must exist: for inputs, a `label[for]`, a wrapping `label`, `aria-label`, or `aria-labelledby` resolving to text; `placeholder` alone fails; `title` alone fails. For icon-only buttons and links (no text content, or text under 2 characters): `aria-label`, `aria-labelledby`, a `title`, or visually hidden text (an element with the common sr-only pattern: 1 px clipped).

Detail strings: pass `Label element` · pass `aria-label` (also for a name from `aria-labelledby` or, on an icon-only control, `title`) · pass `Text content` · pass `Visually hidden text` · fail `No name found` · fail `Placeholder only`.

## 5 · Reduced motion

From the reduced-motion probe in `capture`: under `prefers-reduced-motion: reduce`, the component's `animation-name` must be `none` and its hover transition duration 0, or the site's CSS must contain a `prefers-reduced-motion` rule that targets it. Components with no motion are `na`.

Detail strings: pass `Stops under reduced motion` · fail `Animation still runs under reduced motion`.

## Not measured

When a measurement could not be taken (no focus capture because the capture cap was hit, no mobile instance), the check is `na` with detail `Not measured: capture cap` or the na string above. Never a pass.

## Per-component result

A component passes all checks when every applicable check passed; a component with no applicable check is excluded from the ratio (D-096). This is derived from `components[].checks` by `checkCounts` (`apps/web/lib/doc.ts`, and the same counting in the pipeline and the MCP server, one function in `packages/schema`), never stored per component, because `checks` is an array of results. The stored addition is the run-level `stats.componentsPassing: { passed, applicable }`, written with the other stats. The CheckBadge, the `Passing all checks` filter, the stat strip's Components passing cell, the Checks section's opening line, `list_components`' `passedAll` and the exports' `Checks:` line all read this one rule.

## Per-run summary

`checks.summary = { passed, failed, applicable, total }` where `total` is `components × 5` and `applicable` excludes `na`. `checks.byCheck` lists per check: the check id, passed, applicable, and the failing component names with their detail, the worst 8 by measured shortfall; the full list for any check is derived in the app from `components[].checks`, which carries every result. The stat strip's "Checks passed" and the stats column `checksApplicable` use `applicable`.

## Honesty rules

- A pass means the measurement passed. The UI copy never generalizes a pass into a quality claim.
- The disclaimer sentence appears under the checks heading and in `design-system.md` exports.
- The detail strings above and the labels in `docs/design/copy.md` are the only check wording in the product; a test asserts every rendered detail matches one of these templates.

## Events

`checks · 132 applicable · 118 passed · 14 failed`.

## Tests

- Contrast math against the pairs in `docs/design/design-system.md` and the WCAG sample pairs.
- Background compositing with alpha layers and a gradient fallback (uses a crafted crop).
- Focus indicator detection on crafted state diffs including the `outline: none` with box-shadow case.
- Tap target exemptions.
- Name resolution table.
- Fixture evals: each fixture plants known failures (`expected.json` lists them); the eval asserts every planted failure is found and no planted pass is reported as a fail. Accuracy must be 100% on planted cases.
