import { semanticRoleLabels, variantWords, type ColorToken } from '@dse/schema';
import { contrastRatio } from '../color/contrast';
import { deltaE, oklabToOklch, parseCssColor, rgbToOklab } from '../color/parse';
import { hueWord } from '../tokens/constants';
import { px, radiusOf, type SnapElement } from '../capture/snapshot';
import type { Item } from './items';

// Variant split and deterministic variant names (docs/specs/component-detection.md, Clustering 3).

export type VariantDraft = { key: string; tuple: string[]; items: Item[]; name: string; delta: { property: string; value: string }[] };

const tupleProps = ['background-color', 'color', 'border-color', 'border-width', 'padding', 'border-radius', 'font-weight', 'height'] as const;

/** An instance that looks different only because of a state it is in (D-047). */
export function stateOf(el: SnapElement): 'selected' | 'checked' | 'error' | 'disabled' | null {
  if (el.disabled || el.aria['aria-disabled'] === 'true') return 'disabled';
  if (el.aria['aria-invalid'] === 'true') return 'error';
  if (el.aria['aria-checked'] === 'true') return 'checked';
  if (el.aria['aria-selected'] === 'true' || (el.aria['aria-current'] !== undefined && el.aria['aria-current'] !== 'false')) return 'selected';
  return null;
}

/** Height counts toward a variant only where size is a choice: controls, marks, avatars. */
export function sized(it: Item): boolean {
  return it.interactive || it.rules.includes('inline-mark') || it.rules.includes('avatar');
}

export function tupleOf(it: Item): string[] {
  const st = it.el.style;
  const pad = (['top', 'right', 'bottom', 'left'] as const).map((s) => Math.round(px(st[`padding-${s}`]))).join(' ');
  // A transparent border keeps a ghost button's box; it is not an outline.
  const borderColor = px(st['border-top-width']) > 0 && st['border-top-style'] !== 'none' && parseCssColor(st['border-top-color']) ? st['border-top-color'] : 'none';
  return [st['background-color'], st.color, borderColor, String(px(st['border-top-width'])), pad, String(radiusOf(it.el)), st['font-weight'], sized(it) ? String(Math.round(it.el.h / 4) * 4) : ''];
}

const distance = (a: string[], b: string[]) => a.reduce((n, v, i) => n + (v === b[i] ? 0 : 1), 0);

/**
 * Variants come from the instances of the component's main viewport (desktop when it has any) that
 * are in no state; other instances join the variant of the same element (page and selector) or the
 * nearest variant.
 */
export function splitVariants(items: Item[]): VariantDraft[] {
  const main = items.some((i) => i.viewport === 'desktop') ? 'desktop' : 'mobile';
  const primary = items.filter((i) => i.viewport === main && !stateOf(i.el));
  const seeds = primary.length ? primary : items.filter((i) => i.viewport === main).slice(0, 1);
  const variants = new Map<string, VariantDraft>();
  for (const it of seeds) {
    const tuple = tupleOf(it);
    const key = tuple.join('|');
    const v = variants.get(key);
    if (v) v.items.push(it);
    else variants.set(key, { key, tuple, items: [it], name: '', delta: [] });
  }
  const list = [...variants.values()].sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key));
  const bySelector = new Map<string, VariantDraft>();
  for (const v of list) for (const it of v.items) bySelector.set(`${it.page.id}|${it.selector}`, v);
  for (const it of items) {
    if (list.some((v) => v.items.includes(it))) continue;
    const same = bySelector.get(`${it.page.id}|${it.selector}`);
    const t = tupleOf(it);
    const v = same ?? [...list].sort((a, b) => distance(a.tuple, t) - distance(b.tuple, t) || b.items.length - a.items.length)[0]!;
    v.items.push(it);
  }
  return list;
}

type ColorWord = string | null;

