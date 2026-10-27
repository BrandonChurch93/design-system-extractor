# Changelog

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
