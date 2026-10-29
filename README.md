# Design System Extractor

Paste a URL. Get its design system back.

Tokens under the site's own names, its motion (durations, easings, keyframes, and the entrances, reveals and loops it runs), components with every state you can hover, press, pin and replay on the component's own ground, automated checks with a per-component mark, and a drift report that shows where the system is leaking. Exports to CSS variables, JSON, Tailwind, W3C design tokens, motion CSS and JSON, a design-system.md, a prompt for any model, an MCP server and a CLI.

![A complete run of a fixture site: the stats, the palette, the drift headline and the tokens](docs/images/run-page.png)

![The Motion section of a fixture run: the duration scale with its running ticks, the easing curves looping on one shared clock, the keyframes, and the patterns with their triggers](docs/images/motion.png)

## How it works

1. A headless Chromium reads the site's sitemap and navigation, and a short model pass picks up to 12 pages that cover the most components.
2. Each page is captured at 1440 and 390 px: the DOM with computed styles, screenshots, every control hovered, focused, tabbed and opened, and the motion that runs while it loads and scrolls, read through the Web Animations API and inline-style sampling.
3. Raw values cluster into tokens, named by the site's own custom properties where it declares them; elements cluster into components with variants, states, their transitions and the page they were first seen on, core components apart from page-specific ones.
4. Each component gets a sandboxed live preview on the ground it sat on when it renders faithfully, which plays the site's own hover and press under the pointer, a file per state that plays the site's own transition, measured checks (contrast, focus, tap targets, names, reduced motion) with a mark on every component that passes all of them, and the drift report proposes a cleaner set that keeps every contrast ratio.
5. Everything exports as files, a prompt, an MCP server and a CLI. Runs made by an earlier version open and compare: every read upgrades the stored document. The details are on the How it works page and in `docs/specs/`.

## Local setup

Node 22, pnpm 9, Docker.

```
pnpm install
cp .env.example .env.local        # add ANTHROPIC_API_KEY and the two secrets it describes
docker compose up -d              # Postgres, Redis, MinIO
pnpm db:migrate
pnpm db:seed:fixtures             # six fixture runs, so the home page has a showcase
pnpm dev                          # the web app on http://localhost:3000 and the worker
```

`pnpm run doctor` checks every variable and service. `pnpm check` runs lint, types and unit tests; `pnpm verify:all` runs every gate (tests, end to end, evals, visual goldens, axe, Lighthouse, the copy rules, the audit).

## The CLI and the MCP server

```
npx @design-system-extractor/cli extract https://your-product.com --out ./dse-run
npx @design-system-extractor/cli export ./dse-run/run.json --format tokens.css
npx @design-system-extractor/cli serve ./dse-run          # then open it at /open
```

Every run page has the MCP install line for Claude Code:

```
claude mcp add design-system-extractor -- npx -y @design-system-extractor/mcp --run <run id>
```

## Eval results

Five fixture sites with planted components, states, check failures and drift, scored against their `expected.json` (`docs/evals.md`). The final live run (v1.2.0, 2026-10-28):

| Fixture | Pages | Tokens P / R | Components P / R | States | Live previews | Planted checks | Drift | Motion · Naming |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| clean | 9, exact | 1.000 / 1.000 | 1.000 / 1.000 | 67 of 67 | 28 of 28 | 100% | none, contrast kept | 1.00 · 1.00 |
| messy | 12, exact | 1.000 / 1.000 | 1.000 / 1.000 | 73 of 73 | 30 of 31 | 100% | 16 of 16 found | 1.00 · 1.00 |
| tailwind | 9, exact | 1.000 / 1.000 | 1.000 / 1.000 | 67 of 67 | 28 of 28 | 100% | none, contrast kept | 1.00 · 1.00 |
| css-in-js | 9, exact | 1.000 / 1.000 | 1.000 / 1.000 | 67 of 67 | 28 of 28 | 100% | none, contrast kept | 1.00 · 1.00 |
| library | 7, exact | 1.000 / 1.000 | 1.000 / 1.000 | 54 of 54 | 22 of 22 | 100% | none, contrast kept | 1.00 · 1.00 |

The checks are measurements, not an audit: the measurable subset of WCAG 2.2, run on every component.

## Documents

`docs/` holds the spec this was built from, `docs/decisions.md` every ruling made along the way, `docs/traceability.md` where each section is implemented and tested, and `docs/deploy-runbook.md` how to put it online.

## License

MIT. Built by Brandon Church.