function tokenFor(value: string, tokens: ColorToken[]): ColorToken | undefined {
  const c = parseCssColor(value);
  if (!c) return undefined;
  let best: ColorToken | undefined;
  let bestD = Infinity;
  for (const t of tokens) {
    const tc = parseCssColor(t.value)!;
    if (Math.abs(tc.a - c.a) > 0.05) continue;
    const d = deltaE(tc, c);
    if (d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return bestD <= 2.3 ? best : undefined;
}

const roleWord = semanticRoleLabels as Record<string, ColorWord>;
const capital = (w: string) => w[0]!.toUpperCase() + w.slice(1);

type Field = (set: VariantDraft[]) => Map<VariantDraft, string> | null;
const nums = (set: VariantDraft[], f: (v: VariantDraft) => number) => set.map(f);
/** Words for the extremes of a numeric field: `low` for the smallest, `high` for the largest. */
const extremes = (set: VariantDraft[], f: (v: VariantDraft) => number, low: string, high: string): Map<VariantDraft, string> | null => {
  const vals = nums(set, f);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) return null;
  return new Map(set.map((v, i) => [v, vals[i] === min ? low : vals[i] === max ? high : '']));
};
const alphaOf = (v: VariantDraft) => parseCssColor(v.tuple[0]!)?.a ?? 0;
const padOf = (v: VariantDraft) => v.tuple[4]!.split(' ').reduce((s, n) => s + Number(n), 0);
const contrastOf = (v: VariantDraft) => {
  const fg = parseCssColor(v.tuple[1]!);
  const bg = parseCssColor(v.tuple[0]!);
  return fg ? contrastRatio({ ...fg, a: 1 }, bg && bg.a >= 1 ? bg : { r: 255, g: 255, b: 255, a: 1 }) : 0;
};
const w = variantWords.third;

/** The fields that supply a third word, in order (D-084): the first that tells the variants apart names them. */
const fields: Field[] = [
  (set) => {
    const has = set.map((v) => v.tuple[2] !== 'none');
    return has.some(Boolean) && !has.every(Boolean) ? new Map(set.map((v, i) => [v, has[i] ? w.bordered : ''])) : null;
  },
  (set) => {
    const vals = nums(set, (v) => Number(v.tuple[5]));
    const min = Math.min(...vals);
    if (min === Math.max(...vals)) return null;
    return new Map(set.map((v, i) => [v, vals[i] === min ? (min === 0 ? w.square : '') : w.rounded]));
  },
  (set) => extremes(set, padOf, w.tight, w.wide),
  (set) => {
    const vals = nums(set, (v) => Number(v.tuple[6]) || 400);
    const max = Math.max(...vals);
    return max === Math.min(...vals) ? null : new Map(set.map((v, i) => [v, vals[i] === max ? w.bold : '']));
  },
  (set) => {
    const vals = nums(set, contrastOf);
    const min = Math.min(...vals);
    return Math.abs(min - Math.max(...vals)) < 0.01 ? null : new Map(set.map((v, i) => [v, vals[i] === min ? w.muted : '']));
  },
  (set) => extremes(set, (v) => Number(v.tuple[7] || 0), w.short, w.tall),
  (set) => {
    const vals = nums(set, alphaOf);
    const min = Math.min(...vals);
    return min === Math.max(...vals) ? null : new Map(set.map((v, i) => [v, vals[i] === min ? w.faint : '']));
  },
];

/**
 * Variants that would share a name take the word of the first field that tells them apart, field by
 * field, until each name is unique; a set no field tells apart is one variant, merged into the most
 * used. Returns the variants that remain.
 */
function separate(set: VariantDraft[], from: number, merged: Set<VariantDraft>): void {
  if (set.length < 2) return;
  for (let f = from; f < fields.length; f++) {
    const words = fields[f]!(set);
    if (!words || new Set(words.values()).size < 2) continue;
    for (const v of set) if (words.get(v)) v.name = `${v.name} ${words.get(v)}`;
    const groups = new Map<string, VariantDraft[]>();
    for (const v of set) groups.set(v.name, [...(groups.get(v.name) ?? []), v]);
    for (const g of groups.values()) separate(g, f + 1, merged);
    return;
  }
  const [keep, ...rest] = [...set].sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key));
  for (const v of rest) {
    keep!.items.push(...v.items);
    merged.add(v);
  }
}

