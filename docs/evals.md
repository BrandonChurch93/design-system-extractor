# Evals

Five fixture sites with known expected results are the proof that the pipeline works, the safety net for every change, and the numbers the How it works page shows. A sixth fixture seeds the local showcase and the Compare page and is not scored. They are built in P3 and never edited afterward except to fix a fixture defect (logged as a decision), because every later phase's thresholds depend on them.

## The fixture sites

Static sites in `fixtures/sites/{name}/` with an `index.html` and the pages below, served at `http://localhost:4100/sites/{name}/` by `pnpm fixtures:serve` (the crawler scopes a run to that path prefix, see `docs/specs/crawler.md`). Each has `expected.json` describing pages, tokens, components, planted check failures and planted drift. Each uses only self-hosted fonts (one open font family checked into `fixtures/fonts/`, served at `http://localhost:4100/fonts/`) so results are deterministic. All six share the host `localhost:4100`, which is what lets Compare treat `messy` and `messy-after` as two runs of one site.

### 1 · clean

A small, well-kept SaaS marketing site: home, pricing, features, signup, login, docs index, one docs page, contact, 404 (served as a real 404). Nine colors (navy, blue, teal, success, warning, danger, three neutrals: white, `#E2E8F0`, and `#5F6368` for secondary text since v1.1, D-090), a 4 px grid, one radius scale, two shadows. Components: top nav (with scrolled state), footer, primary, secondary and ghost buttons in two sizes, text input with label and error instance, select, checkbox, toggle, pricing card (two variants), feature card, status badge (three semantic variants), data table, breadcrumb, tabs, code block, alert, empty state (on 404), an avatar, a dropdown menu with a trigger, and a mobile menu button. One disabled button instance, one `aria-invalid` input instance. Everything passes every check except two planted failures: one icon-only button without a name, and one caption-size text at 4.18:1, shown as 4.1:1 (the "New" tag, white on teal, D-046).

No drift, which means the fixture must satisfy every rule in `docs/specs/drift.md` by construction: no two neutrals within ΔE 6 and no two same-hue chromatics within ΔE 8 (so hover and active colors must differ from their rest colors by more than that, or reuse an existing token), no two on-grid spacing steps within 4 px that are both under 5% of usage, no component variants within the collapse tolerances, no two type styles within 1 px of size or 2 px of line height at the same size, at most 4 radii and 3 shadows. The fixture author checks these numbers before P3 closes.

