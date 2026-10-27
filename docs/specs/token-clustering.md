# Token clustering

Stage `tokens`, with substages `tokens:palette`, `tokens:type`, `tokens:space` (radius, shadow and breakpoints land with `space`) and `tokens:motion` (durations, easings and keyframes, `motion-capture.md`). Raw computed values from every capture become a small set of named tokens with usage counts and provenance. All of it is deterministic except naming, which has a deterministic fallback.

## Site variables

Every custom property declared in matched CSS on `:root`, `html`, `body`, a `[data-theme]`, `[data-mode]`, `.dark`, `.light` or `.theme-*` selector, or on an element candidate, that is referenced by at least one kept declaration, is collected: name, declared value, value resolved with `getComputedStyle(documentElement).getPropertyValue` (and on the element for component-scoped ones), the scope, usage (count of `var()` references), pages. Kind is inferred from the resolved value (`color` for a color, `space` for a px length used in padding, margin or gap, `radius` for one used in `border-radius`, `type` for a font size, `shadow`, `duration`, `easing`, `breakpoint` for a length whose name says breakpoint, screen or `bp`), else omitted. Minified or hashed names (`--sx-1fj52yw`, `--x---icon-default-color`, any name whose last segment is 6 or more characters of mixed letters and digits, or that contains `--` twice) are kept in the list with `hashed: true` and never used as token names; so are Tailwind's internal `--tw-*` variables (D-089). The list is capped at 400 entries by usage.

**The site's name wins (D-082).** A token whose value equals the resolved value of a site variable of its kind whose name is not hashed (within ΔE 1 for colors, exactly for every other kind) takes that variable's name, and `siteName` records the full variable name. The name drops the leading `--` and the kind's export prefix (`color-` or `clr-`, `space-` or `spacing-`, `radius-`, `shadow-`, `breakpoint-`), and for type a trailing `-size` or `-font-size` (`--color-text-tertiary` → `text-tertiary`, `--text-small-size` → `text-small`, `--radius-rounded` → `rounded`, written `--radius-rounded` by the exports); durations and easings keep the whole name (`--ease-out-quart` → `ease-out-quart`) (D-089). Several variables resolving to one token: the one with the highest usage names the token and the others are listed with `siteVariables[].mapsTo`. This runs before the deterministic names, the model never renames a site-named token, and a generated name equal to a site name of its kind takes the collision letter.

## Colors

**Collect.** From every snapshot, for every visible element: `color` (weight: 1 per element, use `text`), `background-color` (use `background`; weight 1, plus 1 per 10,000 px² of area capped at 4, so large grounds count more than a dot), border colors (use `border`), `outline-color` on focus states, `box-shadow` colors, gradient stops parsed from `background-image` (use `background`), `fill` and `stroke` on `svg` roots (use `other`). Skip fully transparent values. A color with alpha below 1 is composited over its effective background for contrast purposes and becomes an overlay (below), never a palette cluster (D-086).

**Convert** every value to OKLCH. Keep the hex (uppercase, 8-digit when alpha < 1).

**Cluster.** Sort raw values by weight descending. For each opaque value, join the first existing cluster whose representative is within ΔE (OKLab Euclidean distance × 100, threshold 2.3); else start a cluster. The representative is the member with the highest weight (re-evaluated after clustering). Record every raw member with its count. The threshold is a constant in `pipeline/src/tokens/constants.ts` and is reported in the Tokens caption.

**Classify.**

- `neutral`: OKLCH chroma < 0.03.
- `semantic`: a non-neutral cluster whose uses are at least 70% on elements whose class, role or ancestor class matches `/(success|ok|positive|error|danger|invalid|warning|warn|caution|info|notice|alert|badge|status|toast)/`, or that carry `aria-invalid="true"`, or that sit in the error message an invalid field names in `aria-describedby` or `aria-errormessage`; an ancestor's role counts like an ancestor's class (D-049, D-051), mapped to a role by hue: green 120 to 170 → `success`, yellow to orange 40 to 95 → `warning`, red 0 to 40 or 330 to 360 → `danger`, blue 200 to 280 → `info`. If the hue does not match any band the cluster stays `brand`.
- `brand`: everything else. The brand group is ordered by weight.

