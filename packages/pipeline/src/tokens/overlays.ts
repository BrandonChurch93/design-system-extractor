import type { ColorToken, OverlayToken } from '@dse/schema';
import { parseHex } from '../color/contrast';
import { deltaE } from '../color/parse';
import { stableId } from '../ids';
import type { RawColor, RawTokens } from './collect';

// Overlays (docs/specs/token-clustering.md, Colors, Overlays): a translucent color is a base color
// plus an alpha, never a palette step (D-086).

const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const BLACK = { r: 0, g: 0, b: 0, a: 1 };
const PURE_DELTA_E = 2;

/** Moves every translucent raw color out of the palette's input. */
export function splitOverlays(raw: RawTokens): RawColor[] {
  const out: RawColor[] = [];
  for (const [hex, c] of raw.colors) {
    if (c.rgba.a > 0 && c.rgba.a < 1) {
      out.push(c);
      raw.colors.delete(hex);
    }
  }
  return out;
}

/** Alpha rounded to the nearest 2%. */
export const roundAlpha = (a: number) => Math.min(0.98, Math.max(0.02, Math.round(a * 50) / 50));

export function buildOverlays(raws: RawColor[], palette: ColorToken[]): OverlayToken[] {
  type Acc = { base: string; baseName: string; rgb: { r: number; g: number; b: number }; alpha: number; members: RawColor[] };
  const groups = new Map<string, Acc>();
  for (const c of raws) {
    const opaque = { ...c.rgba, a: 1 };
    let base: Acc['base'];
    let baseName: string;
    let rgb: Acc['rgb'];
    if (deltaE(opaque, WHITE) <= PURE_DELTA_E) [base, baseName, rgb] = ['white', 'white', WHITE];
    else if (deltaE(opaque, BLACK) <= PURE_DELTA_E) [base, baseName, rgb] = ['black', 'black', BLACK];
    else if (palette.length) {
      let best = palette[0]!;
      for (const t of palette) if (deltaE(parseHex(t.value), opaque) < deltaE(parseHex(best.value), opaque)) best = t;
      [base, baseName, rgb] = [best.id, best.name, parseHex(best.value)];
    } else [base, baseName, rgb] = c.rgba.r + c.rgba.g + c.rgba.b > 382 ? ['white', 'white', WHITE] : ['black', 'black', BLACK];
    const alpha = roundAlpha(c.rgba.a);
    const key = `${base}|${alpha}`;
    const g = groups.get(key) ?? { base, baseName, rgb, alpha, members: [] };
    g.members.push(c);
    groups.set(key, g);
  }
  const uses = (c: RawColor) => c.uses.text + c.uses.background + c.uses.border + c.uses.other;
  return [...groups.values()]
    .map((g) => {
      const pages = new Map<string, number>();
      for (const m of g.members) for (const [p, n] of m.pages) pages.set(p, (pages.get(p) ?? 0) + n);
      const pct = Math.round(g.alpha * 100);
      return {
        id: stableId(`overlay:${g.base}:${g.alpha}`),
        name: `${g.baseName}-${pct}`,
        base: g.base,
        alpha: g.alpha,
        value: `rgb(${g.rgb.r} ${g.rgb.g} ${g.rgb.b} / ${pct}%)`,
        usage: g.members.reduce((s, m) => s + uses(m), 0),
        pages: [...pages].map(([pageId, count]) => ({ pageId, count })).sort((a, b) => b.count - a.count || a.pageId.localeCompare(b.pageId)),
        rawValues: g.members.map((m) => ({ value: m.hex, count: uses(m) })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
      };
    })
    .sort((a, b) => b.usage - a.usage || a.name.localeCompare(b.name));
}
