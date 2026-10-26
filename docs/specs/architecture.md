# Architecture

## Shape

A pnpm workspace monorepo. One web app, one worker, four packages, one fixtures folder.

```
apps/
  web/            Next.js App Router · pages, API routes, catalog · Vercel
  worker/         Node service · BullMQ consumer · runs the pipeline · Railway (Docker)
packages/
  schema/         Zod schemas and types · the run document shape, enums, API contracts
  pipeline/       the extraction library · pure TypeScript plus Playwright · no HTTP server
  mcp/            @design-system-extractor/mcp · stdio MCP server
  cli/            @design-system-extractor/cli · the dse binary
fixtures/
  sites/          six static fixture sites: five scored, plus messy-after (see docs/evals.md)
  recordings/     recorded model responses for replay
docs/             this kit
reference/        approved mocks and the sibling design system
qa/               design QA screenshots (gitignored)
```

Why this split: the pipeline must run in three places (worker, CLI, tests) with no web dependency; the schema must be the single source of truth for every consumer including the MCP server; the worker needs a long-lived Chromium that a serverless function cannot host.

## Services

| Service | Local | Production | Used for |
| --- | --- | --- | --- |
| Postgres | Docker Compose | Supabase | runs, pages, tokens, components, events |
| Redis | Docker Compose | Upstash | BullMQ queue, caps counters, budget counter, rate limits |
| Object storage | MinIO (Docker Compose, Chainguard's image, D-029) | Supabase Storage via its S3-compatible endpoint | screenshots, crops, extracted HTML and CSS, captures |
| Web | `pnpm dev` on 3000 | Vercel | the app |
| Worker | `pnpm --filter worker dev` | Railway, one service, Dockerfile in `apps/worker` | the crawler |
| Models | Anthropic API | Anthropic API | select, name, group, narrative |

One storage adapter interface (`put`, `get`, `publicUrl`, `delete`, `list`) with one S3 driver configured by env. MinIO and Supabase Storage both speak S3, so there is one driver and no branching.

## Data flow of a run

1. `POST /api/runs` (web) runs the seven-step pre-check in `caps-and-budget.md` (schema, rate limit, URL, private address, queue depth, visitor cap, budget), inserts a `runs` row with status `queued`, enqueues a BullMQ job `{runId, byoKeyCiphertext?}` with priority, and returns `{id, runsLeft}` or a blocked result.
2. The worker picks the job, marks the run `running`, and runs the pipeline with a `RunContext` that exposes `emit(stage, substage, message, patch)`.
3. Every `emit` appends a `run_events` row and applies `patch` (a partial run document) to the run's `document` through `applyPatch`, a deep merge: objects merge recursively, arrays and scalars are replaced, so a `tokens:type` patch adds `tokens.type` without touching `tokens.colors`. Implemented as a read-modify-write inside a transaction on the run row. The document is therefore readable, partially, at any moment.
4. The web app's `GET /api/runs/{id}` reads the row and returns the document with status. The in-progress page polls it (D-014).
5. On completion the worker writes `stats`, `cost`, `duration_ms`, sets status `complete`, and the document becomes immutable.
6. Blocked and failed runs set status accordingly, write the reason and detail, and refund the visitor's count.

The run document is one JSON object validated by `packages/schema` at write time in the worker and at read time in the web app. Screenshots and crops are referenced by storage keys, never embedded.

## Pipeline stages

In `packages/pipeline/src/stages/`, one module per stage, each a function `(ctx, input) => output` that is unit-testable without the others:

`discover` → `select` → `capture` → `tokens` → `components` → `previews` → `checks` → `drift` → `exports` → `done`

`run.ts` composes them and handles `emit`, timing, the run timeout, and error classification into blocked reasons. Each stage's input and output types live in `packages/schema`. `queue` and `done` are event stages (they appear in `run_events` and the live log) and have no module.

Package layout inside `packages/pipeline/src/`: `stages/` holds the entry module per stage; helpers live in sibling directories named after their stage or concern (`crawl/`, `select/`, `capture/`, `tokens/`, `components/`, `previews/`, `checks/`, `drift/`, `exports/`, `models/`, `net/`, `storage/`, and `db/`, which holds the Drizzle tables, migrations, `applyPatch`, `appendEvent` and `getRunForViewer` shared by the web app and the worker, D-033); `run.ts` and `context.ts` at the root.

`RunContext` has two implementations: `DbRunContext` (the worker: events to `run_events`, patches to the `runs` row, files to storage) and `MemoryRunContext` (the CLI, `pnpm pipeline:run` and `pnpm evals`: events and the document kept in memory, files written under an output folder). Stages never know which one they have.

## Environments

- `development`: Docker Compose services, `DSE_MODEL_MODE=live` with the dev spend cap, hot reload for both apps, `DSE_ALLOW_PRIVATE_HOSTS=localhost:4100,localhost:4300`.
- `test`: Vitest with `DSE_MODEL_MODE=replay`, Postgres and Redis from Docker Compose (a separate database `dse_test`, created by the compose init), MinIO buckets `dse` and `dse-test` (both created by the bucket init container), fixture sites served by a static server on 4100, the same private-host allowance.
- `production`: Vercel (web) and Railway (worker) with the env in `docs/deploy-runbook.md`. The dev spend cap and the private-host allowance are ignored when `NODE_ENV=production` (`pnpm run doctor --production` fails if the allowance is set).

`pnpm run doctor` validates every env var, connects to each service, and reports in one table. It is what the owner runs after deployment and what P0 runs first.

Every root script loads `.env.local` from the repository root; setting `DOTENV_FILE=<path>` makes it load that file instead (the runbook uses `.env.production.local` this way for migrations and the remote showcase). Scripts never read `.env.production.local` unless told to.

## Scripts (workspace root)

| Script | What |
| --- | --- |
| `pnpm dev` | web and worker with hot reload, Docker services up |
| `pnpm check` | lint, typecheck, unit tests |
| `pnpm test` | unit and integration tests |
| `pnpm test:e2e` | Playwright end-to-end against fixture sites |
| `pnpm test:security` | the sanitizer, SSRF and key-handling suites (also part of `test`) |
| `pnpm fixtures:serve` | serves `fixtures/` on port 4100 (sites under `/sites/{name}/`, fonts under `/fonts/`) |
| `pnpm fixtures:build` | compiles the Tailwind fixture's CSS (run once in P3; output committed) |
| `pnpm pipeline:run <url> [--out file]` | runs the pipeline to a JSON file without the queue |
| `pnpm evals [--through <stage>]` | runs the pipeline on the five eval fixtures through `MemoryRunContext` in replay mode (a replay miss fails the run), compares to expected, writes `fixtures/results.json`; `--through` scores only the metrics available up to that stage; `env DSE_MODEL_MODE=live` or `record` on the command line overrides replay |
| `pnpm db:migrate` · `pnpm db:reset` | Drizzle migrations |
| `pnpm db:seed:fixtures` | runs the six fixture sites through the local queue and writes the local showcase content |
| `pnpm qa:design` | screenshots every page and state at 1440, 820, 390 into `qa/` |
| `pnpm qa:visual` | visual regression against committed goldens |
| `pnpm qa:axe` | axe on every page and state |
| `pnpm qa:lighthouse` | Lighthouse on home and a complete run page, against `next build` served by `next start` on a local port |
| `pnpm qa:copy` | the em dash and forbidden-word grep (rules below) |
| `pnpm build` | builds every package and the web app (`next build`) and the worker bundle |
| `pnpm verify:all` | in order, failing fast: `check`, `test`, `test:e2e`, `evals:gate`, `build`, `qa:visual`, `qa:axe`, `qa:lighthouse`, `qa:copy`, `pnpm audit --audit-level high` |
| `pnpm showcase` | runs the showcase roster (local by default, `--remote` against production with the admin token) |
| `pnpm run doctor [--production [--env <file>]]` | env and connectivity check; `--production` checks the shape of a production env file (default `.env.production.local`) without connecting. Always `pnpm run doctor`: pnpm's built-in `doctor` command shadows a bare `pnpm doctor` (D-028) |

`pnpm qa:copy` rules: (1) the em dash character (U+2014) must not appear in `apps/`, `packages/`, `scripts/`, `docs/`, `prompts/`, `README.md`, `STATUS.md`, `CHANGELOG.md`, `.env.example`; `reference/`, `fixtures/sites/` and `node_modules` are excluded. (2) The forbidden words `accessible`, `compliant`, `a11y`, matched with word boundaries, case-insensitive, must not appear in `apps/web/copy/strings.ts`, `apps/web/app/**`, `apps/web/components/**`, `packages/schema/src/labels.ts`, `packages/pipeline/src/exports/**`, `packages/pipeline/src/models/prompts/**`, or `docs/design/copy.md`, except on a line that contains the marker `qa-copy-allow` (used only by the lines that state the rule). Docs other than `copy.md` are not scanned for words, so specs may name the rule.

Until P8, `verify:all` runs `pnpm evals:gate`, which is `pnpm evals --through <stage>` with the last stage the build has completed (each phase updates the script); from P8 on `evals:gate` runs the full `pnpm evals`.

## Database connections

The web app connects through Supabase's transaction pooler in production, so its postgres-js client is created with `prepare: false`; the worker and migrations use the session connection string. Locally both use the Docker Postgres directly. `pnpm run doctor --production` checks that the production env file's `DATABASE_URL` is the session form (port 5432), which the worker and the migration read, and reminds that Vercel gets the transaction pooler form (port 6543) instead; the pooler string is never in that file (D-028).

## Deployment shape

- Web: Vercel project with root directory `apps/web`; `apps/web/vercel.json` pins the install and build commands for the monorepo (`pnpm install --frozen-lockfile` at the root, `pnpm --filter web build`). The build is verified locally with `pnpm --filter web build`; the Vercel CLI is not used during the build because it needs an interactive login.
- Worker: Railway service built from `apps/worker/Dockerfile` with the repository root as the Docker context (so the Dockerfile can copy `packages/`), multi-stage on the Playwright base image, non-root user, `pnpm --filter worker build` then `node dist/index.js`. `docker build -f apps/worker/Dockerfile .` from the root is the local verification.

## Conventions

- TypeScript strict everywhere. No `any` outside the Playwright evaluate boundary, where results are parsed through Zod immediately.
- One Zod schema per concept in `packages/schema`; types are inferred, never duplicated by hand.
- Errors are typed: `BlockedError(reason, detail)`, `TimeoutError`, `ModelError`. The pipeline maps them to run statuses in exactly one place.
- Logging: structured JSON lines in the worker (`pino`), one logger per run with `runId` bound. The web app logs only API errors.
- No comments that narrate. A short why where someone could undo something non-obvious.
- CSS Modules named after the component; tokens only from `tokens.css`.
- File names: components PascalCase, everything else kebab-case.

## Security posture (summary; details in the linked specs)

- SSRF: DNS resolution before fetch, private and link-local ranges rejected, redirects re-validated, 5 redirect cap, http(s) only. `docs/specs/caps-and-budget.md`.
- Untrusted HTML and CSS from crawled sites is sanitized before storage and rendered only in sandboxed iframes with a strict CSP. `docs/specs/preview-fidelity.md`.
- BYO keys are encrypted in the job payload with `DSE_JOB_ENCRYPTION_KEY`, decrypted in the worker, held in memory for the run, and never logged or stored. `docs/specs/caps-and-budget.md`.
- Admin routes require `DSE_ADMIN_TOKEN`. There is no admin UI.
- Dependencies: `pnpm audit` is part of `verify:all`; high severity fails the gate.