**Name.** A site variable's name first (Site variables above). Then deterministic names: neutrals become `gray-{step}` where step is derived from lightness (L ≥ 0.97 → 50, ≥ 0.93 → 100, ≥ 0.87 → 200, ≥ 0.78 → 300, ≥ 0.66 → 400, ≥ 0.55 → 500, ≥ 0.44 → 600, ≥ 0.34 → 700, ≥ 0.24 → 800, ≥ 0.15 → 900, else 950), de-duplicated by appending a letter. Chromatic clusters become `{hueWord}-{step}` with the same lightness steps and hue words from 12 bands of OKLCH hue, each starting at `pink` 0, `red` 15, `orange` 40, `amber` 65, `yellow` 90, `lime` 115, `green` 135, `teal` 165, `cyan` 200, `blue` 230, `indigo` 275, `violet` 295, `pink` 325. Semantic clusters are named by role, or `{role}-{step}` when several clusters share a role. Any name that collides takes a letter (`gray-100b`, D-051). Then the Haiku naming pass may rename within these rules (see `model-calls.md`): it receives the clusters with their roles, hues, and usage contexts and returns names that must match `/^[a-z]+(-[a-z0-9]+)*$/`, have at most three parts, be unique, and keep the hue word, `gray` for a neutral, or the role as one part; anything else is rejected, name by name, and the deterministic name stands.

**Overlays (D-086).** A raw color with alpha below 1 is never a palette cluster. It becomes an overlay: the base is the nearest palette token by hue and lightness with the alpha ignored (or `white` or `black` when the opaque part is within ΔE 2 of them), alpha is rounded to the nearest 2%. Name: `{base}-{alpha}` (`white-8`, `gray-950-60`, `indigo-500-40`). Raw values with one base and one rounded alpha are one overlay. Overlays have usage, pages and raw values like tokens and are exported in their own group (`--overlay-white-8: rgb(255 255 255 / 8%)`). An overlay with a site name uses it like any token. Overlays do not count toward the gray or brand counts in drift.

**Provenance.** Each token lists pages with counts and the raw values with counts; `usage` is the number of uses (text, background, border and other), while weight only orders clustering. Contrast pairs: for every text node with an opaque color (translucent text is left to the checks stage, which composites it, D-089), the pair (text color token, effective background token) with the ratio and where it was seen (the page path); stored on the text token, the worst ratio kept per background token. The background is the opaque effective background mapped to the nearest opaque token; text over a gradient or image is left to the checks stage, which samples the crop (D-051). This feeds the checks and the drift proposal.

Caps: 80 color tokens. Beyond that, the lowest-weight clusters merge into their nearest neighbor and the cap is logged.

## Type

**Collect.** For every visible element with direct text at a font size and line height above zero (text at zero is hidden, D-072), the tuple (resolved family, size px, weight, line-height px, letter-spacing px, text-transform). The resolved family is the first family in the computed `font-family` stack for which `document.fonts.check(…)` is true, else the first family. Record `fallbackStack`.

