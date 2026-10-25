# Component detection

Stage `components`. Turns element candidates across pages into components with types, names, variants, states, instances, provenance and token usage. Deterministic clustering first; a model names and types what the rules are unsure about; deterministic merging last. The hardest stage in the pipeline, so its evals are the strictest.

## Component types and groups

```
ComponentType =
  button | link | input | select | textarea | checkbox | radio | toggle | form |
  nav | header | footer | breadcrumb | tabs | pagination | menu |
  card | list-row | hero | section-header |
  badge | tag | alert | toast | empty-state |
  table | code-block |
  modal | tooltip | dropdown |
  avatar | other

ComponentGroup =
  Buttons: button, link
  Inputs: input, select, textarea, checkbox, radio, toggle, form
  Navigation: nav, header, footer, breadcrumb, tabs, pagination, menu
  Cards: card, list-row, hero, section-header
  Feedback: badge, tag, alert, toast, empty-state
  Data: table, code-block
  Overlays: modal, tooltip, dropdown
  Other: avatar, other
```

`link` means a styled link (a button-like or pill-like anchor), never a plain inline text link in prose, which is not a component.

## Element candidates

"Element candidate" here means a DOM element that may be a component; "page candidate" in the crawler means a URL. An element is an element candidate when any rule matches, evaluated on the snapshot:

- `button`, `input` (not hidden), `select`, `textarea`, `a[href]` with button-like styling (padding ≥ 6 px on at least two sides and a background, border or radius; text ≤ 5 words) or with a role of button.
- `nav`, `header`, `footer`, `[role=navigation]`, `[role=banner]`, `[role=contentinfo]`, `[role=tablist]`, `[role=tab]`, `[role=dialog]`, `[role=alert]`, `[role=status]`, `[role=menu]`, `[role=menuitem]`, `[role=tooltip]`, `table`, `pre`, `code` blocks (block-level `code` or `pre`), `[aria-haspopup]`, `[aria-expanded]`.
- Container rule: an element with a visible border, background differing from its parent's effective background, or a box shadow; between 2 and 60 descendants; area between 2,000 and 60% of the viewport area; not the page's main wrapper.
- Inline mark rule: an element with a background or border, text ≤ 3 words, height ≤ 32 px, display inline or inline-flex or inline-block → badge or tag element candidate.
- Image rule: `img` or `svg` with equal width and height ≤ 64 px and `border-radius` ≥ 50% → avatar element candidate.

Element candidates inside other element candidates are kept (a button inside a card is its own component); the containing card's structure records the child's cluster id, not its markup.

## Fingerprint

For each element candidate:

- `tag`, `role`
- `classTokens`: class names with hashed segments removed (`/[0-9a-f]{5,}/`, `css-…`, `sc-…`, leading `_`), lowercased, sorted, capped at 8
- `structure`: the tag sequence of descendants to depth 2 with counts, e.g. `span:1 svg:1`
- `styleHash`: a hash of the rounded computed values of background-color, border (width, style, color), border-radius, padding (rounded to 2 px), font-size, font-weight, display, box-shadow presence, and text-transform
- `box`: width and height buckets (height to 4 px, width to 16 px) and aspect bucket
- `interactive`: boolean
- `textLen`: bucket of text length (0, 1 to 2 words, 3 to 5, 6 to 20, more)

## Clustering

1. **Exact groups**: element candidates with identical (`tag`, `role`, `classTokens`, `structure`) form a group. This catches most component-library and Tailwind sites.
2. **Style merge**: groups with the same `tag` and `role` merge when their `styleHash` inputs differ by at most two properties and each differing property is within tolerance (color ΔE ≤ 6, padding ±4 px, radius ±2 px, font size ±1 px). This catches hashed-class sites.
3. **Variant split**: within a cluster, instances are grouped by their exact style tuple of background-color, text color, border color, border width, padding, radius, font-weight and height bucket. Each distinct tuple with at least one instance is a variant. Variants with a single instance whose only difference is width are folded into the nearest variant.

   Variant naming is deterministic. Each variant gets a color word and a size word, joined with a space, the color word first, sentence case, and a word is omitted when every variant shares that property:
   - Color word: by the semantic role of its background or border token when semantic (`Success`, `Warning`, `Danger`, `Info`); else by rank of usage among the cluster's brand-colored variants (`Primary`, `Secondary`, `Tertiary`); a variant with a transparent background and a border is `Outlined`; with neither background nor border, `Ghost`.
   - Size word: by height bucket relative to the most-used variant: `Small` below it, `Large` above it, nothing for the most-used size.
   - Example, the test set of 3 colors × 2 sizes where the larger size is more used: `Primary`, `Primary small`, `Secondary`, `Secondary small`, `Ghost`, `Ghost small`.
   The model's `variantHint` may rename variants only within these words (it may pick `Outlined` over `Secondary`, never invent a word).
4. **Cross-page merge**: after per-page clustering, clusters from different pages merge when they share the exact group key, or when their representative fingerprints pass the style merge and their names from the model pass are equal.

A cluster becomes a component when it has at least one instance and is not noise: noise is a container with no interactive descendant, no text, and no image (a layout wrapper), or an element candidate whose area is over 60% of the viewport.

## Rule classification

