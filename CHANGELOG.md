# Changelog

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
