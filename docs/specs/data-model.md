# Data model

Postgres with Drizzle. The run document is the center; tables around it exist for querying, retention and events. Every shape below is defined once in `packages/schema` and used by every package.

## Tables

### `runs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | 10-char nanoid, alphabet `0-9a-z` |
| `url` | text | the URL as submitted, normalized |
| `host` | text | normalized host (`www.` stripped) |
| `status` | enum | `queued` · `running` · `complete` · `blocked` · `failed` · `cancelled` |
| `blocked_reason` | enum, null | `bot` · `login` · `unreachable` · `robots` · `budget` · `busy` · `visitor-cap` · `invalid-url` · `private-address` |
| `blocked_detail` | jsonb, null | the attempt log shown on the state page |
| `owner_id` | text, null | v2 seam (D-009). Always null in v1. |
| `visitor_id` | text | the `dse_v` cookie value |
| `byo_key` | boolean | the run used the visitor's key |
| `priority` | int | 0 default; v2 seam |
| `page_cap` | int | 12 or 40 |
| `include_urls` | text[] | visitor-added URLs |
| `viewports` | text[] | `['desktop','mobile']` |
| `pipeline_version` | text | semver of `packages/pipeline` |
| `document` | jsonb | the run document, partial while running |
| `stats` | jsonb, null | `{colors, typeStyles, spacingSteps, components, checksPassed, checksApplicable}` |
| `cost` | jsonb, null | `{inputTokens, outputTokens, usd, calls}` |
| `framework_hint` | text, null | `tailwind` · `bootstrap` · `mui` · `chakra` · `css-in-js` · null |
| `is_showcase` | boolean | listed on the home page |
| `unpublished` | boolean | removed by the owner; `GET /api/runs/{id}` returns 404 (D-034) |
| `created_at` · `started_at` · `finished_at` | timestamptz | |
| `duration_ms` | int, null | |
| `retention_until` | timestamptz | created + 90 days; showcase runs null |
| `qa_frozen` | boolean | development and test only: a seeded in-progress document the worker never processes (`docs/evals.md`) |

Indexes: `host`, `visitor_id, created_at`, `status`, `retention_until`.

### `run_pages`

`id` (text), `run_id` FK, primary key (`run_id`, `id`) (D-033), `url`, `path`, `reason` (`PageReason`), `template_group` (text, null), `template_size` (int, null), `selected` boolean, `order` int, `status` (`pending` · `captured` · `failed`), `node_count` int, `capture_desktop_key`, `capture_mobile_key` (storage keys for full-page screenshots), `title`, `h1`.

### `run_events`

`id` serial, `run_id`, `ts`, `stage` enum (the canonical stage list), `substage` text null, `level` (`info` · `warn` · `error`), `message` text (the live log line as shown), `data` jsonb null. Indexed by `run_id, id`.

### `visitors`

`id` text PK, `first_seen`, `last_seen`, `runs_total` int. Daily counts live in Redis; this table exists for the v2 claim flow.

### V2 seams (tables present, unused in v1)

`users` (`id`, `email`, `created_at`), `subscriptions` (`id`, `user_id`, `provider`, `provider_ref`, `plan`, `status`, `current_period_end`). Migrations create them in P1 so the v2 migration is a column or two, not a reshape. No v1 code writes to them. See `docs/specs/v2-seams.md`.

## The run document

`packages/schema/src/run-document.ts`. Top level:

