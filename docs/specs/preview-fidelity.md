# Preview fidelity and sanitization

Stage `previews`. For each component, build a self-contained HTML and CSS preview from the extracted markup and matched CSS, render it, compare it to the captured crop, and decide `live` or `captured` (D-010). Every byte of this comes from an untrusted site, so sanitization is a hard requirement, not a nicety.

## Building the preview

For the component's first-seen instance (and each variant's representative instance):

1. **Markup.** `outerHTML` of the element, kept by capture (up to 300 KB), then sanitized (below). Images become placeholder blocks: a `span` with the image's rendered width and height, the image's average color as background (sampled from the crop), `border-radius` copied, and `aria-hidden`. Inline `svg` is kept (sanitized). `iframe`, `video`, `canvas`, `object`, `embed` become placeholder blocks.
2. **CSS.** The matched rules for the element and every descendant, from the capture's matched-CSS map: each rule's selector list and declarations, in cascade order (origin, specificity, source order), with `!important` preserved. Rules keep each element's cascade order when merged and are used without their `@media` and `@supports` wrappers (they matched when the instance was captured). Rules whose selectors reference ancestors outside the element are rewritten to a scope class `.dse-root` that the preview wraps the markup in; id selectors follow the sanitizer's `dse-` prefix. Inherited properties that the element gets from ancestors (font-family, font-size, color, line-height, letter-spacing) are written onto `.dse-root` from the computed styles. CSS custom properties used by any kept declaration are resolved to their computed values on the element and declared on `.dse-root`. **Reset filtering (D-083).** Before the CSS is written: declarations whose value is `inherit`, `unset`, `initial`, `revert` or `revert-layer` are dropped; `box-sizing` and `-webkit-tap-highlight-color` declarations are dropped; rules whose selector list is only universal (`*`, `*::before`, `*::after`, `::before`, `::after`) are dropped, except that their `margin`, `padding` and `border` are carried onto the component's own tags that have a browser default for them (D-090); rules whose selectors are bare element names (`span`, `a`, `div, span`, `button`, `svg`) are kept only when a declaration survives the drops above and the element name appears in the component's markup; a reset value that overrides a browser default on a matched tag is kept even when it is a keyword (`a { color: inherit }`, `button { font: inherit }`), because dropping it would change the render (D-090); any rule with no declarations left is dropped. The preview shell sets `box-sizing` on the component's elements to the snapshot's majority value, so a component that depends on its box model renders as captured. The preview renders from the filtered CSS, so the upload-then-render check protects the filter: a component whose preview diverges because a reset mattered is `captured` with the `diff` reason, which is the correct outcome. The same filtered rules are the component's exported code (`exports-and-mcp.md`). `.dse-root` is a column flex container as wide as the instance, on the opaque ground the element sat on, and the element keeps the exact box it had on the page (border-box, its measured width and height, no margin, no offsets if it was positioned) (D-053).
3. **Fonts.** For each family the component uses: if the site loads it from Google Fonts (a `fonts.googleapis.com` stylesheet link was observed), the preview gets the same `css2` link for that family and the weights used; else if the font file is same-origin or served with CORS and under 300 KB, it is copied to storage and declared with `@font-face`; else the family name is kept and the fallback stack applies. Which case happened is recorded.
4. **Shell.** `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com {storagePublicBase}/; img-src data: {storagePublicBase}/"><style>html,body{margin:0;background:transparent}</style><link ...fonts><style>…rules…</style></head><body><div class="dse-root">…markup…</div></body></html>`.
5. **Store, then render check.** The preview document is uploaded to storage first (`components/{id}/preview.html`, and per variant `components/{id}/variants/{variantId}/preview.html`), and the render check loads it **from its storage URL**, exactly as the app will: a Playwright page navigates to that URL at the instance's width and height plus 16 px, DPR 2, waits for fonts, screenshots the `.dse-root` box, and compares it to a crop of the page screenshot at the instance's exact box (a popup: the crop of the revealed element) with pixelmatch (threshold 0.1, anti-aliasing ignored), at the best alignment within 2 device pixels (found by descending from the unshifted position to the best neighbouring shift until none is better, D-066), forgiving a size difference of up to 4 device pixels. `diffPct` = differing pixels / total, any size difference beyond the slack counting as differing (D-053). Because the worker and the app load the same URL under the same document CSP, what the worker measured is what the visitor sees. Three render checks run at once, each on its own page; a component reached after the previews share of the run's time budget keeps its crop with `not-checked` (D-066).

