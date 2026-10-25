# Token clustering

Stage `tokens`, with substages `tokens:palette`, `tokens:type`, `tokens:space` (radius, shadow and breakpoints land with `space`). Raw computed values from every capture become a small set of named tokens with usage counts and provenance. All of it is deterministic except naming, which has a deterministic fallback.

## Colors

**Collect.** From every snapshot, for every visible element: `color` (weight: 1 per element, use `text`), `background-color` (use `background`; weight 1, plus 1 per 10,000 px² of area capped at 4, so large grounds count more than a dot), border colors (use `border`), `outline-color` on focus states, `box-shadow` colors, gradient stops parsed from `background-image` (use `background`), `fill` and `stroke` on `svg` roots (use `other`). Skip fully transparent values. Keep alpha: a color with alpha < 1 is composited over its effective background for contrast purposes but kept as its own raw value.

**Convert** every value to OKLCH. Keep the hex (uppercase, 8-digit when alpha < 1).

**Cluster.** Sort raw values by weight descending. For each, join the first existing cluster whose representative is within ΔE (OKLab Euclidean distance × 100, threshold 2.3) and whose alpha matches within 0.05; else start a cluster. The representative is the member with the highest weight (re-evaluated after clustering). Record every raw member with its count. The threshold is a constant in `pipeline/src/tokens/constants.ts` and is reported in the Tokens caption.

**Classify.**

- `neutral`: OKLCH chroma < 0.03.
- `semantic`: a non-neutral cluster whose uses are at least 70% on elements whose class, role or ancestor class matches `/(success|ok|positive|error|danger|invalid|warning|warn|caution|info|notice|alert|badge|status|toast)/`, mapped to a role by hue: green 120 to 170 → `success`, yellow to orange 40 to 95 → `warning`, red 0 to 40 or 330 to 360 → `danger`, blue 200 to 280 → `info`. If the hue does not match any band the cluster stays `brand`.
- `brand`: everything else. The brand group is ordered by weight.

**Name.** Deterministic names first: neutrals become `gray-{step}` where step is derived from lightness (L ≥ 0.97 → 50, ≥ 0.93 → 100, ≥ 0.87 → 200, ≥ 0.78 → 300, ≥ 0.66 → 400, ≥ 0.55 → 500, ≥ 0.44 → 600, ≥ 0.34 → 700, ≥ 0.24 → 800, ≥ 0.15 → 900, else 950), de-duplicated by appending a letter. Chromatic clusters become `{hueWord}-{step}` with hue words from 12 bands (`red`, `orange`, `amber`, `yellow`, `lime`, `green`, `teal`, `cyan`, `blue`, `indigo`, `violet`, `pink`). Semantic clusters are named by role. Then the Haiku naming pass may rename within these rules (see `model-calls.md`): it receives the clusters with their roles, hues, and usage contexts and returns names that must match `/^[a-z]+(-[a-z0-9]+)*$/`, be unique, and keep the hue word or role; anything else is rejected and the deterministic name stands.

**Provenance.** Each token lists pages with counts and the raw values with counts. Contrast pairs: for every text node, the pair (text color token, effective background token) with the ratio and where it was seen; stored on the text token. This feeds the checks and the drift proposal.

Caps: 80 color tokens. Beyond that, the lowest-weight clusters merge into their nearest neighbor and the cap is logged.

## Type

**Collect.** For every visible element with direct text, the tuple (resolved family, size px, weight, line-height px, letter-spacing px, text-transform). The resolved family is the first family in the computed `font-family` stack for which `document.fonts.check(…)` is true, else the first family. Record `fallbackStack`.

**Cluster.** Exact tuples, with line height rounded to the nearest 0.5 px and letter spacing to 0.05 px. Count elements. Drop tuples with fewer than 3 elements unless the element is a heading (`h1` to `h6`) or the tuple is the largest size on a page.

**Role.** Order clusters by size descending. The largest on the home page with weight ≥ 600 is `display`; tuples attached to `h1`..`h4` map to `h1`..`h4` by the most common tag; the most common tuple by element count among `p`, `li`, `td`, `span` is `body`; a tuple 1 to 2 px smaller than body with weight 400 is `body-sm`; a tuple 1 to 3 px smaller than body with weight ≥ 500 is `label`; a tuple 3 px or more smaller than body with weight 400 is `caption`; any tuple whose family is monospace is `code`; everything else `other`. Names are the role, with `-2`, `-3` suffixes when several map to one role.

Families found are listed in the order: sans body family, display family if different, monospace. Whether each web font actually loaded is recorded (`loaded: boolean`) and surfaced as a caption when false, using the font-not-loaded caption in `docs/design/copy.md`.

Cap: 24 type tokens, by element count.

## Spacing

**Collect.** `padding-*`, `margin-*` (positive values only), `gap`, `row-gap`, `column-gap` from visible elements, in px, 1 to 200. Weight 1 per occurrence. Values on `html`, `body`, and full-width layout containers (width ≥ 90% of viewport) are excluded from the step list but counted as `contexts.layout`.

**Base grid.** The base is 4 if at least 85% of weighted values are divisible by 4, else 8 if 85% are divisible by 8, else 4 with a note. Reported as "{base} px base".

**Steps.** The values with the highest weights, up to 12, that are on the grid, sorted ascending. Off-grid values with weight above 2% of total are kept as steps flagged `onGrid: false` and shown with the warning mark. Everything else is evidence for drift.

## Radius

Distinct `border-radius` values on elements that have a visible border, background or shadow, counted. A value ≥ 999 px or ≥ half the element's height is `pill`. Up to 6 tokens by count.

## Shadows

Distinct normalized `box-shadow` strings (whitespace and color format normalized, multiple shadows kept as one value) on visible elements, counted. Cluster by the largest blur radius into up to 3 buckets named by increasing blur: `sm`, `md`, `lg`; a site with more distinct shadows has its smallest-usage ones merged into the nearest bucket and the sprawl is reported by drift. If the site's own CSS variables name them (`--shadow-sm` found in matched CSS), those names are used instead.

## Breakpoints

From every stylesheet reachable in matched CSS and `document.styleSheets` (same-origin or CORS-readable): `min-width` and `max-width` values in media queries, counted; the top 6 by count, ascending, in px (em values converted at 16).

## Raw counts

`rawCounts` records how many distinct raw values each kind started from, for the Tokens caption.

## Events

`tokens · colors 31 clustered from 212 raw values · ΔE threshold 2.3`, `tokens · type 14 styles · Inter, JetBrains Mono · all loaded`, `tokens · spacing 9 steps · 4 px base · 2 off grid`.

## Tests

- Known inputs: a synthetic snapshot with 20 colors including 6 within ΔE 2 of each other must yield 15 clusters with the right representatives and counts.
- Neutral and semantic classification on crafted values.
- Naming fallback uniqueness.
- Spacing base inference on 4- and 8-grid sets and on a noisy set.
- Fixture evals: token precision and recall against `expected.json` with ΔE ≤ 2 matching for colors and exact matching for the other kinds.
