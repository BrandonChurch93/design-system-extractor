# Glossary

Use these names exactly, in code, docs, copy and commit messages. A concept with two names in two documents is a bug.

## Product

- **Run** · one extraction of one site at one moment. Has an id, a status, and a run document. URL `/r/{runId}`.
- **Run id** · 10 characters, lowercase letters and digits, generated with nanoid from the alphabet `0123456789abcdefghijklmnopqrstuvwxyz`. Unguessable; this is the only access control on a run in v1.
- **Run document** · the full result of a run as served by `GET /api/runs/{id}`: pages, tokens, components, checks, drift, cost, status. Partial while running. Stored in the shape of the build that wrote it (`pipelineVersion`) and **upgraded** to the current shape on every read (D-092).
- **Site** · the host that was crawled, normalized (`www.` stripped, lowercase, no port for 80/443).
- **Page** · one URL captured during a run, at both viewports.
- **Page candidate** · a URL discovered during crawl that may be selected as a page. Never shortened to "candidate" in a document that also discusses elements.
- **Element candidate** · a DOM element that may become a component (`docs/specs/component-detection.md`).
- **Template group** · candidates that share a structural fingerprint (all blog posts). One per group is selected.
- **Viewport** · `desktop` (1440 × 900) or `mobile` (390 × 844), both at device pixel ratio 2.
- **Capture** · the DOM snapshot, computed styles, matched CSS and screenshots of one page at one viewport.
- **Token** · a clustered design value with a kind, a name, a representative value, raw values, usage count and pages. Kinds: `color`, `type`, `space`, `radius`, `shadow`, `breakpoint`, `duration`, `easing`.
- **Palette** · the opaque color tokens of a run, grouped `brand`, `neutral`, `semantic`.
- **Overlay** · a translucent color, filed as a base color plus an alpha, never a palette step (D-086).
- **Site variable** · a CSS custom property the site itself declares; its name beats any generated name (D-082).
- **Motion pattern** · an observed or declared movement with a start state, an end state, timing and a trigger (`docs/specs/motion-capture.md`).
- **Observed** · measured at runtime through the Web Animations API or inline-style sampling, as opposed to read from CSS.
- **Tier** · `core` or `page`; which components the UI and the exports lead with (D-085).
- **Component** · a cluster of elements across pages that are the same piece of interface. Has a type, a name, variants, states, instances, provenance, tokens used, a preview, and checks.
- **Component type** · one of the enum in `docs/specs/component-detection.md`. The UI groups types into Buttons, Inputs, Navigation, Cards, Feedback, Data, Overlays, Other.
- **Variant** · a sub-cluster of a component that differs by a stable style delta (Primary, Secondary, Ghost).
- **State** · a captured condition of a component: `default`, `hover`, `focus`, `active`, `disabled`, `error`, `checked`, `selected`, `open`, `scrolled`.
- **Instance** · one occurrence of a component on one page: selector, bounding box, viewport.
- **Provenance** · a component's source data: first-seen page, pages with counts, selector, bounding box, viewport, crop. The panel section that shows it is named "Source".
- **Preview** · the visual shown for a component: `live` (sanitized re-render) or `captured` (the crop). See `docs/specs/preview-fidelity.md`.
- **Ground** · the effective background a component's instance sat on, captured as hex and painted behind its preview so it shows on its own ground (D-094).
- **Fill** · a preview's own background color at capture (`Preview.fill`), null when the element is transparent; set beside its ground so the app can tell when the two match (D-109).
- **Contrast fallback** · the app's swap of a preview's painted ground for the opposite tone (`surface` or `inverse-bg`) when the component's fill is within ΔE 5 of its ground; the toggle's `Site` returns the sampled ground (D-109).
- **Hidden until focus** · a focusable element hidden at capture (the `sr-only` pattern of a skip link) and kept as a candidate with `hiddenAtCapture`; its preview is its focus crop (D-108).
- **State file** · a live component's `preview-{state}.html`, which plays that state's recorded transition on load; the **StateBar** pins one (D-094).
- **Live rate** · live previews over previews; on a real site, over the previews that were checked (D-095).
- **Passing all checks** · a component whose every applicable check passed; the run's count is `componentsPassing` (D-096).
- **Check** · one of five measurements: `contrast`, `focus-visible`, `tap-target`, `label`, `reduced-motion`. Status `pass`, `fail`, `na`. The run page section is headed "Automated checks" and its nav label is "Checks"; the drift section is headed "Drift report" with the nav label "Drift".
- **Drift** · findings about leakage in a site's system: near-duplicate tokens, off-grid values, collapsible variants, plus a proposed clean set and a narrative.
- **Proposed set** · the clean tokens the drift report derives. Exports default to it; the raw set is one switch away.
- **Export** · a generated file or text: `tokens.css`, `tokens.json`, `tailwind.tokens.js`, `tokens.w3c.json`, `motion.css`, `motion.json`, `design-system.md`, the prompt, the zip.
- **Showcase** · the owner-curated runs listed on the home page: the roster's, and any run he **promotes** with `pnpm showcase --add` (D-091). See `docs/specs/showcase.md`.
- **Recent runs** · the visitor's own runs, remembered in their browser only.
- **Compare** · two runs side by side. Same site over time, or two sites.
- **Blocked** · a run that could not proceed: `bot`, `login`, `unreachable`, `robots`, `budget`, `busy`, `visitor-cap`, `invalid-url`, `private-address`. A blocked run never counts against the visitor cap.
- **Sparse** · a complete run with fewer than 4 components. Not a blocked reason.
- **Stage** · a pipeline step in canonical order: `queue`, `discover`, `select`, `capture`, `tokens`, `components`, `previews`, `checks`, `drift`, `exports`, `done`. `queue` and `done` are event stages with no module; the others are modules in `packages/pipeline/src/stages/`. Stage events may carry a `substage` (`tokens:palette`, `tokens:type`, `tokens:space`, `tokens:motion`). The live log shows `discover` under its display label `crawl`.
- **Stage rail** · the horizontal progress strip on an in-progress run: Pages, Palette, Type, Spacing, Motion, Components, Checks, Drift. The mapping from stages to rings is in `docs/design/pages.md`.
- **Run events** · the stored event rows (`run_events`). **Live log** · the same events as the reader sees them on the run page.
- **BYO key** · a visitor's own Anthropic API key, kept in their browser, sent per request, never stored server side.
- **Visitor** · an anonymous browser identified by the `dse_v` cookie, with an IP fallback.
- **Visitor cap** · the runs-per-day limit per visitor. In copy it is the "run limit"; the state page is "Run limit". It is not the **rate limit**, which is the 5-per-minute guard on `POST /api/runs` that returns 429.
- **Budget** · the global daily model spend ceiling in USD, reset at midnight America/Boise.
- **Busy** · the blocked reason when more than 20 runs are queued. Applies to every run, key or not.
- **State page** · a full page (TopNav, StateCard, Footer) that explains why a run did not start or was blocked: budget, busy, run limit, bot wall, robots, login wall, unreachable, invalid (which covers private addresses). **State route** · its URL under `/state/*`; the blocked-reason-to-route table is in `docs/design/pages.md`. Failed, cancelled, sparse and the login partial view are run page states, rendered at `/r/{id}`; not found is the app's 404 page. Those also use a StateCard but are not state pages.
- **Entitlements** · the single module that answers what a viewer may do (runs per day, page cap, viewports, retention, private runs, scheduled runs). Free is the only plan in v1.
- **Viewer** · the resolved identity of the current request: visitor id, user id (always null in v1), plan.
- **Flagged surface** · a v2 screen built in v1 behind `BILLING_ENABLED`.

