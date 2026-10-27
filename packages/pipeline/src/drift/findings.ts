import type { ColorToken, Component, Evidence, Tokens, TypeToken, VariantCollapse } from '@dse/schema';
import { deltaE, parseCssColor } from '../color/parse';
import type { Item } from '../components/items';
import { tupleOf } from '../components/variants';
import { hueWord, NEUTRAL_CHROMA } from '../tokens/constants';
import { nearEasing } from '../tokens/easing-table';

// Drift findings (docs/specs/drift.md, Findings). Raw spread is evidence only, never a finding.

export const NEUTRAL_DUPLICATE_DE = 6;
export const CHROMATIC_DUPLICATE_DE = 8;
export const NEAR_STEP_PX = 4;
export const NEAR_STEP_SHARE = 0.05;
export const RAW_SPREAD_MIN = 4;
export const RADIUS_SPRAWL = 4;
export const SHADOW_SPRAWL = 3;
export const DURATION_SPRAWL = 6;
export const EASING_SPRAWL = 5;
export const EVIDENCE_CAP = 40;

export type ColorPair = { a: ColorToken; b: ColorToken; delta: number; pages: string[] };
export type SpacingFinding = { value: number; nearest: number; pages: string[]; uses: number; nearUses: number; kind: 'off-grid' | 'near-step' };
export type TypePair = { a: TypeToken; b: TypeToken };
export type Collapse = VariantCollapse & { componentName: string; keepName: string; mergeNames: string[]; parts: { padding: number; radius: number; fontSize: number; color: boolean } };

export type Findings = { colors: ColorPair[]; spacing: SpacingFinding[]; collapses: Collapse[]; type: TypePair[]; sprawl: Evidence[]; spread: Evidence[] };

const rgba = (t: ColorToken) => parseCssColor(t.value)!;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function pagesOf(ids: string[], paths: Map<string, string>): string[] {
  return ids.map((id) => paths.get(id) ?? id);
}

/**
 * Neutral with neutral within ΔE 6, brand with brand of one hue word within ΔE 8, only between
 * equal alphas (D-048).
 */
export function nearDuplicateColors(colors: ColorToken[], paths: Map<string, string>): ColorPair[] {
  const out: ColorPair[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const a = colors[i]!;
      const b = colors[j]!;
      if (a.group !== b.group || a.group === 'semantic') continue;
      const ca = rgba(a);
      const cb = rgba(b);
      if (Math.abs(ca.a - cb.a) > 0.05) continue;
      const limit = a.group === 'neutral' ? NEUTRAL_DUPLICATE_DE : CHROMATIC_DUPLICATE_DE;
      if (a.group === 'brand' && (a.oklch.c < NEUTRAL_CHROMA || hueWord(a.oklch.h) !== hueWord(b.oklch.h))) continue;
      const d = deltaE(ca, cb);
      if (d > limit) continue;
      const both = a.pages.filter((p) => b.pages.some((q) => q.pageId === p.pageId)).map((p) => p.pageId);
      out.push({ a, b, delta: round1(d), pages: pagesOf(both, paths) });
    }
  }
  return out.sort((x, y) => x.delta - y.delta || x.a.value.localeCompare(y.a.value));
}

export function spacingFindings(tokens: Tokens, paths: Map<string, string>): SpacingFinding[] {
  const steps = tokens.space.filter((s) => s.onGrid);
  const total = tokens.space.reduce((s, t) => s + t.usage, 0) || 1;
  const out: SpacingFinding[] = [];
  for (const s of tokens.space.filter((x) => !x.onGrid)) {
    const nearest = [...steps].sort((a, b) => Math.abs(a.value - s.value) - Math.abs(b.value - s.value) || a.value - b.value)[0];
    out.push({ value: s.value, nearest: nearest?.value ?? Math.round(s.value / tokens.spaceBase.value) * tokens.spaceBase.value, pages: pagesOf(s.pages.map((p) => p.pageId), paths), uses: s.usage, nearUses: nearest?.usage ?? 0, kind: 'off-grid' });
  }
  for (let i = 0; i + 1 < steps.length; i++) {
    const a = steps[i]!;
    const b = steps[i + 1]!;
    if (b.value - a.value <= NEAR_STEP_PX && a.usage / total < NEAR_STEP_SHARE && b.usage / total < NEAR_STEP_SHARE) {
      const [low, high] = a.usage <= b.usage ? [a, b] : [b, a];
      out.push({ value: low.value, nearest: high.value, pages: pagesOf(low.pages.map((p) => p.pageId), paths), uses: low.usage, nearUses: high.usage, kind: 'near-step' });
    }
  }
  return out;
}