Each cluster gets a type guess and confidence from the first matching rule, in this order: `button` (tag button, or role button, or styled link with ≤ 3 words and no href to another page section) 0.95; `link` (styled anchor with href) 0.9; `input`/`select`/`textarea`/`checkbox`/`radio` (by tag and type) 0.98; `toggle` (`role=switch` or a checkbox inside a label with a track-shaped sibling) 0.85; `form` (a `form` with ≥ 2 fields) 0.95; `nav` (`nav`, `role=navigation`) 0.95; `header` (`header` or `role=banner` at document top) 0.95; `footer` 0.95; `breadcrumb` (`aria-label` breadcrumb or an ordered list of ≤ 6 links with separators) 0.8; `tabs` (`role=tablist`) 0.95; `pagination` (nav or list of numbered links) 0.8; `dropdown` (the revealed element of an `open` state whose trigger has `aria-haspopup` of `listbox`, `menu` or `true`, or the revealed element of the mobile menu button) 0.85; `menu` (`role=menu` or `role=menubar`, not reached through an `open` state) 0.85; `table` 0.98; `code-block` (`pre`) 0.95; `modal` (`role=dialog`) 0.95; `alert` (`role=alert`, or class `alert|banner|notice` with an icon and text) 0.8; `toast` (class `toast|snackbar`, fixed position) 0.8; `badge`/`tag` (inline mark rule; `badge` when a status word or number, `tag` otherwise) 0.7; `avatar` 0.9; `hero` (first container on home over 50% viewport height with a heading ≥ 32 px) 0.8; `section-header` (a heading with an eyebrow or subtitle and no other content) 0.6; `card` (container rule with a heading or image and text) 0.6; `list-row` (repeated sibling containers in a list ≥ 3) 0.7; `empty-state` (a container with an illustration or icon, a sentence, and one button, on the 404 page or a zero-count list) 0.6; `tooltip` (`role=tooltip`) 0.9; else `other` 0.3.

## The model pass (Haiku)

Clusters with confidence < 0.9, plus every cluster for naming, go to the model in batches of 8 per call, per page group. Each item carries: the default-state crop (PNG, downscaled to ≤ 512 px wide), the fingerprint summary (tag, role, class tokens, structure), the text sample, the rule guess and confidence, the instance count, and the page paths. The prompt asks for, per item: `type` from the enum, `name` (1 to 3 words, sentence case, the kind of thing it is: "Primary button", "Pricing card", "Status badge"), `isComponent` (false for layout noise), and `variantHint` (a short phrase describing what distinguishes variants, or null). Output is validated with Zod; on failure for an item, the rule guess and a generated name (`{Type} {n}`) stand. Prompt caching on the rubric. Images are sent only for items whose rule confidence is below 0.9; the rest get text only.

A second, text-only call per run (the "collision" call in `model-calls.md`) resolves naming collisions across pages: items with the same name and type but failing the style merge get the model's choice between "same component, different variant" and "different components". Its fallback, and the tie-break on an invalid answer, is to keep them separate and suffix the names (`Card 2`).

Costs: roughly 1.5k input tokens per item with an image, 300 without; a 46-component run is about 40k input tokens for this stage.

## Instances and provenance (D-008)

Every instance records `pageId`, `viewport`, `selector`, `bbox`, `variantId`, and text. Provenance:

- `firstSeen`: the instance on the earliest page in capture order (home first), desktop viewport preferred; its page crop (`source-{viewport}.png`) is the page screenshot region covering the element's bounding box plus 16 CSS px on every side, never smaller than 320 × 240 CSS px (centered on the element when it is smaller than that), with the element's bbox recorded relative to the crop for the outline overlay. Large components (a header, a hero, a footer) therefore get a crop of their own size plus the margin.
- `pages`: every page with the count of instances.
- The run page's component card shows "First seen on {path} · {pages} pages · {variants} variants". The panel shows all of it.

## States and tokens

State captures from `capture` are attached to the component by instance; the component's `states` is the union across instances, preferring the first-seen instance's crop for each state. A state present on another instance is still `captured: true` with that instance noted.

`tokensUsed`: for each of the component's default computed values (background, text color, border color, radius, padding steps, font tuple, shadow), the token whose representative matches (ΔE ≤ 2.3 for colors, exact for others) is linked with the property name. Unmatched values are listed under the "Unmapped" label in the panel's token section with the raw value.

## Responsive variants

If a component's mobile instance differs from its desktop instance in flex direction or display (`Stacks at 390 px`), or in width ratio by more than the variant tolerance (`Changes layout at 390 px`), the component gets `responsiveVariant` with the mobile preview and that note (both strings are in `docs/design/copy.md`).

## Caps and order

Up to 120 components per run; beyond that, drop `other` first, then the lowest instance counts. Order within the run: by group in the enum order, then by instance count descending. Component ids are assigned in that order and are stable for the run.

## Events

`components · 46 found from 1,842 element candidates · 9 by model`, `components · merged 7 across pages`, `components · 3 noise clusters dropped`.

## Tests

- Clustering on crafted snapshots: Tailwind-style identical class sets, hashed-class sets with equal styles, a card containing a button, a pill badge set in three semantic colors.
- Rule classification table test, one case per rule.
- Variant split on a button set (3 colors × 2 sizes = 6 variants, named correctly).
- Cross-page merge: the same nav on four pages yields one component with four pages of provenance.
- Replay tests for the model pass, including a malformed response and a wrong-enum type.
- Fixture evals: component precision and recall by (type, bbox IoU ≥ 0.5) against `expected.json`, and state capture rate.
