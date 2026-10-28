import type { Component, RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { compare as C, runPage } from '../copy/strings';
import { checkCounts } from './doc';
import { count, numberWord } from './format';

// What changed between two runs (docs/design/pages.md, Compare). Pure: the page and its test call it.

const DAY = 86_400_000;

/** "today", "three days", "six weeks", "14 months" (rule 9), from the earlier run to the later. */
export function span(fromIso: string, toIso: string): string {
  const days = Math.round(Math.abs(Date.parse(toIso) - Date.parse(fromIso)) / DAY);
  if (days === 0) return C.today;
  if (days < 14) return days === 1 ? C.spans.day : fill(C.spans.days, { n: numberWord(days) });
  if (days < 60) {
    const w = Math.round(days / 7);
    return w === 1 ? C.spans.week : fill(C.spans.weeks, { n: numberWord(w) });
  }
  const m = Math.round(days / 30);
  return m === 1 ? C.spans.month : fill(C.spans.months, { n: numberWord(m) });
}

export type Stat = { before: number; after: number };
export type Deltas = { colors: Stat; typeStyles: Stat; spacingSteps: Stat; components: Stat; checksPassed: Stat; checksApplicable: Stat; grays: Stat; graysProposedAfter: number; newComponents: number };

const neutrals = (d: RunDocumentPartial) => (d.tokens?.colors ?? []).filter((c) => c.group === 'neutral').length;
// Names come from a model and can differ between runs; the signature is what the site wrote.
const key = (c: Component) => `${c.type}:${c.signature.tag}:${[...c.signature.classTokens].sort().join('.') || c.name.toLowerCase()}`;

export function deltas(a: RunDocumentPartial, b: RunDocumentPartial): Deltas {
  const s = (d: RunDocumentPartial) => d.stats ?? { colors: 0, typeStyles: 0, spacingSteps: 0, components: 0, checksPassed: 0, checksApplicable: 0 };
  const [sa, sb] = [s(a), s(b)];
  const before = new Set((a.components ?? []).map(key));
  return {
    colors: { before: sa.colors, after: sb.colors },
    typeStyles: { before: sa.typeStyles, after: sb.typeStyles },
    spacingSteps: { before: sa.spacingSteps, after: sb.spacingSteps },
    components: { before: sa.components, after: sb.components },
    checksPassed: { before: sa.checksPassed, after: sb.checksPassed },
    checksApplicable: { before: sa.checksApplicable, after: sb.checksApplicable },
    grays: { before: neutrals(a), after: neutrals(b) },
    graysProposedAfter: (b.drift?.proposal.colors ?? []).filter((c) => c.group === 'neutral').length || neutrals(b),
    newComponents: (b.components ?? []).filter((c) => !before.has(key(c))).length,
  };
}

/** The words under each delta (copy.md, Compare: delta captions). */
export function deltaCaptions(d: Deltas): { colors: string; grays: string | null; components: string | null; checks: string; spacing: string | null } {
  const diff = d.colors.before - d.colors.after;
  const label = C.deltas.colorsFewer.split('{n}')[0];
  const colors = diff > 0 ? fill(C.deltas.colorsFewer, { n: count(diff) }) : diff < 0 ? `${label}${fill(C.deltas.colorsMore, { n: count(-diff) })}` : `${label}${C.deltas.colorsUnchanged}`;
  const grayDiff = d.grays.before - d.grays.after;
  const toGo = Math.max(0, d.grays.after - d.graysProposedAfter);
  return {
    colors,
    grays: grayDiff > 0 ? (toGo > 0 ? fill(C.deltas.grays, { n: count(grayDiff), k: count(toGo) }) : fill(C.deltas.grays.split(', still')[0]!, { n: count(grayDiff) })) : null,
    components: d.newComponents ? fill(C.deltas.components, { n: count(d.newComponents) }) : null,
    checks: fill(C.deltas.checks, { a: count(d.checksApplicable.before), b: count(d.checksApplicable.after) }),
    spacing: d.spacingSteps.before === d.spacingSteps.after ? C.deltas.spacingUnchanged : null,
  };
}

export type ColorDiff = { added: { value: string; name: string; where: string }[]; removed: { value: string; name: string }[]; unchanged: { value: string; name: string }[] };

export function colorDiff(a: RunDocumentPartial, b: RunDocumentPartial): ColorDiff {
  const av = new Map((a.tokens?.colors ?? []).map((c) => [c.value, c]));
  const bv = new Map((b.tokens?.colors ?? []).map((c) => [c.value, c]));
  const paths = new Map((b.pages ?? []).map((p) => [p.id, p.path]));
  return {
    added: [...bv.values()].filter((c) => !av.has(c.value)).map((c) => ({ value: c.value, name: c.name, where: paths.get(c.pages[0]?.pageId ?? '') ?? '' })),
    removed: [...av.values()].filter((c) => !bv.has(c.value)).map((c) => ({ value: c.value, name: c.name })),
    unchanged: [...bv.values()].filter((c) => av.has(c.value)).map((c) => ({ value: c.value, name: c.name })),
  };
}

export type Change = { name: string; change: 'new' | 'changed' | 'removed'; before: string; after: string; checks: string };

const variantsWord = (n: number) => (n === 1 ? runPage.components.oneVariant : fill(runPage.components.variants, { variants: count(n) }));
const checksOf = (c: Component) => {
  const k = checkCounts(c.checks);
  return fill(runPage.passedOf, { passed: k.passed, applicable: k.applicable });
};

/** Components that are new, removed, or whose variants or checks changed; the rest are left out. */
export function componentChanges(a: RunDocumentPartial, b: RunDocumentPartial): Change[] {
  const av = new Map((a.components ?? []).map((c) => [key(c), c]));
  const bv = new Map((b.components ?? []).map((c) => [key(c), c]));
  const out: Change[] = [];
  for (const [k, c] of bv) {
    const old = av.get(k);
    if (!old) out.push({ name: c.name, change: 'new', before: '', after: variantsWord(c.variants.length), checks: checksOf(c) });
    else if (old.variants.length !== c.variants.length || checksOf(old) !== checksOf(c))
      out.push({ name: c.name, change: 'changed', before: variantsWord(old.variants.length), after: variantsWord(c.variants.length), checks: `${checksOf(old)} → ${checksOf(c)}` });
  }
  for (const [k, c] of av) if (!bv.has(k)) out.push({ name: c.name, change: 'removed', before: variantsWord(c.variants.length), after: '', checks: checksOf(c) });
  const rank = { new: 0, changed: 1, removed: 2 };
  return out.sort((x, y) => rank[x.change] - rank[y.change] || x.name.localeCompare(y.name));
}

export type MotionCounts = { label: 'durations' | 'easings' | 'keyframes' | 'patterns'; before: number; after: number }[];

/** The Motion table's four counts for each run (D-089). */
export function motionDiff(a: RunDocumentPartial, b: RunDocumentPartial): MotionCounts {
  const n = (d: RunDocumentPartial) => ({ durations: d.tokens?.duration?.length ?? 0, easings: d.tokens?.easing?.length ?? 0, keyframes: d.tokens?.keyframes?.length ?? 0, patterns: d.motion?.patterns.length ?? 0 });
  const [x, y] = [n(a), n(b)];
  return (['durations', 'easings', 'keyframes', 'patterns'] as const).map((label) => ({ label, before: x[label], after: y[label] }));
}
