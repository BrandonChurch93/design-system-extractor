// Every static string the app renders, transcribed verbatim from docs/design/copy.md.
// User-facing JSX reads from here. apps/web/test/copy-audit.test.ts asserts each string
// appears in copy.md. Braced placeholders are filled with `fill` from @dse/schema.

export const global = {
  wordmark: 'Design System Extractor',
  nav: { showcase: 'Showcase', recent: 'Recent runs', howItWorks: 'How it works', github: 'GitHub' },
  footer: {
    openSource: 'Open source · MIT · Built by Brandon Church',
    builtBy: 'Brandon Church',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    builtWith: 'Built with',
  },
  toasts: { copied: 'Copied', linkCopied: 'Link copied', signInDisabled: 'Sign-in is not enabled yet.' },
  icons: { menu: 'Menu', close: 'Close', copy: 'Copy' },
  navLabel: 'Primary',
  sectionsLabel: 'Sections',
  validation: 'Something about that request was not right. Try again.',
  rateLimit: 'Too many requests. Try again in a minute.',
} as const;

export const home = {
  headline: 'Paste a URL. Get its design system back.',
  subline: 'Tokens, components with every state, accessibility checks, and a drift report showing where the system is leaking.',
  placeholder: 'https://your-product.com',
  inputLabel: 'Site URL',
  extract: 'Extract',
  errors: {
    notUrl: 'That is not a web address.',
    notHttp: 'Only http and https sites can be crawled.',
    otherHost: 'That is not the same site as the URL above.',
  },
} as const;

export const runPage = {
  buttons: { share: 'Share', runAgain: 'Run again', compare: 'Compare', export: 'Export', cancel: 'Cancel' },
  liveLog: { label: 'Live log', collapse: 'Collapse', expand: 'Expand' },
  sectionNav: { tokens: 'Tokens', components: 'Components', checks: 'Checks', drift: 'Drift', exports: 'Exports' },
  statLabels: { colors: 'Colors', typeStyles: 'Type styles', spacingSteps: 'Spacing steps', components: 'Components', checksPassed: 'Checks passed' },
  mcp: {
    title: 'MCP server',
    caption: 'Claude Code and Claude Desktop read this run directly. No pasting.',
    install: 'claude mcp add design-system-extractor -- npx -y @design-system-extractor/mcp --run {id}',
  },
  modelHaiku: 'Model · Haiku',
  deterministic: 'Deterministic',
  captured: 'Captured',
  codeTabs: { html: 'HTML', css: 'CSS', tailwind: 'Tailwind' },
  pageListFooter: 'Picked for component coverage, not importance. Legal pages, tag archives and pagination were skipped.',
} as const;

export const componentPanel = {
  showOnPage: 'Show on page',
  handleLabel: 'Component details',
} as const;

export const recent = {
  empty: {
    title: 'No runs yet in this browser.',
    body: 'Paste a URL on the home page and it will show up here.',
    action: 'Extract a site',
  },
} as const;

export const statePages = {
  browseShowcase: 'Browse the showcase',
  recentRuns: 'Your recent runs',
  budget: {
    eyebrow: 'Runs paused',
    title: "Today's budget is spent.",
    body: 'This site runs on a fixed daily budget so nobody can run up a bill. It resets at midnight Mountain time, in about {hours} hours.',
    meter: '{used} of {budget} used',
    runsToday: '{n} runs today',
    formHeading: 'Run it now with your own key',
    extract: 'Extract {host}',
    footer: 'Your URL is kept in the form. Nothing was lost.',
  },
} as const;

export const keyPopover = {
  label: 'Your Anthropic API key',
  placeholder: 'sk-ant-…',
} as const;

export const catalog = {
  title: 'Catalog',
  caption: 'Every component of the app, in every state, from sample data.',
  devLine: 'Design QA · build spend {used} of {cap}',
  indexLabel: 'Catalog index',
  frameTitle: '{name} at 390 px',
  replay: 'Replay',
} as const;
