import './zod-config';
import { z } from 'zod';
import {
  BlockedReason,
  CapturedReason,
  Check,
  CheckStatus,
  ColorGroup,
  ComponentGroup,
  ComponentTier,
  ComponentType,
  DriftKind,
  EvidenceKind,
  FrameworkHint,
  MotionKind,
  MotionSource,
  PageReason,
  PageStatus,
  PreviewMode,
  RunStatus,
  SemanticRole,
  State,
  TokenKind,
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

/** A token name: generated names are kebab case; a site's own names may carry capitals and underscores (D-082). */
export const TokenName = z.string().regex(/^[a-zA-Z][\w-]*$/);
/** The full custom property a site-named token took its name from. */
const SiteName = z.string().regex(/^--[\w-]+$/);

export const ColorToken = z.object({
  id: EntityId,
  name: TokenName,
  siteName: SiteName.optional(),
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

/** A translucent color as a base and an alpha, never a palette step (D-086). */
export const OverlayToken = z.object({
  id: EntityId,
  name: TokenName,
  siteName: SiteName.optional(),
  base: z.union([EntityId, z.literal('white'), z.literal('black')]),
  alpha: z.number().gt(0).lt(1),
  /** `rgb(r g b / a%)`. */
  value: z.string().min(1),
  usage: count,
  pages: z.array(PageCount),
  rawValues: z.array(z.object({ value: Hex, count: count })),
});
export type OverlayToken = z.infer<typeof OverlayToken>;

export const TypeToken = z.object({
  id: EntityId,
  name: TokenName,
  siteName: SiteName.optional(),
  role: TypeRole,
  family: z.string().min(1),
  fallbackStack: z.string(),
  size: z.number().positive(),
  lineHeight: z.number().positive(),
  weight: z.number().int().min(1).max(1000),
  letterSpacing: z.number(),
  textTransform: z.string().optional(),
  uppercase: z.boolean(),
  /** The HTML tags the tuple was found on, most common first: provenance, never a name (D-087). */
  tags: z.array(z.string()),
  usage: count,
  pages: z.array(PageCount),
  sample: z.string(),
});
export type TypeToken = z.infer<typeof TypeToken>;

export const SpaceToken = z.object({
  id: EntityId,
  value: z.number().positive(),
  siteName: SiteName.optional(),
  onGrid: z.boolean(),
  usage: count,
  pages: z.array(PageCount),
  contexts: z.object({ padding: count, margin: count, gap: count, layout: count.default(0) }),
});
export type SpaceToken = z.infer<typeof SpaceToken>;

export const RadiusToken = z.object({
  id: EntityId,
  value: nonNeg,
  siteName: SiteName.optional(),
  isPill: z.boolean(),
  usage: count,
  pages: z.array(PageCount),
});
export type RadiusToken = z.infer<typeof RadiusToken>;

export const ShadowToken = z.object({
  id: EntityId,
  name: TokenName,
  siteName: SiteName.optional(),
  value: z.string().min(1),
  usage: count,
  pages: z.array(PageCount),
});
export type ShadowToken = z.infer<typeof ShadowToken>;

export const DurationRole = z.enum(['faster', 'fast', 'base', 'slow', 'slower']);
export type DurationRole = z.infer<typeof DurationRole>;

export const DurationToken = z.object({
  id: EntityId,
  name: TokenName,
  siteName: SiteName.optional(),
  ms: z.number().positive(),
  role: DurationRole.optional(),
  usage: count,
  pages: z.array(PageCount),
  rawValues: z.array(z.string()),
});
export type DurationToken = z.infer<typeof DurationToken>;

export const EasingToken = z.object({
  id: EntityId,
  name: TokenName,
  /** A keyword, `cubic-bezier(…)`, `steps(…)` or `linear(…)`. */
  value: z.string().min(1),
  siteName: SiteName.optional(),
  usage: count,
  pages: z.array(PageCount),
  /** What uses it, most used first: filled when motion is attached to components (D-093, D-097). */
  usedBy: z.object({
    componentTypes: z.array(z.object({ type: ComponentType, count: count })),
    patternKinds: z.array(z.object({ kind: MotionKind, count: count })),
  }),
});
export type EasingToken = z.infer<typeof EasingToken>;

export const Keyframes = z.object({
  name: z.string().min(1),
  css: z.string().min(1),
  /** The `@media` or `@supports` condition the block sat in. */
  condition: z.string().optional(),
  used: z.boolean(),
  usage: count,
  pages: z.array(PageCount),
  unresolved: z.array(z.string()),
});
export type Keyframes = z.infer<typeof Keyframes>;

export const BreakpointToken = z.object({
  value: z.number().positive(),
  usage: count,
  /** The max-width value one away from this one, folded in and not exported. */
  maxTwin: z.number().positive().optional(),
  siteName: SiteName.optional(),
});
export type BreakpointToken = z.infer<typeof BreakpointToken>;

export const SiteVariableScope = z.enum(['root', 'theme', 'component']);
export type SiteVariableScope = z.infer<typeof SiteVariableScope>;

export const SiteVariable = z.object({
  name: SiteName,
  value: z.string(),
  resolved: z.string(),
  kind: TokenKind.optional(),
  /** The token this variable resolves to when another variable named it. */
  mapsTo: EntityId.optional(),
  hashed: z.boolean(),
  usage: count,
  pages: z.array(PageCount),
  scope: SiteVariableScope,
});
export type SiteVariable = z.infer<typeof SiteVariable>;

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
  overlays: z.array(OverlayToken),
  type: z.array(TypeToken),
  space: z.array(SpaceToken),
  /** The inferred base grid in px, and whether 85% of values agreed with it. */
  spaceBase: z.object({ value: z.union([z.literal(4), z.literal(8)]), clear: z.boolean() }),
  radius: z.array(RadiusToken),
  shadow: z.array(ShadowToken),
  duration: z.array(DurationToken),
  easing: z.array(EasingToken),
  keyframes: z.array(Keyframes),
  breakpoints: z.array(BreakpointToken),
  siteVariables: z.array(SiteVariable).max(400),
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
  /** The ground of the instance the preview was built from, painted behind it (D-094). */
  ground: Hex.optional(),
  /** Families a live preview renders in their fallback stack (D-095). */
  fontsSubstituted: z.array(z.string().min(1)).optional(),
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
  /** The effective background the instance sat on, read at capture (D-094). */
  ground: Hex.optional(),
});
export type Instance = z.infer<typeof Instance>;

export const StateCapture = z.object({
  state: State,
  captured: z.boolean(),
  reason: z.string().optional(),
  cropKey: z.string().optional(),
  delta: z.array(
    z.object({ property: z.string(), from: z.string(), to: z.string(), transition: z.object({ durationMs: nonNeg, easing: z.string() }).optional() }),
  ),
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

export const ComponentMotion = z.object({
  transitions: z.array(
    z.object({ state: State, property: z.string(), durationMs: nonNeg, delayMs: nonNeg, easingTokenId: EntityId.optional(), easing: z.string().optional() }),
  ),
  animations: z.array(
    z.object({
      keyframesName: z.string(),
      durationMs: nonNeg,
      easingTokenId: EntityId.optional(),
      easing: z.string().optional(),
      iterations: z.union([nonNeg, z.literal('infinite')]),
      trigger: MotionKind,
    }),
  ),
  patternIds: z.array(EntityId),
});
export type ComponentMotion = z.infer<typeof ComponentMotion>;

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
  /** The first-seen instance's border width in px when it has a visible border, for the exports' Default line. */
  borderWidth: nonNeg.optional(),
  /** The most common instance ground (D-094). */
  ground: Hex.optional(),
  tier: ComponentTier,
  /** The kebab case of the name, unique in the run: `motion.css` and the prompt use it. */
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  motion: ComponentMotion.nullable(),
});
export type Component = z.infer<typeof Component>;

// Motion (docs/specs/motion-capture.md)

export const MotionTriggerType = z.enum(['load', 'in-view', 'scroll', 'hover', 'open']);
export type MotionTriggerType = z.infer<typeof MotionTriggerType>;

export const MotionPattern = z.object({
  id: EntityId,
  kind: MotionKind,
  elementKey: z.string(),
  selector: z.string().min(1),
  componentId: EntityId.optional(),
  pageId: EntityId,
  pageIds: z.array(EntityId).min(1),
  viewport: Viewport,
  instances: count.min(1),
  trigger: z.object({ type: MotionTriggerType, value: z.number().optional() }),
  start: z.record(z.string(), z.string()),
  end: z.record(z.string(), z.string()),
  durationMs: nonNeg,
  delayMs: nonNeg,
  easing: z.string().nullable(),
  easingTokenId: EntityId.optional(),
  iterations: z.union([nonNeg, z.literal('infinite')]),
  keyframesName: z.string().optional(),
  source: MotionSource,
  stagger: z.object({ count: count.min(2), stepMs: nonNeg }).optional(),
  observed: z.boolean(),
});
export type MotionPattern = z.infer<typeof MotionPattern>;

export const Motion = z.object({
  patterns: z.array(MotionPattern).max(80),
  truncatedPages: z.array(z.string()),
  intersectionObservers: count,
});
export type Motion = z.infer<typeof Motion>;

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

export const ProposedDuration = z.object({ name: z.string().min(1), ms: z.number().positive(), role: DurationRole.optional(), absorbs: z.array(z.string()) });
export type ProposedDuration = z.infer<typeof ProposedDuration>;

export const ProposedEasing = z.object({ name: z.string().min(1), value: z.string().min(1), absorbs: z.array(z.string()) });
export type ProposedEasing = z.infer<typeof ProposedEasing>;

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
    durations: z.array(ProposedDuration),
    easings: z.array(ProposedEasing),
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
  /** Since v1.2; optional because showcase entries and older rows carry stats without them (D-096). */
  componentsPassing: z.object({ passed: count, applicable: count }).optional(),
  /** Previews by mode and captured reason, since v1.2 (D-095). */
  previews: z
    .object({ live: count, diff: count, 'css-too-large': count, 'fonts-unavailable': count, 'not-checked': count })
    .optional(),
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
  motion: Motion,
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
  motion: sections.motion.optional(),
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