```
{
  id, url, host, status, blockedReason?, blockedDetail?,
  failedDetail?, createdAt, startedAt?, finishedAt?, durationMs?, pipelineVersion,
  viewports: Viewport[], frameworkHint?, darkThemeDetected: boolean, sparse: boolean,
  pages: Page[],
  tokens: { colors: ColorToken[], overlays: OverlayToken[], type: TypeToken[], space: SpaceToken[], spaceBase: { value: 4 | 8, clear: boolean }, radius: RadiusToken[], shadow: ShadowToken[], duration: DurationToken[], easing: EasingToken[], keyframes: Keyframes[], breakpoints: BreakpointToken[], siteVariables: SiteVariable[], rawCounts: { colors, fontDecls, spacingValues, radii, shadows }, families: { name, loaded: boolean, fallback?: string }[] },
  motion: { patterns: MotionPattern[], truncatedPages: string[], intersectionObservers: number },
  components: Component[],
  checks: { summary: { passed, failed, total, applicable }, byCheck: CheckSummary[] },
  drift: Drift,
  exports: { designSystemIntro?: string, designSystemMd?: string, promptMd?: string },
  cost: Cost,
  stats: Stats,
  local?: { base: string }
}
```

`CheckSummary = { check (Check enum), passed, applicable, failing: { componentId, name, detail }[] }`. `local` is set only by `dse serve` for a run opened through `/open`. `blockedDetail` is `{ attempts: { url, status, marker?, retries }[], robots?: string }` for `bot` and `robots`, `{ redirectedTo? }` for `login`, `{ used, budget, runsToday, resetsAt }` for `budget` (dollars spent, the daily budget, runs created today site-wide) and `visitor-cap` (the visitor's runs, the runs per day, the visitor's runs, D-057), `{ queued }` for `busy`, and `{ reason: string }` otherwise.

Sections are optional while running and required when complete; the schema has `RunDocumentPartial` and `RunDocumentComplete`.

### Page

`{ id, url, path, reason, templateGroup?, templateSize?, title, h1, nodeCount, status: PageStatus, failedReason?, captures: { desktop?: CaptureRef, mobile?: CaptureRef } }` where `CaptureRef = { screenshotKey, width, height }`. Captures are present once the page is captured; `status` lets the in-progress PagesCard mark rows captured.

### Tokens

- `ColorToken`: `{ id, name, siteName?: string, value (hex, uppercase, opaque: a color with alpha below 1 is an overlay, D-086), oklch: {l, c, h}, group: 'brand' | 'neutral' | 'semantic', semanticRole?: 'success' | 'warning' | 'danger' | 'info', usage: number, uses: { text, background, border, other }, pages: { pageId, count }[], rawValues: { value, count }[], contrastPairs: { fg, bg, ratio, large, where }[] }` where `fg` and `bg` are color token ids and `large` marks text at the large-text size (threshold 3:1)
- `OverlayToken`: `{ id, name, siteName?: string, base: tokenId | 'white' | 'black', alpha: number, value, usage, pages, rawValues: { value, count }[] }`, where `value` is `rgb(r g b / a%)` (D-086)
- `TypeToken`: `{ id, name, siteName?: string, role: TypeRole, family, fallbackStack, size, lineHeight, weight, letterSpacing, textTransform?, uppercase: boolean, tags: string[], usage, pages, sample }`, where `tags` are the HTML tags the tuple was found on, most common first, shown as provenance and never used for naming (D-087)
- `SpaceToken`: `{ id, value, siteName?: string, onGrid: boolean, usage, pages, contexts: { padding, margin, gap, layout } }`
- `RadiusToken`: `{ id, value, siteName?: string, isPill: boolean, usage, pages }`
- `ShadowToken`: `{ id, name: 'sm' | 'md' | 'lg' | string, siteName?: string, value, usage, pages }`
- `DurationToken`: `{ id, name, siteName?: string, ms, role?: 'faster' | 'fast' | 'base' | 'slow' | 'slower', usage, pages, rawValues: string[] }`
- `EasingToken`: `{ id, name, value, siteName?: string, usage, pages }`
- `Keyframes`: `{ name, css, condition?: string, used: boolean, usage, pages, unresolved: string[] }`, where `condition` is the `@media` or `@supports` condition the block sat in
- `BreakpointToken`: `{ value, usage, maxTwin?: number, siteName?: string }`, where `maxTwin` is the max-width value one away from this one, folded in and not exported (D-089, D-090)
- `SiteVariable`: `{ name, value, resolved, kind?: TokenKind, mapsTo?: tokenId, hashed: boolean, usage, pages, scope: 'root' | 'theme' | 'component' }`
- `MotionPattern`: the shape in `motion-capture.md` (Classification into patterns)

