Fix: the Patterns list and the drift Evidence table show six rows, then `Show all`, the way the KeyframesList does.

What is wrong: `PatternList` renders every pattern in the document's order (`docs/design/components.md`, PatternList: 47 rows on the owner's site, 80 on linear.app, the schema cap) and `EvidenceTable` renders every near-duplicate row (`docs/design/components.md`, EvidenceTable; up to 40 rows, D-077). Both sections run long on real sites. The KeyframesList's rule (D-104: six rows by default, a ghost Button `Show all {n} keyframes` beneath that expands the list in staggers of 12 and reads `Show fewer` when open) is what the owner wants on these two.

What it must be instead:

- `docs/design/components.md`, PatternList: "Six rows by default, in the document's order; beneath, a ghost Button `Show all {n} patterns` that expands the list (reveal in staggers of 12, as the ComponentGrid does) and reads `Show fewer` when open. Collapsing stops any play in the hidden rows. A row's auto-preview runs when the row scrolls into view, so rows revealed by `Show all` preview as they enter." The panel's per-component pattern rows (ComponentDetail, Motion) are few and keep showing all.
- `docs/design/components.md`, EvidenceTable: "Six rows by default, in the document's order; beneath, inside the Card, a ghost Button `Show all {n} near-duplicates` that expands the table (the row motion of the ChecksTable) and reads `Show fewer` when open." The cap of 40 stored rows (D-077) is unchanged; `{n}` is the stored count.
- `docs/design/copy.md`, Show all: add `Show all {n} patterns` · `Show all {n} near-duplicates`; `Show fewer` is shared with the keyframes list.
- `docs/design/pages.md`, Run page: the Motion and Drift sentences say six then `Show all`.
- `strings.ts` transcribed from copy.md; the RegionSkeleton's patterns height (the `MOTION.patterns` constant, D-098) re-measured for six rows at the three breakpoints and the ±4 px test updated; the catalog `pattern-list` demo gains a state with more than six patterns (the owner's site's first twelve from the P18 real-site run are fine as data) and the `evidence-table` demo, or the drift demo, a state with more than six rows.
- Keep both buttons out of the way under reduced motion (no stagger, rows appear at once) and keep focus on the button after it toggles, as the KeyframesList does.

Verify: unit or e2e, `tests/e2e/v13.spec.ts` or a new spec: the Patterns card shows six rows then all `{n}` after `Show all`, collapses on `Show fewer` with focus on the button and no row still playing; the Evidence table the same; the skeleton shape test holds the new height; `pnpm qa:copy` with the new strings; `qa:visual` goldens updated once for the Motion and Drift sections and the catalog states, reviewed at 1440, 820 and 390 and logged in STATUS; `env DSE_MODEL_MODE=replay pnpm verify:all` green on a clean tree.

Commit as `Fix · Patterns and near-duplicates show six rows then Show all`. Update STATUS. Never push.