Motion and naming layer (v1.1, D-081 to D-088), built to be scored exactly: three transition durations (120, 160, 240 ms) and two easings, one declared as `--ease-out-quart` and used through `var()`, one written inline as `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out-quad), and every transition and animation on the site uses one of the two; one `@keyframes` block used by a hero entrance (`fade-up`, opacity 0 → 1, translateY 12px → 0, 480 ms); a scroll reveal on the three feature cards implemented with IntersectionObserver adding `.is-visible` at 15% root margin and a CSS transition, staggered 60 ms with `transition-delay`; one `requestAnimationFrame` script that reveals the testimonial card by writing inline opacity and transform over 400 ms (the inline-style path); one infinite loop (a pulsing dot, 1,600 ms); a button hover that transitions `background-color`, `transform` (translateY(-1px)) and `box-shadow` over 160 ms, on every variant, since the component's states come from its first-seen instance, the header's ghost button (D-090); an `outline: none` element with no focus outline (must produce no outline delta); four equal border side colors on hover (must collapse). Its duration tokens are therefore 120, 160, 240, 480 and 1,600 ms (delays are not durations, D-089). It also gains a site-variable layer: `--color-text-primary`, `--color-text-secondary`, `--radius-rounded`, `--text-small-size`, `--shadow-stack-low`, used by the components, plus one hashed variable `--sx-1fj52yw` that must never become a name; two overlays (`rgba(255,255,255,0.08)`, `rgba(8,9,10,0.6)`); one max-width twin breakpoint (1281 next to 1280); two ghost buttons differing only in radius (must name `Ghost` and `Ghost rounded`); one button that appears only in the footer on one page (must be `page` tier and named `Button (footer)` by the fallback). The tailwind and css-in-js fixtures carry the same motion layer, built from the same source. All of it keeps the no-drift constraints above.

Skip link (v1.3, D-108): `a.skip-link`, the `sr-only` pattern with a `:focus` reveal, first in `body`, so the hidden-until-focus rule is proven in replay: the expected components are unchanged in count (the skip link is a `link` the fixture already counts, or the expectation is re-derived and logged), and its preview is `captured` with reason `hidden-until-focus`. tailwind and css-in-js share it, built from the same source.

Proves: tokens extract exactly, every state is captured, previews render live, no false drift, the planted check failures are found, the motion layer is read and observed, the site's names win, overlays split, names are never numeric, a component hidden until focused previews its focus state.

### 2 · messy

The same site rebuilt badly: 14 grays, 3 blues within ΔE 4, two off-grid spacing values (10 and 18), button variants that differ by 1 px padding and 2 px radius, two type styles 1 px apart, a consent banner on load, a third-party script tag (blocked by the tracker list), and five planted check failures (contrast on a badge, `outline: none` on a link, a 36 px tap target, a placeholder-only input, an animation with no reduced-motion rule), plus the two it inherits from the clean pages it is built from, seven in all (D-046). In v1.1 it also gains nine durations and seven easings (motion sprawl), a 7,000-character `unset` reset on one component, three translucent grays (overlays, not grays), and type tuples that would have been named `other`. It also carries the capture and preview test material: a signup form that sets `data-submitted` on submit (must stay unset), a contact-page button that calls `confirm()` (must be auto-dismissed), and one component whose CSS depends on a background image that sanitization strips, so its preview must be `captured` with the `diff` reason.

Proves: drift findings have 100% recall, the consent banner is dismissed, the tracker is blocked, planted failures are all found, no planted pass is flagged, forms are never submitted, dialogs are dismissed, an unfaithful preview is detected.

### 3 · tailwind

The clean site's design implemented with Tailwind utility classes, compiled CSS committed (built once with `pnpm fixtures:build` in P3; the compiled file is the fixture). Includes a dark variant stylesheet under `prefers-color-scheme: dark` (to exercise dark theme detection) that is not extracted.

Proves: utility classes cluster to tokens, `tailwind` framework hint, dark theme detected, the Tailwind code tab appears in the panel.

### 4 · css-in-js

The clean site with every class name hashed (`css-1a2b3c4`, `sc-AxjAm`), inline `style` attributes on some elements, and custom properties for colors (`var(--c-primary)`), pre-rendered as static HTML.

Proves: hashed classes do not break clustering, custom properties resolve, the `css-in-js` hint, live previews still work through matched CSS.

### 5 · library

A site built on an MIT component library's CSS (vendor a small one, for example Pico CSS or Bulma, with its real class names) using its buttons, forms, cards, tables, tags and navbar. The fixture uses Bulma 1.0.4 with a small brand layer of its own, as a real site would (44 px controls, paddings on the 4 px grid, one light gray, one border gray, one link blue, visible focus rings, three shadows), because stock Bulma's computed shades and paddings fall inside the drift tolerances and this fixture must show no drift. Planted failures: a light gray footer caption, an icon button without a name, and Bulma's 13 px native checkbox (D-046).

Proves: components map to recognizable names, library-style selectors scope correctly in previews.

### 6 · messy-after (not scored)

The messy site with roughly half of its drift fixed: grays reduced from 14 to 9, the off-grid spacing kept, two button variants collapsed, two of the five planted failures fixed, and a toast and a stepper component added. It exists so `pnpm db:seed:fixtures` yields six showcase entries (no orphan grid rows) and so the Compare page has a real before-and-after pair on one host. It has no `expected.json` thresholds; the Compare e2e test asserts the expected deltas (grays 14 → 9, two new components, one collapsed variant pair, checks passed increasing by exactly the two fixes; since v1.2 the dark band below adds one gray and three components, so it reads grays 14 → 10 and five new components).

Since v1.2 it also carries the halo material (D-094): a dark-ground section, a `#0B0D10` band holding a rounded primary button and a card, so a preview on a dark ground can be seen with no halo. It is not scored, so no `expected.json` or eval recording is re-derived; its extra recordings are re-recorded with `scripts/record-extra.ts messy-after` (with `--keep`, answers already recorded replay and only the misses call the model, so one changed request does not re-ask selection), and its seed, its showcase entry, the goldens that show it and the Compare e2e's expected deltas are re-checked and updated once if the band changes them, logged in STATUS.

## expected.json

