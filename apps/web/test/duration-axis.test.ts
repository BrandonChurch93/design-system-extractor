import { describe, expect, it } from 'vitest';
import { labeledCount, labelInset, labelRows, logPositions, triggerTicks } from '../lib/duration-axis';

// The strip's log axis and label budget (D-102).

const wide = [150, 200, 300, 350, 400, 500, 700, 900, 1000, 1200, 4000, 14000, 35000];
const dense = [100, 120, 150, 160, 200, 250, 260, 300, 320, 350, 400, 450, 500, 700, 800, 960, 1000, 1200, 1250, 1300, 1500, 2000, 2200, 6000, 10000, 30000];
const ms = (v: number) => `${v.toLocaleString('en-US')} ms`;

describe('the durations axis', () => {
  it('spaces decades evenly and puts a single duration at the center', () => {
    const [a, b, c] = logPositions([150, 1500, 15000], 1000);
    expect(a).toBe(0);
    expect(b).toBeCloseTo(500);
    expect(c).toBe(1000);
    expect(logPositions([300], 800)).toEqual([400]);
    expect(logPositions([300, 300], 800)).toEqual([400, 400]);
  });

  it('labels every value of the owner\'s thirteen on two rows at the 1440 strip width', () => {
    const xs = logPositions(wide, 1064);
    const rows = labelRows(xs, wide.map(ms));
    expect(rows.filter((r) => r === null)).toHaveLength(0);
    expect(Math.max(...(rows as number[]))).toBe(1);
  });

  it('drops what fits on neither row, never stacks past two, and keeps labels apart', () => {
    const xs = logPositions(dense, 320);
    const rows = labelRows(xs, dense.map(ms));
    expect(rows.some((r) => r === null)).toBe(true);
    expect(rows.every((r) => r === null || r < 2)).toBe(true);
    for (const r of [0, 1]) {
      const on = xs.filter((_, i) => rows[i] === r);
      for (let i = 1; i < on.length; i++) expect(on[i]! - on[i - 1]!).toBeGreaterThanOrEqual(56);
    }
  });

  it('skips ticks with no label', () => {
    expect(labelRows([0, 10, 20], ['Base', null, 'Slow'])).toEqual([0, null, 1]);
  });
});

describe('the strip\'s triggers', () => {
  it('takes the most used first and keeps every trigger a target apart', () => {
    expect(triggerTicks([0, 22, 50, 60, 90], [1, 9, 1, 5, 1])).toEqual([false, true, false, true, true]);
    const xs = logPositions(dense, 290);
    const on = xs.filter((_, i) => triggerTicks(xs, dense.map(() => 1))[i]);
    for (let i = 1; i < on.length; i++) expect(on[i]! - on[i - 1]!).toBeGreaterThanOrEqual(24);
  });
});

describe('the strip after the v1.3 review (D-112)', () => {
  it('makes every tick whose value label dropped a trigger, then the rest at the target spacing', () => {
    expect(triggerTicks([0, 10, 20, 60], [1, 1, 9, 1], [false, true, false, false])).toEqual([false, true, false, true]);
  });
  it('ends the scale at 2,000 ms when the Long list holds the rest', () => {
    const xs = logPositions([100, 1000], 1000, 2000);
    expect(xs[0]).toBe(0);
    expect(xs[1]).toBeCloseTo(1000 * (1 / Math.log10(20)));
  });
  it('counts a tick as labeled only when its value and its role both show', () => {
    expect(labeledCount([0, 1, null, 0], ['Base', 'Slow', null, null], [0, null, null, null])).toBe(2);
  });
  it('insets the axis by half the widest label', () => {
    expect(labelInset(['150 ms', '35,000 ms', null])).toBe(Math.ceil((9 * 7.3) / 2));
  });
});
