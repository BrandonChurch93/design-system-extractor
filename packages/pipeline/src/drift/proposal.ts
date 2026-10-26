import type { ColorToken, Drift, ProposedColor, ProposedType, Tokens } from '@dse/schema';
import { contrastRatio, type Rgba } from '../color/contrast';
import { deltaE, hexOf, oklabToOklch, oklabToRgb, oklchToOklab, parseCssColor, rgbToOklab } from '../color/parse';
import { CLUSTER_DELTA_E, lightnessStep } from '../tokens/constants';
import type { Findings } from './findings';

// The proposed clean set (docs/specs/drift.md, The proposed set). Contrast never drops below a
// threshold it met before.

export const GRAY_TARGETS = [5, 7, 9];
export const MAP_WITHIN_DE = 8;
export const BRAND_KEEP_SHARE = 0.02;

type Step = { l: number; rep: ColorToken; members: ColorToken[]; value: Rgba };

const rgba = (t: ColorToken) => parseCssColor(t.value)!;

/** One-dimensional k-means on lightness, weighted by usage, seeded evenly across the range. */
export function kmeansLightness(neutrals: ColorToken[], k: number): ColorToken[][] {
  const ls = neutrals.map((t) => t.oklch.l);
  const lo = Math.min(...ls);
  const hi = Math.max(...ls);
  let centers = Array.from({ length: k }, (_, i) => (k === 1 ? (lo + hi) / 2 : lo + ((hi - lo) * i) / (k - 1)));
  let groups: ColorToken[][] = [];
  for (let iter = 0; iter < 50; iter++) {
    groups = centers.map(() => []);
    for (const t of neutrals) {
      let best = 0;
      for (let c = 1; c < centers.length; c++) if (Math.abs(t.oklch.l - centers[c]!) < Math.abs(t.oklch.l - centers[best]!)) best = c;
      groups[best]!.push(t);
    }
    const next = groups.map((g, i) => {
      const w = g.reduce((s, t) => s + Math.max(1, t.usage), 0);
      return g.length ? g.reduce((s, t) => s + t.oklch.l * Math.max(1, t.usage), 0) / w : centers[i]!;
    });
    if (next.every((c, i) => Math.abs(c - centers[i]!) < 1e-6)) break;
    centers = next;
  }
  return groups.filter((g) => g.length);
}

function withLightness(c: Rgba, l: number): Rgba {
  const o = oklabToOklch(rgbToOklab(c));
  return oklabToRgb(oklchToOklab({ ...o, l: Math.max(0, Math.min(1, l)) }), c.a);
}

export type ColorPlan = { colors: ProposedColor[]; mapping: Map<string, string>; contrastKept: boolean; grays: { before: number; after: number } };

/**
 * Neutrals fold into the smallest of 5, 7 or 9 steps that keeps every current neutral within ΔE 8
 * of its step; each step takes its most used member's value. A pair that passed and would fail
 * moves its step in 0.01 lightness until it passes; a step that comes within ΔE 2.3 of a neighbor
 * means a larger N.
 */
