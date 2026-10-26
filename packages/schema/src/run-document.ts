import './zod-config';
import { z } from 'zod';
import {
  BlockedReason,
  CapturedReason,
  Check,
  CheckStatus,
  ColorGroup,
  ComponentGroup,
  ComponentType,
  DriftKind,
  EvidenceKind,
  FrameworkHint,
  PageReason,
  PageStatus,
  PreviewMode,
  RunStatus,
  SemanticRole,
  State,
  TypeRole,
  Viewport,
} from './enums';
import { EntityId, RunId } from './ids';

const nonNeg = z.number().nonnegative();
const count = z.number().int().nonnegative();
const isoDate = z.string().datetime({ offset: true });
/** Uppercase hex with the hash; 8 digits when alpha is below 1. */
export const Hex = z.string().regex(/^#[0-9A-F]{6}([0-9A-F]{2})?$/);
export type Hex = z.infer<typeof Hex>;

export const BBox = z.object({ x: z.number(), y: z.number(), w: nonNeg, h: nonNeg });
export type BBox = z.infer<typeof BBox>;

export const PageCount = z.object({ pageId: EntityId, count: count });
export type PageCount = z.infer<typeof PageCount>;

// Pages

export const CaptureRef = z.object({ screenshotKey: z.string().min(1), width: count, height: count });
export type CaptureRef = z.infer<typeof CaptureRef>;

export const Page = z.object({
  id: EntityId,
  url: z.string().url(),
  path: z.string().startsWith('/'),
  reason: PageReason,
  templateGroup: z.string().optional(),
  templateSize: count.optional(),
  title: z.string(),
  h1: z.string(),
  nodeCount: count,
  status: PageStatus,
  failedReason: z.string().optional(),
  captures: z.object({ desktop: CaptureRef.optional(), mobile: CaptureRef.optional() }),
});
export type Page = z.infer<typeof Page>;

// Tokens

export const Oklch = z.object({ l: z.number(), c: nonNeg, h: z.number() });
export type Oklch = z.infer<typeof Oklch>;

export const ContrastPair = z.object({
  fg: EntityId,
  bg: EntityId,
  ratio: z.number().positive(),
  /** Text at or above the large-text size, whose threshold is 3:1. */
  large: z.boolean(),
  where: z.string(),
});
export type ContrastPair = z.infer<typeof ContrastPair>;

export const ColorToken = z.object({
  id: EntityId,
  name: z.string().regex(/^[a-z]+(-[a-z0-9]+)*$/),
  value: Hex,
  oklch: Oklch,
  group: ColorGroup,
  semanticRole: SemanticRole.optional(),
  usage: count,
  uses: z.object({ text: count, background: count, border: count, other: count }),
  pages: z.array(PageCount),
  rawValues: z.array(z.object({ value: Hex, count: count })),
  contrastPairs: z.array(ContrastPair),
});
export type ColorToken = z.infer<typeof ColorToken>;

export const TypeToken = z.object({
  id: EntityId,
  name: z.string().min(1),
  role: TypeRole,
  family: z.string().min(1),
  fallbackStack: z.string(),
  size: z.number().positive(),
  lineHeight: z.number().positive(),
  weight: z.number().int().min(1).max(1000),
  letterSpacing: z.number(),
  textTransform: z.string().optional(),
  usage: count,
  pages: z.array(PageCount),
  sample: z.string(),
});
export type TypeToken = z.infer<typeof TypeToken>;

export const SpaceToken = z.object({
  id: EntityId,
  value: z.number().positive(),
  onGrid: z.boolean(),
  usage: count,
  pages: z.array(PageCount),
  contexts: z.object({ padding: count, margin: count, gap: count, layout: count.default(0) }),
});
export type SpaceToken = z.infer<typeof SpaceToken>;

export const RadiusToken = z.object({
  id: EntityId,
  value: nonNeg,
  isPill: z.boolean(),
  usage: count,
  pages: z.array(PageCount),
});
export type RadiusToken = z.infer<typeof RadiusToken>;

export const ShadowToken = z.object({
  id: EntityId,
  name: z.string().min(1),
  value: z.string().min(1),
  usage: count,
  pages: z.array(PageCount),
});
export type ShadowToken = z.infer<typeof ShadowToken>;

export const FontFamily = z.object({ name: z.string().min(1), loaded: z.boolean(), fallback: z.string().optional() });
export type FontFamily = z.infer<typeof FontFamily>;

export const RawCounts = z.object({
  colors: count,
  fontDecls: count,
  spacingValues: count,
  radii: count.default(0),
  shadows: count.default(0),
});
export type RawCounts = z.infer<typeof RawCounts>;

export const Tokens = z.object({
  colors: z.array(ColorToken),
  type: z.array(TypeToken),
  space: z.array(SpaceToken),
  /** The inferred base grid in px, and whether 85% of values agreed with it. */
  spaceBase: z.object({ value: z.union([z.literal(4), z.literal(8)]), clear: z.boolean() }),
  radius: z.array(RadiusToken),
  shadow: z.array(ShadowToken),
  breakpoints: z.array(z.number().positive()),
  rawCounts: RawCounts,
  families: z.array(FontFamily),
});
export type Tokens = z.infer<typeof Tokens>;

// Components

export const Preview = z.object({
  mode: PreviewMode,
  capturedReason: CapturedReason.optional(),
  cropKey: z.string().min(1),
  width: nonNeg,
  height: nonNeg,
  diffPct: nonNeg.optional(),
  htmlKey: z.string().optional(),
  stateHtmlKeys: z.partialRecord(State, z.string()).optional(),
});
export type Preview = z.infer<typeof Preview>;

export const Variant = z.object({
  id: EntityId,
  name: z.string().min(1),
  instanceIds: z.array(EntityId).min(1),
  delta: z.array(z.object({ property: z.string(), value: z.string() })),
  preview: Preview,
});
export type Variant = z.infer<typeof Variant>;

export const Instance = z.object({
  id: EntityId,
  pageId: EntityId,
  viewport: Viewport,
  selector: z.string().min(1),
  bbox: BBox,
  variantId: EntityId,
  text: z.string().optional(),
});
export type Instance = z.infer<typeof Instance>;

export const StateCapture = z.object({
  state: State,
  captured: z.boolean(),
  reason: z.string().optional(),
  cropKey: z.string().optional(),
  delta: z.array(z.object({ property: z.string(), from: z.string(), to: z.string() })),
  reachedByKeyboard: z.boolean().optional(),
  instanceId: EntityId.optional(),
});
export type StateCapture = z.infer<typeof StateCapture>;

export const CheckResult = z.object({
  check: Check,
  status: CheckStatus,
  detail: z.string().min(1),
  measured: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  variantId: EntityId.optional(),
});
export type CheckResult = z.infer<typeof CheckResult>;

export const SourceCrop = z.object({
  key: z.string().min(1),
  width: nonNeg,
  height: nonNeg,
  /** The element's box relative to the crop, for the 2 px outline. */
  outline: BBox,
});
export type SourceCrop = z.infer<typeof SourceCrop>;

export const Provenance = z.object({
  firstSeen: z.object({
    pageId: EntityId,
    path: z.string().startsWith('/'),
    viewport: Viewport,
    selector: z.string().min(1),
    bbox: BBox,
    sourceCrop: SourceCrop.optional(),
  }),
  pages: z.array(z.object({ pageId: EntityId, path: z.string().startsWith('/'), count: count.min(1) })).min(1),
});
export type Provenance = z.infer<typeof Provenance>;

export const Component = z.object({
  id: EntityId,
  name: z.string().min(1),
  type: ComponentType,
  group: ComponentGroup,
  confidence: z.number().min(0).max(1),
  signature: z.object({
    tag: z.string().min(1),
    role: z.string().optional(),
    classTokens: z.array(z.string()),
    structure: z.string(),
    styleHash: z.string(),
  }),
  variants: z.array(Variant).min(1),
  instances: z.array(Instance).min(1),
  provenance: Provenance,
  states: z.array(StateCapture),
  tokensUsed: z.array(z.object({ tokenId: EntityId, property: z.string() })),
  unmapped: z.array(z.object({ property: z.string(), value: z.string() })).default([]),
  preview: Preview,
  code: z.object({ html: z.string(), css: z.string(), tailwind: z.string().optional() }),
  checks: z.array(CheckResult),
  responsiveVariant: z.object({ mobilePreview: Preview, note: z.string() }).optional(),
});
export type Component = z.infer<typeof Component>;

// Checks

export const CheckSummary = z.object({
  check: Check,
  passed: count,
  applicable: count,
  failing: z.array(z.object({ componentId: EntityId, name: z.string(), detail: z.string() })),
});
export type CheckSummary = z.infer<typeof CheckSummary>;

export const Checks = z.object({
  summary: z.object({ passed: count, failed: count, total: count, applicable: count }),
  byCheck: z.array(CheckSummary),
});
export type Checks = z.infer<typeof Checks>;

// Drift

export const ProposedColor = z.object({
  name: z.string().min(1),
  value: Hex,
  group: ColorGroup,
  absorbs: z.array(z.string()),
  contrastKept: z.boolean(),
});
export type ProposedColor = z.infer<typeof ProposedColor>;

export const ProposedType = z.object({
  name: z.string().min(1),
  role: TypeRole,
  family: z.string(),
  size: z.number().positive(),
  lineHeight: z.number().positive(),
  weight: z.number().int(),
  letterSpacing: z.number(),
  absorbs: z.array(z.string()),
});
export type ProposedType = z.infer<typeof ProposedType>;

export const DriftNumber = z.object({ kind: DriftKind, before: count, after: count, caption: z.string() });
export type DriftNumber = z.infer<typeof DriftNumber>;

export const Evidence = z.object({
  a: z.string(),
  b: z.string(),
  delta: z.string(),
  kind: EvidenceKind,
  pages: z.array(z.string()),
  usesA: count,
  usesB: count,
  /** Raw-spread rows: evidence only, never a finding. */
  evidenceOnly: z.boolean().default(false),
});
export type Evidence = z.infer<typeof Evidence>;

export const VariantCollapse = z.object({
  componentId: EntityId,
  keep: EntityId,
  merge: z.array(EntityId).min(1),
  delta: z.string(),
});
export type VariantCollapse = z.infer<typeof VariantCollapse>;

export const Drift = z.object({
  headline: z.object({ kind: DriftKind.nullable(), before: count, after: count, sentence: z.string().min(1) }),
  supporting: z.array(z.string()),
  numbers: z.array(DriftNumber).max(3),
  proposal: z.object({
    colors: z.array(ProposedColor),
    spacing: z.array(z.number().positive()),
    type: z.array(ProposedType),
    contrastKept: z.boolean(),
  }),
  variantCollapses: z.array(VariantCollapse),
  evidence: z.array(Evidence),
  /** Every finding before the 40-row cap on `evidence`, for the rail count and exports. */
  findingCount: count,
  narrative: z.string(),
});
export type Drift = z.infer<typeof Drift>;

// Cost and stats

export const ModelPurpose = z.enum(['select', 'components', 'collision', 'colors', 'narrative']);
export type ModelPurpose = z.infer<typeof ModelPurpose>;

export const CostCall = z.object({
  model: z.string(),
  purpose: ModelPurpose,
  inputTokens: count,
  outputTokens: count,
  usd: nonNeg,
  cached: z.boolean(),
});
export type CostCall = z.infer<typeof CostCall>;

export const Cost = z.object({ inputTokens: count, outputTokens: count, usd: nonNeg, calls: z.array(CostCall) });
export type Cost = z.infer<typeof Cost>;

export const Stats = z.object({
  colors: count,
  typeStyles: count,
  spacingSteps: count,
  components: count,
  checksPassed: count,
  checksApplicable: count,
});
export type Stats = z.infer<typeof Stats>;

// Blocked detail

export const BotAttempt = z.object({
  url: z.string(),
  status: z.number().int(),
  marker: z.string().optional(),
  retries: count,
});
export const BlockedDetail = z.union([
  z.object({ attempts: z.array(BotAttempt), robots: z.string().optional() }).strict(),
  z.object({ used: nonNeg, budget: nonNeg, runsToday: count, resetsAt: isoDate }).strict(),
  z.object({ queued: count }).strict(),
  z.object({ redirectedTo: z.string().optional() }).strict(),
  z.object({ reason: z.string() }).strict(),
]);
export type BlockedDetail = z.infer<typeof BlockedDetail>;

// The run document

export const Exports = z.object({
  designSystemIntro: z.string().optional(),
  designSystemMd: z.string().optional(),
  promptMd: z.string().optional(),
});
export type Exports = z.infer<typeof Exports>;

const identity = {
  id: RunId,
  url: z.string().url(),
  host: z.string().min(1),
  status: RunStatus,
  blockedReason: BlockedReason.optional(),
  blockedDetail: BlockedDetail.optional(),
  failedDetail: z.string().optional(),
  createdAt: isoDate,
  startedAt: isoDate.optional(),
  finishedAt: isoDate.optional(),
  durationMs: count.optional(),
  pipelineVersion: z.string().min(1),
  viewports: z.array(Viewport).min(1),
  frameworkHint: FrameworkHint.optional(),
  local: z.object({ base: z.string().url() }).optional(),
};

const sections = {
  darkThemeDetected: z.boolean(),
  sparse: z.boolean(),
  pages: z.array(Page),
  tokens: Tokens,
  components: z.array(Component),
  checks: Checks,
  drift: Drift,
  exports: Exports,
  cost: Cost,
  stats: Stats,
};

/** A run document at any moment: identity always, each section once its stage has landed. */
export const RunDocumentPartial = z.object({
  ...identity,
  darkThemeDetected: sections.darkThemeDetected.optional(),
  sparse: sections.sparse.optional(),
  pages: sections.pages.optional(),
  tokens: Tokens.partial().optional(),
  components: sections.components.optional(),
  checks: sections.checks.optional(),
  drift: sections.drift.optional(),
  exports: sections.exports.optional(),
  cost: sections.cost.optional(),
  stats: sections.stats.optional(),
});
export type RunDocumentPartial = z.infer<typeof RunDocumentPartial>;

/** A finished run document: every section present. Complete runs and login-wall runs have it. */
export const RunDocumentComplete = z.object({ ...identity, ...sections });
export type RunDocumentComplete = z.infer<typeof RunDocumentComplete>;

/** A JSON object that `applyPatch` deep-merges into a run document. */
export type RunDocumentPatch = { [K in keyof RunDocumentPartial]?: unknown };
