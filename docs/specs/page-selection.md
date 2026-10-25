# Page selection

Stage `select`. Turns the page-candidate list into the pages to capture, within the page cap, maximizing the variety of interface on them. "Important" pages are not the goal; pages that carry distinct components are.

## Reason keys

The `PageReason` enum (`packages/schema/src/enums.ts`): `home`, `nav`, `footer`, `sitemap`, `forms`, `forms-errors`, `tables-toggles`, `code-blocks`, `list-template`, `post-template`, `badges-timeline`, `empty-state`, `about`, `careers`, `app`, `added`, `template`. The `template` reason carries `{group, size}`. Display labels are in `docs/design/copy.md`.

## Scoring, two passes

**Pre-score** (before template fingerprinting, used to pick the 60 candidates to fingerprint): path patterns, source bonus, depth penalty.

**Final score** (after fingerprinting): the pre-score plus the template bonus and the fetch-failure penalty, applied to group representatives only.

Path patterns (first match wins within a row; rows add):

| Pattern | Score | Reason |
| --- | --- | --- |
| root `/` | +3, mandatory | `home` |
| `/(pricing|plans|plan)\b` | +3 | `tables-toggles` |
| `/(signup|sign-up|register|get-started|start|trial)\b` | +2 | `forms` |
| `/(login|signin|sign-in)\b` | +2 | `forms-errors` |
| `/(contact|demo|request-demo|support)\b` | +2 | `forms` |
| `/(features|product|platform|solutions)\b` | +2 | `nav` |
| `/(docs|documentation|developers|api|reference|guides)\b` index | +2 | `code-blocks` |
| one docs page (deepest in group) | +1 | `code-blocks` |
| `/(blog|news|articles|journal)\b` index | +1 | `list-template` |
| one blog post | +1 | `post-template` |
| `/(changelog|updates|releases)\b` | +2 | `badges-timeline` |
| `/(about|team|company)\b` | +1 | `about` |
| `/(careers|jobs)\b` | +1 | `careers` |
| `/(settings|dashboard|app)\b` reachable without login | +1 | `app` |
| synthetic 404 | +2 | `empty-state` |
| visitor include | +10 | `added` |

Source bonus: header nav +1, footer nav +0.5, sitemap +0, body link +0.
Depth penalty: −0.5 per path segment beyond the first.
Template bonus (final score only): a group representative gets +0.5 if the group has 10 or more members.
Fetch failure during fingerprinting (final score only): −5.

The reason shown is the matched row's reason. A candidate that matched no row shows its source as the reason (`nav`, `footer`, `sitemap`). A template representative shows `template` with its group name and size.

## The model pass (Haiku)

Input: the top 30 candidates by final score as a compact table: path, title, h1, source, score, template group and size, reason. The page cap. The rule set in the prompt: choose up to the cap, home is mandatory, visitor includes are mandatory, prefer coverage of distinct interface (forms, tables, lists, code, empty states, marketing) over importance, never choose two pages of one template group, prefer a shorter path when two candidates would add the same kind of interface.

Output: a JSON array of candidate ids in display order, validated with Zod: subset of the input, contains home and includes, length ≤ cap, no duplicates, at most one per group. Any validation failure, model error, or timeout (10 s) falls back to the deterministic top-N by final score with the same constraints applied. The log line says which path was taken: `select · model picked 12` or `select · fallback ranking picked 12`.

Cost: about 1.5k input tokens, 100 output. Prompt caching on the rule set.

## Ordering

Pages are captured and shown in this order: home first, visitor includes next, then by final score descending. The order is stored on `run_pages.order`.

## Edge cases

- Fewer candidates than the cap: capture all that pass exclusions.
- A single-page site: capture home at both viewports; the run proceeds and is likely sparse.
- A site whose sitemap lists thousands of pages: the 300 candidate cap and template folding keep the fingerprint fetch to 60; the model sees 30.
- Hash routers (`/#/pricing`): fragments are stripped during normalization, so such sites get the home page only. Logged as `select · hash router, home only`.

## Tests

- Unit tests for both scoring passes on a synthetic candidate list covering every row.
- Replay tests for the model pass with a recorded response, plus a malformed-response test that asserts the fallback.
- Each fixture site has an expected page set in its `expected.json`; the eval asserts the selection matches exactly.
