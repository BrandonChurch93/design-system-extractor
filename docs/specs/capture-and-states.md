# Capture and states

Stage `capture`. For every selected page, at both viewports, produce a capture: a DOM snapshot with computed styles, matched CSS for element candidates, screenshots, and state captures for interactive elements. This is where "every nuance" is won or lost, so it is thorough by design.

## Per page, per viewport

Two loads of the page: the main load, then a short probe load with reduced motion emulated. The probe comes second because it measures the element candidates, which only the main load can find (D-044).

1. **Main load.** With `reducedMotion: 'no-preference'`, navigate per `crawler.md`. Dismiss consent. Wait for fonts.
2. **Scroll pass.** Scroll from top to bottom in steps of the viewport height with 150 ms pauses to trigger lazy content and intersection animations, then back to top. Capture the header's computed styles at scroll 0 and at scroll 400 for the `scrolled` state (see States). Record each element candidate's motion now, before the freeze: whether `animation-name` is not `none` on it or any descendant (a pulsing dot inside a badge is the badge's animation), and whether any `transition-duration` is non-zero.
3. **Freeze.** Inject a style that disables animations and transitions (`*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important }`) and hide scrollbars.
4. **Full-page screenshot.** PNG, DPR 2, full page up to 8,000 CSS px tall (taller pages are cut, logged).
5. **DOM snapshot.** Through one `page.evaluate`, walk every element in document order and record: a stable selector (see Selectors), tag, `role`, `type` for inputs, `href` presence, `disabled`, `aria-*` attributes, text content truncated to 80 characters, child count, the bounding box (CSS px, document coordinates), visibility (`visibility`, `display`, zero size, off-screen), and computed styles for the property whitelist. Skip `script`, `style`, `noscript`, `svg` descendants (record the `svg` root only), and elements with zero area. Cap 6,000 elements per page; beyond that, record only element candidates and their ancestors. Serialize to JSON and validate with Zod on the Node side.
6. **Element candidates.** Mark elements that may be components (rules in `component-detection.md`). For each, fetch matched CSS rules through CDP `CSS.getMatchedStylesForNode` (the rules, their selectors, their declarations, and the stylesheet origin) and store them keyed by the element's selector. This is what live previews are built from. Cap 400 element candidates per page by area descending, keeping all interactive ones.
7. **States.** See below.
8. Close the page.
9. **Reduced-motion probe (second load).** Only when some element candidate moved in step 2. With `reducedMotion: 'reduce'` emulated, navigate per `crawler.md`, dismiss consent, wait for fonts, run the scroll pass, then, for each element candidate that moved, find it by its selector and record whether `animation-name` (on it or a descendant) is still not `none` and whether any `transition-duration` is non-zero on hover (hover is checked on interactive element candidates only). An element that does not move without the preference cannot move with it, so the others are not re-measured. Whether the site's stylesheets contain any `prefers-reduced-motion` media rule is recorded from the main load's stylesheet scan. Close the page. Stored for the reduced-motion check.

Property whitelist for computed styles: `color`, `background-color`, `background-image`, `border-top-color`, `border-top-width`, `border-top-style`, `border-right-*`, `border-bottom-*`, `border-left-*`, `border-radius` (four corners), `box-shadow`, `outline-color`, `outline-width`, `outline-style`, `outline-offset`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`, `text-decoration-line`, `padding-*`, `margin-*`, `gap`, `row-gap`, `column-gap`, `width`, `height`, `min-height`, `display`, `position`, `opacity`, `fill`, `stroke`, `cursor`, `animation-name`, `transition-property`, `transition-duration`.

## Selectors

A selector must re-find the same element on a reload of the same page. Build it as: `#id` when the id is unique and not hashed; else the shortest chain of `tag.class` segments using only non-hashed class tokens that is unique in the document; else `tag:nth-of-type(n)` chains from the nearest ancestor with a stable selector. Hashed means a token matching `/[0-9a-f]{5,}|^css-|^sc-|^_/`. Record both the selector and a `data-dse-id` attribute written onto the element for the duration of the capture so state captures can target it without re-querying.

## States

For interactive element candidates, at both viewports, in this order, with a fresh neutral state (mouse parked at 0,0, no focus) before each:

| State | How it is reached | Captured as |
| --- | --- | --- |
| `default` | the frozen page | crop + computed styles |
| `hover` | `mouse.move` to the element center, wait 150 ms | crop + the style diff from default |
| `focus` | keyboard reach: during a Tab walk (below) when the element becomes `document.activeElement`; else `element.focus()` with a note `reachedByKeyboard: false` | crop + diff; the diff records outline and box-shadow explicitly |
| `active` | `mouse.down` at center, wait 100 ms, capture, `mouse.move` 40 px away, `mouse.up` (cancels the click on links and buttons) | crop + diff |
| `disabled` | only if an instance of the same cluster has `disabled` or `aria-disabled="true"`; that instance is captured | crop |
| `error` | only if an instance has `aria-invalid="true"` or a class matching `/(error|invalid)/` | crop |
| `checked` · `selected` | only if an instance is checked (`:checked`, `aria-checked`, `aria-selected`, `aria-current`) | crop |
| `open` | for triggers with `aria-haspopup`, `aria-controls`, or `aria-expanded="false"`, except `role=tab` (its `aria-controls` names a tab panel; switching it is a selection, D-044): click, wait 300 ms, capture the trigger and the revealed element as its own element candidate, press Escape, click outside. Max 3 per page. Never for elements inside forms with `type=submit`. | crop of trigger + an element candidate for the popup |
| `scrolled` | headers and top navs: computed styles at scroll 400 vs 0 | diff |

The **Tab walk**: from `body`, press Tab up to 80 times, recording `document.activeElement`'s `data-dse-id` each time; stop when it cycles. Elements reached are `reachedByKeyboard: true`. The walk happens once per page per viewport before per-element state capture.

Never: submit a form, type into an input, follow a link, scroll inside an element to reach content, or trigger a `confirm`/`alert`. Dialog handlers auto-dismiss any that appear and log them.

A state crop is the element's bounding box plus 8 px, taken from a fresh screenshot of the viewport region at that moment (not the frozen full-page shot), so hover and focus visuals are real. Crops are stored as `runs/{id}/components/{componentId}/{state}.png` once components are known; during capture they are keyed by element id and re-keyed in `components`.

Caps: 40 interactive element candidates per page per viewport for state capture, chosen by cluster novelty (one per preliminary cluster first, then by area). Everything else gets `default` only and `captured: false` with reason `over capture cap` for the other states.

## What is written

Per page and viewport: the screenshot key, the snapshot (stored as `runs/{id}/pages/{pageId}/{viewport}.snapshot.json.gz`), the matched CSS map (`.css.json.gz`), the state captures index. The run document's `pages` gains the capture refs; the rest is intermediate data consumed by later stages and deleted after `done` unless `DSE_KEEP_INTERMEDIATE=1`.

## Mobile viewport differences

At 390 px, navs are usually collapsed behind a menu button. The capture attempts the `open` state on the first `button[aria-expanded]` or `[aria-controls]` in `header`/`nav` so the mobile menu is captured as a component. Tap targets are measured at this viewport only.

## Events

`capture · /pricing · 1440 and 390 · 2 screenshots · 1,204 nodes`, `capture · /pricing · hover 14 · focus 9 · tab 23 · open 2`, `capture · /docs · cut at 8000 px`.

## Tests

- Snapshot shape against fixtures (counts of element candidates and interactive elements are known).
- State capture on the clean fixture: the primary button yields hover, focus, active with non-empty diffs; the disabled instance is found.
- Tab walk reaches the expected sequence on the clean fixture.
- The `open` state captures the dropdown and the mobile menu on the clean and messy fixtures.
- Dialog auto-dismiss (the messy fixture's contact page has a button that calls `confirm()`; the capture must finish and log the dismissal) and no-form-submission (the messy fixture's signup form sets a `data-submitted` marker on submit; the marker must stay unset after capture).
