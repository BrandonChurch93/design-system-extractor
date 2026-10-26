import type { ColorToken, ContrastPair } from '@dse/schema';
import type { Rgba } from '../color/contrast';
import { deltaE, oklabToOklch, parseCssColor, rgbToOklab } from '../color/parse';
import { stableId } from '../ids';
import type { ColorUse, RawColor, RawTokens } from './collect';
import { ALPHA_MATCH, CLUSTER_DELTA_E, COLOR_CAP, NEUTRAL_CHROMA, SEMANTIC_SHARE, hueWord, lightnessStep, semanticRoleOf, type SemanticRole } from './constants';

// Colors (docs/specs/token-clustering.md, Colors): cluster, classify, name, provenance, contrast pairs.

export type ColorCluster = { rep: RawColor; members: RawColor[] };

const usesOf = (c: RawColor) => c.uses.text + c.uses.background + c.uses.border + c.uses.other;

/** Weight descending, then hex, so equal inputs always cluster the same way. */
function byWeight(a: RawColor, b: RawColor) {
  return b.weight - a.weight || a.hex.localeCompare(b.hex);
}

export function clusterColors(raw: Iterable<RawColor>, threshold = CLUSTER_DELTA_E): ColorCluster[] {
  const clusters: ColorCluster[] = [];
  for (const c of [...raw].sort(byWeight)) {
    const hit = clusters.find((k) => deltaE(k.rep.rgba, c.rgba) <= threshold && Math.abs(k.rep.rgba.a - c.rgba.a) <= ALPHA_MATCH);
    if (hit) hit.members.push(c);
    else clusters.push({ rep: c, members: [c] });
  }
  // The representative is the heaviest member; sorting by weight made it the first.
  return clusters;
}

const weightOf = (k: ColorCluster) => k.members.reduce((s, m) => s + m.weight, 0);

/** Over the cap, the lightest clusters merge into their nearest neighbor. */
export function capClusters(clusters: ColorCluster[], cap = COLOR_CAP): { clusters: ColorCluster[]; merged: number } {
  const out = [...clusters].sort((a, b) => weightOf(b) - weightOf(a) || a.rep.hex.localeCompare(b.rep.hex));
  let merged = 0;
  while (out.length > cap) {
    const last = out.pop()!;
    let best = out[0]!;
    for (const k of out) if (deltaE(k.rep.rgba, last.rep.rgba) < deltaE(best.rep.rgba, last.rep.rgba)) best = k;
    best.members.push(...last.members);
    merged++;
  }
  return { clusters: out, merged };
}

export type Classified = { group: ColorToken['group']; semanticRole?: SemanticRole };

export function classify(k: ColorCluster): Classified {
  const { c, h } = oklabToOklch(rgbToOklab(k.rep.rgba));
  if (c < NEUTRAL_CHROMA) return { group: 'neutral' };
  const uses = k.members.reduce((s, m) => s + usesOf(m), 0);
  const semantic = k.members.reduce((s, m) => s + m.semantic, 0);
  if (uses > 0 && semantic / uses >= SEMANTIC_SHARE) {
    const role = semanticRoleOf(h);
    if (role) return { group: 'semantic', semanticRole: role };
  }
  return { group: 'brand' };
}

const letter = (n: number) => String.fromCharCode(97 + n);

/**
 * Deterministic names: gray-{step} for neutrals, {hue}-{step} for brand colors, the role for a
 * semantic color (role-{step} when a role has several). Collisions take a letter: gray-100b.
 */
export function deterministicNames(items: { rep: Rgba; group: ColorToken['group']; semanticRole?: SemanticRole }[]): string[] {
  const roleCount = new Map<string, number>();
  for (const it of items) if (it.semanticRole) roleCount.set(it.semanticRole, (roleCount.get(it.semanticRole) ?? 0) + 1);
  const taken = new Set<string>();
  return items.map((it) => {
    const o = oklabToOklch(rgbToOklab(it.rep));
    const step = lightnessStep(o.l);
    let base: string;
    if (it.group === 'neutral') base = `gray-${step}`;
    else if (it.semanticRole) base = (roleCount.get(it.semanticRole) ?? 0) > 1 ? `${it.semanticRole}-${step}` : it.semanticRole;
    else base = `${hueWord(o.h)}-${step}`;
    let name = base;
    for (let n = 1; taken.has(name); n++) name = `${base}${letter(n)}`;
    taken.add(name);
    return name;
  });
}

