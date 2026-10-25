# Design System Extractor · build rules

You are building Design System Extractor: paste a URL, get its design system back. Tokens, components with every state, automated accessibility checks, and a drift report. This file is the constitution for the build. Everything else lives in `docs/`.

The owner, Brandon Church, is not available during the build. He will not answer questions, review work in progress, or approve anything until the Definition of Done in `docs/plan.md` is green. You decide, you log the decision, you continue.

## Reading order, every session

Do this at the start of every session and again after every context compaction, before touching code:

1. `CLAUDE.md` (this file)
2. `STATUS.md` (where the build is, what the next action is)
3. `docs/decisions.md` (rulings that override everything else)
4. The current phase in `docs/plan.md`, in full
5. Every document that phase links, in full, even if you think you remember it

Then write one line in the STATUS session log: session started, phase, what you read. A session that skips this has no standing to change anything.

## Precedence when documents disagree

1. `docs/decisions.md`
2. `docs/specs/*`
3. `docs/design/*`
4. `docs/plan.md`
5. `reference/*` (mocks are structure references, never pixel specs)

If you find a contradiction, resolve it in favor of the higher document, fix the lower one, and log the ruling in `docs/decisions.md`. Never leave two documents saying different things.

## Always rules

1. **Never ask Brandon.** Make the call, log it in `docs/decisions.md` with the reasoning, continue. The only reason to stop is a hard blocker you have tried three ways to work around (a credential that does not exist, a tool that cannot be installed). A hard blocker is written as `BLOCKER` at the top of `STATUS.md` with exactly what is needed, and then you stop.
2. **Quality over economy.** This build runs on a Max plan. Do not conserve tokens, do not skip screenshots, do not shorten test suites, do not defer polish. Read whole files. Re-read the spec before implementing it. The goal is built once, premium, never touched again.
3. **Docs are the spec.** Code follows the documents. When code and a document diverge, fix the code. When the document is wrong, fix the document and log a decision. Never let them drift.
4. **No em dashes.** None, anywhere a human reads: UI copy, labels, docs you write, commit messages, generated exports, prompts the app produces. Use an interpunct (·) to separate facts, a period to end a sentence, or restructure. Model output inside the product is exempt but the app's own templates are not. `pnpm qa:copy` (rules in `docs/specs/architecture.md`) is part of every gate.
5. **Chrome is monochrome.** The app's own interface uses no chroma. The only color on any page is the extracted palette of the site being shown. Pass and fail are shown by icon shape and words, never by green and red. See `docs/design/design-system.md`.
6. **Checks are measurements, never claims.** The forbidden words in `docs/design/copy.md` rule 3 never appear in product copy. The section is "Automated checks", results are "4 of 4 checks" with names and numbers, and the disclaimer sentence appears wherever checks are summarized.
7. **Every gate is real.** A phase is done when its exit criteria in `docs/plan.md` pass: automated tests, eval thresholds, screenshot self-review at 1440, 820 and 390, axe with zero violations, the copy grep, and a consistency sweep against the spec. "Mostly passing" is failing.
8. **Commit, never push.** Commit locally after every gate and after every meaningful unit of work, with a message that names the phase. Do not push, do not add a remote, do not open pull requests. Brandon pushes.
9. **Minimal comments.** No narration of what code does. A short comment only for a non-obvious why that someone could otherwise undo.
10. **Phone layouts are not optional.** Every page works at 390 px wide with a 20 px gutter and no horizontal scroll. Compare is the one desktop-only screen and says so.
11. **Security is a feature.** Every crawled site is hostile input. Follow the sanitization and SSRF rules in `docs/specs/preview-fidelity.md` and `docs/specs/caps-and-budget.md` exactly. A gate includes the security test suite.
12. **Fallbacks for every model call.** A model outage never fails a run. Every model step has a deterministic fallback in `docs/specs/model-calls.md`.
13. **Model ids are verified, not remembered.** At P0 you check the current model ids on docs.claude.com and set them in one config file. Nothing else hardcodes a model id.
14. **Nothing visible from v2.** The v2 surfaces are built behind `BILLING_ENABLED` and have zero entry points when the flag is off. A test proves it.
15. **STATUS.md is always true.** Update it before you stop for any reason, including compaction you can see coming. A fresh session must be able to continue from it alone.

## Working style

- Shell commands: pass environment variables with the `env` prefix (`env DSE_MODEL_MODE=live pnpm evals`), never as a bare `VAR=value cmd` prefix, so the permission allowlist in `.claude/settings.json` matches. Run multi-step shell work through `pnpm` scripts you add to `package.json` rather than long ad hoc pipelines.
- Plan each phase before coding it: list the files you will touch and the tests you will write, in STATUS.
- Write tests with the code, not after. Keep tests lean: no duplicate cases that assert the same output through the same branch; keep negative cases and regressions.
- Subagents are fine for independent, fully specified work (fixture sites, test data, a self-contained package). The main agent integrates, reviews the result against the spec, and owns the gate.
- Screenshot your own work. `pnpm qa:design` captures every page and state at three viewports. Look at them. Compare against `docs/design/*` and `docs/quality-bar.md`. Fix what is off before calling a gate passed.
- When something in the spec cannot be done as written, do not silently simplify. Implement the closest faithful version, log the decision with the limitation, and add it to Known limitations in STATUS.

## Stack (settled, do not revisit)

pnpm workspaces monorepo · Next.js App Router with TypeScript · CSS Modules · Motion for presence and layout, GSAP for internals · Playwright with Chromium · BullMQ on Redis · Postgres with Drizzle · S3-compatible storage adapter (MinIO locally, Supabase Storage in production) · Zod schemas shared across packages · Vitest · Anthropic SDK · Vercel (web) · Railway (worker) · Supabase (Postgres, storage) · Upstash (Redis) · MIT license.

Details and the reasons are in `docs/specs/architecture.md`.