/** Same family and weight, a size within 1 px, or the same size with line heights within 2 px. */
export function typeNearDuplicates(type: TypeToken[]): TypePair[] {
  const out: TypePair[] = [];
  for (let i = 0; i < type.length; i++) {
    for (let j = i + 1; j < type.length; j++) {
      const a = type[i]!;
      const b = type[j]!;
      if (a.family !== b.family || a.weight !== b.weight) continue;
      const sizeClose = Math.abs(a.size - b.size) <= 1;
      const lineClose = a.size === b.size && Math.abs(a.lineHeight - b.lineHeight) <= 2;
      if (sizeClose || lineClose) out.push(a.usage >= b.usage ? { a, b } : { a: b, b: a });
    }
  }
  return out;
}

/** What separates two variant looks, when it is only padding ±2, radius ±2, type ±1 or a color within ΔE 3. */
export function collapseDelta(x: string[], y: string[]): Collapse['parts'] | null {
  const [bgA, colorA, borderA, borderWA, padA, radA, weightA, heightA] = x;
  const [bgB, colorB, borderB, borderWB, padB, radB, weightB, heightB] = y;
  let color = false;
  for (const [p, q] of [[bgA, bgB], [colorA, colorB], [borderA, borderB]] as const) {
    if (p === q) continue;
    const cp = parseCssColor(p!);
    const cq = parseCssColor(q!);
    if (!cp || !cq || Math.abs(cp.a - cq.a) > 0.05 || deltaE(cp, cq) > 3) return null;
    color = true;
  }
  if (borderWA !== borderWB || weightA !== weightB || heightA !== heightB) return null;
  const pa = padA!.split(' ').map(Number);
  const pb = padB!.split(' ').map(Number);
  const padding = Math.max(...pa.map((v, i) => Math.abs(v - pb[i]!)));
  const radius = Math.abs(Number(radA) - Number(radB));
  if (padding > 2 || radius > 2) return null;
  if (!color && padding === 0 && radius === 0) return null;
  return { padding, radius, fontSize: 0, color };
}

export function variantCollapses(comps: Component[], reps: Map<string, Map<string, Item>>): Collapse[] {
  const out: Collapse[] = [];
  for (const c of comps) {
    const byId = reps.get(c.id);
    if (!byId || c.variants.length < 2) continue;
    const ranked = [...c.variants].sort((a, b) => b.instanceIds.length - a.instanceIds.length);
    const used = new Set<string>();
    for (const keep of ranked) {
      if (used.has(keep.id)) continue;
      const k = byId.get(keep.id);
      if (!k) continue;
      const merge: { id: string; name: string; parts: Collapse['parts'] }[] = [];
      for (const other of ranked) {
        if (other.id === keep.id || used.has(other.id)) continue;
        const o = byId.get(other.id);
        const parts = o ? collapseDelta(tupleOf(k), tupleOf(o)) : null;
        if (parts) merge.push({ id: other.id, name: other.name, parts });
      }
      if (!merge.length) continue;
      used.add(keep.id);
      for (const m of merge) used.add(m.id);
      const parts = { padding: Math.max(...merge.map((m) => m.parts.padding)), radius: Math.max(...merge.map((m) => m.parts.radius)), fontSize: 0, color: merge.some((m) => m.parts.color) };
      const words = [parts.padding ? `padding ${parts.padding} px` : '', parts.radius ? `radius ${parts.radius} px` : '', parts.color ? 'color within ΔE 3' : ''].filter(Boolean).join(', ');
      out.push({ componentId: c.id, keep: keep.id, merge: merge.map((m) => m.id), delta: words, componentName: c.name, keepName: keep.name, mergeNames: merge.map((m) => m.name), parts });
    }
  }
  return out;
}

