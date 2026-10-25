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
| `created_at` · `started_at` · `finished_at` | timestamptz | |
| `duration_ms` | int, null | |
| `retention_until` | timestamptz | created + 90 days; showcase runs null |
| `qa_frozen` | boolean | development and test only: a seeded in-progress document the worker never processes (`docs/evals.md`) |

Indexes: `host`, `visitor_id, created_at`, `status`, `retention_until`.

### `run_pages`

`id` (text PK), `run_id` FK, `url`, `path`, `reason` (`PageReason`), `template_group` (text, null), `template_size` (int, null), `selected` boolean, `order` int, `status` (`pending` · `captured` · `failed`), `node_count` int, `capture_desktop_key`, `capture_mobile_key` (storage keys for full-page screenshots), `title`, `h1`.

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
  createdAt, startedAt?, finishedAt?, durationMs?, pipelineVersion,
  frameworkHint?, darkThemeDetected: boolean, sparse: boolean,
  pages: Page[],
  tokens: { colors: ColorToken[], type: TypeToken[], space: SpaceToken[], radius: RadiusToken[], shadow: ShadowToken[], breakpoints: number[], rawCounts: { colors, fontDecls, spacingValues }, families: { name, loaded: boolean, fallback?: string }[] },
  components: Component[],
  checks: { summary: { passed, failed, total, applicable }, byCheck: CheckSummary[] },
  drift: Drift,
  exports: { designSystemIntro?: string, designSystemMd?: string, promptMd?: string },
  cost: Cost,
  stats: Stats,
  local?: { base: string }
}
```

`CheckSummary = { check (Check enum), passed, applicable, failing: { componentId, name, detail }[] }`. `local` is set only by `dse serve` for a run opened through `/open`. `blockedDetail` is `{ attempts: { url, status, marker?, retries }[], robots?: string }` for `bot` and `robots`, `{ redirectedTo? }` for `login`, `{ used, budget, runsToday, resetsAt }` for `budget` and `visitor-cap`, `{ queued }` for `busy`, and `{ reason: string }` otherwise.

Sections are optional while running and required when complete; the schema has `RunDocumentPartial` and `RunDocumentComplete`.

### Page

`{ id, url, path, reason, templateGroup?, templateSize?, title, h1, nodeCount, captures: { desktop: CaptureRef, mobile: CaptureRef } }` where `CaptureRef = { screenshotKey, width, height }`.

### Tokens

- `ColorToken`: `{ id, name, value (hex, uppercase, with alpha as 8-digit when < 1), oklch: {l, c, h}, group: 'brand' | 'neutral' | 'semantic', semanticRole?: 'success' | 'warning' | 'danger' | 'info', usage: number, uses: { text, background, border, other }, pages: { pageId, count }[], rawValues: { value, count }[], contrastPairs: { fg, bg, ratio, where }[] }`
- `TypeToken`: `{ id, name, role: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'label' | 'caption' | 'code' | 'other', family, fallbackStack, size, lineHeight, weight, letterSpacing, textTransform?, usage, pages, sample }`
- `SpaceToken`: `{ id, value, onGrid: boolean, usage, pages, contexts: { padding, margin, gap } }`
- `RadiusToken`: `{ id, value, isPill: boolean, usage, pages }`
- `ShadowToken`: `{ id, name: 'sm' | 'md' | 'lg' | string, value, usage, pages }`

### Component

```
{
  id, name, type (ComponentType), group (ComponentGroup),
  confidence: number,
  signature: { tag, role?, classTokens: string[], structure: string, styleHash },
  variants: Variant[],
  instances: Instance[],
  provenance: { firstSeen: { pageId, path, viewport, selector, bbox }, pages: { pageId, path, count }[] },
  states: StateCapture[],
  tokensUsed: { tokenId, property }[],
  preview: Preview,
  code: { html: string, css: string, tailwind?: string },
  checks: CheckResult[],
  responsiveVariant?: { mobilePreview: Preview, note: string }
}
```

- `Variant`: `{ id, name, instanceIds: string[], delta: { property, value }[], preview: Preview }`
- `Instance`: `{ id, pageId, viewport, selector, bbox: {x, y, w, h}, variantId, text? }`
- `StateCapture`: `{ state (State enum), captured: boolean, reason?: string, cropKey?, delta: { property, from, to }[], reachedByKeyboard?: boolean }`
- `Preview`: `{ mode: PreviewMode, capturedReason?: CapturedReason, cropKey, width, height, diffPct?: number, htmlKey?: string, stateHtmlKeys?: Record<State, string> }`
- `CheckResult`: `{ check (Check enum), status: 'pass' | 'fail' | 'na', detail: string, measured?: Record<string, number | string>, variantId? }`

Enums (`packages/schema/src/enums.ts`), every one with a Zod enum and a label map entry: `RunStatus`, `BlockedReason`, `Stage` (`queue`, `discover`, `select`, `capture`, `tokens`, `components`, `previews`, `checks`, `drift`, `exports`, `done`), `Substage` (`tokens:palette`, `tokens:type`, `tokens:space`), `EventLevel` (`info`, `warn`, `error`), `Viewport`, `PageReason` (`home`, `nav`, `footer`, `sitemap`, `body`, `forms`, `forms-errors`, `tables-toggles`, `code-blocks`, `list-template`, `post-template`, `badges-timeline`, `empty-state`, `about`, `careers`, `app`, `added`, `template`), `PageStatus`, `FrameworkHint` (`tailwind`, `bootstrap`, `mui`, `chakra`, `css-in-js`), `TokenKind` (`color`, `type`, `space`, `radius`, `shadow`, `breakpoint`), `ColorGroup` (`brand`, `neutral`, `semantic`), `SemanticRole` (`success`, `warning`, `danger`, `info`), `TypeRole`, `ComponentType`, `ComponentGroup`, `State`, `PreviewMode` (`live`, `captured`), `CapturedReason` (`diff`, `css-too-large`, `fonts-unavailable`), `Check`, `CheckStatus` (`pass`, `fail`, `na`), `DriftKind` (`grays`, `variants`, `spacing`, `type`), `EvidenceKind` (`color`, `variant`, `spacing`, `type`, `sprawl`), `PlanId`, `ExportFormat` (`tokens.css`, `tokens.json`, `tailwind.tokens.js`, `tokens.w3c.json`, `design-system.md`, `prompt.md`, `component-prompt.md`, `all.zip`). The UI reads labels for every enum value from one map in `packages/schema/src/labels.ts` so copy stays in one place (the values are in `docs/design/copy.md` under Enum labels).

### Drift

```
{
  headline: { kind: 'grays' | 'variants' | 'spacing' | 'type', before, after, sentence },
  supporting: string[],
  numbers: { kind, before, after, caption }[],
  proposal: { colors: ProposedColor[], spacing: number[], type: ProposedType[] },
  variantCollapses: { componentId, keep: variantId, merge: variantId[], delta: string }[],
  evidence: { a, b, delta: string, kind: EvidenceKind, pages: string[], usesA, usesB }[],
  narrative: string
}
```

`ProposedColor = { name, value, absorbs: string[], contrastKept: boolean }`.

### Cost and stats

`Cost = { inputTokens, outputTokens, usd, calls: { model, purpose, inputTokens, outputTokens, usd, cached: boolean }[] }`. `Stats` as the table column.

## Storage keys

- Pages: `runs/{runId}/pages/{pageId}/{viewport}.png`, plus the intermediate `…/{viewport}.snapshot.json.gz` and `…/{viewport}.css.json.gz` (deleted after `done` unless `DSE_KEEP_INTERMEDIATE=1`).
- Components: `runs/{runId}/components/{componentId}/{state}.png` (crops), `…/source-{viewport}.png`, `…/preview.html` (default state, self-contained), `…/preview-{state}.html` (one per captured state of a live component), `…/variants/{variantId}/preview.html` and `…/variants/{variantId}/preview-{state}.html`.
- Run: `runs/{runId}/og.png`.
- Showcase: `showcase/showcase.json`.

Images are PNG at device pixel ratio 2. Crops are the element's bounding box plus 8 CSS px padding on each side; source crops follow the rule in `component-detection.md`.

## Retention

A daily job (`apps/worker` cron, 03:00 America/Boise) deletes runs past `retention_until`, their rows, and their storage prefix. Showcase runs have null retention. The `/privacy` page states ninety days.

## Ids

Run ids, page ids, component ids, variant ids and instance ids are all nanoid with the `0-9a-z` alphabet: runs 10 characters, everything else 8. Component ids are stable within a run and appear in URLs.
