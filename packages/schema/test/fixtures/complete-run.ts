import type { RunDocumentComplete, RunDocumentPartial } from '../../src';

const home = 'pg000001';
const pricing = 'pg000002';
const cap = (pageId: string, viewport: string) => ({
  screenshotKey: `runs/abc123def4/pages/${pageId}/${viewport}.png`,
  width: viewport === 'desktop' ? 1440 : 390,
  height: 2400,
});

export const completeRun: RunDocumentComplete = {
  id: 'abc123def4',
  url: 'https://tidewater.app/',
  host: 'tidewater.app',
  status: 'complete',
  createdAt: '2026-10-12T16:00:00.000Z',
  startedAt: '2026-10-12T16:00:02.000Z',
  finishedAt: '2026-10-12T16:02:43.000Z',
  durationMs: 161000,
  pipelineVersion: '1.0.0',
  viewports: ['desktop', 'mobile'],
  frameworkHint: 'tailwind',
  darkThemeDetected: false,
  sparse: false,
  pages: [
    {
      id: home,
      url: 'https://tidewater.app/',
      path: '/',
      reason: 'home',
      title: 'Tidewater',
      h1: 'Ship calmer releases',
      nodeCount: 1204,
      status: 'captured',
      captures: { desktop: cap(home, 'desktop'), mobile: cap(home, 'mobile') },
    },
    {
      id: pricing,
      url: 'https://tidewater.app/pricing',
      path: '/pricing',
      reason: 'tables-toggles',
      title: 'Pricing · Tidewater',
      h1: 'Pricing',
      nodeCount: 980,
      status: 'captured',
      captures: { desktop: cap(pricing, 'desktop'), mobile: cap(pricing, 'mobile') },
    },
  ],
  tokens: {
    overlays: [{ id: 'ov000001', name: 'white-8', base: 'white', alpha: 0.08, value: 'rgb(255 255 255 / 8%)', usage: 3, pages: [{ pageId: home, count: 3 }], rawValues: [{ value: '#FFFFFF14', count: 3 }] }],
    colors: [
      {
        id: 'co000001',
        name: 'navy-900',
        value: '#0B1F3A',
        oklch: { l: 0.24, c: 0.06, h: 255 },
        group: 'brand',
        usage: 412,
        uses: { text: 300, background: 80, border: 30, other: 2 },
        pages: [
          { pageId: home, count: 220 },
          { pageId: pricing, count: 192 },
        ],
        rawValues: [
          { value: '#0B1F3A', count: 400 },
          { value: '#0C1F3B', count: 12 },
        ],
        contrastPairs: [{ fg: 'co000001', bg: 'co000002', ratio: 16.2, large: false, where: '/' }],
      },
      {
        id: 'co000002',
        name: 'gray-50',
        value: '#FAFAF9',
        oklch: { l: 0.98, c: 0.002, h: 90 },
        group: 'neutral',
        usage: 260,
        uses: { text: 0, background: 250, border: 10, other: 0 },
        pages: [{ pageId: home, count: 260 }],
        rawValues: [{ value: '#FAFAF9', count: 260 }],
        contrastPairs: [],
      },
      {
        id: 'co000003',
        name: 'success',
        value: '#15803D',
        oklch: { l: 0.53, c: 0.14, h: 150 },
        group: 'semantic',
        semanticRole: 'success',
        usage: 14,
        uses: { text: 8, background: 6, border: 0, other: 0 },
        pages: [{ pageId: pricing, count: 14 }],
        rawValues: [{ value: '#15803D', count: 14 }],
        contrastPairs: [],
      },
    ],
    type: [
      {
        id: 'ty000001',
        name: 'display',
        role: 'display',
        family: 'Inter',
        fallbackStack: 'Inter, system-ui, sans-serif',
        size: 56,
        lineHeight: 64,
        weight: 700,
        letterSpacing: -1.4,
        uppercase: false,
        tags: ['h1'],
        usage: 4,
        pages: [{ pageId: home, count: 4 }],
        sample: 'Ship calmer releases',
      },
      {
        id: 'ty000002',
        name: 'body',
        role: 'body',
        family: 'Inter',
        fallbackStack: 'Inter, system-ui, sans-serif',
        size: 16,
        lineHeight: 26,
        weight: 400,
        letterSpacing: 0,
        uppercase: false,
        tags: ['p', 'li'],
        usage: 300,
        pages: [{ pageId: home, count: 300 }],
        sample: 'Release notes your team will read.',
      },
    ],
    space: [
      { id: 'sp000001', value: 8, onGrid: true, usage: 120, pages: [{ pageId: home, count: 120 }], contexts: { padding: 60, margin: 20, gap: 40, layout: 0 } },
      { id: 'sp000002', value: 16, onGrid: true, usage: 200, pages: [{ pageId: home, count: 200 }], contexts: { padding: 150, margin: 30, gap: 20, layout: 4 } },
    ],
    spaceBase: { value: 4, clear: true },
    radius: [
      { id: 'ra000001', value: 8, isPill: false, usage: 40, pages: [{ pageId: home, count: 40 }] },
      { id: 'ra000002', value: 999, isPill: true, usage: 12, pages: [{ pageId: pricing, count: 12 }] },
    ],
    shadow: [{ id: 'sh000001', name: 'md', value: '0 4px 12px rgba(11, 31, 58, 0.12)', usage: 9, pages: [{ pageId: pricing, count: 9 }] }],
    duration: [{ id: 'du000001', name: 'duration-160', ms: 160, role: 'base', usage: 12, pages: [{ pageId: home, count: 12 }], rawValues: ['0.16s'] }],
    easing: [{ id: 'ea000001', name: 'ease-out-quart', siteName: '--ease-out-quart', value: 'cubic-bezier(0.25, 1, 0.5, 1)', usage: 12, pages: [{ pageId: home, count: 12 }] }],
    keyframes: [{ name: 'fade-up', css: '@keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }', used: true, usage: 1, pages: [{ pageId: home, count: 1 }], unresolved: [] }],
    breakpoints: [
      { value: 640, usage: 4 },
      { value: 1024, usage: 3 },
    ],
    siteVariables: [
      { name: '--ease-out-quart', value: 'cubic-bezier(0.25, 1, 0.5, 1)', resolved: 'cubic-bezier(0.25, 1, 0.5, 1)', kind: 'easing', hashed: false, usage: 6, pages: [{ pageId: home, count: 6 }], scope: 'root' },
      { name: '--sx-1fj52yw', value: '#0B1F3A', resolved: '#0B1F3A', kind: 'color', hashed: true, usage: 2, pages: [{ pageId: home, count: 2 }], scope: 'component' },
    ],
    rawCounts: { colors: 212, fontDecls: 940, spacingValues: 1830, radii: 2, shadows: 1 },
    families: [{ name: 'Inter', loaded: true }],
  },
  motion: {
    patterns: [
      {
        id: 'mp000001',
        kind: 'entrance',
        elementKey: 'h1|0.1.0|3f2a',
        selector: '.hero h1',
        pageId: home,
        pageIds: [home],
        viewport: 'desktop',
        instances: 1,
        trigger: { type: 'load' },
        start: { opacity: '0', transform: 'translateY(12px)' },
        end: { opacity: '1', transform: 'none' },
        durationMs: 480,
        delayMs: 0,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        easingTokenId: 'ea000001',
        iterations: 1,
        keyframesName: 'fade-up',
        source: 'css-animation',
        observed: false,
      },
    ],
    truncatedPages: [],
    intersectionObservers: 1,
  },
  components: [
    {
      id: 'cm000001',
      name: 'Primary button',
      type: 'button',
      group: 'buttons',
      confidence: 0.95,
      signature: { tag: 'button', classTokens: ['btn', 'btn-primary'], structure: 'span:1', styleHash: 'a1b2c3' },
      variants: [
        {
          id: 'va000001',
          name: 'Primary',
          instanceIds: ['in000001', 'in000002'],
          delta: [{ property: 'background-color', value: '#0B1F3A' }],
          preview: {
            mode: 'live',
            cropKey: 'runs/abc123def4/components/cm000001/default.png',
            width: 132,
            height: 44,
            diffPct: 1.1,
            htmlKey: 'runs/abc123def4/components/cm000001/variants/va000001/preview.html',
          },
        },
      ],
      instances: [
        { id: 'in000001', pageId: home, viewport: 'desktop', selector: 'header .btn-primary', bbox: { x: 1180, y: 18, w: 132, h: 44 }, variantId: 'va000001', text: 'Start free' },
        { id: 'in000002', pageId: home, viewport: 'mobile', selector: 'header .btn-primary', bbox: { x: 20, y: 300, w: 350, h: 48 }, variantId: 'va000001', text: 'Start free' },
      ],
      provenance: {
        firstSeen: {
          pageId: home,
          path: '/',
          viewport: 'desktop',
          selector: 'header .btn-primary',
          bbox: { x: 1180, y: 18, w: 132, h: 44 },
          sourceCrop: { key: 'runs/abc123def4/components/cm000001/source-desktop.png', width: 320, height: 240, outline: { x: 94, y: 98, w: 132, h: 44 } },
        },
        pages: [{ pageId: home, path: '/', count: 2 }],
      },
      states: [
        { state: 'default', captured: true, cropKey: 'runs/abc123def4/components/cm000001/default.png', delta: [] },
        {
          state: 'hover',
          captured: true,
          cropKey: 'runs/abc123def4/components/cm000001/hover.png',
          delta: [{ property: 'background-color', from: '#0B1F3A', to: '#13294B', transition: { durationMs: 160, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' } }],
        },
        { state: 'focus', captured: true, reachedByKeyboard: true, delta: [{ property: 'outline-width', from: '0px', to: '2px' }] },
        { state: 'disabled', captured: false, reason: 'no instance found', delta: [] },
      ],
      tokensUsed: [{ tokenId: 'co000001', property: 'background-color' }],
      unmapped: [],
      preview: {
        mode: 'live',
        cropKey: 'runs/abc123def4/components/cm000001/default.png',
        width: 132,
        height: 44,
        diffPct: 1.1,
        htmlKey: 'runs/abc123def4/components/cm000001/preview.html',
        stateHtmlKeys: { hover: 'runs/abc123def4/components/cm000001/preview-hover.html' },
      },
      code: { html: '<button class="btn btn-primary">Start free</button>', css: '.btn-primary { background: var(--color-navy-900); }' },
      checks: [
        { check: 'contrast', status: 'pass', detail: '16.2:1 on navy-900', measured: { ratio: 16.2 } },
        { check: 'focus-visible', status: 'pass', detail: '2 px ring, 12.1:1 against gray-50' },
        { check: 'tap-target', status: 'pass', detail: '350 × 48 at 390 px' },
        { check: 'label', status: 'na', detail: 'Text content' },
        { check: 'reduced-motion', status: 'na', detail: 'Stops under reduced motion' },
      ],
      tier: 'core',
      slug: 'primary-button',
      motion: {
        transitions: [{ state: 'hover', property: 'background-color', durationMs: 160, delayMs: 0, easingTokenId: 'ea000001' }],
        animations: [],
        patternIds: [],
      },
    },
  ],
  checks: {
    summary: { passed: 3, failed: 0, total: 5, applicable: 3 },
    byCheck: [
      { check: 'contrast', passed: 1, applicable: 1, failing: [] },
      { check: 'focus-visible', passed: 1, applicable: 1, failing: [] },
      { check: 'tap-target', passed: 1, applicable: 1, failing: [] },
      { check: 'label', passed: 0, applicable: 0, failing: [] },
      { check: 'reduced-motion', passed: 0, applicable: 0, failing: [] },
    ],
  },
  drift: {
    headline: { kind: null, before: 3, after: 3, sentence: 'Nothing to collapse. 3 colors, 2 spacing steps, all on the grid.' },
    supporting: [],
    numbers: [],
    proposal: {
      colors: [{ name: 'navy-900', value: '#0B1F3A', group: 'brand', absorbs: [], contrastKept: true }],
      spacing: [8, 16],
      type: [],
      contrastKept: true,
    },
    variantCollapses: [],
    evidence: [],
    findingCount: 0,
    narrative: 'Nothing to collapse.',
  },
  exports: { designSystemIntro: 'This design system was extracted from tidewater.app on 2026-10-12.', designSystemMd: '# tidewater.app', promptMd: 'You are building an interface that must match this design system exactly.' },
  cost: {
    inputTokens: 12000,
    outputTokens: 1400,
    usd: 0.03,
    calls: [{ model: 'claude-haiku-5-5', purpose: 'select', inputTokens: 1500, outputTokens: 100, usd: 0.0002, cached: false }],
  },
  stats: { colors: 3, typeStyles: 2, spacingSteps: 2, components: 1, checksPassed: 3, checksApplicable: 3 },
};

/** The document as it reads after each stage lands, oldest first. */
export function partialsByStage(doc: RunDocumentComplete): { stage: string; doc: RunDocumentPartial }[] {
  const identity = {
    id: doc.id,
    url: doc.url,
    host: doc.host,
    createdAt: doc.createdAt,
    pipelineVersion: doc.pipelineVersion,
    viewports: doc.viewports,
  };
  const queued: RunDocumentPartial = { ...identity, status: 'queued' };
  const running = { ...identity, status: 'running' as const, startedAt: doc.startedAt };
  const discovered = { ...running, frameworkHint: doc.frameworkHint, darkThemeDetected: doc.darkThemeDetected };
  const selected = { ...discovered, pages: doc.pages.map((p) => ({ ...p, status: 'pending' as const, captures: {} })) };
  const captured = { ...discovered, pages: doc.pages };
  const palette = { ...captured, tokens: { colors: doc.tokens.colors } };
  const type = { ...captured, tokens: { colors: doc.tokens.colors, type: doc.tokens.type, families: doc.tokens.families } };
  const space = { ...captured, tokens: { ...doc.tokens, duration: undefined, easing: undefined, keyframes: undefined } };
  const motion = { ...captured, tokens: doc.tokens, motion: doc.motion };
  const components = { ...motion, components: doc.components.map((c) => ({ ...c, checks: [] })) };
  const previews = { ...motion, components: doc.components.map((c) => ({ ...c, checks: [] })) };
  const checks = { ...motion, components: doc.components, checks: doc.checks };
  const drift = { ...checks, drift: doc.drift, exports: { designSystemIntro: doc.exports.designSystemIntro } };
  const exportsLanded = { ...drift, exports: doc.exports };
  return [
    { stage: 'queue', doc: queued },
    { stage: 'discover', doc: discovered },
    { stage: 'select', doc: selected },
    { stage: 'capture', doc: captured },
    { stage: 'tokens:palette', doc: palette },
    { stage: 'tokens:type', doc: type },
    { stage: 'tokens:space', doc: space },
    { stage: 'tokens:motion', doc: motion },
    { stage: 'components', doc: components },
    { stage: 'previews', doc: previews },
    { stage: 'checks', doc: checks },
    { stage: 'drift', doc: drift },
    { stage: 'exports', doc: exportsLanded },
    { stage: 'done', doc },
  ];
}