`pages` on every token kind is `{ pageId, count }[]`, as on colors.

### Component

```
{
  id, name, type (ComponentType), group (ComponentGroup),
  confidence: number,
  signature: { tag, role?, classTokens: string[], structure: string, styleHash },
  variants: Variant[],
  instances: Instance[],
  provenance: { firstSeen: { pageId, path, viewport, selector, bbox, sourceCrop?: { key, width, height, outline: bbox } }, pages: { pageId, path, count }[] },
  states: StateCapture[],
  tokensUsed: { tokenId, property }[],
  unmapped: { property, value }[],
  preview: Preview,
  code: { html: string, css: string, tailwind?: string },
  checks: CheckResult[],
  responsiveVariant?: { mobilePreview: Preview, note: string },
  borderWidth?: number,
  tier: ComponentTier,
  slug: string,
  motion: ComponentMotion | null
}
```

`slug` is the kebab case of the name, unique in the run, used by `motion.css` and the prompt. `borderWidth` is the first-seen instance's border width in px when it has a visible border, which the exports' Default line names (D-090). `tier` follows the rule in `component-detection.md` (D-085). `ComponentMotion = { transitions: { state: State, property, durationMs, delayMs, easingTokenId?: string, easing?: string }[], animations: { keyframesName, durationMs, easingTokenId?, easing?, iterations: number | 'infinite', trigger: MotionKind }[], patternIds: string[] }`; `motion` is null when the component has no transitions, no animations and no patterns (`motion-capture.md`).

- `Variant`: `{ id, name, instanceIds: string[], delta: { property, value }[], preview: Preview }`
- `Instance`: `{ id, pageId, viewport, selector, bbox: {x, y, w, h}, variantId, text? }`
- `StateCapture`: `{ state (State enum), captured: boolean, reason?: string, cropKey?, delta: { property, from, to, transition?: { durationMs, easing } }[], reachedByKeyboard?: boolean, instanceId? }`, the delta over the property set in `capture-and-states.md` (D-088)
- `Preview`: `{ mode: PreviewMode, capturedReason?: CapturedReason, cropKey, width, height, diffPct?: number, htmlKey?: string, stateHtmlKeys?: Record<State, string> }`, with `width` and `height` in CSS px (the instance's box when live, the crop's size when captured)
- `CheckResult`: `{ check (Check enum), status: 'pass' | 'fail' | 'na', detail: string, measured?: Record<string, number | string>, variantId? }`

Enums (`packages/schema/src/enums.ts`), every one with a Zod enum and a label map entry: `RunStatus`, `BlockedReason`, `Stage` (`queue`, `discover`, `select`, `capture`, `tokens`, `components`, `previews`, `checks`, `drift`, `exports`, `done`), `Substage` (`tokens:palette`, `tokens:type`, `tokens:space`, `tokens:motion`), `EventLevel` (`info`, `warn`, `error`), `Viewport`, `PageReason` (`home`, `nav`, `footer`, `sitemap`, `body`, `forms`, `forms-errors`, `tables-toggles`, `code-blocks`, `list-template`, `post-template`, `badges-timeline`, `empty-state`, `about`, `careers`, `app`, `added`, `template`), `PageStatus`, `FrameworkHint` (`tailwind`, `bootstrap`, `mui`, `chakra`, `css-in-js`), `TokenKind` (`color`, `type`, `space`, `radius`, `shadow`, `breakpoint`, `duration`, `easing`), `ColorGroup` (`brand`, `neutral`, `semantic`), `SemanticRole` (`success`, `warning`, `danger`, `info`), `TypeRole` (`display`, `title`, `heading`, `subheading`, `body`, `body-sm`, `label`, `eyebrow`, `caption`, `code`, `text`; D-087), `ComponentType`, `ComponentGroup`, `State`, `PreviewMode` (`live`, `captured`), `CapturedReason` (`diff`, `css-too-large`, `fonts-unavailable`, `not-checked`), `Check`, `CheckStatus` (`pass`, `fail`, `na`), `DriftKind` (`grays`, `variants`, `spacing`, `type`), `EvidenceKind` (`color`, `variant`, `spacing`, `type`, `sprawl`), `PlanId`, `ExportFormat` (`tokens.css`, `tokens.json`, `tailwind.tokens.js`, `tokens.w3c.json`, `design-system.md`, `prompt.md`, `component-prompt.md`, `motion.css`, `motion.json`, `all.zip`), `MotionKind` (`entrance`, `scroll-reveal`, `scroll-progress`, `scrolled-header`, `hover`, `loop`, `open`), `MotionSource` (`css-transition`, `css-animation`, `waapi`, `inline-style`), `ComponentTier` (`core`, `page`). The UI reads labels for every enum value from one map in `packages/schema/src/labels.ts` so copy stays in one place (the values are in `docs/design/copy.md` under Enum labels).

