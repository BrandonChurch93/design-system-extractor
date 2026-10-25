// Every enum value in the words of docs/design/copy.md (Enum labels). The UI reads labels
// from here and nowhere else. Braced placeholders are filled with `fill`.
import type {
  BlockedReason,
  CapturedReason,
  Check,
  CheckStatus,
  ColorGroup,
  ComponentGroup,
  ComponentType,
  DriftKind,
  EventLevel,
  EvidenceKind,
  ExportFormat,
  FrameworkHint,
  PageReason,
  PageStatus,
  PlanId,
  PreviewMode,
  RunStatus,
  SemanticRole,
  Stage,
  State,
  Substage,
  TokenKind,
  TypeRole,
  Viewport,
} from './enums';

export const runStatusLabels: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  complete: 'Complete',
  blocked: 'Blocked',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/** The Recent runs result line for a blocked run. */
export const blockedReasonLabels: Record<BlockedReason, string> = {
  bot: 'Blocked the crawler. Nothing extracted.',
  login: 'Login wall. One page extracted.',
  unreachable: 'Could not be reached. Nothing extracted.',
  robots: 'Crawling not allowed. Nothing extracted.',
  budget: 'Budget was spent. Nothing extracted.',
  busy: 'Crawler was busy. Nothing extracted.',
  'visitor-cap': 'Run limit reached. Nothing extracted.',
  'invalid-url': 'Not a crawlable address.',
  'private-address': 'Not a crawlable address.',
};

/** Stage display labels for the live log. */
export const stageLabels: Record<Stage, string> = {
  queue: 'queue',
  discover: 'crawl',
  select: 'select',
  capture: 'capture',
  tokens: 'tokens',
  components: 'components',
  previews: 'previews',
  checks: 'checks',
  drift: 'drift',
  exports: 'exports',
  done: 'done',
};

export const substageLabels: Record<Substage, string> = {
  'tokens:palette': 'Palette',
  'tokens:type': 'Type',
  'tokens:space': 'Spacing',
};

export const eventLevelLabels: Record<EventLevel, string> = {
  info: 'Info',
  warn: 'Warning',
  error: 'Error',
};

export const viewportLabels: Record<Viewport, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
};

export const pageReasonLabels: Record<PageReason, string> = {
  home: 'home',
  nav: 'nav',
  footer: 'footer',
  sitemap: 'sitemap',
  body: 'linked',
  forms: 'forms',
  'forms-errors': 'forms, errors',
  'tables-toggles': 'tables, toggles',
  'code-blocks': 'code blocks',
  'list-template': 'list template',
  'post-template': 'post template',
  'badges-timeline': 'badges, timeline',
  'empty-state': 'empty state',
  about: 'about',
  careers: 'careers',
  app: 'app',
  added: 'you added it',
  template: '{group} template, 1 of {n}',
};

export const pageStatusLabels: Record<PageStatus, string> = {
  pending: 'Pending',
  captured: 'Captured',
  failed: 'Failed',
};

/** Framework names; rendered with `frameworkDetected`. */
export const frameworkHintLabels: Record<FrameworkHint, string> = {
  tailwind: 'Tailwind',
  bootstrap: 'Bootstrap',
  mui: 'MUI',
  chakra: 'Chakra',
  'css-in-js': 'CSS-in-JS',
};
export const frameworkDetected = '{Name} detected';

export const tokenKindLabels: Record<TokenKind, string> = {
  color: 'Color',
  type: 'Type',
  space: 'Spacing',
  radius: 'Radius',
  shadow: 'Shadow',
  breakpoint: 'Breakpoint',
};

export const colorGroupLabels: Record<ColorGroup, string> = {
  brand: 'Brand',
  neutral: 'Neutral',
  semantic: 'Semantic',
};

export const semanticRoleLabels: Record<SemanticRole, string> = {
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
  info: 'Info',
};

/** The sample text in TypeScaleRow. */
export const typeRoleLabels: Record<TypeRole, string> = {
  display: 'Display',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  body: 'Body, the reading size',
  'body-sm': 'Body, small',
  label: 'Label',
  caption: 'Caption',
  code: 'Code',
  other: 'Other',
};

