import { deltaE, parseCssColor } from '../color/parse';
import type { Item, StyleInputs } from './items';

// Exact groups, then the style merge (docs/specs/component-detection.md, Clustering 1 and 2).

export type Cluster = { key: string; items: Item[] };

export function exactKey(it: Item): string {
  const f = it.fp;
  return [f.tag, f.role, f.baseTokens.join('.'), f.structure, f.iconOnly ? 'icon' : '', f.trigger ? 'trigger' : '', f.semanticGround ? 'semantic' : ''].join('|');
}

export function exactGroups(items: Item[]): Cluster[] {
  const groups = new Map<string, Item[]>();
  for (const it of items) {
    const k = exactKey(it);
    const g = groups.get(k);
    if (g) g.push(it);
    else groups.set(k, [it]);
  }
  return [...groups].map(([key, items]) => ({ key, items }));
}

/** The instance that speaks for a group: desktop first, then capture order, then document order. */
export function representative(items: Item[]): Item {
  return [...items].sort((a, b) => Number(a.viewport !== 'desktop') - Number(b.viewport !== 'desktop') || a.page.order - b.page.order || a.el.index - b.el.index)[0]!;
}

function colorClose(a: string, b: string, tolerance: number): boolean {
  const x = parseCssColor(a);
  const y = parseCssColor(b);
  if (!x || !y) return !x && !y;
  return Math.abs(x.a - y.a) <= 0.05 && deltaE(x, y) <= tolerance;
}

/** Properties of the style hash that differ beyond tolerance, and the count that differ at all. */
export function styleDifference(a: StyleInputs, b: StyleInputs): { differing: number; beyond: number } {
  let differing = 0;
  let beyond = 0;
  const check = (same: boolean, within: boolean) => {
    if (same) return;
    differing++;
    if (!within) beyond++;
  };
  check(a.background === b.background, colorClose(a.background, b.background, 6));
  check(a.borderColor === b.borderColor || (a.borderWidth === 0 && b.borderWidth === 0), colorClose(a.borderColor, b.borderColor, 6));
  check(a.borderWidth === b.borderWidth, false);
  check(a.borderStyle === b.borderStyle || (a.borderWidth === 0 && b.borderWidth === 0), false);
  check(a.radius === b.radius, Math.abs(a.radius - b.radius) <= 2);
  check(a.padding.join() === b.padding.join(), a.padding.every((p, i) => Math.abs(p - b.padding[i]!) <= 4));
  check(a.fontSize === b.fontSize, Math.abs(a.fontSize - b.fontSize) <= 1);
  check(a.fontWeight === b.fontWeight, false);
  check(a.display === b.display, false);
  check(a.shadow === b.shadow, false);
  check(a.textTransform === b.textTransform, false);
  return { differing, beyond };
}

const subsetOf = (a: string[], b: string[]) => a.every((t) => b.includes(t));
const root = (t: string) => t.split(/-+/)[0]!;

/**
 * Two groups may merge when their base class tokens agree: none to read, one inside the other, or
 * every token sharing its root with one on the other side (`pagination-link`, `pagination-next`).
 * Differently named components with equal styles stay apart (D-052).
 */
export function classesAllowMerge(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0 || subsetOf(a, b) || subsetOf(b, a)) return true;
  return a.every((t) => b.some((u) => root(u) === root(t))) && b.every((t) => a.some((u) => root(u) === root(t)));
}

/** Overlap of two structures' tag counts, 1 when both are empty. */
export function structureSimilarity(a: string, b: string): number {
  const parse = (s: string) => new Map(s.split(' ').filter(Boolean).map((x) => [x.split(':')[0]!, Number(x.split(':')[1])] as const));
  const ma = parse(a);
  const mb = parse(b);
  let inter = 0;
  let union = 0;
  for (const k of new Set([...ma.keys(), ...mb.keys()])) {
    inter += Math.min(ma.get(k) ?? 0, mb.get(k) ?? 0);
    union += Math.max(ma.get(k) ?? 0, mb.get(k) ?? 0);
  }
  return union === 0 ? 1 : inter / union;
}

/** Groups of the same tag and role merge when at most two style properties differ, each within tolerance. */
export function styleMerge(groups: Cluster[]): Cluster[] {
  const parent = groups.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const reps = groups.map((g) => representative(g.items));
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const a = reps[i]!.fp;
      const b = reps[j]!.fp;
      if (a.tag !== b.tag || a.role !== b.role || a.iconOnly !== b.iconOnly || a.trigger !== b.trigger) continue;
      if (!classesAllowMerge(a.baseTokens, b.baseTokens)) continue;
      if (structureSimilarity(a.structure, b.structure) < 0.7) continue;
      const d = styleDifference(a.style, b.style);
      if (d.differing <= 2 && d.beyond === 0) parent[find(j)] = find(i);
    }
  }
  const merged = new Map<number, Cluster>();
  groups.forEach((g, i) => {
    const root = find(i);
    const m = merged.get(root);
    if (m) m.items.push(...g.items);
    else merged.set(root, { key: g.key, items: [...g.items] });
  });
  return [...merged.values()];
}

/**
 * Groups that share their base class tokens are one component whatever their colors or children: a
 * link styled `.btn` and a `button.btn` are one button, `.alert` with and without a link one alert.
 * Icon-only controls stay apart (D-052).
 */
export function familyMerge(groups: Cluster[]): Cluster[] {
  const controls = ['a', 'button', 'input[submit]', 'input[button]'];
  const byFamily = new Map<string, Cluster>();
  const out: Cluster[] = [];
  for (const g of groups) {
    const r = representative(g.items).fp;
    if (r.baseTokens.length === 0) {
      out.push(g);
      continue;
    }
    const k = [controls.includes(r.tag) ? 'control' : r.tag, r.role, r.baseTokens.join('.'), r.iconOnly, r.semanticGround ?? false].join('|');
    const f = byFamily.get(k);
    if (f) f.items.push(...g.items);
    else {
      const c = { key: g.key, items: [...g.items] };
      byFamily.set(k, c);
      out.push(c);
    }
  }
  return out;
}

export function clusterItems(items: Item[]): Cluster[] {
  return styleMerge(familyMerge(exactGroups(items)));
}
