import { z } from 'zod';
import { parseCssColor } from '../color/parse';
import { styleProps, type RawElement, type SnapshotResult } from './snapshot-script';

// The snapshot as Node sees it: validated, with style maps and tree helpers.

const RawElementSchema = z.object({
  d: z.string(),
  p: z.number().int(),
  tag: z.string(),
  id: z.string(),
  cls: z.array(z.string()),
  role: z.string().nullable(),
  type: z.string().nullable(),
  href: z.boolean(),
  disabled: z.boolean(),
  aria: z.record(z.string(), z.string()),
  attrs: z.record(z.string(), z.string()),
  text: z.string(),
  own: z.string(),
  children: z.number().int(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  vis: z.boolean(),
  st: z.array(z.string()).length(styleProps.length),
  font: z.string(),
  focusable: z.boolean(),
});

export const SnapshotSchema = z.object({
  elements: z.array(RawElementSchema),
  truncated: z.boolean(),
  docW: z.number(),
  docH: z.number(),
  nodeCount: z.number().int(),
  title: z.string(),
  h1: z.string(),
});

export type StyleMap = Record<(typeof styleProps)[number], string>;

export type SnapElement = Omit<RawElement, 'st'> & { index: number; style: StyleMap; kids: number[] };

export type Snapshot = Omit<SnapshotResult, 'elements'> & { elements: SnapElement[]; byDse: Map<string, SnapElement> };

export function toStyleMap(st: string[]): StyleMap {
  const m = {} as StyleMap;
  styleProps.forEach((p, i) => (m[p] = st[i] ?? ''));
  return m;
}

export function buildSnapshot(raw: unknown): Snapshot {
  const parsed = SnapshotSchema.parse(raw);
  const elements: SnapElement[] = parsed.elements.map((e, index) => {
    const { st, ...rest } = e;
    return { ...rest, index, style: toStyleMap(st), kids: [] };
  });
  for (const e of elements) if (e.p >= 0) elements[e.p]?.kids.push(e.index);
  return { ...parsed, elements, byDse: new Map(elements.map((e) => [e.d, e])) };
}

/** The data as stored: compact arrays, the style list in styleProps order. */
export function compactSnapshot(s: Snapshot): SnapshotResult {
  return {
    ...s,
    elements: s.elements.map(({ index: _i, style, kids: _k, ...rest }) => ({ ...rest, st: styleProps.map((p) => style[p]) })),
  } as SnapshotResult & { byDse?: unknown };
}

export function descendants(s: Snapshot, el: SnapElement): SnapElement[] {
  const out: SnapElement[] = [];
  const stack = [...el.kids];
  while (stack.length) {
    const i = stack.pop()!;
    const e = s.elements[i]!;
    out.push(e);
    stack.push(...e.kids);
  }
  return out;
}

export function ancestors(s: Snapshot, el: SnapElement): SnapElement[] {
  const out: SnapElement[] = [];
  for (let p = el.p; p >= 0; p = s.elements[p]!.p) out.push(s.elements[p]!);
  return out;
}

export function px(v: string | undefined): number {
  const n = parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
}

/** Any computed color (rgb, oklch, lab, color()); null for transparent or anything else. */
export function parseRgb(v: string): { r: number; g: number; b: number; a: number } | null {
  return parseCssColor(v ?? '');
}

export function hasBackground(e: SnapElement): boolean {
  const c = parseRgb(e.style['background-color']);
  return Boolean((c && c.a > 0) || (e.style['background-image'] && e.style['background-image'] !== 'none'));
}

export function hasVisibleBorder(e: SnapElement): boolean {
  return (['top', 'right', 'bottom', 'left'] as const).some((side) => {
    const w = px(e.style[`border-${side}-width`]);
    const style = e.style[`border-${side}-style`];
    const c = parseRgb(e.style[`border-${side}-color`]);
    return w > 0 && style !== 'none' && style !== 'hidden' && Boolean(c && c.a > 0);
  });
}

export function hasShadow(e: SnapElement): boolean {
  return Boolean(e.style['box-shadow'] && e.style['box-shadow'] !== 'none');
}

export function radiusOf(e: SnapElement): number {
  return Math.max(px(e.style['border-top-left-radius']), px(e.style['border-top-right-radius']), px(e.style['border-bottom-right-radius']), px(e.style['border-bottom-left-radius']));
}

/** The opaque color behind an element: ancestors' backgrounds composited in order, white below all. */
export function effectiveBackground(s: Snapshot, el: SnapElement, includeSelf = true): { r: number; g: number; b: number } {
  const chain = [...(includeSelf ? [el] : []), ...ancestors(s, el)];
  const layers: { r: number; g: number; b: number; a: number }[] = [];
  for (const e of chain) {
    const c = parseRgb(e.style['background-color']);
    if (c && c.a > 0) {
      layers.push(c);
      if (c.a >= 1) break;
    }
  }
  let base = { r: 255, g: 255, b: 255 };
  for (const l of layers.reverse()) base = { r: l.r * l.a + base.r * (1 - l.a), g: l.g * l.a + base.g * (1 - l.a), b: l.b * l.a + base.b * (1 - l.a) };
  return base;
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function isInteractive(e: SnapElement): boolean {
  if (['button', 'select', 'textarea'].includes(e.tag)) return true;
  if (e.tag === 'input' && e.type !== 'hidden') return true;
  if (e.tag === 'a' && e.href) return true;
  if (e.role && ['button', 'tab', 'menuitem', 'switch', 'checkbox', 'radio', 'link', 'option', 'combobox'].includes(e.role)) return true;
  if ('aria-haspopup' in e.aria || 'aria-expanded' in e.aria) return true;
  return e.focusable;
}
