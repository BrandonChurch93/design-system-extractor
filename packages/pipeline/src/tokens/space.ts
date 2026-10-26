import type { RadiusToken, ShadowToken, SpaceToken, Tokens } from '@dse/schema';
import { stableId } from '../ids';
import type { RawShadow, RawTokens } from './collect';
import { BASE_SHARE, BREAKPOINT_CAP, OFF_GRID_SHARE, RADIUS_CAP, SHADOW_BUCKETS, SHADOW_NAMES, SPACE_STEP_CAP } from './constants';

// Spacing, radius, shadows and breakpoints (docs/specs/token-clustering.md).

const pagesOf = (m: Map<string, number>) => [...m].map(([pageId, count]) => ({ pageId, count })).sort((a, b) => b.count - a.count || a.pageId.localeCompare(b.pageId));

/** 8 when 85% of weighted values sit on 8, else 4 when 85% sit on 4, else 4 and not clear (D-051). */
export function inferBase(values: { value: number; weight: number }[]): Tokens['spaceBase'] {
  const total = values.reduce((s, v) => s + v.weight, 0);
  if (total === 0) return { value: 4, clear: false };
  const share = (n: number) => values.filter((v) => v.value % n === 0).reduce((s, v) => s + v.weight, 0) / total;
  if (share(8) >= BASE_SHARE) return { value: 8, clear: true };
  if (share(4) >= BASE_SHARE) return { value: 4, clear: true };
  return { value: 4, clear: false };
}

export function buildSpace(raw: RawTokens): { space: SpaceToken[]; spaceBase: Tokens['spaceBase'] } {
  const values = [...raw.space.values()].filter((v) => v.weight > 0);
  const spaceBase = inferBase(values);
  const total = values.reduce((s, v) => s + v.weight, 0);
  const byWeight = (a: { weight: number; value: number }, b: { weight: number; value: number }) => b.weight - a.weight || a.value - b.value;
  const onGrid = values.filter((v) => v.value % spaceBase.value === 0).sort(byWeight).slice(0, SPACE_STEP_CAP);
  const offGrid = values.filter((v) => v.value % spaceBase.value !== 0 && v.weight / total > OFF_GRID_SHARE);
  const space = [...onGrid.map((v) => ({ v, on: true })), ...offGrid.map((v) => ({ v, on: false }))]
    .sort((a, b) => a.v.value - b.v.value)
    .map(({ v, on }) => ({ id: stableId(`space:${v.value}`), value: v.value, onGrid: on, usage: v.weight, pages: pagesOf(v.pages), contexts: { ...v.contexts } }));
  return { space, spaceBase };
}

export function buildRadius(raw: RawTokens): RadiusToken[] {
  return [...raw.radius.values()]
    .sort((a, b) => b.count - a.count || a.value - b.value)
    .slice(0, RADIUS_CAP)
    .sort((a, b) => a.value - b.value)
    .map((r) => ({ id: stableId(`radius:${r.value}`), value: r.value, isPill: r.isPill, usage: r.count, pages: pagesOf(r.pages) }));
}

/**
 * Up to three buckets by largest blur, named sm, md and lg by increasing blur. With more distinct
 * shadows, the least used merge into the bucket nearest in blur. Names a site gives its shadows
 * (`--shadow-md`) win.
 */
export function buildShadows(raw: RawTokens, siteNames: Map<string, string> = new Map()): ShadowToken[] {
  type Bucket = { members: RawShadow[] };
  const buckets: Bucket[] = [...raw.shadows.values()].sort((a, b) => a.maxBlur - b.maxBlur || b.count - a.count || a.value.localeCompare(b.value)).map((s) => ({ members: [s] }));
  const usage = (b: Bucket) => b.members.reduce((s, m) => s + m.count, 0);
  const blur = (b: Bucket) => Math.max(...b.members.map((m) => m.maxBlur));
  while (buckets.length > SHADOW_BUCKETS) {
    let least = 0;
    for (let i = 1; i < buckets.length; i++) if (usage(buckets[i]!) < usage(buckets[least]!)) least = i;
    const [gone] = buckets.splice(least, 1);
    let near = 0;
    for (let i = 1; i < buckets.length; i++) if (Math.abs(blur(buckets[i]!) - blur(gone!)) < Math.abs(blur(buckets[near]!) - blur(gone!))) near = i;
    buckets[near]!.members.push(...gone!.members);
  }
  const used = new Set<string>();
  return buckets.map((b, i) => {
    const rep = [...b.members].sort((x, y) => y.count - x.count || x.value.localeCompare(y.value))[0]!;
    const pages = new Map<string, number>();
    for (const m of b.members) for (const [p, n] of m.pages) pages.set(p, (pages.get(p) ?? 0) + n);
    const own = siteNames.get(rep.value);
    const name = own && !used.has(own) ? own : (SHADOW_NAMES[i] ?? `shadow-${i + 1}`);
    used.add(name);
    return { id: stableId(`shadow:${rep.value}`), name, value: rep.value, usage: usage(b), pages: pagesOf(pages) };
  });
}

/** The six most used media-query widths, ascending. */
export function buildBreakpoints(raw: RawTokens): number[] {
  return [...raw.breakpoints]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, BREAKPOINT_CAP)
    .map(([w]) => w)
    .sort((a, b) => a - b);
}