export const componentTypeLabels: Record<ComponentType, string> = {
  button: 'Button',
  link: 'Link',
  input: 'Text input',
  select: 'Select',
  textarea: 'Textarea',
  checkbox: 'Checkbox',
  radio: 'Radio',
  toggle: 'Toggle',
  form: 'Form',
  nav: 'Nav bar',
  header: 'Header',
  footer: 'Footer',
  breadcrumb: 'Breadcrumb',
  tabs: 'Tabs',
  pagination: 'Pagination',
  menu: 'Menu',
  card: 'Card',
  'list-row': 'List row',
  hero: 'Hero',
  'section-header': 'Section header',
  badge: 'Badge',
  tag: 'Tag',
  alert: 'Alert',
  toast: 'Toast',
  'empty-state': 'Empty state',
  table: 'Table',
  'code-block': 'Code block',
  modal: 'Modal',
  tooltip: 'Tooltip',
  dropdown: 'Dropdown',
  avatar: 'Avatar',
  other: 'Other',
};

export const componentGroupLabels: Record<ComponentGroup, string> = {
  buttons: 'Buttons',
  inputs: 'Inputs',
  navigation: 'Navigation',
  cards: 'Cards',
  feedback: 'Feedback',
  data: 'Data',
  overlays: 'Overlays',
  other: 'Other',
};

export const stateLabels: Record<State, string> = {
  default: 'Default',
  hover: 'Hover',
  focus: 'Focus',
  active: 'Active',
  disabled: 'Disabled',
  error: 'Error',
  checked: 'Checked',
  selected: 'Selected',
  open: 'Open',
  scrolled: 'Scrolled',
};

export const previewModeLabels: Record<PreviewMode, string> = {
  live: 'Live',
  captured: 'Captured',
};

export const capturedReasonLabels: Record<CapturedReason, string> = {
  diff: 'render differed by {pct} %',
  'css-too-large': 'styles too large',
  'fonts-unavailable': 'fonts unavailable',
};

export const checkLabels: Record<Check, string> = {
  contrast: 'Contrast AA',
  'focus-visible': 'Focus visible',
  'tap-target': 'Tap target',
  label: 'Label present',
  'reduced-motion': 'Reduced motion',
};

export const checkDescriptions: Record<Check, string> = {
  contrast: 'Text against the background it actually sits on, at the size it is rendered',
  'focus-visible': 'A visible focus style when reached by keyboard',
  'tap-target': '44 × 44 px minimum for touch controls at the mobile viewport',
  label: 'Inputs and icon-only buttons have a name a screen reader can announce',
  'reduced-motion': 'Animations stop or shorten under prefers-reduced-motion',
};

export const checkStatusLabels: Record<CheckStatus, string> = {
  pass: 'Pass',
  fail: 'Fail',
  na: 'Not applicable',
};

export const driftKindLabels: Record<DriftKind, string> = {
  grays: 'Grays',
  variants: 'Variants',
  spacing: 'Spacing values',
  type: 'Type styles',
};

export const evidenceKindLabels: Record<EvidenceKind, string> = {
  color: 'Color',
  variant: 'Variant',
  spacing: 'Spacing',
  type: 'Type',
  sprawl: 'Sprawl',
};

export const planLabels: Record<PlanId, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
};

export const exportFormatLabels: Record<ExportFormat, string> = {
  'tokens.css': 'CSS variables',
  'tokens.json': 'JSON',
  'tailwind.tokens.js': 'Tailwind config',
  'tokens.w3c.json': 'W3C design tokens',
  'design-system.md': 'design-system.md',
  'prompt.md': 'Prompt',
  'component-prompt.md': 'Component prompt',
  'all.zip': 'All files',
};

/** Label maps keyed by the enum names in `enums`. */
export const labels = {
  RunStatus: runStatusLabels,
  BlockedReason: blockedReasonLabels,
  Stage: stageLabels,
  Substage: substageLabels,
  EventLevel: eventLevelLabels,
  Viewport: viewportLabels,
  PageReason: pageReasonLabels,
  PageStatus: pageStatusLabels,
  FrameworkHint: frameworkHintLabels,
  TokenKind: tokenKindLabels,
  ColorGroup: colorGroupLabels,
  SemanticRole: semanticRoleLabels,
  TypeRole: typeRoleLabels,
  ComponentType: componentTypeLabels,
  ComponentGroup: componentGroupLabels,
  State: stateLabels,
  PreviewMode: previewModeLabels,
  CapturedReason: capturedReasonLabels,
  Check: checkLabels,
  CheckStatus: checkStatusLabels,
  DriftKind: driftKindLabels,
  EvidenceKind: evidenceKindLabels,
  PlanId: planLabels,
  ExportFormat: exportFormatLabels,
} as const;

/** Replaces `{key}` placeholders. A missing value leaves the placeholder, which tests catch. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
