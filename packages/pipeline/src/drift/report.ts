import type { Component, Drift, DriftNumber, Tokens } from '@dse/schema';
import type { Findings } from './findings';

// Numbers, headline and captions (docs/specs/drift.md; patterns in docs/design/copy.md). Every
// sentence is a template filled with computed facts.

const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** Copy rule 9: numbers under ten are words in running sentences, capitalized to start one. */
export function inWords(n: number, start = false): string {
  const w = Number.isInteger(n) && n >= 0 && n < 10 ? words[n]! : String(n);
  return start ? w[0]!.toUpperCase() + w.slice(1) : w;
}

export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

export type Facts = {
  grays: { before: number; after: number; pages: number; within: number; involved: number };
  variants: { before: number; after: number; components: number; affected: number; involved: number; delta: string };
  spacing: { before: number; after: number; offGrid: number; base: number; values: number[]; pages: string[] };
  type: { before: number; after: number; involved: number };
};

export function factsOf(tokens: Tokens, comps: Component[], f: Findings, grays: { before: number; after: number }, proposalSpacing: number, proposalType: number, pageCount: number): Facts {
  const involved = new Set(f.colors.filter((p) => p.a.group === 'neutral').flatMap((p) => [p.a.id, p.b.id]));
  const variantsBefore = comps.reduce((s, c) => s + c.variants.length, 0);
  const merged = f.collapses.reduce((s, c) => s + c.merge.length, 0);
  const parts = f.collapses.map((c) => c.parts);
  const pad = Math.max(0, ...parts.map((p) => p.padding));
  const rad = Math.max(0, ...parts.map((p) => p.radius));
  const delta = joinAnd([pad ? `${pad} px of padding` : '', rad ? `a ${rad} px radius` : '', parts.some((p) => p.color) ? 'a color within ΔE 3' : ''].filter(Boolean)).replace(/ and ([^,]*)$/, ' or $1');
  const off = f.spacing.filter((s) => s.kind === 'off-grid');
  return {
    grays: { before: grays.before, after: grays.after, pages: pageCount, within: Math.max(0, ...f.colors.filter((p) => p.a.group === 'neutral').map((p) => p.delta)), involved: involved.size },
    variants: { before: variantsBefore, after: variantsBefore - merged, components: comps.length, affected: new Set(f.collapses.map((c) => c.componentId)).size, involved: f.collapses.reduce((s, c) => s + c.merge.length + 1, 0), delta },
    spacing: { before: tokens.space.length, after: proposalSpacing, offGrid: off.length, base: tokens.spaceBase.value, values: off.map((s) => s.value), pages: [...new Set(off.flatMap((s) => s.pages))] },
    type: { before: tokens.type.length, after: proposalType, involved: new Set(f.type.flatMap((p) => [p.a.id, p.b.id])).size },
  };
}

function caption(kind: DriftNumber['kind'], x: Facts): string {
  if (kind === 'grays') return `${inWords(x.grays.involved, true)} are within ΔE ${x.grays.within.toFixed(1)} of a neighbor. Nobody can tell them apart.`;
  if (kind === 'variants') return `${inWords(x.variants.involved, true)} differ only by ${x.variants.delta}.`;
  if (kind === 'spacing') {
    const pages = x.spacing.pages.length > 3 ? `${inWords(x.spacing.pages.length)} pages` : joinAnd(x.spacing.pages);
    return `${inWords(x.spacing.offGrid, true)} sit off the ${x.spacing.base} px grid: ${joinAnd(x.spacing.values.map(String))}, on ${pages}.`;
  }
  return `${inWords(x.type.involved, true)} differ by 1 px or less in size or line height.`;
}

/** Up to three numbers with a reduction, the largest relative reduction first. */
export function numbersOf(x: Facts): DriftNumber[] {
  const all: DriftNumber[] = [
    { kind: 'grays', before: x.grays.before, after: x.grays.after, caption: '' },
    { kind: 'variants', before: x.variants.before, after: x.variants.after, caption: '' },
    { kind: 'spacing', before: x.spacing.before, after: x.spacing.after, caption: '' },
    { kind: 'type', before: x.type.before, after: x.type.after, caption: '' },
  ];
  return all
    .filter((n) => n.before > n.after)
    .sort((a, b) => (b.before - b.after) / b.before - (a.before - a.after) / a.before)
    .slice(0, 3)
    .map((n) => ({ ...n, caption: caption(n.kind, x) }));
}

/** The headline patterns, numerals (copy rule 9: headlines take numerals). */
export function headlineOf(n: DriftNumber, x: Facts): string {
  if (n.kind === 'grays') return `${n.before} grays across ${x.grays.pages} pages. ${n.after} would do.`;
  if (n.kind === 'variants') return `${n.before} variants across ${x.variants.components} components. ${n.after} would do.`;
  if (n.kind === 'spacing') return `${n.before} spacing values, ${x.spacing.offGrid} of them off the ${x.spacing.base} px grid.`;
  return `${n.before} type styles where ${n.after} would do.`;
}

/** A supporting finding as a running sentence, numbers under ten in words. */
export function supportingOf(n: DriftNumber, x: Facts): string {
  if (n.kind === 'grays') return `${inWords(n.before, true)} grays across ${inWords(x.grays.pages)} pages where ${inWords(n.after)} would do.`;
  if (n.kind === 'variants') return `${inWords(n.before, true)} variants across ${inWords(x.variants.components)} components where ${inWords(n.after)} would do.`;
  if (n.kind === 'spacing') return `${inWords(n.before, true)} spacing values, ${inWords(x.spacing.offGrid)} of them off the ${x.spacing.base} px grid.`;
  return `${inWords(n.before, true)} type styles where ${inWords(n.after)} would do.`;
}

export function nothingToCollapse(tokens: Tokens): string {
  return `Nothing to collapse. ${tokens.colors.length} colors, ${tokens.space.filter((s) => s.onGrid).length} spacing steps, all on the grid.`;
}

export function headlineAndSupport(tokens: Tokens, numbers: DriftNumber[], x: Facts): Pick<Drift, 'headline' | 'supporting'> {
  const first = numbers[0];
  if (!first) return { headline: { kind: null, before: 0, after: 0, sentence: nothingToCollapse(tokens) }, supporting: [] };
  return { headline: { kind: first.kind, before: first.before, after: first.after, sentence: headlineOf(first, x) }, supporting: numbers.slice(1).map((n) => supportingOf(n, x)) };
}
