import { PNG } from 'pngjs';
import type { CheckResult, ColorToken } from '@dse/schema';
import { composite, contrastRatio, formatRatio, type Rgba } from '../color/contrast';
import { deltaE, hexOf, parseCssColor } from '../color/parse';
import { ancestors, descendants, px, type SnapElement, type Snapshot } from '../capture/snapshot';
import { cropShot } from '../components/crop';
import type { Item } from '../components/items';
import type { StyleDelta } from '../capture/states';
import { isLargeText } from '../tokens/collect';

// The five measurements (docs/specs/checks.md). Each returns a result for one instance or state;
// the stage keeps the worst per component.

export type Measured = Omit<CheckResult, 'check'> & { shortfall: number };

export const na = (detail = 'Not applicable'): Measured => ({ status: 'na', detail, shortfall: 0 });

/** The token name for a color, or its hex when no token is within ΔE 2.3. */
export function colorName(c: Rgba, tokens: ColorToken[]): string {
  let best: ColorToken | undefined;
  let bestD = Infinity;
  for (const t of tokens) {
    const tc = parseCssColor(t.value)!;
    if (tc.a < 1) continue;
    const d = deltaE(tc, c);
    if (d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return best && bestD <= 2.3 ? best.name : hexOf({ ...c, a: 1 });
}

/** The median color of a crop, leaving out pixels within ΔE 10 of the text color. */
export function sampleGround(png: Buffer, fg: Rgba): Rgba | null {
  const p = PNG.sync.read(png);
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (let i = 0; i < p.data.length; i += 4) {
    const c = { r: p.data[i]!, g: p.data[i + 1]!, b: p.data[i + 2]!, a: 1 };
    if (deltaE(c, fg) <= 10) continue;
    rs.push(c.r);
    gs.push(c.g);
    bs.push(c.b);
  }
  if (!rs.length) return null;
  const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
  return { r: median(rs), g: median(gs), b: median(bs), a: 1 };
}

/**
 * The ground behind an element: ancestors' backgrounds composited in order, white below all; null
 * when an image or gradient lies between, so the crop must be sampled.
 */
export function groundOf(s: Snapshot, el: SnapElement): Rgba | null {
  const layers: Rgba[] = [];
  for (const e of [el, ...ancestors(s, el)]) {
    if (/url\(|gradient\(/.test(e.style['background-image'] ?? '')) return null;
    const c = parseCssColor(e.style['background-color']);
    if (c) {
      layers.push(c);
      if (c.a >= 1) break;
    }
  }
  let base: Rgba = { r: 255, g: 255, b: 255, a: 1 };
  for (const l of layers.reverse()) base = composite(l, base);
  return base;
}

/** Contrast AA: the worst text node in the instance, placeholders included. */
export function contrastOf(it: Item, tokens: ColorToken[], placeholderColor?: string): Measured | null {
  const s = it.snapshot;
  // Text inside a nested component (a tag in a card) is that component's to answer for.
  const nested = new Set<number>();
  if (!it.revealed) {
    const candidates = new Set(it.vc.candidates.map((c) => c.dse));
    for (const d of descendants(s, it.el)) if (candidates.has(d.d)) for (const n of [d, ...descendants(s, d)]) nested.add(n.index);
  }
  const nodes = [it.el, ...descendants(s, it.el)].filter((e) => !nested.has(e.index) && e.vis && (e.own.trim() || (placeholderOf(e) && !e.attrs.value)));
  let worst: Measured | null = null;
  let worstScore = Infinity;
  for (const e of nodes) {
    const isPlaceholder = !e.own.trim();
    const fgRaw = parseCssColor(isPlaceholder ? (placeholderColor ?? '#757575') : e.style.color);
    if (!fgRaw) continue;
    let bg = groundOf(s, e);
    if (!bg && !it.revealed) {
      const crop = cropShot(it.vc.screenshot, { x: e.x, y: e.y, w: e.w, h: e.h });
      bg = crop ? sampleGround(crop, fgRaw) : null;
    }
    bg ??= { r: 255, g: 255, b: 255, a: 1 };
    const fg = fgRaw.a < 1 ? composite(fgRaw, bg) : fgRaw;
    const size = px(e.style['font-size']);
    const weight = Number(e.style['font-weight']) || 400;
    const threshold = isLargeText(size, weight) ? 3 : 4.5;
    const ratio = contrastRatio(fg, bg);
    const shortfall = Math.max(0, threshold - ratio);
    const bgName = colorName(bg, tokens);
    const r: Measured = {
      status: ratio >= threshold ? 'pass' : 'fail',
      detail: ratio >= threshold ? `${formatRatio(ratio)} on ${bgName}` : `${formatRatio(ratio)} on ${bgName}, needs ${threshold === 3 ? '3:1' : '4.5:1'}`,
      measured: { ratio: Math.round(ratio * 100) / 100, fg: hexOf(fg), bg: hexOf(bg), size, weight },
      shortfall,
    };
    if (ratio / threshold < worstScore) {
      worst = r;
      worstScore = ratio / threshold;
    }
  }
  return worst;
}

function placeholderOf(e: SnapElement): string | undefined {
  return ['input', 'textarea'].includes(e.tag) ? e.attrs.placeholder : undefined;
}

/**
 * Focus visible: from the focus state's diff, the first indicator of outline, box-shadow, border
 * color, background color; its contrast against the ground outside the element must be 3:1.
 */
export function focusOf(delta: StyleDelta[], reachedByKeyboard: boolean, before: SnapElement, ground: Rgba, tokens: ColorToken[]): Measured {
  if (!reachedByKeyboard) return { status: 'fail', detail: 'Not reachable by keyboard', shortfall: 3 };
  const to = (p: string) => delta.find((d) => d.property === p)?.to;
  const now = (p: string) => to(p) ?? before.style[p as keyof typeof before.style];
  const groundName = colorName(ground, tokens);
  const ring = (color: Rgba | null, width: number): Measured | null => {
    if (!color || width <= 0) return null;
    const ratio = contrastRatio(color.a < 1 ? composite(color, ground) : color, ground);
    return ratio >= 3
      ? { status: 'pass', detail: `${Math.round(width)} px ring, ${formatRatio(ratio)} against ${groundName}`, measured: { ratio: Math.round(ratio * 100) / 100, width }, shortfall: 0 }
      : { status: 'fail', detail: `${formatRatio(ratio)} ring, needs 3:1`, measured: { ratio: Math.round(ratio * 100) / 100, width }, shortfall: 3 - ratio };
  };
  const outlineChanged = ['outline-width', 'outline-style', 'outline-color'].some((p) => to(p) !== undefined);
  const style = now('outline-style');
  if (outlineChanged && style && style !== 'none') {
    const r = ring(parseCssColor(now('outline-color') ?? ''), px(now('outline-width')) || (style === 'auto' ? 1 : 0));
    if (r) return r;
  }
  const shadow = to('box-shadow');
  if (shadow !== undefined && shadow !== 'none') {
    const color = parseCssColor(/(rgba?\([^)]*\)|#[0-9a-f]{3,8})/i.exec(shadow)?.[1] ?? '');
    const lengths = (shadow.replace(/rgba?\([^)]*\)/g, '').match(/-?[\d.]+px/g) ?? []).map((n) => Math.abs(parseFloat(n)));
    const r = ring(color, Math.max(0, ...lengths));
    if (r) return r;
  }
  const border = ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'].find((p) => to(p) !== undefined);
  if (border && px(now('border-top-width')) > 0) {
    const r = ring(parseCssColor(to(border)!), px(now('border-top-width')));
    if (r) return r;
  }
  const bgTo = to('background-color');
  if (bgTo !== undefined) {
    const a = parseCssColor(before.style['background-color']) ?? ground;
    const b = parseCssColor(bgTo) ?? ground;
    const ratio = contrastRatio(b.a < 1 ? composite(b, ground) : b, a.a < 1 ? composite(a, ground) : a);
    return ratio >= 3
      ? { status: 'pass', detail: `Background change, ${formatRatio(ratio)}`, measured: { ratio: Math.round(ratio * 100) / 100 }, shortfall: 0 }
      : { status: 'fail', detail: `${formatRatio(ratio)} ring, needs 3:1`, measured: { ratio: Math.round(ratio * 100) / 100 }, shortfall: 3 - ratio };
  }
  return { status: 'fail', detail: 'No visible change on focus', shortfall: 3 };
}

/** Tap target: the instance's box at 390 px must be 44 × 44 CSS px; the smaller side is reported. */
export function tapOf(el: SnapElement): Measured {
  const w = Math.round(el.w);
  const h = Math.round(el.h);
  if (w >= 44 && h >= 44) return { status: 'pass', detail: `${w} × ${h} at 390 px`, measured: { w, h }, shortfall: 0 };
  const shortH = 44 - h;
  const shortW = 44 - w;
  if (h <= w) return { status: 'fail', detail: `${h} px tall, ${shortH} short`, measured: { w, h }, shortfall: Math.max(shortH, shortW) };
  return { status: 'fail', detail: `${w} px wide, ${shortW} short`, measured: { w, h }, shortfall: Math.max(shortH, shortW) };
}

const textOf = (s: Snapshot, ids: string) =>
  ids
    .split(/\s+/)
    .map((id) => s.elements.find((e) => e.id === id)?.text.trim() ?? '')
    .join(' ')
    .trim();

/** A visually hidden child: the common sr-only pattern, 1 px and clipped. */
function visuallyHidden(e: SnapElement): boolean {
  return e.w <= 1 && e.h <= 1 && e.text.trim().length > 0;
}

/** Label present, by the name sources a screen reader would read (docs/specs/checks.md, 4). */
export function labelOf(it: Item, iconOnly: boolean): Measured {
  const s = it.snapshot;
  const el = it.el;
  if (el.aria['aria-label']?.trim()) return { status: 'pass', detail: 'aria-label', shortfall: 0 };
  if (el.aria['aria-labelledby'] && textOf(s, el.aria['aria-labelledby'])) return { status: 'pass', detail: 'aria-label', shortfall: 0 };
  const field = ['input', 'select', 'textarea'].includes(el.tag);
  if (field) {
    if (el.id && s.elements.some((e) => e.tag === 'label' && e.attrs.for === el.id && e.text.trim())) return { status: 'pass', detail: 'Label element', shortfall: 0 };
    if (ancestors(s, el).some((a) => a.tag === 'label' && a.text.trim())) return { status: 'pass', detail: 'Label element', shortfall: 0 };
    if (el.attrs.placeholder?.trim()) return { status: 'fail', detail: 'Placeholder only', shortfall: 1 };
    return { status: 'fail', detail: 'No name found', shortfall: 1 };
  }
  if (iconOnly) {
    if (el.attrs.title?.trim()) return { status: 'pass', detail: 'aria-label', shortfall: 0 };
    if (descendants(s, el).some(visuallyHidden)) return { status: 'pass', detail: 'Visually hidden text', shortfall: 0 };
    return { status: 'fail', detail: 'No name found', shortfall: 1 };
  }
  return el.text.trim() ? { status: 'pass', detail: 'Text content', shortfall: 0 } : { status: 'fail', detail: 'No name found', shortfall: 1 };
}

/** Reduced motion: the probe's answer for a moving instance. */
export function motionOf(main: { animation: boolean; transition: boolean } | undefined, reduced: { animation: boolean; transition: boolean } | undefined, interactive: boolean): Measured | null {
  const moves = Boolean(main && (main.animation || (interactive && main.transition)));
  if (!moves) return null;
  if (!reduced) return na('Not measured: capture cap');
  const still = Boolean(reduced && (reduced.animation || (interactive && reduced.transition)));
  return still ? { status: 'fail', detail: 'Animation still runs under reduced motion', shortfall: 1 } : { status: 'pass', detail: 'Stops under reduced motion', shortfall: 0 };
}

