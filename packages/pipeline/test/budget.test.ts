import { describe, expect, it } from 'vitest';
import { BUDGET, overBudget } from '../src/budget';
import type { RunContext } from '../src/context';

// The run's time budget (D-066): each elastic step stops spending at its share of the timeout.

const ctx = (startedAt: string | undefined, timeoutMs = 360_000) => ({ current: () => ({ startedAt }), config: { timeoutMs } }) as unknown as RunContext;
const start = Date.parse('2026-10-26T12:00:00.000Z');

describe('the time budget', () => {
  it('lets each step spend until its share of the timeout, then not', () => {
    const c = ctx(new Date(start).toISOString());
    for (const step of Object.keys(BUDGET) as (keyof typeof BUDGET)[]) {
      const edge = start + BUDGET[step] * 360_000;
      expect(overBudget(c, step, edge - 1), step).toBe(false);
      expect(overBudget(c, step, edge + 1), step).toBe(true);
    }
  });

  it('leaves room for the stages after each step, in pipeline order', () => {
    const order = ['fingerprints', 'states', 'naming', 'previews', 'narrative'] as const;
    for (let i = 1; i < order.length; i++) expect(BUDGET[order[i]!]).toBeGreaterThan(BUDGET[order[i - 1]!]);
    expect(BUDGET.narrative).toBeLessThan(1);
  });

  it('never cuts a run that has not started', () => {
    expect(overBudget(ctx(undefined), 'states', start + 10 * 360_000)).toBe(false);
  });
});
