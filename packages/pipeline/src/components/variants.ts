import { fill, semanticRoleLabels, variantWords, type ColorToken } from '@dse/schema';
import { deltaE, parseCssColor } from '../color/parse';
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

/**
 * Names in the words of the spec: a color word (the semantic role; else Primary, Secondary, Tertiary
 * by usage; Outlined for a border on no ground; Ghost for neither) and a size word (Small or Large
 * against the most used variant), each left out when every variant shares it.
 */
export function nameVariants(variants: VariantDraft[], tokens: ColorToken[]): void {
  if (variants.length === 1) {
    variants[0]!.name = variantWords.single;
    return;
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
  const colorWord = (v: VariantDraft) => words.get(v) ?? rank[ranked.indexOf(colorKey(v))] ?? fill(variantWords.rankedMore, { n: ranked.indexOf(colorKey(v)) + 1 });
  const sameColor = new Set(variants.map(colorKey)).size === 1;
  const top = [...variants].sort((a, b) => b.items.length - a.items.length)[0]!;
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
  const used = new Map<string, number>();
  variants.forEach((v, i) => {
    const color = sameColor ? '' : colorWord(v);
    const size = sameSize ? '' : sizes[i]!;
    let name = [color, size].filter(Boolean).join(' ');
    name = name ? name[0]!.toUpperCase() + name.slice(1) : variantWords.single;
    const n = (used.get(name) ?? 0) + 1;
    used.set(name, n);
    v.name = n > 1 ? `${name} ${n}` : name;
  });
  for (const v of variants) v.delta = tupleProps.map((p, i) => ({ property: p, value: v.tuple[i]! })).filter((d, i) => d.value !== top.tuple[i]);
}
