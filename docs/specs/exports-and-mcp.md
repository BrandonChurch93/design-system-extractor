# Exports, the MCP server, the CLI, and /open

Stage `exports` assembles design-system.md (from facts plus the Sonnet intro produced in the `drift` stage) and the prompt text, and stores both in the document. Every other export is generated on request from the run document by `packages/pipeline/src/exports/`, which has no Node-only dependencies, so that the web app, the MCP server, the CLI and the `/open` page produce byte-identical files.

## Formats

All exports take `set=proposed|raw` (default proposed). Token names come from the run; values from the chosen set. Files carry no comments except a one-line header: `/* Design System Extractor · {host} · run {id} · {set} set · {date} */` (CSS, JS) or a `"$meta"` object (JSON; `tokens.w3c.json` uses `$description` and `$extensions` instead, because the DTCG format reserves `$` keys, D-056).

**`tokens.css`** · `:root { --color-navy-900: #0B1F3A; … --type-body-size: 16px; --type-body-line: 26px; --type-body-weight: 400; --space-4: 16px; --radius-md: 8px; --shadow-md: …; --breakpoint-md: 768px; }` grouped by kind with a blank line between groups. Font families as `--font-sans`, `--font-mono`.

Naming for kinds whose tokens have no name of their own: space tokens are `space-{value}` (`--space-16` for 16 px; the proposed set uses the same scheme); radius tokens are ranked by value and named `radius-sm`, `radius-md`, `radius-lg`, `radius-xl` with `radius-pill` for the pill, extra values appended as `radius-{value}`; shadows use their bucket names; breakpoints are ranked ascending and named `breakpoint-sm`, `breakpoint-md`, `breakpoint-lg`, `breakpoint-xl`, `breakpoint-2xl`, extra values `breakpoint-{value}`; type tokens use their role names. The same names appear in every export and in the panel's token chips.

**`tokens.json`** · the run's own shape: `{ $meta, color: { name: { value, group, usage } }, type: { name: { family, size, lineHeight, weight, letterSpacing } }, space: [4, 8, …], radius: {…}, shadow: {…}, breakpoints: [...] }` matching `packages/schema/src/exports.ts`.

**`tailwind.tokens.js`** · `module.exports = { theme: { extend: { colors: { navy: { 900: '#0B1F3A' } }, fontFamily, fontSize: { body: ['16px', { lineHeight: '26px', fontWeight: '400' }] }, spacing, borderRadius, boxShadow, screens } } }`. Hue-step names split into nested objects; semantic names stay flat.

**`tokens.w3c.json`** · the W3C Design Tokens Community Group format (2024 draft): groups by kind, each token `{ "$type": "color", "$value": "#0B1F3A", "$description": "navy · 412 uses" }`, `dimension` for space and radius, `shadow` for shadows, `typography` composite tokens for type, `fontFamily` for families. The DTCG publishes no official JSON Schema, so the build authors one from the specification's rules (`$type` and `$value` shapes per type, group nesting, reserved `$` keys) at `packages/schema/vendor/w3c-tokens.schema.json`, with a comment naming the spec version it encodes, and validates every export against it.

**`design-system.md`** · Markdown, written by the pipeline from facts with the Sonnet intro (`exports.designSystemIntro`) and the drift narrative (`drift.narrative`): title, the intro paragraph, Palette (table of name, value, group, uses), Type (table), Spacing (list with base), Radius, Shadow, Breakpoints, Components (one section per component: name, type, variants, states captured, tokens used, checks with the disclaimer sentence, a fenced HTML and CSS snippet, each cut at a tag or declaration boundary past 3,000 and 4,000 characters with a comment saying so, D-069), Drift (numbers, proposal, narrative), How this was made (one paragraph naming the tool, the run id and date). Headings in sentence case. No em dashes and no forbidden words (the generator asserts both).

**`prompt.md`** · a system-style prompt with the static opening `You are building an interface that must match this design system exactly.` followed by the condensed tokens (CSS variables block), the type scale as a table, the component contracts (name, variants, states, tokens used, the CSS of the default state: the component's own rules with token variables, shortened as in design-system.md and within 48,000 characters in all for the whole system, a component's own prompt keeping all of its code, D-069), the rules (use only these tokens, keep contrast pairs, no em dashes), and the source line. No model writes any of it. Per-component variant: the same with only that component's contract. Both end with `Source: {runUrl}`.