export type ColorBuild = { tokens: ColorToken[]; clusters: ColorCluster[]; merged: number; rawCount: number };

export function buildColors(raw: RawTokens): ColorBuild {
  const { clusters, merged } = capClusters(clusterColors(raw.colors.values()));
  const classified = clusters.map(classify);
  const names = deterministicNames(clusters.map((k, i) => ({ rep: k.rep.rgba, ...classified[i]! })));
  const tokens: ColorToken[] = clusters.map((k, i) => {
    const o = oklabToOklch(rgbToOklab(k.rep.rgba));
    const uses: Record<ColorUse, number> = { text: 0, background: 0, border: 0, other: 0 };
    const pages = new Map<string, number>();
    for (const m of k.members) {
      for (const u of Object.keys(uses) as ColorUse[]) uses[u] += m.uses[u];
      for (const [p, n] of m.pages) pages.set(p, (pages.get(p) ?? 0) + n);
    }
    return {
      id: stableId(`color:${k.rep.hex}`),
      name: names[i]!,
      value: k.rep.hex,
      oklch: { l: round(o.l, 4), c: round(o.c, 4), h: round(o.h, 2) },
      group: classified[i]!.group,
      ...(classified[i]!.semanticRole ? { semanticRole: classified[i]!.semanticRole } : {}),
      usage: uses.text + uses.background + uses.border + uses.other,
      uses,
      pages: [...pages].map(([pageId, count]) => ({ pageId, count })).sort((a, b) => b.count - a.count || a.pageId.localeCompare(b.pageId)),
      rawValues: k.members.map((m) => ({ value: m.hex, count: usesOf(m) })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
      contrastPairs: [],
    };
  });
  attachContrastPairs(raw, clusters, tokens);
  // Brand by weight, as the spec orders it; groups follow one another for the palette strip.
  const order = { brand: 0, neutral: 1, semantic: 2 } as const;
  const weight = new Map(clusters.map((k, i) => [tokens[i]!.id, weightOf(k)]));
  tokens.sort((a, b) => order[a.group] - order[b.group] || weight.get(b.id)! - weight.get(a.id)! || a.value.localeCompare(b.value));
  return { tokens, clusters, merged, rawCount: raw.colors.size };
}

function round(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** The pair (text color token, effective background token) for every text node, worst ratio kept. */
function attachContrastPairs(raw: RawTokens, clusters: ColorCluster[], tokens: ColorToken[]) {
  const tokenOfRaw = new Map<string, number>();
  clusters.forEach((k, i) => k.members.forEach((m) => tokenOfRaw.set(m.hex, i)));
  const opaque = clusters.map((k, i) => ({ k, i })).filter(({ k }) => k.rep.rgba.a >= 1);
  const nearestOpaque = (hex: string): number => {
    const exact = tokenOfRaw.get(hex);
    if (exact !== undefined && clusters[exact]!.rep.rgba.a >= 1) return exact;
    const c = parseCssColor(hex)!;
    let best = opaque[0]!;
    for (const o of opaque) if (deltaE(o.k.rep.rgba, c) < deltaE(best.k.rep.rgba, c)) best = o;
    return best.i;
  };
  const byToken = new Map<number, Map<string, ContrastPair>>();
  for (const p of raw.pairs.values()) {
    const fi = tokenOfRaw.get(p.fg);
    if (fi === undefined || opaque.length === 0) continue;
    const bi = nearestOpaque(p.bg);
    const key = `${bi}|${p.large}`;
    const pairs = byToken.get(fi) ?? new Map<string, ContrastPair>();
    byToken.set(fi, pairs);
    const prev = pairs.get(key);
    if (!prev || p.ratio < prev.ratio) pairs.set(key, { fg: tokens[fi]!.id, bg: tokens[bi]!.id, ratio: round(p.ratio, 2), large: p.large, where: p.where });
  }
  for (const [i, pairs] of byToken) tokens[i]!.contrastPairs = [...pairs.values()].sort((a, b) => a.ratio - b.ratio);
}
