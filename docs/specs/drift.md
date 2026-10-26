# Drift

Stage `drift`. Where a site's system is leaking: tokens that are too close to be intentional, values off the grid, variants that differ by a pixel. Then a proposed clean set that never lowers a passing contrast ratio, and a narrative that only phrases what was computed.

## Findings

**Near-duplicate colors.** Pairs of color tokens in the same group (neutral with neutral, brand with brand within the same hue band) whose alphas match within 0.05 (a translucent shadow color is not a duplicate of its opaque base, D-048) and whose representatives are within ΔE 6 (neutrals) or ΔE 8 (chromatic). The clustering threshold (2.3) already merged what is imperceptible; this finds what is perceptible but pointless. Each finding: the two tokens, the ΔE, the pages where both appear, and both usage counts.

**Raw spread.** For each color token, the number of raw values it absorbed. Reported in the Tokens caption and as evidence rows when a token absorbed 4 or more raw values ("#6B6B6B written 6 ways"). Raw spread is evidence only: it is never a finding, never changes the numbers or the headline, and does not count as drift on a fixture that expects none.

**Off-grid spacing.** Space tokens with `onGrid: false`, with pages and usage. Plus near-steps: two on-grid steps within 4 px of each other that are both used under 5% of the time.

**Variant collapse.** Within a component, variants whose delta is only: padding ±2 px, radius ±2 px, font size ±1 px, or a color within ΔE 3. Each finding: the component, the variant to keep (highest usage), the variants to merge, the delta in words.

**Type near-duplicates.** Type tokens with the same family and weight whose size differs by ≤ 1 px or whose line height differs by ≤ 2 px at the same size.

**Shadow and radius sprawl.** More than 4 radius tokens, or more than 3 distinct shadows found (token clustering keeps 3 buckets and records how many it merged). Reported as evidence rows of kind `sprawl` ("5 radii: 4, 6, 8, 10, 12", "7 shadows merged into 3"); it has no number card and never becomes the headline.

## The proposed set

**Neutrals.** Target count N: the smallest of 5, 7 or 9 such that every current neutral token maps to a proposed step within ΔE 8. Candidate steps are chosen by 1-dimensional k-means on OKLCH lightness weighted by usage, seeded evenly across the observed lightness range. Each proposed step takes the representative value of the most-used token it absorbs (so the proposal reuses real values, never invents). Constraint check: for every contrast pair recorded on the tokens (`contrastPairs`), compute the ratio with both colors mapped to their proposals; if any pair that passes today (at today's token values: a raw pair can pass while its clustered tokens do not, and no proposal can keep that one, D-067) would fall below its threshold, move the offending step toward the needed lightness in 0.01 L increments until it passes, and if that pushes it within ΔE 2.3 of a neighbor, increase N and retry. `contrastKept` is true only when every pair holds.

**Brand.** Keep tokens with usage ≥ 2% of chromatic usage; map lower-usage tokens to the nearest kept token within ΔE 8, else keep them. Semantic tokens are always kept.

**Spacing.** The on-grid steps, with each off-grid value mapped to the nearest step (rounded to the base grid).

**Type.** Merge near-duplicates into the more-used token.

Exports use the proposed set by default (`?set=proposed`); the raw set is available (`?set=raw`). Component code always shows raw values with proposed token names in comments only where a value maps.

## Numbers and headline

`numbers` holds up to three `{kind, before, after, caption}` entries ordered by relative reduction, from the kinds `grays` (neutral token count before and after), `variants` (total variants across all components before and after collapses, with the count of affected components), `spacing` (step count before and after, with the off-grid count), `type` (type token count before and after merges). A kind with no reduction is omitted. The `headline` is the first entry rendered with its sentence pattern from `docs/design/copy.md`; `supporting` holds the next two as sentences following copy rule 9. If nothing drifts (a clean site), the headline uses the nothing-to-collapse pattern and `numbers` is empty.

Captions are generated from these templates with the computed facts, never free text (the values each placeholder takes are in D-055):

- grays: `{k} are within ΔE {d} of a neighbor. Nobody can tell them apart.`
- variants: `{k} differ only by {delta words}.` (e.g. `Three differ only by 1 px of padding or a 2 px radius.`)
- spacing: `{k} sit off the {base} px grid: {values}, on {pages}.`
- type: `{k} differ by 1 px or less in size or line height.`

## Evidence

Rows for every finding, in the order: color near-duplicates by ΔE ascending (kind `color`), variant collapses (`variant`), off-grid spacing (`spacing`), type near-duplicates (`type`), sprawl (`sprawl`), then raw-spread evidence (kind `color`, flagged `evidenceOnly`). Each row: `a`, `b`, `delta` (a string such as `ΔE 1.2`, `radius 8 vs 6`, `2 px`), `kind`, `pages`, `usesA`, `usesB`. Capped at 40 rows in the document; the export includes all.

## Narrative and intro (Sonnet, one call)

One call in this stage produces two fields: `drift.narrative` (four to six sentences: what leaks, what the proposal does, and one sentence on what it keeps safe) and `exports.designSystemIntro` (two sentences introducing the extracted system for design-system.md). Input: the findings, numbers, proposal and run stats as JSON, plus the voice rules from `docs/design/copy.md`. Validation on each field: every number in the output must appear in the input facts (a regex extracts integers and decimals from the text and checks each against a set built from the facts); any failure, an em dash, a forbidden word from copy rule 3, or any scolding word (`sloppy`, `messy`, `inconsistent`, `poor`, `bad`, `fail`), rejects that field and its template text is used instead (templates in `model-calls.md`). The log line says which was used for each.

## Events

`drift · 14 grays → 5 · 6 variants → 3 · 9 spacing → 7 · contrast kept`, `drift · narrative by model` or `drift · narrative by template`.

## Tests

- Proposal on a crafted neutral set with contrast pairs that would break at N=5 and hold at N=7.
- Variant collapse on crafted variants at the tolerance edges.
- Narrative validator with a response containing an invented number (rejected) and a clean one (accepted).
- Fixture evals: the messy fixture plants known near-duplicates, off-grid values and a collapsible variant; recall of planted findings must be 100%, and the clean fixture must produce zero findings (no false drift; raw-spread evidence rows do not count).
