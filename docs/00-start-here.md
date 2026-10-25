# Start here

This kit is the complete specification for Design System Extractor. It was written so that several sessions of Claude Code, none of which share memory, can build the whole product to the same standard without the owner present.

## What you are building

A public web app. A visitor pastes a URL. A crawler visits a bounded set of that site's pages, captures every component in every state it can reach, clusters the raw values into tokens, runs five measurable accessibility checks, computes where the system is leaking (the drift report), and offers exports: CSS variables, JSON, Tailwind config, W3C design tokens, a design-system.md, a prompt for any model, an MCP server, and a CLI. The home page is a showcase of runs the owner chose. No accounts in v1. A daily budget and a per-visitor cap protect spend, and visitors can use their own API key to go beyond them.

It is a portfolio piece for a design engineer. The bar is: the interface looks and moves like a premium product, and the extraction captures the nuances of a component rather than a rough guess. Both matter equally. See `docs/quality-bar.md`.

## The documents

Governance (read first, every session)

- `CLAUDE.md` · the rules
- `STATUS.md` · where the build is
- `docs/decisions.md` · rulings that override everything, append only
- `docs/handoff.md` · what to do at every session start, compaction and stop
- `docs/quality-bar.md` · what premium means here, with a checklist
- `docs/glossary.md` · the names used everywhere; use them exactly

Product

- `docs/brief.md` · what the product is and is not, the audience, the promise
- `docs/plan.md` · the phases, their gates, and the Definition of Done
- `docs/evals.md` · fixture sites, metrics, thresholds, visual regression
- `docs/v2-plan.md` · what v2 adds and what v1 prepares for it
- `docs/deploy-runbook.md` · the owner's end-of-build steps; you verify it is accurate

Design (`docs/design/`)

- `design-system.md` · tokens, type, spacing, radius, shadow, breakpoints, the monochrome rule
- `motion.md` · the motion grammar, timings, reduced motion
- `components.md` · every app component with anatomy, states, responsive behavior
- `pages.md` · every page and state, section by section
- `copy.md` · voice, rules, and the verbatim copy for every page

Engineering (`docs/specs/`)

- `architecture.md` · packages, services, data flow, environments
- `data-model.md` · tables, the run document, ids, retention
- `crawler.md` · discovery, politeness, blocked-state detection
- `page-selection.md` · scoring, template folding, the model pass
- `capture-and-states.md` · what is captured per page, how states are reached
- `token-clustering.md` · colors, type, spacing, radius, shadow, breakpoints, naming
- `component-detection.md` · fingerprints, clustering, classification, variants, provenance
- `preview-fidelity.md` · live render vs captured, sanitization, the diff rule
- `checks.md` · the five checks, exact thresholds and wording
- `drift.md` · findings, the proposed clean set, the narrative
- `exports-and-mcp.md` · every export format, the MCP server, the CLI, the /open page
- `caps-and-budget.md` · budget, visitor cap, BYO key, abuse and SSRF guards
- `model-calls.md` · which model for what, prompts, structured output, caching, record and replay, fallbacks
- `showcase.md` · the roster, alternates, the showcase script
- `v2-seams.md` · entitlements, owner column, billing adapter, flagged surfaces

Reference (`reference/`)

- `page-flow/` · the approved structure mock of every page (HTML, open in a browser). Structure and content are approved; the skin is not.
- `direction-a.html` · the approved visual direction, Studio. The skin is approved; it is a reference, not a pixel spec. `docs/design/design-system.md` wins. The mocks call the product "Specimen", an earlier placeholder name; D-001 settles the name.
- `genui-design-system/` · the owner's previous project's design system README and tokens. This is the level of rigor expected from `docs/design/design-system.md` and from the catalog page. It is a sibling, not a template: do not copy its accent or its components.

## Before you begin

`ANTHROPIC_API_KEY` must already be in `.env.local` at the repository root; the owner places it there before launching you. P0 checks for it first and stops with a blocker if it is missing, because recordings and the live evals need it.

## How to begin

1. Read everything in the governance list.
2. Read `docs/brief.md`, `docs/plan.md`, `docs/evals.md`.
3. Skim every design and spec document once so you know what exists. You will re-read each in full when its phase starts.
4. Open `STATUS.md`, set the current phase to P0, copy P0's exit criteria into the checklist, log the session start.
5. Begin P0.
