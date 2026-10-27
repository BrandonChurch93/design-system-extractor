# Crawler

Stage `discover`, plus the shared browser setup used by `capture`. The crawler is a polite, honest, bounded visitor. It never submits a form, never logs in, never follows a link off the site, and never fetches more than the caps allow.

## Browser

- Playwright Chromium, headless, one browser per worker process, one context per run, pages closed after capture. Context options: `userAgent` from `DSE_USER_AGENT`, `locale: en-US`, `timezoneId: America/Boise`, `colorScheme: light`, `reducedMotion: no-preference` (changed per step where a spec says), `deviceScaleFactor: 2`, `viewport` per the viewport enum, `javaScriptEnabled: true`, `bypassCSP: false`, `serviceWorkers: block`, no persistent storage.
- Resource policy: block `media`, `font` is allowed (fonts are needed), block third-party `script` from known tracker domains (a short list in `pipeline/src/crawl/blocklist.ts`: analytics, ads, chat widgets), allow everything else. Blocking trackers removes the most common cookie and chat overlays and makes captures deterministic.
- Timeouts: navigation 20 s, `networkidle` wait capped at 5 s, then `document.fonts.ready`, then 500 ms settle. A page that fails to reach `domcontentloaded` in 20 s is marked `failed` with the reason and skipped; two failed pages in a row trigger an unreachable check (a plain GET of the origin through the guarded fetch, since many servers refuse HEAD, D-076).
- Politeness: at most 2 pages in flight per run, at least 800 ms between navigations to the same host, 3 retries with backoff (1 s, 3 s, 8 s) on network errors only, never on 4xx.

## Scope

The start URL defines the scope. A start URL at the host root (`https://tidewater.app/`) scopes the crawl to the whole host. A start URL with a path (`https://tidewater.app/docs/`, or a fixture at `http://localhost:4100/clean/`) scopes it to that path prefix: only same-host URLs whose path starts with the prefix are page candidates, "home" is the start URL itself, the synthetic 404 is `{prefix}/{token}-does-not-exist` (the token is the first 10 hex characters of the SHA-256 of `dse-404:{host}{prefix}`, stable so replays hold, D-041), and the run's `host` is still the host. `robots.txt` and the sitemaps are always read at the host root. This is what lets six fixtures share one host and what lets a visitor extract one product area of a large site.

## Identity and robots

- The user agent is the value of `DSE_USER_AGENT`, whose documented value is `DesignSystemExtractorBot/1.0 (+{appUrl}/how-it-works)`. Never spoofed.
- `robots.txt` is fetched first and parsed (a small robots parser in `pipeline/src/crawl/robots.ts`, supporting `User-agent`, `Allow`, `Disallow`, `Crawl-delay`, `Sitemap`). Rules for `DesignSystemExtractorBot` apply, else `*`. Disallowed paths are never fetched. If the root path is disallowed, the run is blocked with reason `robots`. A `Crawl-delay` above 800 ms is honored up to 5 s.

## Discovery

Input: the normalized start URL. Output: a page-candidate list with metadata.

1. **Start page.** Navigate to the URL. Redirect policy for this and every later navigation: up to 5 redirects; each target is re-validated against the private-address rules (`pipeline/src/net/private-ranges.ts`, shared with the API) before it is followed; a same-host target is followed; a target on the same site with or without `www.` is followed and becomes the canonical host; any other host blocks the run with `invalid-url` and the detail "redirected off-site". A private target blocks with `private-address`.
2. **Sitemaps.** `robots.txt` `Sitemap:` lines, then `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap-index.xml`. Parse sitemap indexes one level deep, gzip supported. Cap 2,000 URLs read; keep same-host only.
3. **Navigation.** On the start page, collect links inside `header`, `nav`, `[role=navigation]`, `footer`, and any element whose id or class contains `nav`, `menu`, `header`, `footer`. Record where each was found (`header`, `footer`, `nav`).
4. **Body links.** All other same-host links on the start page, depth 1.
5. **Visitor includes.** Up to 5 URLs the visitor added; same host required; recorded with reason `you added it`.
6. **Synthetic 404.** `{prefix}/{token}-does-not-exist` (see Scope) is added as a page candidate with reason `empty state`; it is captured only if the response is an HTML page with a status of 404 or a soft-404 body.

Normalization: lowercase host, strip `www.` for comparison but keep the site's canonical form for fetching, strip fragments, strip tracking query params (`utm_*`, `fbclid`, `gclid`, `ref`), keep other queries only when the path alone has not been seen, remove trailing slashes except root, resolve relative URLs. Dedupe.

Exclusions (never page candidates): non-HTML by extension (`.pdf .png .jpg .jpeg .gif .svg .webp .zip .mp4 .css .js .json .xml .txt`), `mailto:`, `tel:`, `javascript:`, paths matching `/(privacy|terms|legal|cookie|cookies|gdpr|imprint|impressum)\b`, `/(tag|tags|category|categories|author|page)\/`, `[?&]page=\d`, `/wp-json`, `/feed`, `/rss`, `/amp`, `/cdn-cgi/`, and any path `robots.txt` disallows.