```
{
  "pages": [{ "path", "reason" }],
  "tokens": {
    "colors": [{ "value", "group", "minUsage" }],
    "type": [{ "role", "size", "weight", "name" }],
    "space": { "base": 4, "steps": [4, 8, 12, 16, 24, 32, 48, 64, 96], "offGrid": [] },
    "radius": [4, 8, 12, 999],
    "shadowCount": 2,
    "breakpoints": [640, 1024]
  },
  "components": [{ "type", "name", "page", "bbox": {x, y, w, h}, "viewport": "desktop", "variants": 3, "states": ["default","hover","focus","active","disabled"] }],
  "checks": { "plantedFailures": [{ "component", "check", "detailContains" }], "plantedPasses": [...] },
  "drift": { "nearDuplicateColors": [["#6B6B6B","#6E6E6E"]], "offGrid": [10, 18], "variantCollapses": [{ "component": "Button", "count": 2 }], "typeNearDuplicates": [[14, 15]], "expectNone": false },
  "previews": { "minLiveRate": 0.9, "captured": [{ "name": "Promo card", "reason": "diff" }] },
  "motion": {
    "durations": [{ "name", "ms" }], "easings": [{ "name", "value" }], "keyframes": ["fade-up"],
    "patterns": [{ "kind", "trigger", "start": {}, "end": {}, "durationMs", "easing": "ease-out-quart" | null, "stagger": { "count", "stepMs" }, "observed" }],
    "hover": [{ "component", "properties": ["background-color", "transform", "box-shadow"] }], "noOutline": ["component"], "collapsedBorder": ["component"]
  },
  "siteVariables": { "named": { "text-primary": "--color-text-primary" }, "hashed": ["--sx-1fj52yw"] },
  "overlays": [{ "name", "base", "alpha" }],
  "tiers": { "Button": "core" },
  "variantNames": [{ "component", "names": ["Ghost", "Ghost rounded"] }],
  "fallbackNames": [{ "component", "name": "Button (footer)" }],
  "noNumericNames": true
}
```

Pattern durations match within ±40 ms; components are named by their expected `name` and matched as in Metrics. Pages are listed in capture order. A component's `page`, `viewport` and `bbox` are its first-seen instance (capture order, desktop preferred) in document CSS px; `states` lists the states the capture spec takes for it; variants never count state-driven styles (selected, current, checked, invalid or disabled instances supply a state); the interactive items of a composite (tab buttons, pagination links) are components of their own; planted check entries name expected components (D-047). `scripts/test/expected.test.ts` checks these rules on every file.

## Metrics

Computed by `pnpm evals` into `fixtures/results.json` with a per-fixture row:

