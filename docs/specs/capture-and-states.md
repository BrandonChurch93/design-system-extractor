# Capture and states

Stage `capture`. For every selected page, at both viewports, produce a capture: a DOM snapshot with computed styles, matched CSS for element candidates, screenshots, and state captures for interactive elements. This is where "every nuance" is won or lost, so it is thorough by design.

## Per page, per viewport

Two loads of the page: the main load, then a short probe load with reduced motion emulated. The probe comes second because it measures the element candidates, which only the main load can find (D-044).

1. **Main load.** With `reducedMotion: 'no-preference'`, navigate per `crawler.md`. Dismiss consent. Wait for fonts.
2. **Scroll pass.** Scroll from top to bottom in steps of the viewport height with 150 ms pauses to trigger lazy content and intersection animations, then back to top. Capture the header's computed styles at scroll 0 and at scroll 400 for the `scrolled` state (see States). Record each element candidate's motion now, before the freeze: whether `animation-name` is not `none` on it or any descendant (a pulsing dot inside a badge is the badge's animation), and whether any `transition-duration` is non-zero.
2b. **Motion pass.** The motion init script (installed with `addInitScript` before navigation; `motion-capture.md`) has been recording since document start. Read its records after the main load, keep it running through the scroll pass, and read them again after the scroll pass and before freeze. The computed `transition-*` and `animation-*` longhands of every element are read here too (the snapshot taken before the freeze), because the freeze removes them (D-089).
3. **Freeze.** Read the motion records out first; freeze ends every running animation. Inject a style that settles every CSS animation at its own end at once and disables transitions (`*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; transition: none !important; caret-color: transparent !important }`; an entrance that ends visible with `forwards` stays visible, where removing the animation would put it back at its hidden start, D-098), finish every running Web Animations API animation that has an end and cancel every infinite one, and hide scrollbars. State capture (step 7) comes after the freeze, so every crop is taken from a still page and a state's `to` values are the settled ones at once (D-089).
4. **Full-page screenshot.** PNG, DPR 2, full page up to 8,000 CSS px tall (taller pages are cut, logged). Below the cut, the element candidates whose matched CSS this page reads (step 6) are covered by clip screenshots of the page with 128 px around them, merged while one clip stays within 2,000 px, at most 12 per page and viewport and down to 24,000 px, held in memory with the page screenshot for the crops, the ground and the previews' reference and never stored (D-098). The cut line names them: `capture · /docs · cut at 8000 px · 3 clips below it for crops`.
5. **DOM snapshot.** Through one `page.evaluate`, walk every element in document order and record: a stable selector (see Selectors), tag, `role`, `type` for inputs, `href` presence, `disabled`, `aria-*` attributes, text content truncated to 80 characters, child count, the bounding box (CSS px, document coordinates), visibility (`visibility`, `display`, zero size, off-screen), and computed styles for the property whitelist. Skip `script`, `style`, `noscript`, `svg` descendants (record the `svg` root only), and elements with zero area. Cap 6,000 elements per page; beyond that, record only element candidates and their ancestors. Serialize to JSON and validate with Zod on the Node side.
6. **Element candidates.** Mark elements that may be components (rules in `component-detection.md`). For each, read its matched CSS rules from the page's CSSOM (the rules in stylesheet order, the selectors of each that matched, their declarations, inline and pseudo-element declarations; stylesheets the page cannot read are fetched by the worker and parsed by the browser as constructed sheets, D-068) and store them keyed by the element's selector. A candidate's subtree is read where its preliminary cluster (novelty key and subtree size) is first seen in the run at that viewport, not again on later pages (D-066). This is what live previews are built from, with each element candidate's `outerHTML` (up to 300 KB) and the computed value of every custom property its rules name (D-053). Cap 400 element candidates per page by area descending, keeping all interactive ones.
7. **States.** See below.
8. Close the page.
9. **Reduced-motion probe (second load).** Only when some element candidate moved in step 2. With `reducedMotion: 'reduce'` emulated, navigate per `crawler.md`, dismiss consent, wait for fonts, run the scroll pass, then, for each element candidate that moved, find it by its selector and record whether `animation-name` (on it or a descendant) is still not `none` and whether any `transition-duration` is non-zero on hover (hover is checked on interactive element candidates only). An element that does not move without the preference cannot move with it, so the others are not re-measured. Whether the site's stylesheets contain any `prefers-reduced-motion` media rule is recorded from the main load's stylesheet scan. Close the page. Stored for the reduced-motion check.

Property whitelist for computed styles: `color`, `background-color`, `background-image`, `border-top-color`, `border-top-width`, `border-top-style`, `border-right-*`, `border-bottom-*`, `border-left-*`, `border-radius` (four corners), `box-shadow`, `outline-color`, `outline-width`, `outline-style`, `outline-offset`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`, `text-decoration-line`, `padding-*`, `margin-*`, `gap`, `row-gap`, `column-gap`, `width`, `height`, `min-height`, `display`, `position`, `opacity`, `fill`, `stroke`, `cursor`, `transform`, `translate`, `scale`, `rotate`, `filter`, `backdrop-filter`, `text-decoration-color`, `animation-name`, `animation-duration`, `animation-timing-function`, `animation-delay`, `animation-iteration-count`, `transition-property`, `transition-duration`, `transition-timing-function`, `transition-delay`. The motion longhands are kept from the snapshot taken before the freeze.

## Selectors

A selector must re-find the same element on a reload of the same page. Build it as: `#id` when the id is unique and not hashed; else the shortest chain of `tag.class` segments using only non-hashed class tokens that is unique in the document; else `tag:nth-of-type(n)` chains from the nearest ancestor with a stable selector. Hashed means a token matching `/[0-9a-f]{5,}|^css-|^sc-|^_/`. Record both the selector and a `data-dse-id` attribute written onto the element for the duration of the capture so state captures can target it without re-querying.

## States

For interactive element candidates, at both viewports, in this order, with a fresh neutral state (mouse parked at 0,0, no focus) before each:

| State | How it is reached | Captured as |
| --- | --- | --- |
| `default` | the frozen page | crop + computed styles |
| `hover` | `mouse.move` to the element center, wait 150 ms, then while a Web Animations API animation runs on the element or inside it, until it ends (its longest duration plus delay plus 50 ms, at most 1,200 ms in all; D-089) | crop + the style diff from default |
| `focus` | keyboard reach: during a Tab walk (below) when the element becomes `document.activeElement`; else `element.focus()` with a note `reachedByKeyboard: false` | crop + diff; the diff records outline and box-shadow explicitly |
| `active` | `mouse.down` at center, wait 100 ms, capture, `mouse.move` 40 px away, `mouse.up` (cancels the click on links and buttons) | crop + diff |
| `disabled` | only if an instance of the same cluster has `disabled` or `aria-disabled="true"`; that instance is captured | crop |
| `error` | only if an instance has `aria-invalid="true"` or a class matching `/(error|invalid)/` | crop |
| `checked` · `selected` | only if an instance is checked (`:checked`, `aria-checked`, `aria-selected`, `aria-current`) | crop |
| `open` | for triggers with `aria-haspopup`, `aria-controls`, or `aria-expanded="false"`, except `role=tab` (its `aria-controls` names a tab panel; switching it is a selection, D-044): click, wait 300 ms, capture the trigger and the revealed element as its own element candidate (with its markup, its matched CSS and a crop of it alone), press Escape, click outside. Max 3 per page. Never for elements inside forms with `type=submit`. | crop of trigger + an element candidate for the popup |
| `scrolled` | headers and top navs: computed styles at scroll 400 vs 0 | diff |

The state diff tracks this property set and nothing else (D-088): `background-color`, `background-image`, `color`, `border-color` (the four sides collapsed to one entry when equal, else listed per side), `border-width`, `border-style`, `outline-width`, `outline-style`, `outline-color`, `outline-offset`, `box-shadow`, `opacity`, `transform`, `translate`, `scale`, `rotate`, `filter`, `backdrop-filter`, `text-decoration-line`, `text-decoration-color`, `letter-spacing`, `font-weight`, `padding`, `gap`, `width`, `height`, `cursor`. Rules:

- A delta entry exists only when `from` and `to` differ after normalization (colors to hex or `rgb(r g b / a%)`; transforms decomposed; lengths to px; `none` and `0px 0px 0px 0px transparent` shadows treated as equal).
- The three `outline-*` entries are dropped when `outline-style` is `none` or `outline-width` is `0px` in both states. (This removes the `outline-color` noise that comes from `* { outline-color: transparent }` resets.)
- Each entry carries `transition` when the element's resolved `transition-property` covers that property (`all` counts), with the resolved duration and easing, read before the freeze; script-driven motion recorded during the state adds its own timing (D-089).
- Focus, active and `open` follow the same wait as hover: the freeze settles CSS transitions at once, and only script-driven motion is waited for.

The **Tab walk**: from `body`, press Tab up to 80 times, recording `document.activeElement`'s `data-dse-id` each time; stop when it cycles. Elements reached are `reachedByKeyboard: true`. The walk happens once per page per viewport before per-element state capture.

Never: submit a form, type into an input, follow a link, scroll inside an element to reach content, or trigger a `confirm`/`alert`. Dialog handlers auto-dismiss any that appear and log them. A page script stops link navigation (a click on `a[href]` other than a fragment still reaches the page's handlers) and `window.open`. A page that navigates itself anyway during state capture keeps what was measured; the elements not yet probed have their states recorded as `not reachable`, a warning is logged, and the run continues (D-066).

A state crop is the element's bounding box plus 4 px, taken from a fresh screenshot of the viewport region at that moment (not the frozen full-page shot), so hover and focus visuals are real; its margin is painted with the instance's ground (Ground, below; D-094). Crops are stored as `runs/{id}/components/{componentId}/{state}.png` once components are known; during capture they are keyed by element id and re-keyed in `components`.

Caps: 40 interactive element candidates per page per viewport for state capture, chosen by cluster novelty (one per preliminary cluster first, then by area). A preliminary cluster is the novelty key: tag, role, class tokens without hashes, ground color, height in 4 px steps, whether the element opens something and whether it is icon-only (D-070). Novelty is run-wide per viewport and decided in page order (D-066): a preliminary cluster probed on an earlier page is not probed again, whichever page finished first, and only a viewport's first page fills by area. The `open` state and the reduced-motion probe follow the same rule, so a mobile menu on every page is opened once and a page with no new moving clusters has no second load. Past the states share of the run's time budget (`caps-and-budget.md`), pages keep their default capture only. Everything else gets `default` only and `captured: false` with reason `over capture cap` for the other states.

## Ground

Each element candidate records `ground`, the effective background color it sat on, as hex (D-094), read before any crop is cut. The page screenshot is sampled at the four corners of the crop margin (the 4 px band around the box, one sample at each corner, inset 1 px); if the four agree within ΔE 2, that color is the ground; otherwise the nearest ancestor with an opaque `background-color` supplies it; otherwise the page's `body` background; otherwise the canvas the page paints on, read from the screenshot's bottom-left corner (a page whose dark ground comes from its color scheme sets no background anywhere, D-098); and white when even that cannot be read. A crop is then taken with a 4 px margin instead of 8, and the margin is painted with `ground`, so even a captured preview shows no page bleed. The one exception is an element whose computed `box-shadow` is not `none`: its shadow lives in the margin, so the margin is kept as captured (its corners, which the shadow rarely reaches, still decide the ground). A component's `ground` is the most common ground of its instances.

## What is written

Each instance records `ground` (the effective background color as hex) and its crops carry the 4 px margin painted with it. Per page and viewport: the screenshot key, the snapshot (stored as `runs/{id}/pages/{pageId}/{viewport}.snapshot.json.gz`), the matched CSS map (`.css.json.gz`). State captures stay in the stage's output and reach storage as component crops (D-076). The run document's `pages` gains the capture refs; the rest is intermediate data consumed by later stages and deleted after `done` unless `DSE_KEEP_INTERMEDIATE=1`.

## Mobile viewport differences

At 390 px, navs are usually collapsed behind a menu button. The capture attempts the `open` state on the first `button[aria-expanded]` or `[aria-controls]` in `header`/`nav` so the mobile menu is captured as a component. Tap targets are measured at this viewport only.

## Events

`capture · /pricing · 1440 and 390 · 2 screenshots · 1,204 nodes`, `capture · /pricing · hover 14 · focus 9 · tab 23 · open 2`, `capture · /docs · cut at 8000 px`, and the motion lines in `motion-capture.md` (`capture · /pricing · motion 23 animations · 140 style samples`).

## Tests

- Snapshot shape against fixtures (counts of element candidates and interactive elements are known).
- State capture on the clean fixture: the primary button yields hover, focus, active with non-empty diffs; the disabled instance is found.
- Tab walk reaches the expected sequence on the clean fixture.
- A planted hover that changes `transform`, `filter`, `opacity` and `box-shadow` yields all four in the delta with their transition timing; a planted element with `outline: none` yields no outline entries on focus; four equal border side colors yield one `border-color` entry.
- The `open` state captures the dropdown and the mobile menu on the clean and messy fixtures.
- Dialog auto-dismiss (the messy fixture's contact page has a button that calls `confirm()`; the capture must finish and log the dismissal) and no-form-submission (the messy fixture's signup form sets a `data-submitted` marker on submit; the marker must stay unset after capture).
