# Pages

Every route, its sections in order, and its states. Components are named as in `docs/design/components.md`; copy is verbatim in `docs/design/copy.md`. `reference/page-flow/` shows the approved structure of each page as a wireframe; it predates the responsive and provenance decisions, so this document wins where they differ.

Routes are Next.js App Router routes under `apps/web/app/`. Every page has a `title`, a `description`, an Open Graph image, and works at 390 px.

## `/` · Home

1. TopNav.
2. Headline block: `headline` "Paste a URL. Get its design system back.", the `body` subline, UrlForm, the caps caption. `space-9` top padding at desktop, `space-7` at phone.
3. Showcase: heading row (`h2` "Showcase" left, the caption right; the promoted caption variant from copy when the content holds a promoted entry, D-091), CategoryFilter, ShowcaseGrid of the showcase content (`docs/specs/showcase.md`), reveal entrance in viewport.
4. When `BILLING_ENABLED`: PricingSection between Showcase and Footer with the `h2` "Plans". Never rendered otherwise, and no anchor, link or nav item references it when off.
5. Footer with the home context line.

Submitting UrlForm:

- Client-side syntax checks run first and render inline under the Input without leaving the page: not a URL, not http or https, an include line on another host. These never reach the server.
- Then `POST /api/runs`. On `{id}`, navigate to `/r/{id}`. On a blocked result, store the response's `detail` in `sessionStorage.dse_blocked` (try/catch) and navigate to the state route for the reason with `?url={attempted}`; the state page reads the detail from `sessionStorage` and renders without it when absent. On 429, render the rate-limit line inline. On 400 (a body that failed schema validation, which a well-behaved client never sends), render the generic validation line inline.
- A run that blocks inside the worker (`bot`, `robots`, `login`, `unreachable` after the pre-check passed, `private-address` on a redirect) is observed by the run page's polling: the first poll that returns status `blocked` navigates to the state route with `?run={id}`, and the state page fetches `GET /api/runs/{id}` for its detail.

| Blocked reason | Route | Detail source |
| --- | --- | --- |
| `budget` | `/state/budget` | sessionStorage |
| `busy` | `/state/busy` | sessionStorage |
| `visitor-cap` | `/state/visitor-cap` | sessionStorage |
| `invalid-url`, `private-address` (pre-check) | `/state/invalid` | sessionStorage |
| `bot` | `/state/bot` | `?run={id}` |
| `robots` | `/state/robots` | `?run={id}` |
| `login` | `/state/login` | `?run={id}` |
| `unreachable` | `/state/unreachable` | `?run={id}` |
| `private-address` (mid-run) | `/state/invalid` | `?run={id}` |

## `/r/{id}` · Run

One page, two faces: in progress and complete. Same sections; in progress shows RegionSkeleton for regions that have not landed and the StageRail and LiveLog, which the complete page hides (the log stays available behind a "Show log" link in the footer).

Sections, in order:

