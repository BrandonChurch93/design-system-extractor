# Changelog

## 1.3.0 · 2026-10-29

The third testing round: a Motion section you can read, token cards with room, and previews that answer the pointer.

- Easings: each curve fills its card, 160 px tall, with larger dots; the stages of a row line up at the card's bottom edge; every card says what uses its easing, or that nothing on the pages did.
- Durations: one log scale from the shortest to the longest, so 150 ms, 1 s and 10 s are evenly spaced; labels take at most two rows above and two below, and the strip says how many it labeled when one has no room; every tick opens its token.
- Radius and Shadow: a row of their own under Type and Spacing, 72 px samples, and a gap from each run's largest blur so no shadow reaches the next one.
- Patterns: chips rest on where the site's element starts (faded, slid, blurred) and return there after each play; Replay keeps its width; the keyframes list shows six with Show all.
- Previews: a live preview on a card plays the site's own hover and active styles under the pointer, and a tap on a phone opens the drawer; a card preview is never smaller than 0.6x, and a cut one fades at its edge and says so; the drawer shows a component at its real size and scrolls sideways; a component whose fill matches its ground is shown on the opposite tone, with the Ground toggle on every card.
- Capture: an element hidden on the page until focused, such as a skip link, is shown focused; a box with no width or height is never a component; a preview with no crop shows its code.
- Names: the probe for a missing page is named `404 page`, never its path; a pattern belongs to the component that owns its own element.
- Stored runs: the 1.3 upgrade removes pattern references that resolve to nothing and turns a preview whose crop was never written into its code-only form.

## 1.2.0 · 2026-10-28

The second testing round: runs from any version open, easings you can see, previews you can play with, and the check results up front.

- Showcase: `pnpm showcase --add <runId>`, `--remove` and `--list`, locally or `--remote`, put any complete run the owner made on the home page without re-crawling; a promoted run is the first card and is never deleted; the caption says so.
- Stored runs: every read path (the run page and its API, Compare, /open, the MCP server, the CLI) upgrades a document written by an earlier build to the current shape by its pipeline version, so v1.0 and v1.1 runs open and compare. Compare shows a StateCard, never an error page, for a run it cannot read. `pnpm runs:parse` checks the local database.
- Motion: the easings run on one shared clock, curve and track side by side, the same distance in the same time, so the differences between curves are what you see; each easing names what uses it; duration ticks run their real length; patterns preview themselves when they scroll into view. Still under reduced motion.
- Previews: every preview sits on the ground its element sat on, so a dark site's button has no halo; crops keep 4 px around the element, painted with that ground; elements below the 8,000 px screenshot cut get their own crops; a substituted font alone no longer demotes a preview; variable fonts up to 1 MB are copied; render checks run core components first, by use. The panel pins a state (each state's file plays the site's own transition), plays Default, Hover, Active, and switches the ground between the site's, light and dark. Previews scaled to fit say by how much.
- Measured: every run counts its previews by mode and reason, and the live log says why the rest were captured.
- Checks up front: a Components passing cell in the stat strip, a Passing all checks filter, a filled All checks mark on every component that passes every check that applies, the ratio in words at the head of the Checks section, `passedAll` in the MCP server, and a `Checks:` line on every component in design-system.md and the prompt. Monochrome, as everything else.
- Security: a state value that would leave its rule or its style element is refused.

## 1.1.0 · 2026-10-27

Fidelity: what a rebuild needs to feel like the original, not only look like it.

- Motion: durations, easings (named against a table of known curves), `@keyframes`, and runtime patterns (entrances, scroll reveals, scroll progress, the scrolled header, loops, staggers) read through the Web Animations API and inline-style sampling; observed patterns are labeled as observed. Hover, focus and open transitions are attached to each component's state changes with their timing.
- The site's own names: tokens take the names of the custom properties the site declares, hashed and framework-internal variables excepted, and every export keeps the site's variables beside its own.
- Overlays: translucent colors leave the palette and become overlay tokens with a base and an alpha.
- Naming: type roles named with words (`body-sm`, `heading-lg`), never numbers; components named with their context when a name repeats; variant third words (`rounded`, `outline`); core and page-specific tiers; no component or variant name ends in a digit. Notices that differ only in tone are one component; badge and tag follow the rule's reading of the text.
- Previews and code: reset filtering keeps what a component depends on and drops the rest; component code names the export's own tokens.
- Exports: `motion.css` and `motion.json`; a Motion section in design-system.md and the prompt, and a Motion line and a Default line for every component; core components first; a check that no file uses a custom property it does not declare. MCP `get_motion` and a `motion.css` resource; `dse export --format motion.css`.
- Drift: motion sprawl and a proposed set of durations and easings.
- The run page: a Motion section with a duration scale, easing curves with Replay, keyframes and patterns; an eighth ring on the stage rail; an overlays strip; the site's names in token provenance; core and page-specific component grids with a Core only filter; a Motion block in the component panel; a Motion table in Compare. Replay respects reduced motion.
- Evals: motion, naming and export-integrity rows on every fixture.

## 1.0.0 · 2026-10-26

The first release: paste a URL, get its design system back.

- Crawler: sitemaps, navigation and body links, template fingerprints, a model pass that picks up to 12 pages (40 with your own key), honest bot identity, robots.txt, politeness, SSRF guards on every request and redirect, bot, login, robots and unreachable states.
- Capture at 1440 and 390: DOM snapshots with computed styles, full-page screenshots, hover, focus, tab, active and open states, reduced-motion measurement, matched CSS read from the page's CSSOM.
- Tokens: colors clustered by ΔE and named by a model, type by family, size, weight and line height, spacing against an inferred grid, radii, shadows, breakpoints.
- Components: fingerprinting and clustering, rule classification, naming by a model with deterministic fallbacks, variants named by color and size, every state, first-seen provenance with its page crop.
- Previews: sanitized, sandboxed live previews served from storage, checked against the page's own pixels, captured crops otherwise with the reason.
- Automated checks: contrast, focus visibility, tap targets at 390, names for inputs and icon buttons, reduced motion. Measurements, never claims.
- Drift: near-duplicate colors, variant collapses, off-grid spacing, type near-duplicates, sprawl, a proposed clean set that keeps every contrast ratio, a narrative written from the computed facts.
- Exports: CSS variables, JSON, Tailwind, W3C design tokens, design-system.md, a prompt for any model, a per-component prompt, a zip; an MCP server (`@design-system-extractor/mcp`) and a CLI (`@design-system-extractor/cli`, `dse extract`, `dse export`, `dse serve`).
- The web app: home with the showcase, the run page in progress and complete, the component panel, Compare, Recent runs, How it works with the eval results, About, Privacy, Terms, state pages, `/open` for local runs, a catalog of every component at three widths. Monochrome chrome; the only color is the site's own.
- Platform: a BullMQ worker with one Chromium, a time budget so large sites finish inside their timeout, per-visitor caps, a daily budget, your own key, a heartbeat, retention, and the outage behavior P14 tested (a killed worker's run restarts, Redis and storage outages fail cleanly and refund).
- Quality gates: unit, integration and end-to-end tests, evals on five fixture sites, visual goldens at three widths, axe, Lighthouse, the copy rules, a soak, chaos tests, a Docker smoke test, and `docs/traceability.md` mapping every section of every spec to its code and tests.
- V2 (accounts, plans, billing) is prepared behind `BILLING_ENABLED` and invisible in this release.