## Engineering

- **Pipeline** · `packages/pipeline`, the pure library that turns a URL into a run document. Used by the worker and the CLI.
- **Worker** · `apps/worker`, the long-running service that pulls jobs from the queue and runs the pipeline.
- **Web** · `apps/web`, the Next.js app: pages, API routes, the catalog.
- **Schema** · `packages/schema`, the Zod schemas and TypeScript types every package imports. The run document shape lives here and nowhere else.
- **Fixture site** · one of six static sites in `fixtures/sites/`: five eval fixtures with known expected results and `messy-after`, which seeds the showcase and Compare. See `docs/evals.md`.
- **Pill** · the app's status marker primitive (Complete, New, Deterministic). Not a Tag (a token chip) and not a Chip (a filter). See `docs/design/components.md`.
- **Size words** · the app's own size names are `sm`, `md`, `xl` for buttons and inputs and `strip`, `mini`, `token`, `xl` for swatches. The word "hero" is reserved for the extracted component type `hero`; the app's largest type style is `headline`.
- **Recording** · a stored model response used in replay mode. See `docs/specs/model-calls.md`.
- **Gate** · a phase's exit criteria. See `docs/plan.md`.
- **Catalog** · `/catalog`, the internal page that renders every app component in every state for QA. `noindex`.
- **Design QA** · `pnpm qa:design`, which screenshots every page and state at three viewports into `qa/`.

## Copy conventions

- Interpunct (·) separates facts in a line: `12 pages · 2 viewports · 2 min 41 s`.
- Counts read `118 of 132`, never `118/132`, in prose and labels. Mono tables may use `118 / 132` with spaces.
- Ratios read `5.4:1`. Sizes read `44 × 44`. Durations read `2 min 41 s`.
- Sentence case for every label, button and heading.
