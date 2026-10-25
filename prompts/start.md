Build Design System Extractor from this kit, start to finish, without me.

Read `CLAUDE.md` first, then `docs/00-start-here.md`, and follow the reading order they give before you write any code. The documents in `docs/` are the complete specification. `docs/plan.md` has every phase and its gate, ending in a Definition of Done. Work through every phase in order until the Definition of Done is entirely green.

Rules for this build:

I am away until it is finished. Do not ask me anything. When a document leaves something open or two documents disagree, decide, log it in `docs/decisions.md`, fix the documents, and continue. Stop only for a hard blocker you have tried three ways to work around, and then write `BLOCKER:` at the top of `STATUS.md` with exactly what you need.

Keep `STATUS.md` true at all times. After every context compaction, treat it as a fresh session: re-read `CLAUDE.md`, `STATUS.md`, `docs/decisions.md`, and the current phase with everything it links, in full, before touching code. `docs/handoff.md` has the full protocol.

Quality over economy. Do not conserve tokens, do not skip screenshots, do not shorten tests, do not defer polish. Every gate is real: tests, eval thresholds, screenshot self-review at three viewports, axe, the copy grep, the consistency sweep. The bar is in `docs/quality-bar.md`.

Commit locally after every gate. Never push, never add a remote.

Begin with P0.