### Drift

```
{
  headline: { kind: 'grays' | 'variants' | 'spacing' | 'type' | null, before, after, sentence },
  supporting: string[],
  numbers: { kind, before, after, caption }[],
  proposal: { colors: ProposedColor[], spacing: number[], type: ProposedType[], durations: ProposedDuration[], easings: ProposedEasing[], contrastKept: boolean },
  variantCollapses: { componentId, keep: variantId, merge: variantId[], delta: string }[],
  evidence: { a, b, delta: string, kind: EvidenceKind, pages: string[], usesA, usesB, evidenceOnly: boolean }[],
  findingCount: number,
  narrative: string
}
```

`ProposedColor = { name, value, group, absorbs: string[], contrastKept: boolean }`. `ProposedType = { name, role, family, size, lineHeight, weight, letterSpacing, absorbs: string[] }`. `ProposedDuration = { name, ms, role?, absorbs: string[] }` and `ProposedEasing = { name, value, absorbs: string[] }` carry drift's motion proposal (`drift.md`, The proposed set). The headline `kind` is null when nothing drifts (the nothing-to-collapse sentence). `findingCount` counts every finding before the 40-row evidence cap.

### Cost and stats

`Cost = { inputTokens, outputTokens, usd, calls: { model, purpose, inputTokens, outputTokens, usd, cached: boolean }[] }` where `purpose` is the `ModelPurpose` enum (`select`, `components`, `collision`, `colors`, `narrative`). `Stats` as the table column.

## Storage keys

- Pages: `runs/{runId}/pages/{pageId}/{viewport}.png`, plus the intermediate `…/{viewport}.snapshot.json.gz` and `…/{viewport}.css.json.gz` (deleted after `done` unless `DSE_KEEP_INTERMEDIATE=1`).
- Components: `runs/{runId}/components/{componentId}/{state}.png` (crops), `…/source-{viewport}.png`, `…/mobile.png` (the 390 px crop for a responsive variant), `…/variants/{variantId}/default.png` (each variant's crop), `…/preview.html` (default state, self-contained), `…/preview-{state}.html` (one per captured state of a live component), `…/variants/{variantId}/preview.html` and `…/variants/{variantId}/preview-{state}.html`.
- Run: `runs/{runId}/og.png`.
- Motion adds no keys: patterns carry no crops.
- Showcase: `showcase/showcase.json`.

Images are PNG at device pixel ratio 2. Crops are the element's bounding box plus 8 CSS px padding on each side; source crops follow the rule in `component-detection.md`.

## Retention

A daily job (`apps/worker` cron, 03:00 America/Boise) deletes runs past `retention_until`, their rows, and their storage prefix. Showcase runs have null retention. The `/privacy` page states ninety days.

## Ids

Run ids, page ids, component ids, variant ids and instance ids all use the `0-9a-z` alphabet: runs 10 characters, everything else 8. Run ids are random nanoids. Page ids are derived from the SHA-256 of the page's normalized URL, so a replayed run gets the same ids (D-041). Component ids are stable within a run and appear in URLs.