- **Token precision and recall**: a predicted color matches an expected one when ΔE ≤ 2 and the group matches; type by role, size (±0.5) and weight; space, radius and breakpoints exact; shadow by count.
- **Component precision and recall**: a predicted component matches when type matches and the bbox IoU of its first-seen instance against the expected bbox is ≥ 0.5 at the same viewport. Name is reported but not scored (names come from a model; the eval records agreement as a separate number).
- **Variant accuracy**: expected variant count matched exactly, per matched component.
- **State capture rate**: captured states / expected states, over matched components.
- **Check accuracy**: planted failures found / planted; planted passes not flagged / planted. Both must be 100%.
- **Drift recall**: planted findings found / planted; **false drift**: findings on `expectNone` fixtures (must be 0; raw-spread evidence rows are not findings).
- **Preview live rate**: live components / components. On the How it works page this is shown as "Live previews" with the counts, "38 of 46". A component listed under `previews.captured` (the messy fixture's planted promo card) must come out captured with that reason, or the metric fails. On a real site (the P17 real-site check, not an eval fixture) the rate is counted over the components whose preview was checked, `not-checked` excluded with its count stated (D-095). A `hidden-until-focus` preview counts as checked (its focus crop is what a reader is meant to see); a `no-crop` preview, which has no reference to check against, is excluded like `not-checked` with its count stated (D-108, D-110).
- **Selection exactness**: selected pages equal expected pages.
- **Motion** (v1.1): duration and easing token recall (by value, and by name where `expected.json` names it); keyframes recall by name; pattern recall with kind and trigger type exact, duration within ±40 ms and the `observed` flag exact; hover delta completeness over the planted properties, each carrying its transition timing; outline-noise entries (outline entries on a planted `outline: none` element) must be 0.
- **Naming** (v1.1): site-variable naming over the planted variables; tokens named by a hashed variable (must be 0); overlay split (every expected overlay found with its base and alpha, and no translucent value in the palette); type role names against the `name` of each `tokens.type` entry, with no token named `other`; variant names on the planted pairs; component and variant names ending in a digit (must be 0); tier assignment against `tiers`. Fallback names are scored by `pnpm evals --fallback`; tiers are not, since a fallback run never merges clusters by name across pages and tiers follow that merge (D-090).
- **Export integrity** (v1.1): every export of every fixture run (both sets, every format and every component prompt) names no `var(--` that the same export does not declare; and the prompt has a Motion section, a Site variables block, a Default line for every component and its core components before the page-specific ones (docs/plan.md, Definition of Done 11; D-090).

## Thresholds (the floor)

| Fixture | Tokens P / R | Components P / R | Variants | States | Checks | Drift recall · false | Live rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| clean | 1.00 / 0.98 | 0.95 / 0.95 | 0.95 | 0.95 | 100% · 100% | n/a · 0 | 0.90 |
| messy | 0.97 / 0.98 | 0.90 / 0.90 | 0.90 | 0.90 | 100% · 100% | 100% · n/a | 0.85 |
| tailwind | 0.98 / 0.96 | 0.92 / 0.90 | 0.90 | 0.90 | 100% · 100% | n/a · 0 | 0.90 |
| css-in-js | 0.96 / 0.95 | 0.88 / 0.87 | 0.85 | 0.90 | 100% · 100% | n/a · 0 | 0.85 |
| library | 0.99 / 0.97 | 0.95 / 0.93 | 0.90 | 0.90 | 100% · 100% | n/a · 0 | 0.90 |

Motion, naming and export integrity (v1.1), on every fixture where the column applies (a fixture without the planted item reports n/a):

| Metric | clean | messy | tailwind | css-in-js | library |
| --- | --- | --- | --- | --- | --- |
| Duration and easing recall | 100% | 100% | 100% | 100% | 100% |
| Keyframes recall | 100% | 100% | 100% | 100% | 100% |
| Pattern recall | 0.90 | 0.90 | 0.90 | 0.90 | n/a |
| Hover delta completeness · outline noise | 100% · 0 | n/a | 100% · 0 | 100% · 0 | n/a |
| Site-variable naming · hashed names | 100% · 0 | n/a · 0 | 100% · 0 | 100% · 0 | 100% · 0 |
| Overlay split | 100% | 100% | 100% | 100% | 100% |
| Type roles · named `other` | match · 0 | match · 0 | match · 0 | match · 0 | match · 0 |
| Variant names on planted pairs | match | n/a | match | match | match |
| Numeric names | 0 | 0 | 0 | 0 | 0 |
| Export variable resolution | 100% | 100% | 100% | 100% | 100% |
| Tiers | match | match | match | match | match |

Live rate (v1.2, D-095): at least 85% on the clean, tailwind and css-in-js fixtures, keeping the existing floor where it is already higher (clean and tailwind stay at 0.90; css-in-js rises from 0.75 to 0.85). On real sites, at least 70% on each of the three sites of the P17 real-site check, counted over the checked components, with the per-reason counts pasted into STATUS; a real site below 70% passes only when every remaining captured preview on it has a named cause that `preview-fidelity.md` (Why previews fall back, measured) lists as out of scope (a background video, a canvas, a third-party embed), with the counts.

The site names of the tailwind (its `@theme` variables), css-in-js (its `--c-*` variables) and library (Bulma's `--bulma-*`) fixtures are expected too: they are the sites' own names. The library's planted pair is its pagination links, `Outlined wide` and `Outlined tight` (D-052).

Selection exactness is 100% on all five. The `pnpm evals` command fails if any cell is below its floor. With `--through <stage>` it scores only the metrics available up to that stage (selection through `capture`; tokens through `tokens`; components, variants and states through `components`; live rate through `previews`; checks through `checks`; drift through `drift`) and reports the rest as not yet measured. The How it works page shows the current numbers from `results.json`, never these floors.

## Document upgrades and the Motion loops (v1.2)

- `packages/pipeline/test/fixtures/runs/clean-v1-0.json` is a complete v1.0 document of the clean fixture, produced by checking out `0ff300f` in a worktree and running the clean fixture through it in replay (D-092). `upgradeRunDocument` is tested against it (the result parses as `RunDocumentComplete`, upgrading twice equals upgrading once, component token references still resolve), and against every v1.0 document in the local database by `pnpm runs:parse --all`.
- The seed stores that document as the complete run `seedv10cln` (its storage files are the clean seed run's, copied under its id), and a Playwright test opens Compare with it against `seedclean0` and asserts every row renders, the Motion rows included, which read `0` for the old run; `/r/seedv10cln` renders.
- The catalog has a sample run with 12 easings (no fixture has more than seven), and a Playwright test asserts no long task over 50 ms while the grid loops with all 12, that the loops pause off screen, that every card's animations share one start time, and that under reduced motion the dot does not move.

## Visual regression

`pnpm qa:visual`: Playwright screenshots of every page and state at 1440 × 900, 820 × 1180 and 390 × 844, compared with committed goldens in `apps/web/test/goldens/` using a 0.1% pixel threshold with anti-aliasing ignored. The first run of a page generates its golden; from then on a diff fails the gate and an intentional update requires a line in STATUS saying which page changed and why. Goldens use fixture runs seeded by `pnpm db:seed:fixtures`, so they are deterministic. The run page goldens change once in P16 (the Motion section) and the update is logged. Before any shot, QA waits for every preview frame and crop on the page to fire `load` (PreviewFrame's `data-loaded`), and a shot whose live preview region is one flat fill fails: the frame had not painted. The run page states include a card hovered (its frame's root in the site's hover state) and the drawer scrolling a component wider than its stage (D-112).

## Design QA

`pnpm qa:design` writes the same screenshots plus every state (hover and focus captured by Playwright actions, the in-progress page at three poll stages, the panel open, the sheet open at 390, every state route, the catalog) into `qa/{page}/{viewport}/{state}.png` and a `qa/index.html` contact sheet. This is what the self-review looks at. It is not a test; it is the evidence the gate requires you to look at.

## Accessibility and performance

- `pnpm qa:axe`: axe-core on every page and state, zero violations, including the in-progress face and the open panel.
- `pnpm qa:lighthouse`: Home and a complete fixture run page, mobile and desktop presets: performance ≥ 90, accessibility 100, best practices 100, SEO 100.

## Model recordings

`pnpm evals` forces `replay` regardless of `.env.local`; only `env DSE_MODEL_MODE=live pnpm evals` or `env DSE_MODEL_MODE=record pnpm evals` on the command line overrides it. In replay, a recording miss fails the eval run and names the call, so a changed prompt is noticed. Recordings for the fixtures are made with `record` once per phase that adds a model call (P3, P4, P5, P8), and refreshed by the final live eval in P15. Recording spend is part of the $20 dev cap, with $4 reserved for P15. If a prompt changes after its recording, re-record. `pnpm evals --fallback` makes every model call fail, so each step takes its deterministic fallback; it spends nothing, leaves `results.json` unchanged, and is how the fallback gates (P4 naming, P5 components, P8 narrative) are checked (D-051). `pnpm evals --prune-recordings` deletes recordings that a full replay did not read (D-052). `fixtures/results.json` holds the final live run (P15, refreshed in P16), which the How it works page shows; a replay scores against the thresholds and keeps those results, and a `record` run counts as live because its calls are (D-080, D-090).

## Deterministic seeds and frozen partial documents

`pnpm db:seed:fixtures` makes goldens and QA screenshots deterministic: it runs the six fixtures through the queue, each created with its fixed id (storage keys embed the run id, so it is set at creation rather than rewritten, D-057) (fixed ids `seedclean0`, `seedmessy0`, `seedtailw0`, `seedcssin0`, `seedlibra0`, `seedmafter`, ten characters each like every run id, D-032), then rewrites `createdAt`, `startedAt`, `finishedAt`, `durationMs`, `cost` and the event times to fixed values from `fixtures/seed.json` (dates in October 2026, so the Compare title reads a fixed span). It also stores three frozen in-progress documents for the clean fixture (after `select`, after `tokens`, after `components`) as runs `seedprog01`, `seedprog02`, `seedprog03` with status `running` and the column `qa_frozen = true`; the worker never picks a frozen run up, `/api/health` ignores them, and `GET /api/runs/{id}` serves them as they are, so the in-progress face can be screenshotted at three stages. `qa_frozen` runs exist only in development and test databases. The seed also stores two runs the worker ends blocked (`seedlogin0`, a login wall; `seedblock0`, a bot challenge) and four QA-only `qa_frozen` documents for the remaining run states (`seedqueue0` queued, `seedfail00` failed, `seedcanc00` cancelled, `seedspars0` sparse) (D-058).
