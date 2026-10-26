import type { ExpectedFixture, RunDocumentPartial } from '@dse/schema';
import type { Floors } from './fixtures';

export type Metric = { value: unknown; summary: string; pass: (f: Floors) => boolean };
export type FixtureResult = { name: string; seconds: number; metrics: Record<string, Metric> };

const synthetic = /-does-not-exist$/;
const key = (p: { path: string; reason: string }) => `${synthetic.test(p.path) ? '/{missing}' : p.path} ${p.reason}`;

/** Selection exactness: the selected pages, by path and reason, equal the expected set. */
export function scoreSelection(expected: ExpectedFixture, doc: RunDocumentPartial): Metric {
  const want = new Set(expected.pages.map(key));
  const got = new Set((doc.pages ?? []).map(key));
  const missing = [...want].filter((k) => !got.has(k));
  const extra = [...got].filter((k) => !want.has(k));
  const exact = missing.length === 0 && extra.length === 0;
  return {
    value: { exact, expected: want.size, selected: got.size, missing, extra },
    summary: exact ? `exact · ${got.size} pages` : `missing ${missing.join(', ') || 'none'} · extra ${extra.join(', ') || 'none'}`,
    pass: () => exact,
  };
}

type Kind = { kind: string; predicted: number; expected: number; matched: number; misses: string[]; extras: string[] };

/** One-to-one greedy matching: each expected item takes the first unclaimed predicted item that fits. */
function matchKind<P, E>(kind: string, predicted: P[], expected: E[], fits: (p: P, e: E) => boolean, label: (x: P | E) => string): Kind {
  const claimed = new Set<number>();
  const misses: string[] = [];
  for (const e of expected) {
    const i = predicted.findIndex((p, j) => !claimed.has(j) && fits(p, e));
    if (i >= 0) claimed.add(i);
    else misses.push(label(e));
  }
  const extras = predicted.filter((_, j) => !claimed.has(j)).map(label);
  return { kind, predicted: predicted.length, expected: expected.length, matched: claimed.size, misses, extras };
}

/**
 * Token precision and recall (docs/evals.md, Metrics): colors by ΔE ≤ 2 and group, type by role,
 * size ± 0.5 and weight, spacing steps, off-grid values, radii and breakpoints exactly, shadows by count.
 */
export function scoreTokens(expected: ExpectedFixture, doc: RunDocumentPartial, deltaE: (a: string, b: string) => number): Metric {
  const t = doc.tokens ?? {};
  const ex = expected.tokens;
  const colors = matchKind(
    'colors',
    t.colors ?? [],
    ex.colors,
    (p, e) => p.group === e.group && deltaE(p.value, e.value) <= 2,
    (x) => `${x.value} ${x.group}`,
  );
  const type = matchKind(
    'type',
    t.type ?? [],
    ex.type,
    (p, e) => p.role === e.role && Math.abs(p.size - e.size) <= 0.5 && p.weight === e.weight,
    (x) => `${x.role} ${x.size}/${x.weight}`,
  );
  const steps = matchKind('space', (t.space ?? []).filter((s) => s.onGrid).map((s) => s.value), ex.space.steps, (p, e) => p === e, String);
  const off = matchKind('offGrid', (t.space ?? []).filter((s) => !s.onGrid).map((s) => s.value), ex.space.offGrid, (p, e) => p === e, String);
  const radius = matchKind('radius', (t.radius ?? []).map((r) => (r.isPill ? 999 : r.value)), ex.radius, (p, e) => p === e, String);
  const breakpoints = matchKind('breakpoints', t.breakpoints ?? [], ex.breakpoints, (p, e) => p === e, String);
  const shadowCount = t.shadow?.length ?? 0;
  const shadow: Kind = { kind: 'shadow', predicted: shadowCount, expected: ex.shadowCount, matched: Math.min(shadowCount, ex.shadowCount), misses: [], extras: [] };
  const base: Kind = { kind: 'base', predicted: 1, expected: 1, matched: t.spaceBase?.value === ex.space.base ? 1 : 0, misses: [], extras: [] };
  const kinds = [colors, type, steps, off, radius, breakpoints, shadow, base];
  const sum = (f: (k: Kind) => number) => kinds.reduce((s, k) => s + f(k), 0);
  const precision = sum((k) => k.predicted) ? sum((k) => k.matched) / sum((k) => k.predicted) : 0;
  const recall = sum((k) => k.expected) ? sum((k) => k.matched) / sum((k) => k.expected) : 0;
  const problems = kinds.filter((k) => k.misses.length || k.extras.length || k.matched < Math.max(k.predicted, k.expected));
  const names = (t.colors ?? []).map((c) => c.name);
  const namesValid = names.every((n) => /^[a-z]+(-[a-z0-9]+)*$/.test(n)) && new Set(names).size === names.length;
  return {
    value: { precision: round3(precision), recall: round3(recall), namesValid, kinds: Object.fromEntries(kinds.map((k) => [k.kind, { predicted: k.predicted, expected: k.expected, matched: k.matched, misses: k.misses, extras: k.extras }])) },
    summary: `P ${precision.toFixed(3)} · R ${recall.toFixed(3)}${namesValid ? '' : ' · invalid color names'}${problems.length ? ` · off in ${problems.map((k) => k.kind).join(', ')}` : ''}`,
    pass: (f) => namesValid && precision >= f.tokens.precision && recall >= f.tokens.recall,
  };
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;
