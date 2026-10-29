import type { CheckResult, Component, Stats } from './run-document';

// Counts read from a document, shared by the pipeline, the exports, the MCP server and the app.

export function checkCounts(checks: CheckResult[]): { passed: number; applicable: number; failed: number } {
  const applicable = checks.filter((c) => c.status !== 'na');
  const passed = applicable.filter((c) => c.status === 'pass').length;
  return { passed, applicable: applicable.length, failed: applicable.length - passed };
}

/** Every applicable check passed; false when none applies, which leaves it out of the ratio (D-096). */
export function passesAll(checks: CheckResult[]): boolean {
  const k = checkCounts(checks);
  return k.applicable > 0 && k.failed === 0;
}

export function componentsPassing(components: Pick<Component, 'checks'>[]): NonNullable<Stats['componentsPassing']> {
  const applicable = components.filter((c) => checkCounts(c.checks).applicable > 0);
  return { passed: applicable.filter((c) => passesAll(c.checks)).length, applicable: applicable.length };
}

export function previewCounts(components: Pick<Component, 'preview'>[]): NonNullable<Stats['previews']> {
  const out = { live: 0, diff: 0, 'css-too-large': 0, 'fonts-unavailable': 0, 'not-checked': 0, 'hidden-until-focus': 0, 'no-crop': 0 };
  for (const { preview: p } of components) {
    if (p.mode === 'live') out.live++;
    else out[p.capturedReason ?? 'diff']++;
  }
  return out;
}