**Cluster.** Exact tuples, with line height rounded to the nearest 0.5 px and letter spacing to 0.05 px. Count elements. Drop tuples with fewer than 3 elements unless the element is a heading (`h1` to `h6`) or the tuple is the largest size on a page (a page's own snapshot, not a menu it revealed, D-051).

**Role (D-087).** Order non-monospace tuples by size descending. `body` is the most common tuple by element count among `p`, `li`, `td`, `span`, `div` text nodes. Every other tuple's role comes from its size relative to body: ≥ 2.5× `display`, ≥ 1.75× `title`, ≥ 1.35× `heading`, ≥ 1.1× `subheading`; within 1 px of body with weight ≥ 500 `label`; 1 to 2 px smaller with weight 400 `body-sm`; 3 px or more smaller with weight 400 `caption`; any tuple with `text-transform: uppercase` and letter-spacing ≥ 0.04 em and size ≤ body `eyebrow`; monospace family `code`; anything left `text`. Names are the role; when several tuples map to one role they are ordered by size then weight and the second and later get a word, not a number: the heavier of two gets `-strong`, the lighter `-soft`, a larger size `-lg`, a smaller `-sm`, a wider tracking `-wide`; only when two tuples differ in nothing nameable are they merged. Each later tuple takes the first word that applies against the first tuple of the role, in that order, and a name still taken takes the next word that applies (D-089). `text` tokens are named `text-{size}` (`text-18`). The tags a tuple was found on are recorded in `tags` and shown as provenance, never used for naming; `uppercase` records `text-transform: uppercase`. A site variable of kind `type` names the token instead (Site variables above).

Families found are listed in the order: sans body family, display family if different, monospace. Whether each web font actually loaded is recorded (`loaded: boolean`) and surfaced as a caption when false, using the font-not-loaded caption in `docs/design/copy.md`.

Cap: 24 type tokens, by element count.

## Spacing

**Collect.** `padding-*`, `margin-*` (positive values only), `gap`, `row-gap`, `column-gap` from visible elements, in px, 1 to 200. Weight 1 per occurrence. Values on `html`, `body`, and full-width layout containers (width ≥ 90% of viewport) are excluded from the step list but counted as `contexts.layout`, and so are the equal left and right margins of an element centered in its parent (`margin: auto` computes to pixels, D-045).

**Base grid.** The base is 8 if at least 85% of weighted values are divisible by 8, else 4 if 85% are divisible by 4, else 4 with a note (8 is tried first because every multiple of 8 is a multiple of 4, D-051). Reported as "{base} px base".

**Steps.** The values with the highest weights, up to 12, that are on the grid, sorted ascending. A value seen only in layout contexts has no weight and is never a step. Off-grid values with weight above 2% of total are kept as steps flagged `onGrid: false` and shown with the warning mark. Everything else is evidence for drift.

## Radius

Distinct `border-radius` values on elements that have a visible border, background or shadow, counted. A value ≥ 999 px or ≥ half the element's height is `pill`. Up to 6 tokens by count.

## Shadows

Distinct normalized `box-shadow` strings (whitespace and color format normalized, multiple shadows kept as one value) on visible elements, counted. Cluster by the largest blur radius into up to 3 buckets named by increasing blur: `sm`, `md`, `lg`; a site with more distinct shadows has its smallest-usage ones merged into the nearest bucket and the sprawl is reported by drift. If the site names a shadow, the site's name is used (Site variables above, which replaces the shadow-only rule of D-051).

## Breakpoints

From every stylesheet reachable in matched CSS and `document.styleSheets` (same-origin or CORS-readable): `min-width` and `max-width` values in media queries, counted; the top 6 by count, ascending, in px (em values converted at 16). A value that is exactly one more than another breakpoint (1281 next to 1280) is its max-width twin: it is folded into the lower one as `maxTwin` and not exported as a token.

## Motion

Substage `tokens:motion`, after `tokens:space`: durations, easings and keyframes, by the rules in `motion-capture.md` (Motion tokens). Durations and easings are token kinds and take site names like every kind.

## Raw counts

`rawCounts` records how many distinct raw values each kind started from, for the Tokens caption.

## Events

`tokens · colors 31 clustered from 212 raw values · ΔE threshold 2.3`, `tokens · type 14 styles · Inter, JetBrains Mono · all loaded`, `tokens · spacing 9 steps · 4 px base · 2 off grid`, `tokens · motion 5 durations · 3 easings · 4 keyframes`, `tokens · 14 site variables named tokens · 31 overlays`.

## Tests

- Known inputs: a synthetic snapshot with 20 colors including 6 within ΔE 2 of each other must yield 15 clusters with the right representatives and counts.
- Neutral and semantic classification on crafted values.
- Naming fallback uniqueness.
- Spacing base inference on 4- and 8-grid sets and on a noisy set.
- Site-variable naming beats generated naming on a crafted stylesheet; hashed names are never used; overlays split from the palette with the right base and alpha; type roles on the fixture tuples match `expected.json` and no token is named `other`; 1281 folds into 1280.
- Fixture evals: token precision and recall against `expected.json` with ΔE ≤ 2 matching for colors and exact matching for the other kinds.
