import type { Viewport } from '@dse/schema';
import { viewportSize } from '@dse/schema';
import { hexOf, colorsIn, parseCssColor } from '../color/parse';
import type { Rgba } from '../color/contrast';
import { hasBackground, hasShadow, hasVisibleBorder, px, type SnapElement, type Snapshot } from '../capture/snapshot';

// Raw values from every capture (docs/specs/token-clustering.md, Collect). Clustering comes after.

export type ColorUse = 'text' | 'background' | 'border' | 'other';

export type RawColor = { hex: string; rgba: Rgba; weight: number; uses: Record<ColorUse, number>; pages: Map<string, number> };
export type RawType = { key: string; family: string; fallbackStack: string; size: number; lineHeight: number; weight: number; letterSpacing: number; textTransform?: string; count: number; tags: Map<string, number>; pages: Map<string, number>; sample: string; homeLargest: boolean };
export type RawSpace = { value: number; weight: number; contexts: { padding: number; margin: number; gap: number; layout: number }; pages: Map<string, number> };
export type RawRadius = { value: number; isPill: boolean; count: number; pages: Map<string, number> };
export type RawShadow = { value: string; count: number; maxBlur: number; pages: Map<string, number> };

export type RawTokens = {
  colors: Map<string, RawColor>;
  type: Map<string, RawType>;
  space: Map<number, RawSpace>;
  radius: Map<number, RawRadius>;
  shadows: Map<string, RawShadow>;
  breakpoints: Map<number, number>;
  fontDecls: number;
  families: Map<string, { loaded: boolean; fallback?: string }>;
};

export type CaptureSource = {
  pageId: string;
  isHome: boolean;
  viewport: Viewport;
  snapshot: Snapshot;
  /** outline colors seen on focus states */
  focusOutlines: string[];
  media: string[];
  fonts: { family: string; status: string }[];
};

const bump = (m: Map<string, number>, k: string, n = 1) => m.set(k, (m.get(k) ?? 0) + n);

export function emptyRaw(): RawTokens {
  return { colors: new Map(), type: new Map(), space: new Map(), radius: new Map(), shadows: new Map(), breakpoints: new Map(), fontDecls: 0, families: new Map() };
}

function addColor(raw: RawTokens, c: Rgba, use: ColorUse, weight: number, pageId: string) {
  const hex = hexOf(c);
  let r = raw.colors.get(hex);
  if (!r) {
    r = { hex, rgba: c, weight: 0, uses: { text: 0, background: 0, border: 0, other: 0 }, pages: new Map() };
    raw.colors.set(hex, r);
  }
  r.weight += weight;
  r.uses[use] += 1;
  bump(r.pages, pageId);
}

/** The layers of a box-shadow, transparent zero-size layers (Tailwind's ring placeholders) dropped. */
export function shadowLayers(value: string): string[] {
  if (!value || value === 'none') return [];
  const layers: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      layers.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) layers.push(cur.trim());
  return layers.filter((l) => {
    const colors = colorsIn(l);
    const lengths = l.replace(/(rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)/g, '').match(/-?[\d.]+px/g) ?? [];
    const visible = lengths.some((n) => parseFloat(n) !== 0);
    return colors.length > 0 && visible;
  });
}

/** A shadow written the same way every time: colors as hex, lengths as px, single spaces. */
export function normalizeShadow(value: string): string {
  return shadowLayers(value)
    .map((l) => {
      const colors = colorsIn(l).map(hexOf);
      const inset = /\binset\b/.test(l) ? 'inset ' : '';
      const lengths = (l.replace(/(rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)/g, '').match(/-?[\d.]+px/g) ?? []).map((n) => `${parseFloat(n)}px`);
      return `${inset}${lengths.join(' ')} ${colors[0] ?? ''}`.trim();
    })
    .join(', ');
}

function maxBlur(normalized: string): number {
  return Math.max(0, ...normalized.split(', ').map((l) => parseFloat(l.replace('inset ', '').split(' ')[2] ?? '0')));
}

