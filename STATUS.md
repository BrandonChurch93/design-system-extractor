# STATUS

This is the single live file for the build. A fresh session with no memory must be able to continue from this file plus the docs. Keep every section current. Update it before any stop.

## Blocker

None.

(When a hard blocker exists, replace the line above with `BLOCKER:` followed by exactly what is needed from Brandon and what was tried. Then stop.)

## Current phase

P1 · Schema and data model. Started 2026-10-25.

## Next action

Read `docs/specs/data-model.md`, `docs/glossary.md` and the Enum labels in `docs/design/copy.md` in full, then build `packages/schema` (enums, labels, run document, API contracts, entitlements) with its tests, then the Drizzle schema, migrations and storage adapter, per the P1 checklist below.

## Phase checklist

P1 exit criteria (from `docs/plan.md`), plus the standing gate items:

- [ ] Schema tests: a complete fixture document validates; partial documents validate at each stage; invalid enums fail; every enum named in `data-model.md` exists with a label for every value.
- [ ] Migrations apply on a clean database and `pnpm db:reset` returns it to empty and re-applies them; storage round trip for text and binary with the right content type.
- [ ] Every type in `data-model.md` exists in `packages/schema` with the same name.
- [ ] Handoff consistency sweep, `pnpm check`, `pnpm qa:copy`, `pnpm verify:all` (evals stub until P3), commit naming P1, STATUS updated.

## Gates passed

- P0 · Preflight · 2026-10-25 · `pnpm run doctor` all services connected (Postgres 16, Redis 7, MinIO with both buckets and public read, Anthropic key with both model ids live) · `pnpm check` green · `pnpm verify:all` green end to end with empty suites · worker image builds and runs · `pnpm --filter web build` green.

## Decisions made during this build

Mirror of the entries added to `docs/decisions.md`, newest first.

- D-029 · Local MinIO runs from Chainguard's image; bucket init image built locally (`docker/storage-init`).
- D-028 · Always `pnpm run doctor` (pnpm's built-in `doctor` shadows the script); the production check requires the session string and reminds that Vercel gets the pooler string.
- D-027 · Structured outputs (`output_config.format`) instead of forced tool use; no sampling parameters; small model thinking off at effort low, large model adaptive at effort low.
- D-026 · Verified model ids `claude-haiku-5-5` and `claude-sonnet-5-5` and their prices on 2026-10-25.

## Known limitations

Things implemented differently from the spec, with the decision id that explains why. Brandon reads this list at the end.

- Model calls send no `temperature`: the API no longer accepts sampling parameters, so naming and narrative are stabilized by prompts, schemas, validation and recordings instead (D-027).

## Toolchain notes

- Node 22.14, pnpm 9.15.9, TypeScript 5.9.3 (the native 7.x compiler is not yet supported by Next.js tooling), ESLint 9 (ESLint 10 is not supported by the React, jsx-a11y and import plugins that `eslint-config-next` uses), Next.js 16.4, React 19.3, Zod 4.6, Vitest 5, Playwright 1.64 with its Chromium.
- Internal packages `@dse/schema` and `@dse/pipeline` are consumed as TypeScript source; the worker, MCP and CLI bundles inline them with tsup.
- Root scripts load `.env.local` (or `DOTENV_FILE`) through `scripts/run.mjs` without overriding variables already set, so `env DSE_MODEL_MODE=live pnpm evals` wins.

## What Brandon must do at the end

Keep this list current. It is the only hands-on work he will do.

1. Follow `docs/deploy-runbook.md`.

## Session log

Newest first. One line per session start, one per gate passed, one per stop. Keep it short.

- 2026-10-25 · Gate passed · P0 · doctor, check and verify:all green.
- 2026-10-25 · Session started · P0 · read CLAUDE.md, 00-start-here, STATUS, handoff, decisions, quality-bar, glossary, brief, plan, evals, deploy-runbook, v2-plan, every design and spec document, reference READMEs · tree clean (new repository).