/**
 * Names in the words of the spec: a color word (the semantic role; else Primary, Secondary, Tertiary
 * by usage, then the ground's hue word; Outlined for a border on no ground; Ghost for neither) and a
 * size word (Small or Large against the most used variant), each left out when every variant shares
 * it; then third words where names would repeat (D-084, D-089). Never a number.
 */
export function nameVariants(variants: VariantDraft[], tokens: ColorToken[]): VariantDraft[] {
  if (variants.length === 1) {
    variants[0]!.name = variantWords.single;
    variants[0]!.delta = [];
    return variants;
  }
  const words = new Map<VariantDraft, ColorWord>();
  for (const v of variants) {
    const [bg, , border] = v.tuple;
    const bgTransparent = !parseCssColor(bg!);
    const hasBorder = border !== 'none';
    const sem = [tokenFor(bg!, tokens), hasBorder ? tokenFor(border!, tokens) : undefined].find((t) => t?.semanticRole);
    if (sem?.semanticRole) words.set(v, roleWord[sem.semanticRole]!);
    else if (bgTransparent && hasBorder) words.set(v, variantWords.outlined);
    else if (bgTransparent) words.set(v, variantWords.ghost);
    else words.set(v, null);
  }
  const colorKey = (v: VariantDraft) => v.tuple.slice(0, 4).join('|');
  // Colors are ranked, not variants: two sizes of one blue are both Primary.
  const colorUse = new Map<string, number>();
  for (const v of variants) if (words.get(v) === null) colorUse.set(colorKey(v), (colorUse.get(colorKey(v)) ?? 0) + v.items.length);
  const ranked = [...colorUse].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
  const rank: readonly string[] = variantWords.ranked;
  const hueOf = (v: VariantDraft) => {
    const t = tokenFor(v.tuple[0]!, tokens);
    const c = parseCssColor(v.tuple[0]!)!;
    return capital(hueWord(t ? t.oklch.h : oklabToOklch(rgbToOklab(c)).h));
  };
  const colorWord = (v: VariantDraft) => words.get(v) ?? rank[ranked.indexOf(colorKey(v))] ?? hueOf(v);
  const sameColor = new Set(variants.map(colorKey)).size === 1;
  // The most used size is the one with the most instances; smaller is Small, larger Large.
  const heightUse = new Map<number, number>();
  for (const v of variants) heightUse.set(Number(v.tuple[7] || 0), (heightUse.get(Number(v.tuple[7] || 0)) ?? 0) + v.items.length);
  const base = [...heightUse].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]![0];
  const sizeWord = (v: VariantDraft) => {
    const h = Number(v.tuple[7] || 0);
    return h && base && h < base ? variantWords.small : h && base && h > base ? variantWords.large : '';
  };
  const sizes = variants.map(sizeWord);
  const sameSize = new Set(sizes).size === 1;
  variants.forEach((v, i) => {
    // Variants that share both words keep the color word, so their third words read Ghost, Ghost rounded (D-090).
    const color = sameColor && !sameSize ? '' : colorWord(v);
    const size = sameSize ? '' : sizes[i]!;
    const name = [color, size].filter(Boolean).join(' ');
    v.name = name ? capital(name) : variantWords.single;
  });
  const merged = new Set<VariantDraft>();
  const byName = new Map<string, VariantDraft[]>();
  for (const v of variants) byName.set(v.name, [...(byName.get(v.name) ?? []), v]);
  for (const g of byName.values()) separate(g, 0, merged);
  const kept = variants.filter((v) => !merged.has(v)).sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key));
  if (kept.length === 1) kept[0]!.name = variantWords.single;
  const top = kept[0]!;
  for (const v of kept) v.delta = tupleProps.map((p, i) => ({ property: p, value: v.tuple[i]! })).filter((d, i) => d.value !== top.tuple[i]);
  return kept;
}