1. TopNav.
2. RunHeader. In progress, the breadcrumb line is replaced by the eyebrow "Extracting" (`label` `muted`) and the meta line follows the in-progress patterns in copy; the actions are Cancel (ghost) only. Complete: as specified in components, with the breadcrumb.
3. StageRail (in progress only), then PagesCard (in progress only, D-058).
4. StatStrip. Six cells in the one Card: Colors, Type styles, Spacing steps, Components, Checks passed (`95 of 167`) and Components passing (`20 of 30` with the caption from copy, D-096). At tablet the strip wraps to 3 + 3; at phone to 2 columns, three rows, no spanning cell. The Components passing cell links to the Components section's filter row (`#components-passing`) with the `Passing all checks` filter applied. In progress: cells fill as their stage lands; unknown cells show a skeleton number.
5. PaletteRow.
6. DriftHeadline (lands with the drift stage; skeleton before).
7. SectionNav, sticky from here down.
8. **Tokens** (`h2`, caption from copy): a Color Card with TokenGroup Brand, Neutral, Semantic; then a two-column row: Type Card (TypeScaleRow list, families line) and a stack of Spacing Card (SpacingBar list), Radius Card (RadiusSample), Shadow Card (ShadowSample); a Radius or Shadow card with no tokens is left out (D-059). Breakpoints found are listed as a caption at the bottom of the Spacing Card. Dark theme detection, when present, is a caption under the Color Card. A web font that did not load is a caption under the Type Card. Overlays render as their own PaletteStrip at the bottom of the Color Card, labeled `Overlays`, with the overlays caption (D-086). Tokens that took a site name show the `Named by the site` Pill and the provenance line `Named by {variable}` in their TokenPopover (D-082, D-089).
9. **Motion** (`h2` "Motion", caption from copy; D-081): a DurationStrip (every duration as a labeled tick on one horizontal scale, the most used marked with its role, each tick's dot running its real length on the grid's shared clock), an EasingGrid (one EasingCard per easing: the name, the value in mono, the usage line, and an EasingStage where the curve and a track run on one shared clock with every other card, forever, while the section is in view; the grid caption from copy beneath; D-093), a KeyframesList (name, usage, a CodeBlock that expands), and a PatternList (one PatternRow per pattern: kind Pill, the selector or component name as a link to the panel when attached, trigger in words, start → end as two token-sized swatches when color or two value chips otherwise, duration and easing, `Observed` Tag when observed, the row's preview chip plays start → end once when the row scrolls into view, then a Replay button plays it again). Patterns with `stagger` say "{count} items · {step} ms apart". Empty: "No transitions or animations found." with the caption from copy.
10. **Components** (`h2`, caption from copy): ComponentFilter (with the `Passing all checks` toggle Chip beside `Core only`, D-096), then, when both tiers exist, two headings "Core components" and "Page-specific components" (`h3`), each over its own ComponentGrid and "Show all" Button; the page-specific group is collapsed by default on phones, its heading a disclosure (D-085, D-089). ComponentFilter gains a `Core only` Chip, on by default when the run has more than 24 components. Cards render their previews on the component's `ground`, live previews in their frames (D-094); the CheckBadge on each card, beside the name, reads at a glance: a filled `ink` Pill with the check glyph and `All checks` when every applicable check passes, an outlined Pill `{passed} of {applicable} checks` otherwise, nothing when no check applies; it keeps its Popover with the per-check list. The `Captured` tag stays on the preview.
11. **Automated checks** (`h2`, caption is the disclaimer sentence): the opening line from copy (`{passed} of {applicable} components pass every check that applies to them.`, D-096), ChecksSummary, ChecksTable. The section keeps its place in the order (Tokens, Motion, Components, Checks, Drift, Exports).
12. **Drift report** (`h2`, caption from copy): the narrative paragraph (D-058), DriftNumbers, DriftProposal, VariantCollapseList (when any), EvidenceTable.
13. **Exports** (`h2`, caption from copy): the set toggle and "Download all" row, eight ExportCards in a 3 / 2 / 1 grid (CSS variables, JSON, Tailwind config, W3C design tokens, Motion CSS, Motion JSON, design-system.md, Prompt; the Tailwind config card is always offered; eight cards leave no single-card row, D-089), the MCP ExportCard full width.
The LiveLog (in progress) sits after Exports, above the footer.

14. Footer, context line, the live-rate line (D-095) and share link from copy, plus "Report a problem with this run" (a `mailto:` to `DSE_CONTACT_EMAIL`, D-013).

Breadcrumb rule for RunHeader: `is_showcase` → "Showcase / {host}"; else if the run id is in this browser's `dse_recent` → "Recent runs / {host}"; else "{host}" alone; a local run → "Local run". Breadcrumb segments before the last are links (Showcase to `/`, Recent runs to `/recent`).

### Stage to rail to region

| Pipeline stage (event) | StageRail ring | Region that fills |
| --- | --- | --- |
| `discover`, `select` | Pages (lands when `select` completes; the count shows during `discover`) | PagesCard; the StatStrip stays skeleton |
| `capture` | Pages shows "Pages · capturing {n} of {total}" | PagesCard rows mark captured |
| `tokens:palette` | Palette | PaletteRow, the Colors cell, the Color card |
| `tokens:type` | Type | the Type cell, the Type card |
| `tokens:space` | Spacing | the Spacing cell, the Spacing, Radius and Shadow cards |
| `tokens:motion` | Motion | the Motion section |
| `components` | Components, running ("Components · naming") | nothing yet |
| `previews` | Components lands | the Components cell, ComponentFilter, ComponentGrid |
| `checks` | Checks | the Checks cell, ChecksSummary, ChecksTable, CheckBadges on cards |
| `drift` | Drift | DriftHeadline, the Drift section |
| `exports` | no ring | the Exports section |
| `done` | all rings done | the header switches to the complete face; StageRail and LiveLog leave |

Rail labels while running and once done are in `docs/design/copy.md` (Stage rail labels); `{total}` in the Type label is the page count.

States of the run page:

- **Queued**: the in-progress face with StageRail all pending and the queued meta line, whose `{ahead}` is `queuePosition` from the API. Polls.
- **Running**: the in-progress face, filling.
- **Complete**: the complete face.
- **Sparse** (complete with fewer than 4 components): the complete face plus the sparse caption under the StatStrip.
- **Login wall** (status `blocked`, reason `login`): when the polling page first observes it, it navigates to `/state/login?run={id}`. A direct visit to `/r/{id}?partial=1` (the login state page's "Open it anyway" link) renders the complete face for the single captured page with the login caption under the StatStrip and no Compare button. A direct visit without `?partial=1` redirects to the state page.
- **Blocked** (any other reason): the polling page, or a direct visit, navigates to the state route for the reason with `?run={id}`.
- **Failed** (an internal error): the header with a StateCard from copy: "Something broke on our side.", "Run again" primary, "Browse the showcase" ghost.
- **Cancelled**: the header with a StateCard from copy: "This run was cancelled.", "Run again" primary, "Browse the showcase" ghost.
- **Not found**: a StateCard "No run with that link." with "Browse the showcase".

The component panel shows the PreviewFrame with its StateBar and Ground toggle above the states list; the states list stays as the record of what changed, and the StateBar is how it is seen (D-094). The panel's Checks block gets the same CheckBadge Pill at its head.

The component panel: `app/r/[id]/@panel/page.tsx` is a parallel-route slot that reads `searchParams.c` and renders ComponentPanel for that component, or nothing (`@panel/default.tsx` returns null). Opening a component pushes `?c={componentId}` so a refresh or a shared link reopens the panel; closing removes it. "Open as page" goes to `/r/{id}/c/{componentId}`.

## `/r/{id}/c/{componentId}` · Component page

TopNav, the component breadcrumb from copy ("{host} / Components / {name}", the first two segments links to the run and to its Components section), then the ComponentPanel content laid out as a page at 760 max width with prose and lists on a 600 px measure, then "Back to all components" (ghost Button), Footer.

## `/compare?a={runId}&b={runId}` · Compare

TopNav; header with the compare breadcrumb from copy ("{host} / Compare" for one host, "Compare" alone for two) and `title-sm` from the compare title patterns in copy; CompareModeToggle (preselected by whether the two hosts match); CompareColumns; DeltaStrip; Tokens (`h2-sm`) with TokenDiff; Motion (`h2-sm`) with a MotionDiff table, rows Durations, Easings, Keyframes and Patterns with their counts before and after (D-089); Components (`h2-sm`) with ChangeTable; two Buttons "Open the {date} run" (ghost for the first, primary for the second; by order when the dates match, copy.md); Footer with the compare footer line and the compare share link.

Compare never throws on a document it can upgrade (D-092). If either run cannot be loaded or upgraded, the page renders the StateCard `We could not compare these runs.` with the reason and a ghost Button `Open {host}` for each run that exists, never a blank page or a stack trace.

Opened from a run page's Compare Button with only one run known (`?a={runId}`): the page shows CompareColumns with the known run on the left and a picker on the right: a list of the visitor's recent runs of the same host first, then of other hosts, each a RecentRunRow with a "Compare" Button; or an Input "Paste another run link".

Phone: as specified under Compare in components.

## `/recent` · Recent runs

TopNav; header `title` "Your recent runs" with its caption; right side the runs-left line (`caption`, from `GET /api/me`; when a key is saved in this browser the line is the with-key variant from copy instead) and "New run" (primary Button, links to `/`); a Card with RecentRunRow list, where "Details" on a blocked row links to `/state/{reason}?run={id}`; the clearing caption; Footer with the recent footer lines, where "Use your own key" opens KeyPopover.

Empty: EmptyState from copy.

The list is `localStorage` key `dse_recent`: an array of `{id, host, createdAt, status, stats, palette}` capped at 50, written when a run is created from this browser and updated on completion or when the page loads and polls any non-terminal entries once. Wrapped in try/catch; failure shows the empty state.

## State routes

Each is a full page: TopNav, StateCard centered with `space-8` vertical padding, Footer. The route carries the attempted URL in the query (`?url=`) so the StateCard can name the host and prefill the retry, and, for worker-side blocks, `?run={id}` so it can fetch the run's `blockedDetail`; pre-check blocks read their detail from `sessionStorage.dse_blocked`. A state page with neither renders its copy without the detail region. Copy for every string is in `docs/design/copy.md` under State pages.

- `/state/budget` · **Budget reached** (D-005). Eyebrow, title, body with the computed hours; Meter with the used and total line and the runs-today line; "Run it now with your own key" with the key Input and a primary Button "Extract {host}"; the key caption; after a rule: "Browse the showcase", "Your recent runs". When `BILLING_ENABLED`, UpgradePrompt renders above the key form. Footer: the kept-URL line.
- `/state/busy` · **Crawler busy**. Eyebrow "Runs paused", title and body from copy, no Meter, no key form (a key does not skip the queue); "Browse the showcase", "Your recent runs". Footer: the kept-URL line.
- `/state/visitor-cap` · **Run limit**. Eyebrow, title, body with the computed hours; the same key form as budget; "Browse the showcase", "Your recent runs". When `BILLING_ENABLED`, UpgradePrompt renders above the key form.
- `/state/bot` · **Site blocked the crawler**. Eyebrow "Could not crawl"; title and body; CodeBlock with the attempt log from `blockedDetail`; "What you can do" with its three lines; an Input prefilled with the host and "Try this page" primary; "Browse the showcase", "How crawling works" (links `/how-it-works#crawl`). Footer: the did-not-count line and the runs-left line.
- `/state/robots` · **Crawling not allowed**. Eyebrow "Could not crawl"; title and body; the same actions as bot without the retry Input.
- `/state/login` · **Login wall** (D-015). Eyebrow, title, body; a Card with the sign-in page's stats line and up to 4 Swatch `mini` and "Open it anyway" (ghost, links to `/r/{id}?partial=1` of the blocked run); "To extract the real thing" with its two lines and the CLI CodeBlock; primary "Try another URL", ghost "Local crawling guide" (links `/how-it-works#cli`). Footer as bot.
- `/state/unreachable` · **Unreachable**. Eyebrow "Could not crawl"; title and body; retry Input with "Try again"; "Browse the showcase". Footer as bot.
- `/state/invalid` · **Not a site we can crawl**. Eyebrow "Could not crawl"; title and body; retry Input with "Try again"; "Browse the showcase". Covers `invalid-url` and `private-address`.

## `/open` · Open a local run (D-015)

TopNav; `title` "Open a local run"; its caption; a drop zone Card (dashed `line-strong` border, Lucide `file-json`) accepting one `run.json`; on load, the complete run page face renders client-side, the Motion section included, with the "Local run" breadcrumb and no Share, Run again or Compare buttons (exports work; they are generated in the browser). Crops and previews load from `document.local.base` when the run file sets it (written by `dse serve`, always `http://localhost:4300`), else the placeholder caption from copy. This route's CSP header allows `http://localhost:4300` in `frame-src` and `img-src` (a fixed value, not computed from the file).

## `/how-it-works` · How it works

TopNav; `title` "How it works" with the intro paragraph; "The pipeline" (`h2-sm`, anchor `#crawl` on the Card) as a Card of ten PipelineStep rows; a two-column row of Cards "Cost and limits" (with the model routing CodeBlock) and "What the checks are, and are not"; "How it is tested" (`h2-sm`) with EvalTable and its caption; "The CLI" (`h2-sm`, anchor `#cli`): a CodeBlock with the install and the three commands from `docs/specs/exports-and-mcp.md` and the `--cdp` caption; "The MCP server" (`h2-sm`, anchor `#mcp`) with its CodeBlock; Buttons "Read the source" (primary, the repository link), "Try it on a site" (ghost, home); Footer with its right line. Prose on this page sits on a 600 px measure.

## `/about`, `/privacy`, `/terms`

Simple prose pages, `body` text on a 600 px measure inside a 720 px container, with `h2-sm` headings. Copy in `docs/design/copy.md`. Linked from the Footer's left line.

## `/catalog`

Internal. `noindex`. TopNav, then one section per component in `docs/design/components.md`, each rendered in every state at desktop and at a 390-wide frame, with its name, its token list, and sample data. Primitives are added in P2; every page-level component is added in the phase that builds it (P11, P12), so the catalog is always complete. The flagged v2 surfaces render here always. A "Design QA" line at the top shows the dev spend meter when running locally.

## 404

The app-level not-found page: TopNav, a StateCard with the 404 copy and "Browse the showcase", Footer.

## `/account/billing`

Only when `BILLING_ENABLED`; otherwise a 404. TopNav, BillingPage, Footer; `noindex`, metadata from copy (D-060).

## Indexing

`sitemap.xml` lists the static pages (home, how it works, about, privacy, terms) and the showcase runs. Every other run page, component page, compare page, state page, `/recent`, `/open` and `/catalog` carry `noindex`. `robots.txt` allows everything except `/api/` and `/catalog`.

## Page metadata

Titles follow `{page} · Design System Extractor`; the `{page}` values and descriptions are in `docs/design/copy.md` under Page metadata. Every run page's Open Graph image is its `/og` route; the home page's OG image is the wordmark and the headline on `bg` with the first showcase entry's palette strip beneath; every other page uses the home image. Every page also carries its full title and description as its Open Graph and Twitter preview, with `summary_large_image` (D-065).

## API routes

- `POST /api/runs` · body `{url, include?: string[]}`; the BYO key travels in the `x-byo-key` header, never the body. Returns `200 {id, runsLeft}` or `200 {blocked: reason, detail, runsLeft}` (a blocked run is a result, not an error), `429` with `Retry-After` when rate limited, `400` when the body fails the schema.
- `GET /api/runs/{id}` · `{ id, status, isShowcase, document, events }` (the run document, its run events for the live log, and whether it is in the showcase for the breadcrumb), plus `queuePosition` (the count of queued jobs with priority ≥ this run's, ahead of it) while queued; ETag; `Cache-Control: no-store` while queued or running, `public, max-age=3600, stale-while-revalidate=86400` once terminal. A run that has been unpublished or deleted returns 404 (`no-store`) and the stale copy expires within the hour.
- `GET /api/runs/{id}/export/{format}` · `format` in `tokens.css`, `tokens.json`, `tailwind.tokens.js`, `tokens.w3c.json`, `motion.css`, `motion.json`, `design-system.md`, `prompt.md`, `component/{componentId}/prompt.md`, `all.zip`; query `set=proposed|raw` (default proposed).
- `GET /api/runs/{id}/pages/{pageId}/capture?viewport=desktop|mobile` · the full-page capture image, as a 302 redirect to the stored file (a capture can be larger than a function may return, D-057).
- `GET /api/runs/{id}/og` · the Open Graph image: the palette strip, the host, and the stats line on `bg`.
- `POST /api/runs/{id}/cancel` · cancels a queued or running run from the browser that created it (the visitor cookie must match). Returns `{id, status}` with `cancelled` (a queued run, ended at once) or `cancelling` (a running run, ended by the worker between pages); `403` from another browser, `409` once the run has ended.
- `GET /api/me` · `{ runsLeft, runsPerDay, resetsAt }` for the current visitor. The key is never sent to this route; whether a key is saved is known to the browser alone.
- `GET /api/health` · `{ok, worker: {alive, queueDepth}, budget: {remaining, resetsAt}}`. `worker.alive` is true when the worker's heartbeat in Redis is under 45 s old.

Admin, token-gated by `DSE_ADMIN_TOKEN` in a bearer header: `POST /api/admin/showcase/run` (enqueues a roster site as a showcase run), `POST /api/admin/showcase/content` (stores the showcase content file), `POST /api/admin/runs/{id}/unpublish`.