Decision: `diffPct ≤ 2.5` → `mode: live`; otherwise `mode: captured` with `capturedReason: diff` (label `render differed by {pct} %`). Other captured reasons: `css-too-large` (label `styles too large`, the CSS cap), `fonts-unavailable` (label `fonts unavailable`, a required family could not be served and the fallback render differed), `not-checked` (label `not checked in time`, the run reached the previews share of its time budget before this component's render check, D-066). The threshold is a constant in `pipeline/src/previews/constants.ts` and the panel shows the measured value.

States for live components: the worker writes one file per captured state beside the default, `preview-{state}.html`, identical to `preview.html` plus one rule that applies that state's computed-style diff to the root element (the diff from `capture`, as declarations with `!important`). The app shows a state by pointing an iframe at that file. No script, no query string, no class toggling. For captured components, state crops are shown.

## Sanitization (hard rules)

Applied to markup before storage, with a whitelist sanitizer (DOMPurify in a jsdom context, with the configuration below), then a second pass of explicit checks. Nothing from a crawled site is stored or served unsanitized.

Markup:

- Remove: `script`, `noscript`, `template`, `iframe`, `frame`, `object`, `embed`, `applet`, `link`, `meta`, `base`, `form` is kept but its `action` and `method` removed, `input` kept with `name` removed and `type` limited to text-like types and `checkbox`, `radio`, `submit`, `button`.
- Remove every attribute starting with `on`, every `href` or `src` or `srcset` or `xlink:href` or `formaction` or `poster` that is not `https:` or a relative path or `data:image/`; `javascript:`, `vbscript:`, `data:text` are removed with the attribute. Relative `href` values are rewritten to `#` (previews never navigate). `target` removed. `style` attributes are kept but passed through the CSS sanitizer. `id` attributes are prefixed `dse-` to avoid clashing with the app. `class` kept. `data-*` kept except `data-dse-*` which is stripped.
- SVG: `script`, `foreignObject`, `use` with external href, `animate*`, `set` removed; `href` to external removed.

CSS (applied to every declaration in the preview stylesheet and every `style` attribute):

- Remove declarations containing `expression(`, `-moz-binding`, `behavior:`, `@import`, or `url(` whose target is not `https://fonts.gstatic.com`, `https://fonts.googleapis.com`, the storage public base, or `data:image/`.
- Remove `position: fixed` and `position: sticky` (they escape the preview box); convert to `relative`.
- Remove `@font-face` from site CSS; fonts come only from step 3 above.
- Allow `@media` and `@supports`. `@keyframes` never reach a preview: the preview carries only the style rules matched to the component's elements (D-076).
- Cap total preview CSS at 200 KB, measured after filtering; over the cap the component is `captured` with reason `css-too-large` (label `styles too large`).

Serving:

- Previews are served from storage as files on the storage origin and rendered in the app only as `<iframe sandbox="" src="{storagePublicBase}/runs/{id}/components/{cid}/preview.html">` (no `allow-scripts`, no `allow-same-origin`). Never `srcdoc`: a `srcdoc` document inherits the embedding page's CSP, which would block the fonts the worker's render check loaded, and live decisions would be wrong. With `src` on the storage origin, the preview document's own `<meta>` CSP governs it, the same way in the worker and in the app. The iframe is sized to the preview's recorded dimensions; the app never reads into it.
- The S3 driver uploads `preview*.html` with `Content-Type: text/html; charset=utf-8` and every image with its image type. The sandbox attribute and the document's own CSP are the security boundary; no response header on the storage origin is relied upon.
- Every preview iframe carries `title="{component name} preview"` (axe requires a frame title) and `loading="lazy"` below the fold.
- The app's CSP is set by Next.js proxy (`apps/web/proxy.ts`, Next 16's name for middleware, D-058) with a per-request nonce: `default-src 'self'; script-src 'self' 'nonce-{nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: {storage}; font-src 'self'; connect-src 'self' {storage}; frame-src 'self' {storage}; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`. `{storage}` is the origin of `STORAGE_PUBLIC_BASE_URL`; `'self'` in `frame-src` is for the catalog's 390 px demo frames (D-038). In development only, `script-src` also allows `'unsafe-eval'`, which the Next.js dev server needs; production never sends it (D-076). The nonce is passed to Next through the `x-nonce` request header so the App Router's inline scripts carry it. The `/open` route's header additionally allows `http://localhost:4300` in `frame-src` and `img-src`, a fixed value matching `dse serve`'s port.

## Security tests (part of every gate from P6 on)

A test suite of hostile component markup and CSS, each asserting the sanitized output and that rendering in the sandbox produces no network request outside the allowlist and executes no script:

- inline `onclick`, `onerror` on `img`, `javascript:` href, `srcdoc` iframe, `svg` with `script` and `foreignObject`, `style` with `expression()`, `url(javascript:…)`, `@import`, `position: fixed` overlay, a `form` with an external `action`, a `data:text/html` src, a `meta refresh`, a `base` tag, CSS custom property exfiltration via `url(var(--x))`, an `@font-face` pointing off-site.

Any new sanitizer bypass found later is added to this suite before it is fixed.

## Events

`previews · 46 built · 38 live · 8 captured (median diff 1.1 %)`.

## Tests

- The clean fixture yields ≥ 90% live; the css-in-js fixture ≥ 75%.
- The messy fixture's deliberately unfaithful component (its CSS depends on a background image that sanitization strips) is `captured` with reason `render differed by {pct} %`; a unit test with 250 KB of matched CSS yields `styles too large`.
- A crafted component whose matched CSS includes a 7,000-character `unset` reset and three universal rules yields preview CSS under 1,500 characters that still renders within the pixel threshold.
- Fonts: the Google Fonts case is a unit test of the builder with an observed `fonts.googleapis.com` stylesheet link (no network); the same-origin copy case and the fallback case are exercised by the fixtures (self-hosted fonts).
- In the test environment the storage origin is MinIO; the render check and the app's iframe both load from it, so the test proves the two agree.
