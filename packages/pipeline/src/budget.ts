import type { RunContext } from './context';

/**
 * The shares of the run timeout by which each elastic step stops spending time (D-066). Past its
 * share a step takes its lighter path, so a large site completes inside the timeout: fingerprints
 * fall back to path patterns, state probing to default captures, naming to the deterministic names,
 * render checks to the captured crop, the narrative to its template.
 */
export const BUDGET = { fingerprints: 0.12, states: 0.45, naming: 0.7, previews: 0.88, narrative: 0.94 } as const;
export type BudgetStep = keyof typeof BUDGET;

export function overBudget(ctx: RunContext, step: BudgetStep, now = Date.now()): boolean {
  const started = Date.parse(ctx.current().startedAt ?? '');
  if (!Number.isFinite(started)) return false;
  return now - started > BUDGET[step] * ctx.config.timeoutMs;
}