Cap: 300 page candidates. Beyond that, keep by source priority (the start page, visitor includes, the synthetic 404, header links, other navigation, footer links, sitemap, body) then shortest path (D-077).

## Template fingerprinting

Before selection, up to 60 page candidates (the top 60 by the pre-score in `page-selection.md`: path patterns, source and depth only) are fetched as plain HTML (no browser, 8 s timeout, same politeness) and fingerprinted: the sequence of tag names of `body`'s first three levels plus the sorted set of class tokens on those elements, with digits and hashes stripped, hashed with SHA-1. Page candidates sharing a fingerprint form a template group; the group's size is recorded and only one member (the highest scored) remains selectable. Groups are also inferred by path pattern, for every candidate whether fetched or not: `/blog/{slug}` with 10 or more members, `/docs/{anything}`, `/products/{slug}` (D-077). Fetching stops at the fingerprints share of the run's time budget (`caps-and-budget.md`, D-066); the candidates not fetched are grouped by path pattern only.

## Blocked-state detection

Evaluated during discovery and again during capture.

- **bot**: a response of 403, 429 or 503 whose body contains any of: `cf-challenge`, `challenge-platform`, `captcha`, `verify you are human`, `access denied`, `request blocked`, `perimeterx`, `datadome`, `akamai`; or a 200 whose body is under 2 KB and contains those markers. An interstitial that never settles ends either way: it shows one of those markers once loaded, or the start page fails to load and the run is `unreachable` (D-076). On the start page: retry twice with 4 s and 8 s delays; if still challenged, block with `bot` and record the attempt log (URL, status, marker, retries). On other pages: mark the page failed; if more than half of selected pages are challenged, block the run.
- **login**: more than 80% of selected pages redirect to or render a URL matching `/(login|signin|sign-in|auth|account/login|users/sign_in)\b`, or render a page whose main content is one form with a password input and under 1,500 characters of text. The pipeline then runs every remaining stage on the sign-in page alone, so the run document is a complete, one-page document, and the run ends with status `blocked`, reason `login`. The login state page offers "Open it anyway", which opens `/r/{id}`; the run page renders a blocked-login run as the complete face with the login caption (`docs/design/pages.md`). The visitor's count is refunded like any blocked run.
- **unreachable**: DNS failure, connection refused, TLS failure, or no response in 20 s on the start page after retries.
- **robots**: as above.
- **invalid-url** and **private-address**: decided by the API before any fetch (`caps-and-budget.md`) and re-checked by the crawler on every navigation and redirect through the shared `pipeline/src/net/private-ranges.ts`.
- **Sparse** is not a blocked reason: a run that completes with fewer than 4 components is `complete` and the run page shows the sparse caption.

## Cookie and consent overlays

After load, once per page: find a visible element whose id, class, or `aria-label` contains `cookie`, `consent`, `gdpr`, `privacy-banner`; inside it, click the first button whose text matches `/^(accept|accept all|agree|i agree|got it|ok|okay|allow all|dismiss|close)$/i`. If none, look for a close button (`aria-label` `close`, or an `×`). Wait 300 ms. Never click anything outside such a container. Record what was clicked in the event log.

## Framework hint

From the start page: `tailwind` if class tokens match `/^(flex|grid|px-\d|py-\d|text-\w+-\d{2,3}|bg-\w+-\d{2,3})$/` on 20 or more elements; `bootstrap` if `/^(btn|container|row|col-\w+)$/` on 20 or more; `mui` if `/^Mui\w+/`; `chakra` if `/^chakra-/`; `css-in-js` if more than 50% of classes are hashed (`/^[a-zA-Z_-]*[0-9a-f]{5,}/`, `/^css-[a-z0-9]+/` or `/^sc-[A-Za-z0-9]+/`, D-042). Stored as `frameworkHint`, shown in the run meta line as "{Name} detected".

## Dark theme detection

Collect stylesheets' `@media (prefers-color-scheme: dark)` rules and any `[data-theme]`, `.dark`, `.theme-dark` selectors. If present, set `darkThemeDetected`. Nothing else changes in v1.

## Events

Every discovery step emits a run event with stage `discover` whose live-log line uses the stage's display label (`crawl`, from `labels.ts`) in the voice of `docs/design/copy.md`, e.g. `crawl · sitemap.xml · 281 urls · nav 11 · footer 6`, `select · 3 templates folded (docs ×212, blog ×48, careers ×9) · 12 pages chosen`, `capture · /pricing · hover 14 · focus 9 · tab 23`. "Page candidates" are URLs; "element candidates" (in `capture-and-states.md`) are DOM elements; the two are never conflated.

## Tests

- Fixture sites served locally exercise sitemaps, nav discovery, template folding, the synthetic 404 and consent banners (the messy fixture has a consent banner).
- Unit tests for normalization, exclusions, robots parsing, template fingerprinting, blocked-state classification with recorded HTML bodies.
- Politeness: a test asserts the minimum interval between same-host navigations.
