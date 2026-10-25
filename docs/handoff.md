# Handoff protocol

The build will pass through many sessions and many context compactions. None of them share memory. This protocol is what makes the result consistent anyway. It is not optional and it is not abbreviated when the session feels short.

## At every session start

1. Read `CLAUDE.md`, `STATUS.md`, `docs/decisions.md`, in that order, in full.
2. Read the current phase in `docs/plan.md` and every document it links, in full. Do not rely on a summary of a document you have not read in this session.
3. Run `git status` and `git log --oneline -20`. Confirm the working tree matches what STATUS says. If it does not, reconcile: the repository is the truth about code, STATUS is the truth about intent. Fix STATUS, log what you found.
4. Run `pnpm check` (lint, typecheck, unit tests). If it is red, fixing it is the next action, before anything else.
5. Append to the STATUS session log: `Session started · P<n> · read <list> · tree <clean|reconciled>`.

## After every compaction

A compaction is a session start. Do all five steps above. Treat whatever you remember from before the compaction as a rumor until the documents confirm it.

## Before every stop

A stop is any of: a hard blocker, the end of the build, or anything that ends the session. Before stopping:

1. Make the working tree clean: commit, with a message naming the phase.
2. Update STATUS: current phase, next action (one precise sentence a stranger could execute), the phase checklist, decisions, known limitations, the owner's end list.
3. Append to the session log: `Stopped · P<n> · <reason>`.

If you can see a compaction coming (long phase, large files read), do the three steps above pre-emptively. STATUS is cheap to update and expensive to be wrong.

## Decisions

Any time you choose between two readings of a document, choose a default a document left open, or deviate from a document because it cannot be done as written:

1. Add an entry to `docs/decisions.md` using the next id, with the context, the decision, the reasoning, and which documents it affects.
2. Fix the affected documents so they agree with the decision.
3. Mirror the entry as one line in STATUS.

Decisions are append only. A later decision can supersede an earlier one by saying so; the earlier one is never edited.

## Consistency sweep at every gate

Before declaring a phase's gate passed:

1. Re-read the phase's spec documents.
2. For every requirement in them, point at the code and the test that satisfies it. If you cannot, the gate is not passed.
3. Run `pnpm qa:copy` (the em dash and forbidden-word rules in `docs/specs/architecture.md`). It must pass.
4. Run the full `pnpm verify:all` (see `docs/plan.md`), not a subset.
5. Look at the screenshots from `pnpm qa:design` for every page the phase touched, at 1440, 820 and 390, against `docs/design/pages.md` and `docs/quality-bar.md`.

## What you never do

- Ask Brandon a question or leave a question for him in a document. Decide and log.
- Push, add a remote, or open a pull request.
- Edit a past decision.
- Skip the reading order because the task looks small.
- Mark a gate passed with a failing or skipped check.
- Simplify a spec silently.
