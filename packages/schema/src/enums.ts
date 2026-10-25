import { z } from 'zod';

export const RunStatus = z.enum(['queued', 'running', 'complete', 'blocked', 'failed', 'cancelled']);
export type RunStatus = z.infer<typeof RunStatus>;

export const BlockedReason = z.enum(['bot', 'login', 'unreachable', 'robots', 'budget', 'busy', 'visitor-cap', 'invalid-url', 'private-address']);
export type BlockedReason = z.infer<typeof BlockedReason>;

export const Stage = z.enum(['queue', 'discover', 'select', 'capture', 'tokens', 'components', 'previews', 'checks', 'drift', 'exports', 'done']);
export type Stage = z.infer<typeof Stage>;

export const Substage = z.enum(['tokens:palette', 'tokens:type', 'tokens:space']);
export type Substage = z.infer<typeof Substage>;

export const EventLevel = z.enum(['info', 'warn', 'error']);
export type EventLevel = z.infer<typeof EventLevel>;

export const Viewport = z.enum(['desktop', 'mobile']);
export type Viewport = z.infer<typeof Viewport>;

export const PageReason = z.enum([
  'home',
  'nav',
  'footer',
  'sitemap',
  'body',
  'forms',
  'forms-errors',
  'tables-toggles',
  'code-blocks',
  'list-template',
  'post-template',
  'badges-timeline',
  'empty-state',
  'about',
  'careers',
  'app',
  'added',
  'template',
]);
export type PageReason = z.infer<typeof PageReason>;

export const PageStatus = z.enum(['pending', 'captured', 'failed']);
export type PageStatus = z.infer<typeof PageStatus>;

export const FrameworkHint = z.enum(['tailwind', 'bootstrap', 'mui', 'chakra', 'css-in-js']);
export type FrameworkHint = z.infer<typeof FrameworkHint>;

export const TokenKind = z.enum(['color', 'type', 'space', 'radius', 'shadow', 'breakpoint']);
export type TokenKind = z.infer<typeof TokenKind>;

export const ColorGroup = z.enum(['brand', 'neutral', 'semantic']);
export type ColorGroup = z.infer<typeof ColorGroup>;

export const SemanticRole = z.enum(['success', 'warning', 'danger', 'info']);
export type SemanticRole = z.infer<typeof SemanticRole>;

export const TypeRole = z.enum(['display', 'h1', 'h2', 'h3', 'h4', 'body', 'body-sm', 'label', 'caption', 'code', 'other']);
export type TypeRole = z.infer<typeof TypeRole>;

export const ComponentType = z.enum([
  'button',
  'link',
  'input',
  'select',
  'textarea',
  'checkbox',
  'radio',
  'toggle',
  'form',
  'nav',
  'header',
  'footer',
  'breadcrumb',
  'tabs',
  'pagination',
  'menu',
  'card',
  'list-row',
  'hero',
  'section-header',
  'badge',
  'tag',
  'alert',
  'toast',
  'empty-state',
  'table',
  'code-block',
  'modal',
  'tooltip',
  'dropdown',
  'avatar',
  'other',
]);
export type ComponentType = z.infer<typeof ComponentType>;

export const ComponentGroup = z.enum(['buttons', 'inputs', 'navigation', 'cards', 'feedback', 'data', 'overlays', 'other']);
export type ComponentGroup = z.infer<typeof ComponentGroup>;

/** Which group each component type belongs to (docs/specs/component-detection.md). */
export const componentGroupOf: Record<ComponentType, ComponentGroup> = {
  button: 'buttons',
  link: 'buttons',
  input: 'inputs',
  select: 'inputs',
  textarea: 'inputs',
  checkbox: 'inputs',
  radio: 'inputs',
  toggle: 'inputs',
  form: 'inputs',
  nav: 'navigation',
  header: 'navigation',
  footer: 'navigation',
  breadcrumb: 'navigation',
  tabs: 'navigation',
  pagination: 'navigation',
  menu: 'navigation',
  card: 'cards',
  'list-row': 'cards',
  hero: 'cards',
  'section-header': 'cards',
  badge: 'feedback',
  tag: 'feedback',
  alert: 'feedback',
  toast: 'feedback',
  'empty-state': 'feedback',
  table: 'data',
  'code-block': 'data',
  modal: 'overlays',
  tooltip: 'overlays',
  dropdown: 'overlays',
  avatar: 'other',
  other: 'other',
};

export const State = z.enum(['default', 'hover', 'focus', 'active', 'disabled', 'error', 'checked', 'selected', 'open', 'scrolled']);
export type State = z.infer<typeof State>;

export const PreviewMode = z.enum(['live', 'captured']);
export type PreviewMode = z.infer<typeof PreviewMode>;

export const CapturedReason = z.enum(['diff', 'css-too-large', 'fonts-unavailable']);
export type CapturedReason = z.infer<typeof CapturedReason>;

export const Check = z.enum(['contrast', 'focus-visible', 'tap-target', 'label', 'reduced-motion']);
export type Check = z.infer<typeof Check>;

export const CheckStatus = z.enum(['pass', 'fail', 'na']);
export type CheckStatus = z.infer<typeof CheckStatus>;

export const DriftKind = z.enum(['grays', 'variants', 'spacing', 'type']);
export type DriftKind = z.infer<typeof DriftKind>;

export const EvidenceKind = z.enum(['color', 'variant', 'spacing', 'type', 'sprawl']);
export type EvidenceKind = z.infer<typeof EvidenceKind>;

export const PlanId = z.enum(['free', 'pro', 'team']);
export type PlanId = z.infer<typeof PlanId>;

export const ExportFormat = z.enum(['tokens.css', 'tokens.json', 'tailwind.tokens.js', 'tokens.w3c.json', 'design-system.md', 'prompt.md', 'component-prompt.md', 'all.zip']);
export type ExportFormat = z.infer<typeof ExportFormat>;

export const ExportSet = z.enum(['proposed', 'raw']);
export type ExportSet = z.infer<typeof ExportSet>;

/** Every enum named in docs/specs/data-model.md, by its name there. */
export const enums = {
  RunStatus,
  BlockedReason,
  Stage,
  Substage,
  EventLevel,
  Viewport,
  PageReason,
  PageStatus,
  FrameworkHint,
  TokenKind,
  ColorGroup,
  SemanticRole,
  TypeRole,
  ComponentType,
  ComponentGroup,
  State,
  PreviewMode,
  CapturedReason,
  Check,
  CheckStatus,
  DriftKind,
  EvidenceKind,
  PlanId,
  ExportFormat,
} as const;

export type EnumName = keyof typeof enums;

/** Viewport sizes in CSS px, at device pixel ratio 2 (docs/glossary.md). */
export const viewportSize: Record<Viewport, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

/** Statuses after which a run document is immutable. */
export const terminalStatuses: ReadonlySet<RunStatus> = new Set(['complete', 'blocked', 'failed', 'cancelled']);