export function sprawlEvidence(tokens: Tokens): Evidence[] {
  const out: Evidence[] = [];
  if (tokens.radius.length > RADIUS_SPRAWL) out.push({ a: `${tokens.radius.length} radii`, b: tokens.radius.map((r) => (r.isPill ? 'pill' : `${r.value}`)).join(', '), delta: `${tokens.radius.length} radii`, kind: 'sprawl', pages: [], usesA: tokens.radius.reduce((s, r) => s + r.usage, 0), usesB: 0, evidenceOnly: false });
  if (tokens.rawCounts.shadows > SHADOW_SPRAWL) out.push({ a: `${tokens.rawCounts.shadows} shadows`, b: `merged into ${tokens.shadow.length}`, delta: `${tokens.rawCounts.shadows} shadows merged into ${tokens.shadow.length}`, kind: 'sprawl', pages: [], usesA: tokens.shadow.reduce((s, t) => s + t.usage, 0), usesB: 0, evidenceOnly: false });
  // Motion sprawl comes after the other sprawl rows (motion-capture.md, Drift).
  const durations = tokens.duration ?? [];
  if (durations.length > DURATION_SPRAWL) {
    const list = `${durations.map((d) => d.ms).join(', ')} ms`;
    out.push({ a: `${durations.length} durations`, b: list, delta: `${durations.length} durations: ${list}`, kind: 'sprawl', pages: [], usesA: durations.reduce((s, d) => s + d.usage, 0), usesB: 0, evidenceOnly: false });
  }
  const easings = tokens.easing ?? [];
  if (easings.length > EASING_SPRAWL) {
    const top = [...easings].sort((a, b) => b.usage - a.usage)[0]!;
    const near = easings.filter((e) => e !== top && nearEasing(e.value, top.value)).length;
    out.push({ a: `${easings.length} easings`, b: `${near} within 0.05 of ${top.name}`, delta: `${easings.length} easings, ${near} within 0.05 of ${top.name}`, kind: 'sprawl', pages: [], usesA: easings.reduce((s, e) => s + e.usage, 0), usesB: 0, evidenceOnly: false });
  }
  return out;
}

/** "#6B6B6B written 6 ways": a token that absorbed four or more raw values. Evidence only. */
export function rawSpread(colors: ColorToken[], paths: Map<string, string>): Evidence[] {
  return colors
    .filter((c) => c.rawValues.length >= RAW_SPREAD_MIN)
    .map((c) => ({ a: c.value, b: c.rawValues.map((r) => r.value).join(', '), delta: `written ${c.rawValues.length} ways`, kind: 'color' as const, pages: pagesOf(c.pages.map((p) => p.pageId), paths), usesA: c.usage, usesB: 0, evidenceOnly: true }));
}

export function findAll(tokens: Tokens, comps: Component[], reps: Map<string, Map<string, Item>>, paths: Map<string, string>): Findings {
  return {
    colors: nearDuplicateColors(tokens.colors, paths),
    spacing: spacingFindings(tokens, paths),
    collapses: variantCollapses(comps, reps),
    type: typeNearDuplicates(tokens.type),
    sprawl: sprawlEvidence(tokens),
    spread: rawSpread(tokens.colors, paths),
  };
}

export const findingCount = (f: Findings) => f.colors.length + f.spacing.length + f.collapses.length + f.type.length + f.sprawl.length;

/** Evidence rows in the spec's order, capped at 40 in the document. */
export function evidenceRows(f: Findings): Evidence[] {
  const rows: Evidence[] = [
    ...f.colors.map((p) => ({ a: p.a.value, b: p.b.value, delta: `ΔE ${p.delta.toFixed(1)}`, kind: 'color' as const, pages: p.pages, usesA: p.a.usage, usesB: p.b.usage, evidenceOnly: false })),
    ...f.collapses.map((c) => ({ a: `${c.componentName} · ${c.keepName}`, b: c.mergeNames.join(', '), delta: c.delta, kind: 'variant' as const, pages: [], usesA: 0, usesB: 0, evidenceOnly: false })),
    ...f.spacing.map((s) => ({ a: `${s.value} px`, b: `${s.nearest} px`, delta: `${Math.round(Math.abs(s.value - s.nearest) * 10) / 10} px`, kind: 'spacing' as const, pages: s.pages, usesA: s.uses, usesB: s.nearUses, evidenceOnly: false })),
    ...f.type.map((t) => ({ a: t.a.name, b: t.b.name, delta: t.a.size === t.b.size ? `line height ${t.a.lineHeight} vs ${t.b.lineHeight}` : `${Math.abs(t.a.size - t.b.size)} px`, kind: 'type' as const, pages: [], usesA: t.a.usage, usesB: t.b.usage, evidenceOnly: false })),
    ...f.sprawl,
    ...f.spread,
  ];
  return rows.slice(0, EVIDENCE_CAP);
}