function lineHeightPx(e: SnapElement): number {
  const lh = e.style['line-height'];
  if (lh === 'normal' || !lh) return Math.round(px(e.style['font-size']) * 1.2 * 2) / 2;
  return Math.round(px(lh) * 2) / 2;
}

/** Width and comparison values of media queries in px (em and rem at 16). */
export function breakpointsOf(condition: string): number[] {
  const out: number[] = [];
  const val = (n: string, unit: string) => (unit === 'px' ? parseFloat(n) : parseFloat(n) * 16);
  for (const m of condition.matchAll(/(?:min|max)-width\s*:\s*([\d.]+)(px|em|rem)/gi)) out.push(val(m[1]!, m[2]!));
  for (const m of condition.matchAll(/width\s*(?:<=|>=|<|>)\s*([\d.]+)(px|em|rem)/gi)) out.push(val(m[1]!, m[2]!));
  for (const m of condition.matchAll(/([\d.]+)(px|em|rem)\s*(?:<=|>=|<|>)\s*width/gi)) out.push(val(m[1]!, m[2]!));
  return out.map((v) => Math.round(v));
}

export function collect(sources: CaptureSource[]): RawTokens {
  const raw = emptyRaw();
  const decls = new Set<string>();
  for (const src of sources) {
    const vpWidth = viewportSize[src.viewport].width;
    const s = src.snapshot;
    const largestOnPage = Math.max(0, ...s.elements.filter((e) => e.vis && e.own).map((e) => px(e.style['font-size'])));
    for (const e of s.elements) {
      if (!e.vis) continue;
      const st = e.style;
      // Colors.
      const text = parseCssColor(st.color);
      if (text) addColor(raw, text, 'text', 1, src.pageId);
      const bg = parseCssColor(st['background-color']);
      if (bg) addColor(raw, bg, 'background', 1 + Math.min(4, Math.floor((e.w * e.h) / 10_000)), src.pageId);
      for (const side of ['top', 'right', 'bottom', 'left'] as const) {
        if (px(st[`border-${side}-width`]) > 0 && !['none', 'hidden'].includes(st[`border-${side}-style`])) {
          const bc = parseCssColor(st[`border-${side}-color`]);
          if (bc) addColor(raw, bc, 'border', 1, src.pageId);
        }
      }
      for (const layer of shadowLayers(st['box-shadow'])) for (const c of colorsIn(layer)) addColor(raw, c, 'other', 1, src.pageId);
      if (st['background-image'] && st['background-image'] !== 'none' && /gradient\(/.test(st['background-image'])) {
        for (const c of colorsIn(st['background-image'])) addColor(raw, c, 'background', 1, src.pageId);
      }
      if (e.tag === 'svg') {
        for (const prop of ['fill', 'stroke'] as const) {
          const c = parseCssColor(st[prop]);
          if (c) addColor(raw, c, 'other', 1, src.pageId);
        }
      }
      // Type: elements with their own text.
      if (e.own) {
        const size = px(st['font-size']);
        const lineHeight = lineHeightPx(e);
        const weight = Number(st['font-weight']) || 400;
        const ls = st['letter-spacing'] === 'normal' ? 0 : Math.round(px(st['letter-spacing']) * 20) / 20;
        const transform = st['text-transform'] && st['text-transform'] !== 'none' ? st['text-transform'] : undefined;
        const family = e.font || st['font-family'].split(',')[0]!.trim().replace(/^['"]|['"]$/g, '');
        const key = `${family}|${size}|${weight}|${lineHeight}|${ls}|${transform ?? ''}`;
        decls.add(`${st['font-family']}|${size}|${weight}|${st['line-height']}|${st['letter-spacing']}|${st['text-transform']}`);
        let t = raw.type.get(key);
        if (!t) {
          t = { key, family, fallbackStack: st['font-family'], size, lineHeight, weight, letterSpacing: ls, textTransform: transform, count: 0, tags: new Map(), pages: new Map(), sample: e.own.slice(0, 60), homeLargest: false };
          raw.type.set(key, t);
        }
        t.count++;
        bump(t.tags, e.tag);
        bump(t.pages, src.pageId);
        if (src.isHome && size === largestOnPage) t.homeLargest = true;
      }
      // Spacing.
      const layout = ['html', 'body'].includes(e.tag) || e.w >= vpWidth * 0.9;
      const spaceProps: [string, 'padding' | 'margin' | 'gap'][] = [
        ['padding-top', 'padding'],
        ['padding-right', 'padding'],
        ['padding-bottom', 'padding'],
        ['padding-left', 'padding'],
        ['margin-top', 'margin'],
        ['margin-right', 'margin'],
        ['margin-bottom', 'margin'],
        ['margin-left', 'margin'],
        ['row-gap', 'gap'],
        ['column-gap', 'gap'],
      ];
      // margin: auto computes to px; equal side margins on a centered element are layout, not spacing.
      const parent = e.p >= 0 ? s.elements[e.p] : undefined;
      const ml = px(st['margin-left']);
      const mr = px(st['margin-right']);
      const centered = ml > 0 && Math.abs(ml - mr) < 1 && parent !== undefined && Math.abs(e.x + e.w / 2 - (parent.x + parent.w / 2)) < 2;
      for (const [prop, ctx] of spaceProps) {
        if (centered && (prop === 'margin-left' || prop === 'margin-right')) {
          const sp = raw.space.get(Math.round(ml * 2) / 2);
          if (sp) sp.contexts.layout++;
          continue;
        }
        const v = st[prop as keyof typeof st];
        if (!v || v === 'normal' || v === 'auto') continue;
        const n = Math.round(px(v) * 2) / 2;
        if (n < 1 || n > 200) continue;
        if (ctx === 'gap' && !/flex|grid/.test(st.display)) continue;
        let sp = raw.space.get(n);
        if (!sp) {
          sp = { value: n, weight: 0, contexts: { padding: 0, margin: 0, gap: 0, layout: 0 }, pages: new Map() };
          raw.space.set(n, sp);
        }
        if (layout) {
          sp.contexts.layout++;
          continue;
        }
        sp.weight++;
        sp.contexts[ctx]++;
        bump(sp.pages, src.pageId);
      }
      // Radius.
      if (hasVisibleBorder(e) || hasBackground(e) || hasShadow(e)) {
        const corners = (['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'] as const).map((k) => {
          const v = st[k];
          if (v.endsWith('%')) return (parseFloat(v) / 100) * Math.min(e.w, e.h);
          return px(v);
        });
        const r = Math.max(...corners);
        if (r > 0) {
          const isPill = r >= 999 || r >= e.h / 2 - 0.5;
          const value = isPill ? 999 : Math.round(r * 2) / 2;
          let rr = raw.radius.get(value);
          if (!rr) {
            rr = { value, isPill, count: 0, pages: new Map() };
            raw.radius.set(value, rr);
          }
          rr.count++;
          bump(rr.pages, src.pageId);
        }
      }
      // Shadows.
      const sh = normalizeShadow(st['box-shadow']);
      if (sh) {
        let r = raw.shadows.get(sh);
        if (!r) {
          r = { value: sh, count: 0, maxBlur: maxBlur(sh), pages: new Map() };
          raw.shadows.set(sh, r);
        }
        r.count++;
        bump(r.pages, src.pageId);
      }
    }
    for (const o of src.focusOutlines) {
      const c = parseCssColor(o);
      if (c) addColor(raw, c, 'border', 1, src.pageId);
    }
    for (const m of src.media) for (const bp of breakpointsOf(m)) raw.breakpoints.set(bp, (raw.breakpoints.get(bp) ?? 0) + 1);
    for (const f of src.fonts) {
      const prev = raw.families.get(f.family);
      raw.families.set(f.family, { loaded: (prev?.loaded ?? false) || f.status === 'loaded' });
    }
  }
  raw.fontDecls = decls.size;
  return raw;
}
