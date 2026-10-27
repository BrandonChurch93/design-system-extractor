import { ComponentType, type ExpectedFixture, type RunDocumentPartial } from '@dse/schema';
import { validName } from '@dse/pipeline/components/model';
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
  const breakpoints = matchKind('breakpoints', (t.breakpoints ?? []).map((b) => b.value), ex.breakpoints, (p, e) => p === e, String);
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

type Box = { x: number; y: number; w: number; h: number };
function iou(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Components (docs/evals.md, Metrics): a predicted component matches an expected one by type and a
 * first-seen box IoU of 0.5 or more at the same viewport and page; variants by exact count; states by
 * captured over expected, over matched components.
 */
type Pair = { e: ExpectedFixture['components'][number]; p: NonNullable<RunDocumentPartial['components']>[number] };

/** Each expected component paired with the predicted one it matches, by type and first-seen box. */
export function matchComponents(expected: ExpectedFixture, doc: RunDocumentPartial): { pairs: Pair[]; misses: string[]; extras: string[] } {
  const predicted = doc.components ?? [];
  const pagePath = (p: string) => (/-does-not-exist$/.test(p) ? '/{missing}-does-not-exist' : p);
  const claimed = new Set<number>();
  const pairs: Pair[] = [];
  const misses: string[] = [];
  for (const e of expected.components) {
    let best = -1;
    let bestIou = 0.5;
    predicted.forEach((p, i) => {
      if (claimed.has(i) || p.type !== e.type) return;
      const f = p.provenance.firstSeen;
      if (f.viewport !== e.viewport || pagePath(f.path) !== e.page) return;
      const o = iou(f.bbox, e.bbox);
      if (o >= bestIou) {
        best = i;
        bestIou = o;
      }
    });
    if (best >= 0) {
      claimed.add(best);
      pairs.push({ e, p: predicted[best]! });
    } else misses.push(`${e.name} (${e.type})`);
  }
  const extras = predicted.filter((_, i) => !claimed.has(i)).map((p) => `${p.name} (${p.type}) ${p.provenance.firstSeen.path}`);
  return { pairs, misses, extras };
}

/** Planted check accuracy: every planted failure found with its detail, no planted pass flagged. */
export function scoreChecks(expected: ExpectedFixture, doc: RunDocumentPartial): Metric {
  const { pairs } = matchComponents(expected, doc);
  const byName = new Map(pairs.map(({ e, p }) => [e.name, p]));
  const result = (component: string, check: string) => byName.get(component)?.checks.find((r) => r.check === check);
  const missedFailures = expected.checks.plantedFailures.filter((f) => {
    const r = result(f.component, f.check);
    return !(r && r.status === 'fail' && r.detail.includes(f.detailContains));
  });
  const flaggedPasses = expected.checks.plantedPasses.filter((f) => {
    const r = result(f.component, f.check);
    return !(r && r.status === 'pass' && (!f.detailContains || r.detail.includes(f.detailContains)));
  });
  const failures = expected.checks.plantedFailures.length ? 1 - missedFailures.length / expected.checks.plantedFailures.length : 1;
  const passes = expected.checks.plantedPasses.length ? 1 - flaggedPasses.length / expected.checks.plantedPasses.length : 1;
  const describe = (list: { component: string; check: string }[]) => list.map((f) => `${f.component} ${f.check}: ${result(f.component, f.check)?.detail ?? 'no result'}`);
  return {
    value: { failures: round3(failures), passes: round3(passes), summary: doc.checks?.summary, missedFailures: describe(missedFailures), flaggedPasses: describe(flaggedPasses) },
    summary: `failures ${(failures * 100).toFixed(0)}% · passes ${(passes * 100).toFixed(0)}%${missedFailures.length ? ` · missed ${describe(missedFailures).join('; ')}` : ''}${flaggedPasses.length ? ` · flagged ${describe(flaggedPasses).join('; ')}` : ''}`,
    pass: (f) => failures >= f.checks.failures && passes >= f.checks.passes,
  };
}

export function scoreComponents(expected: ExpectedFixture, doc: RunDocumentPartial): { components: Metric; variants: Metric; states: Metric } {
  const predicted = doc.components ?? [];
  const { pairs, misses, extras } = matchComponents(expected, doc);
  const precision = predicted.length ? pairs.length / predicted.length : 0;
  const recall = expected.components.length ? pairs.length / expected.components.length : 0;
  const agreed = pairs.filter(({ e, p }) => e.name.toLowerCase() === p.name.toLowerCase()).length;
  const variantHits = pairs.filter(({ e, p }) => e.variants === p.variants.length);
  const variantMisses = pairs.filter(({ e, p }) => e.variants !== p.variants.length).map(({ e, p }) => `${e.name} ${p.variants.length} of ${e.variants}`);
  const variantAcc = pairs.length ? variantHits.length / pairs.length : 0;
  let wanted = 0;
  let got = 0;
  const stateMisses: string[] = [];
  for (const { e, p } of pairs) {
    for (const s of e.states) {
      wanted++;
      if (p.states.some((x) => x.state === s && x.captured)) got++;
      else stateMisses.push(`${e.name} ${s}`);
    }
  }
  const stateRate = wanted ? got / wanted : 0;
  const names = predicted.map((p) => p.name);
  const namesValid = names.every(validName) && new Set(names.map((n) => n.toLowerCase())).size === names.length && predicted.every((p) => ComponentType.safeParse(p.type).success);
  return {
    components: {
      value: { precision: round3(precision), recall: round3(recall), predicted: predicted.length, expected: expected.components.length, matched: pairs.length, nameAgreement: round3(pairs.length ? agreed / pairs.length : 0), namesValid, misses, extras },
      summary: `P ${precision.toFixed(3)} · R ${recall.toFixed(3)} · ${pairs.length} of ${expected.components.length}${misses.length ? ` · missing ${misses.join(', ')}` : ''}${extras.length ? ` · extra ${extras.join(', ')}` : ''}`,
      pass: (f) => precision >= f.components.precision && recall >= f.components.recall,
    },
    variants: { value: { accuracy: round3(variantAcc), misses: variantMisses }, summary: `${variantAcc.toFixed(3)}${variantMisses.length ? ` · ${variantMisses.join(', ')}` : ''}`, pass: (f) => variantAcc >= f.variants },
    states: { value: { rate: round3(stateRate), captured: got, expected: wanted, misses: stateMisses }, summary: `${stateRate.toFixed(3)} · ${got} of ${wanted}${stateMisses.length ? ` · missing ${stateMisses.slice(0, 8).join(', ')}` : ''}`, pass: (f) => stateRate >= f.states },
  };
}

/** Live previews over components; shown on How it works as "Live previews · 38 of 46". */
export function scoreLiveRate(expected: ExpectedFixture, doc: RunDocumentPartial): Metric {
  const comps = doc.components ?? [];
  const live = comps.filter((c) => c.preview.mode === 'live').length;
  const rate = comps.length ? live / comps.length : 0;
  const captured = comps.filter((c) => c.preview.mode !== 'live').map((c) => `${c.name} (${c.preview.capturedReason ?? 'captured'}${c.preview.diffPct !== undefined ? ` ${c.preview.diffPct} %` : ''})`);
  const planted = expected.previews.captured.filter((p) => !comps.some((c) => c.name === p.name && c.preview.mode === 'captured' && c.preview.capturedReason === p.reason));
  return {
    value: { rate: round3(rate), live, total: comps.length, captured },
    summary: `${rate.toFixed(3)} · ${live} of ${comps.length}${captured.length ? ` · captured ${captured.join(', ')}` : ''}${planted.length ? ` · not captured as planted ${planted.map((p) => `${p.name} (${p.reason})`).join(', ')}` : ''}`,
    pass: (f) => rate >= f.liveRate && planted.length === 0,
  };
}

/**
 * Drift: on a fixture that plants drift, every planted finding found (recall); on one that expects
 * none, zero findings (raw-spread rows are evidence, not findings). The proposal must keep contrast.
 */
export function scoreDrift(expected: ExpectedFixture, doc: RunDocumentPartial): Metric {
  const d = doc.drift;
  if (!d) return { value: null, summary: 'no drift section', pass: () => false };
  const kept = d.proposal.contrastKept;
  if (expected.drift.expectNone) {
    return {
      value: { falseFindings: d.findingCount, contrastKept: kept, headline: d.headline.sentence },
      summary: `${d.findingCount} findings · contrast ${kept ? 'kept' : 'not kept'} · ${d.headline.sentence}`,
      pass: (f) => kept && d.findingCount <= (f.drift.falseFindings ?? 0),
    };
  }
  const rows = d.evidence.filter((e) => !e.evidenceOnly);
  const planted: { what: string; found: boolean }[] = [];
  for (const [a, b] of expected.drift.nearDuplicateColors) planted.push({ what: `${a}~${b}`, found: rows.some((r) => r.kind === 'color' && ((r.a === a && r.b === b) || (r.a === b && r.b === a))) });
  for (const v of expected.drift.offGrid) planted.push({ what: `off-grid ${v}`, found: rows.some((r) => r.kind === 'spacing' && r.a === `${v} px`) });
  const idOf = new Map(matchComponents(expected, doc).pairs.map(({ e, p }) => [e.name, p.id]));
  for (const c of expected.drift.variantCollapses) planted.push({ what: `${c.component} collapse ×${c.count}`, found: d.variantCollapses.some((v) => idOf.get(c.component) === v.componentId && v.merge.length + 1 === c.count) });
  const sizeOf = new Map((doc.tokens?.type ?? []).map((t) => [t.name, t.size]));
  for (const [x, y] of expected.drift.typeNearDuplicates) planted.push({ what: `type ${x}~${y}`, found: rows.some((r) => r.kind === 'type' && [sizeOf.get(r.a), sizeOf.get(r.b)].sort().join() === [x, y].sort().join()) });
  const found = planted.filter((p) => p.found).length;
  const recall = planted.length ? found / planted.length : 1;
  const missed = planted.filter((p) => !p.found).map((p) => p.what);
  return {
    value: { recall: round3(recall), found, planted: planted.length, findings: d.findingCount, contrastKept: kept, missed, headline: d.headline.sentence },
    summary: `recall ${recall.toFixed(3)} · ${found} of ${planted.length} · ${d.findingCount} findings · contrast ${kept ? 'kept' : 'not kept'}${missed.length ? ` · missed ${missed.join(', ')}` : ''}`,
    pass: (f) => kept && recall >= (f.drift.recall ?? 1),
  };
}
