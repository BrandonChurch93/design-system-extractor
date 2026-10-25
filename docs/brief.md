# Brief

## The product in one line

Paste a URL. Get its design system back.

## Who it is for

Two readers, equally:

- A design-engineer recruiter or hiring manager who lands on the home page from the owner's portfolio or LinkedIn, pastes a site they know, and judges the product in three minutes. They decide by look, motion, and whether the result feels true.
- An engineer or design-system lead who inspects the methodology: the How it works page, the fixture evals, the checks' honesty, the exports, the MCP server, the source.

The owner is Brandon Church, a design engineer. The project exists to show that he can take a precise idea and ship it as a premium product, end to end, with both the engineering and the design at a senior level.

## What it does

1. Crawls a bounded set of a public site's pages (12 by default), at desktop and mobile widths, politely and honestly.
2. Captures every component it can find in every state it can reach without submitting a form: default, hover, focus, active, and disabled, error, checked, selected, open and scrolled where instances exist.
3. Clusters raw values into tokens: colors, type, spacing, radius, shadow, breakpoints, each with usage counts and the pages it came from.
4. Detects components, groups their variants, and names them, with full provenance: first-seen page, every page with counts, selector, bounding box, viewport, a crop with the component outlined on its page.
5. Builds a live preview of each component from its extracted markup and CSS, and shows the capture instead when the live render does not match.
6. Runs five automated checks with numbers: contrast, focus visibility, tap target size, names for inputs and icon buttons, reduced motion.
7. Computes drift: near-duplicate tokens, off-grid values, collapsible variants, and proposes a clean set that never lowers a passing contrast ratio.
8. Exports: CSS variables, JSON, Tailwind config, W3C design tokens, design-system.md, a prompt for any model, an MCP server, a CLI, and a client-side page that opens local runs.
9. Compares two runs: the same site over time, or two sites.

## What it is not

- Not an accessibility audit. It measures five things and says so.
- Not a scraper for stealing sites. It identifies itself, obeys robots.txt, crawls a dozen pages, and the computed styles it reports are inspection, not reproduction.
- Not a SaaS, yet. No accounts, no payments in v1. The seams exist for v2.
- Not a dashboard of opinions. Every number on a page comes from a measurement.

## The promise on the page

Headline: "Paste a URL. Get its design system back." Subline: "Tokens, components with every state, accessibility checks, and a drift report showing where the system is leaking." Extraction leads; drift pays off a second later.

## Non-negotiables

- The interface is premium: the design system in `docs/design/`, the motion grammar, the quality bar. It is judged against Apple, Linear, Vercel and Lovable.
- The extraction captures nuance: states, variants, provenance, live previews. It is judged against the fixture evals in `docs/evals.md`.
- Anyone can run it, safely: the caps and guards in `docs/specs/caps-and-budget.md`.
- The showcase is the owner's best work, twelve runs, the first thing anyone sees.
- Phone layouts are real.
- No em dashes. None of the forbidden words in `docs/design/copy.md`. Monochrome chrome.

## Done means

The Definition of Done in `docs/plan.md`: every phase gate green, `pnpm verify:all` green, the deploy runbook verified, STATUS carrying an accurate known-limitations list and the owner's end list. The owner then deploys, runs the showcase, tests v1, and decides on v2.