**`all.zip`** · stored without compression with a fixed date so it is byte-stable (D-056); all of the above plus `components/{id}/preview.html` and `preview.css` for live components, `crops/` for captured ones, and `README.txt` with the run URL.

## The MCP server

`packages/mcp`, published as `@design-system-extractor/mcp`, a stdio server built on the official MCP TypeScript SDK. Invocation: `npx -y @design-system-extractor/mcp --run {id}` or `--url {runUrl}` or `--file ./run.json`. With `--run`, it fetches `GET {appUrl}/api/runs/{id}` once, where `{appUrl}` is the production URL baked into the package at publish time (`https://design-system-extractor.vercel.app`, overridable with `--app-url` or `DSE_APP_URL`); with `--url` the app URL is taken from the run link. It caches the document in memory and serves:

| Tool | Input | Output |
| --- | --- | --- |
| `get_tokens` | `{ set?: 'proposed' \| 'raw', kind?: TokenKind }` | tokens.json content for the kind(s) |
| `list_components` | `{ group?, type? }` | `[ { id, name, type, group, variants: n, states: n, checksPassed, checksApplicable } ]` |
| `get_component` | `{ id \| name }` | the component's contract: variants, states with deltas, tokens used, code (html, css), checks, provenance |
| `get_checks` | `{ componentId? }` | the summary or one component's results |
| `get_drift` | `{}` | numbers, proposal, evidence, narrative |
| `get_prompt` | `{ componentId? }` | prompt.md content |

Resources: `dse://run/{id}/design-system.md` and `dse://run/{id}/tokens.css`. The server has no network access besides the one fetch and never writes to disk. It is tested with a scripted MCP client in `packages/mcp/test` that exercises every tool and resource over stdio against a local run; the Claude Code install line is verified by the owner after publishing (runbook step 12).

## The CLI

`packages/cli`, published as `@design-system-extractor/cli`, binary `dse`. Runs the pipeline locally with the system's Chromium (Playwright's, installed on first run with a prompt).

- `dse extract <url> [--pages 12] [--out ./dse-run] [--cdp <wsUrl|httpUrl>] [--include <url>…] [--set proposed|raw]` · runs the full pipeline and writes `run.json`, `exports/` (every format), `screenshots/`, `components/`. With `--cdp`, Playwright connects to a running Chrome over the DevTools protocol (the user starts Chrome with `--remote-debugging-port=9222`), uses a new tab in that profile, and so sees whatever the user is logged into. Nothing is sent anywhere; model calls use `ANTHROPIC_API_KEY` from the environment and the same fallbacks apply when it is absent (names and narrative come from templates).
- `dse export <run.json> --format tokens.css [--set raw]` · regenerates one export from a run file.
- `dse serve <dir>` · serves the run folder on `http://localhost:4300` with permissive CORS and rewrites the folder's `run.json` on start so that `document.local.base` is that URL; `/open` then loads crops and previews from it.

Outputs are the same files the web app would produce. The CLI prints the stat strip as a table and the drift headline at the end. The run folder maps the document's storage keys onto `screenshots/`, `components/` and `fonts/`, and is served over HTTP while the run lasts so previews are checked from a URL; the address the visitor asked for is allowed even when it is private; `--cdp` leaves the user's browser open; exit codes are 0 complete, 2 blocked, 1 failed (D-056).

## /open (D-015)

The web page accepts a `run.json` (dropped or chosen), validates it with `RunDocumentComplete` (whose optional `local: { base }` field is the only addition a local run carries), and renders the complete run page face client-side with the "Local run" breadcrumb. Exports are generated in the browser by the same `packages/pipeline/src/exports/` code. Crops and previews load from `document.local.base` when set, else show the placeholder caption. Nothing is sent to the server; the page is static.

## Tests

- Each format has a golden test from a fixture run document, and `tokens.w3c.json` validates against the vendored schema.
- design-system.md and prompt.md generators assert no em dashes and no forbidden words.
- MCP: scripted client calls every tool and validates outputs against the schema.
- CLI: end-to-end on the clean fixture through a local static server, including `--cdp` against a Playwright-launched Chromium with remote debugging on, and `dse serve` rewriting `local.base`.
- /open (tested in P11, where the page is built): a Playwright test drops a fixture run.json and asserts the page renders every section and generates an export.