export function proposeColors(colors: ColorToken[]): ColorPlan {
  const neutrals = colors.filter((c) => c.group === 'neutral');
  const byId = new Map(colors.map((c) => [c.id, c]));
  const pairs = colors.flatMap((c) => c.contrastPairs.map((p) => ({ ...p, threshold: p.large ? 3 : 4.5 })));
  const passing = pairs.filter((p) => p.ratio >= p.threshold);

  const evaluate = (steps: Step[], brandMap: Map<string, string>) => {
    const valueOf = (id: string): Rgba => {
      const step = steps.find((s) => s.members.some((m) => m.id === id));
      if (step) return step.value;
      const mapped = brandMap.get(id);
      return rgba(byId.get(mapped ?? id)!);
    };
    return passing.filter((p) => byId.has(p.fg) && byId.has(p.bg)).map((p) => ({ p, ratio: contrastRatio(valueOf(p.fg), valueOf(p.bg)) }));
  };

  let chosen: { steps: Step[]; kept: boolean } | null = null;
  const sizes = neutrals.length <= GRAY_TARGETS[0]! ? [neutrals.length] : GRAY_TARGETS.filter((n) => n < neutrals.length).concat(neutrals.length);
  for (const n of sizes) {
    const groups = n >= neutrals.length ? neutrals.map((t) => [t]) : kmeansLightness(neutrals, n);
    const steps: Step[] = groups.map((g) => {
      const rep = [...g].sort((a, b) => b.usage - a.usage || a.value.localeCompare(b.value))[0]!;
      return { l: rep.oklch.l, rep, members: g, value: rgba(rep) };
    });
    if (!steps.every((s) => s.members.every((m) => deltaE(rgba(m), s.value) <= MAP_WITHIN_DE))) continue;
    // Repair: nudge a step whose mapping broke a passing pair.
    let kept = true;
    for (let guard = 0; guard < 200; guard++) {
      const broken = evaluate(steps, new Map()).find(({ p, ratio }) => ratio < p.threshold);
      if (!broken) break;
      const ids = [broken.p.fg, broken.p.bg];
      // The step whose value differs from a member's own: that mapping changed the pair.
      const step = steps.find((s) => s.members.some((m) => ids.includes(m.id) && hexOf(s.value) !== m.value));
      if (!step) {
        kept = false;
        break;
      }
      const other = ids.find((id) => !step.members.some((m) => m.id === id))!;
      const otherL = byId.get(other) ? oklabToOklch(rgbToOklab(evaluateValue(steps, other, byId))).l : 0.5;
      const dir = step.l >= otherL ? 0.01 : -0.01;
      step.l = Math.max(0, Math.min(1, step.l + dir));
      step.value = withLightness(step.value, step.l);
      const crowded = steps.some((s) => s !== step && deltaE(s.value, step.value) < CLUSTER_DELTA_E);
      if (crowded || step.l <= 0 || step.l >= 1) {
        kept = false;
        break;
      }
    }
    chosen = { steps, kept };
    if (kept) break;
  }
  const steps = chosen?.steps ?? [];

  // Brand: keep what carries 2% of chromatic usage; fold the rest into the nearest kept within ΔE 8.
  const chromatic = colors.filter((c) => c.group !== 'neutral');
  const chromaticUse = chromatic.reduce((s, c) => s + c.usage, 0) || 1;
  const brand = colors.filter((c) => c.group === 'brand');
  const keptBrand = brand.filter((c) => c.usage / chromaticUse >= BRAND_KEEP_SHARE);
  const brandMap = new Map<string, string>();
  for (const c of brand) {
    if (keptBrand.includes(c)) continue;
    const near = keptBrand.filter((k) => Math.abs(rgba(k).a - rgba(c).a) <= 0.05).sort((a, b) => deltaE(rgba(a), rgba(c)) - deltaE(rgba(b), rgba(c)))[0];
    if (!near || deltaE(rgba(near), rgba(c)) > MAP_WITHIN_DE) continue;
    brandMap.set(c.id, near.id);
    // A brand fold that would break a passing pair is not made.
    if (evaluate(steps, brandMap).some(({ p, ratio }) => ratio < p.threshold && [p.fg, p.bg].includes(c.id))) brandMap.delete(c.id);
  }

  const results = evaluate(steps, brandMap);
  const failingIds = new Set(results.filter(({ p, ratio }) => ratio < p.threshold).flatMap(({ p }) => [p.fg, p.bg]));
  const mapping = new Map<string, string>();
  const out: ProposedColor[] = [];
  const names = new Set<string>();
  for (const s of [...steps].sort((a, b) => b.l - a.l)) {
    let name = `gray-${lightnessStep(s.l)}`;
    for (let n = 1; names.has(name); n++) name = `gray-${lightnessStep(s.l)}${String.fromCharCode(97 + n)}`;
    names.add(name);
    for (const m of s.members) mapping.set(m.id, name);
    out.push({ name, value: hexOf(s.value), group: 'neutral', absorbs: s.members.map((m) => m.name), contrastKept: !s.members.some((m) => failingIds.has(m.id)) });
  }
  for (const c of colors.filter((x) => x.group !== 'neutral' && !brandMap.has(x.id))) {
    const absorbed = [...brandMap].filter(([, to]) => to === c.id).map(([from]) => byId.get(from)!.name);
    mapping.set(c.id, c.name);
    for (const [from, to] of brandMap) if (to === c.id) mapping.set(from, c.name);
    out.push({ name: c.name, value: c.value, group: c.group, absorbs: [c.name, ...absorbed], contrastKept: !failingIds.has(c.id) });
  }
  return { colors: out, mapping, contrastKept: failingIds.size === 0, grays: { before: neutrals.length, after: steps.length } };
}

function evaluateValue(steps: Step[], id: string, byId: Map<string, ColorToken>): Rgba {
  const step = steps.find((s) => s.members.some((m) => m.id === id));
  return step ? step.value : rgba(byId.get(id)!);
}

/** On-grid steps; off-grid values and the lighter member of a near-step map to the nearest step. */
export function proposeSpacing(tokens: Tokens, f: Findings): number[] {
  const dropped = new Set(f.spacing.filter((s) => s.kind === 'near-step').map((s) => s.value));
  return tokens.space.filter((s) => s.onGrid && !dropped.has(s.value)).map((s) => s.value);
}

/** Near-duplicate type styles fold into the more used one. */
export function proposeType(tokens: Tokens, f: Findings): ProposedType[] {
  const into = new Map<string, string>();
  for (const p of f.type) if (!into.has(p.b.id)) into.set(p.b.id, p.a.id);
  const root = (id: string): string => (into.has(id) ? root(into.get(id)!) : id);
  return tokens.type
    .filter((t) => !into.has(t.id))
    .map((t) => ({ name: t.name, role: t.role, family: t.family, size: t.size, lineHeight: t.lineHeight, weight: t.weight, letterSpacing: t.letterSpacing, absorbs: [t.name, ...tokens.type.filter((x) => x.id !== t.id && root(x.id) === t.id).map((x) => x.name)] }));
}

export function propose(tokens: Tokens, f: Findings): { proposal: Drift['proposal']; grays: ColorPlan['grays'] } {
  const c = proposeColors(tokens.colors);
  return { proposal: { colors: c.colors, spacing: proposeSpacing(tokens, f), type: proposeType(tokens, f), contrastKept: c.contrastKept }, grays: c.grays };
}
