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
- `nav`, `header` and `footer` where ARIA maps them to landmarks (not inside `article`, `aside`, `main`, `nav` or `section`; a card's footer is not the page footer), `[role=navigation]`, `[role=banner]`, `[role=contentinfo]`, `[role=tablist]`, `[role=tab]`, `[role=dialog]`, `[role=alert]`, `[role=status]`, `[role=menu]`, `[role=menuitem]`, `[role=tooltip]`, `table`, `pre`, `code` blocks (block-level `code` or `pre`), `[aria-haspopup]`, `[aria-expanded]`.
- Container rule: an element with a visible border, background differing from its parent's effective background (a background image or gradient always differs), or a box shadow; between 2 and 60 descendants; area between 2,000 and 60% of the viewport area; not the page's main wrapper; never a table part (`thead`, `tbody`, `tfoot`, `tr`, `td`, `th`, `caption`, `colgroup`), which belongs to its table.
- Inline mark rule: an element with a background or border, text ≤ 3 words, height ≤ 32 px, display inline or inline-flex or inline-block, or a flex or grid item narrower than half its parent (the browser blockifies an `inline-flex` child of a flex container, so its computed display reads `flex`) → badge or tag element candidate.
- Image rule: `img` or `svg` with equal width and height ≤ 64 px and `border-radius` ≥ 50% → avatar element candidate.

Element candidates inside other element candidates are kept (a button inside a card is its own component); the containing card's structure records the tags of its children and grandchildren with their counts; it does not reference the child's cluster (D-076).

## Fingerprint

For each element candidate:

- `tag`, `role`
- `classTokens`: class names with hashed segments removed (`/[0-9a-f]{5,}/`, `css-…`, `sc-…`, leading `_`), lowercased, sorted, capped at 8; none on a Tailwind site, whose utilities describe values, not components. `baseTokens` are the class tokens without modifiers: a token that extends another (`btn-primary` beside `btn`, `pricing-card--featured` beside `pricing-card`), `is-*`, `has-*` and size or state words (D-052)
- `structure`: the tag sequence of descendants to depth 2 with counts, e.g. `span:1 svg:1`
- `styleHash`: a hash of the rounded computed values of background-color, border (width, style, color), border-radius, padding (rounded to 2 px), font-size, font-weight, display, box-shadow presence, and text-transform
- `box`: not part of the fingerprint (D-076). Size enters through the height bucket of the variant split (step 3), so the same card at two widths stays one component.
- `interactive`: boolean
- `textLen`: bucket of text length (0, 1 to 2 words, 3 to 5, 6 to 20, more)

## Clustering

1. **Exact groups**: element candidates with identical (`tag`, `role`, `baseTokens`, `structure`, icon-only, whether it opens something (a trigger), and for inline marks whether the ground is a semantic color) form a group; text-like input types count as one tag. Groups that share non-empty `baseTokens` are then one family whatever their colors or children, across `a`, `button` and submit inputs for controls, icon-only controls apart (D-052). This catches most component-library sites.
2. **Style merge**: groups with the same `tag`, `role` and icon-only flag merge when their `styleHash` inputs differ by at most two properties and each differing property is within tolerance (color ΔE ≤ 6, padding ±4 px, radius ±2 px, font size ±1 px; `display` compared by its inner type), their structures overlap by 70% or more, and their `baseTokens` agree: equal, one inside the other, none to read, or every token sharing its first segment with one on the other side. This catches hashed-class and utility sites without merging two components a site named apart. After classification, two clusters of one type whose instances are controls or marks and that share an identical variant look are one component (D-052); two `alert` or `toast` clusters of one tag, role and structure (70% overlap) whose looks differ only in color are one component whose tones are its variants (D-090).
3. **Variant split**: within a cluster, instances are grouped by their exact style tuple of background-color, text color, border color, border width, padding, radius, font-weight and height bucket. Each distinct tuple with at least one instance is a variant. Variants with a single instance whose only difference is width are folded into the nearest variant. Variants come from the main viewport's instances (desktop when there are any); an instance at the other viewport joins the variant of the same element (page and selector), else the nearest. The height bucket counts only for controls, inline marks and avatars, whose size is a choice; a card's height follows its content. A transparent border is no border. An instance whose style differs only because it is in a state (selected, current, checked, invalid, disabled: `aria-selected`, `aria-current`, `aria-checked`, `:checked`, `aria-invalid`, `disabled`, `aria-disabled`) does not form a variant; it supplies that state's capture (D-047).

   Variant naming is deterministic. Each variant gets a color word and a size word, joined with a space, the color word first, sentence case, and a word is omitted when every variant shares that property:
   - Color word: by the semantic role of its background or border token when semantic (`Success`, `Warning`, `Danger`, `Info`); else by rank of usage among the cluster's brand-colored variants (`Primary`, `Secondary`, `Tertiary`); a variant with a transparent background and a border is `Outlined`; with neither background nor border, `Ghost`.
   - Size word: by height bucket relative to the most-used variant: `Small` below it, `Large` above it, nothing for the most-used size.
   - Example, the test set of 3 colors × 2 sizes where the larger size is more used: `Primary`, `Primary small`, `Secondary`, `Secondary small`, `Ghost`, `Ghost small`.
   - Third word (D-084): when two variants would receive the same name, the first field in this order on which they differ supplies a third word: border (`Bordered` for the one with a visible border), radius (`Rounded` for the larger radius, `Square` for a radius of 0), padding (`Tight` for the smaller, `Wide` for the larger), font weight (`Bold` for the heavier), text color (`Muted` for the lower-contrast one against its background), height (`Tall`, `Short`), background opacity (`Faint` for the more transparent). If the two differ on none of these they are the same variant and are merged. The rule runs over every set of variants that would share a name, a field supplying a word only where its rule tells them apart, until each name is unique or the rest merge; the fourth and later brand fills take the hue word of their ground's color token (`Teal`) before it (D-089). Names are never suffixed with a number. Two ghost buttons that differ only in radius are `Ghost` and `Ghost rounded`.
   The model's `variantHint` is a description of what sets the variants apart; it may choose among the third words that apply, never add one, and it never otherwise renames a variant (D-076).
4. **Cross-page merge**: clusters from different pages merge when they share the exact group key, or when their representative fingerprints pass the style merge and their names from the model pass are equal. Same-named clusters that fail the style merge go to the collision call only when their `baseTokens` agree (as in the style merge); a site's own class names that set two clusters apart keep them apart (D-052). A trigger and an action control never merge by name, whatever the model called them (D-070).

A cluster becomes a component when it has at least one instance and is not noise: noise is a container with no interactive descendant, no text, and no image (a layout wrapper), or an element candidate whose area is over 60% of the viewport.

**Tier (D-085).** A component is `core` when it has instances on 2 or more pages, or 3 or more instances on one page, or its type is one of `button`, `input`, `select`, `checkbox`, `radio`, `toggle`, `textarea`, `link`, `badge`, `tag`, `avatar`, `tooltip` and it is the most-used component of that type (D-089: `toggle`, where the addendum wrote `switch`). Everything else is `page`. The UI, the exports and the prompt list core components first under their own heading; page components follow under "Page-specific components". Each component also gets a `slug`, the kebab case of its name, unique in the run (a repeated slug takes the next free ordinal word, as names do).

## Rule classification

Each cluster gets a type guess and confidence from the first matching rule, in this order, except that a specific form is always tried before the general one it would otherwise fall under: `toggle` before `button`, and `breadcrumb`, `pagination` and `tabs` before `nav` (D-050): `button` (tag button, or role button, or styled link with ≤ 3 words and no href to another page section) 0.95; `link` (styled anchor with href) 0.9; `input`/`select`/`textarea`/`checkbox`/`radio` (by tag and type) 0.98; `toggle` (`role=switch` or a checkbox inside a label with a track-shaped sibling) 0.85; `form` (a `form` with ≥ 2 fields) 0.95; `nav` (`nav`, `role=navigation`) 0.95; `header` (`header` or `role=banner` at document top) 0.95; `footer` 0.95; `breadcrumb` (`aria-label` breadcrumb or an ordered list of ≤ 6 links with separators) 0.8; `tabs` (`role=tablist`) 0.95; `pagination` (nav or list of numbered links) 0.8; `dropdown` (the revealed element of an `open` state whose trigger has `aria-haspopup` of `listbox`, `menu` or `true`, or the revealed element of the mobile menu button) 0.85; `menu` (`role=menu` or `role=menubar`, not reached through an `open` state) 0.85; `table` 0.98; `code-block` (`pre`) 0.95; `modal` (`role=dialog`) 0.95; `alert` (`role=alert`, or class `alert|banner|notice` with an icon and text) 0.8; `toast` (class `toast|snackbar`, fixed position) 0.8; `badge`/`tag` (inline mark rule; `badge` when a status word or number, `tag` otherwise) 0.7, and between these two the rule decides even when the model answers the other (D-090); `avatar` 0.9; `hero` (first container on home over 50% viewport height with a heading ≥ 32 px) 0.8; `section-header` (a heading with an eyebrow or subtitle and no other content) 0.6; `card` (container rule with a heading or image and text) 0.6; `list-row` (repeated sibling containers in a list ≥ 3) 0.7; `empty-state` (a container with an illustration or icon, a sentence, and one button, on the 404 page or a zero-count list) 0.6; `tooltip` (`role=tooltip`) 0.9; else `other` 0.3.

The rules above are applied with these readings (D-052): a popup root revealed by an `open` state is a dropdown; a styled link that is a tab or a page number is a link however short; the empty state is tried before the section header and the card; a section header has no ground of its own; repeated rows stacked in one column (three or more siblings at least 80% of their parent's width, at desktop) are list rows before cards; a badge's text is a status word or a number.

## The model pass (Haiku)

Clusters with confidence < 0.9, plus every cluster for naming, go to the model in batches of 8 per call, in first-seen order across pages, four calls in flight (D-066, D-076). Each item carries: the default-state crop (PNG, downscaled to ≤ 512 px wide), the fingerprint summary (tag, role, class tokens, structure), where it sits (the context the generated name uses, below: `in footer`, D-090), the text sample, the rule guess and confidence, the instance count, and the page paths. The prompt asks for, per item (the model's `type` and `isComponent` are used only for clusters below confidence 0.9; a confident rule keeps its type): `type` from the enum, `name` (1 to 3 words, sentence case, the kind of thing it is: "Primary button", "Pricing card", "Status badge"), `isComponent` (false for layout noise), and `variantHint` (a short phrase describing what distinguishes variants, or null). Output is validated with Zod; on failure for an item, the rule guess and a generated name stand. The generated name is the type label for the first component of a type and `{Type label} ({context})` for later ones (D-084, D-089), where context is the nearest ancestor landmark or section name (`header`, `footer`, `nav`, `aside`, a `section` with a heading: that heading's first two words), and when there is none, the page's last path segment (`Button (pricing)`; the home page is `home`). A name still shared adds the page's last path segment (`Button (footer, pricing)`), then an ordinal word (`Button (footer, second)`). Prompt caching on the rubric. Images are sent only for items whose rule confidence is below 0.9; the rest get text only.

A second, text-only call per run (the "collision" call in `model-calls.md`) resolves naming collisions across pages: items with the same name and type but failing the style merge get the model's choice between "same component, different variant" and "different components". Its fallback, and the tie-break on an invalid answer, is to keep them separate and give the later one its context (`Card (docs)` instead of `Card 2`). A final pass asserts no component or variant name ends in a number; one that does is renamed with the context rule and an event line says so (D-084).

Costs: roughly 1.5k input tokens per item with an image, 300 without; a 46-component run is about 40k input tokens for this stage.

## Instances and provenance (D-008)

Every instance records `pageId`, `viewport`, `selector`, `bbox`, `variantId`, and text. Provenance:

- `firstSeen`: the instance on the earliest page in capture order (home first), desktop viewport preferred; its page crop (`source-{viewport}.png`) is the page screenshot region covering the element's bounding box plus 16 CSS px on every side, never smaller than 320 × 240 CSS px (centered on the element when it is smaller than that), with the element's bbox recorded relative to the crop for the outline overlay. Large components (a header, a hero, a footer) therefore get a crop of their own size plus the margin.
- `pages`: every page with the count of instances (its desktop instances, or its phone ones when it has no desktop instance).
- The run page's component card shows "First seen on {path} · {pages} pages · {variants} variants". The panel shows all of it.

## States and tokens

State captures from `capture` are attached to the component by instance; the component's `states` is the union across instances, preferring the first-seen instance's crop for each state. A state present on another instance is still `captured: true` with that instance noted.

`tokensUsed`: for each of the component's default computed values (background, text color, border color, radius, padding steps, font tuple, shadow, and the durations and easings of its transitions), the token whose representative matches (ΔE ≤ 2.3 for colors, exact for others) is linked with the property name. Tokens used are computed against the raw set during this stage and re-mapped to whichever set an export asks for at export time (`exports-and-mcp.md`), so a token line in any export only ever names tokens present in that export's token block. A test asserts this on every fixture export. Unmatched values are listed under the "Unmapped" label in the panel's token section with the raw value.

**Motion.** After instances and provenance, each component gets its `motion` (transitions per state, animations inside it, the patterns whose target is inside one of its instances) by the rules in `motion-capture.md` (Attachment to components).

## Responsive variants

If a component's mobile instance differs from its desktop instance in flex direction or display (`Stacks at 390 px`), or fills its container on phones (90% of the container's width or more) where it does not on desktop (60% or less) (`Changes layout at 390 px`, D-052), the component gets `responsiveVariant` with the mobile preview and that note (both strings are in `docs/design/copy.md`).

## Caps and order

Up to 120 components per run; beyond that, drop `other` first, then the lowest instance counts. Order within the run: by group in the enum order, then by instance count descending. Component ids are a hash of the cluster's group key, so the same component keeps its id when the run is repeated; the document lists components in that order (D-076).

## Events

`components · 46 found from 1,842 element candidates · 9 by model`, `components · merged 7 across pages`, `components · 3 noise clusters dropped`, `components · 31 core · 15 page-specific`, `components · motion attached to 31 components · 12 patterns`, and, when the final pass renames one, `components · renamed Button 2 to Button (footer)`.

## Tests

- Clustering on crafted snapshots: Tailwind-style identical class sets, hashed-class sets with equal styles, a card containing a button, a pill badge set in three semantic colors.
- Rule classification table test, one case per rule.
- Variant split on a button set (3 colors × 2 sizes = 6 variants, named correctly).
- Cross-page merge: the same nav on four pages yields one component with four pages of provenance.
- Replay tests for the model pass, including a malformed response and a wrong-enum type.
- Variant names on a crafted set of two ghost buttons differing only in radius yield `Ghost` and `Ghost rounded`; a set differing in nothing nameable merges; the fallback name for a button in a `footer` is `Button (footer)`; no fixture run contains a component or variant name ending in a digit; tier assignment on the clean fixture matches `expected.json`.
- Fixture evals: component precision and recall by (type, bbox IoU ≥ 0.5) against `expected.json`, and state capture rate.
