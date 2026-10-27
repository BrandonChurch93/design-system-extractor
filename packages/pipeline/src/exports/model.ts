import type { ColorGroup, Component, ExportSet, Keyframes, RunDocumentPartial } from '@dse/schema';
import { resolveSiteVariables, sealKeyframes } from './vars';

// The token set an export writes, with the names every format and the panel share
// (docs/specs/exports-and-mcp.md, Formats). Browser-safe: no Node imports anywhere in exports/.

/** Every token carries its display name and the custom property the exports write for it. */
export type ExportColor = { name: string; var: string; value: string; group: ColorGroup; usage: number };
export type ExportOverlay = { name: string; var: string; value: string; base: string; alpha: number };
export type ExportType = { name: string; role: string; family: string; fallbackStack: string; size: number; lineHeight: number; weight: number; letterSpacing: number };
export type ExportDuration = { name: string; var: string; ms: number; role?: string };
export type ExportEasing = { name: string; var: string; value: string };
export type ExportTokens = {
  set: ExportSet;
  colors: ExportColor[];
  overlays: ExportOverlay[];
  type: ExportType[];
  fonts: { name: string; family: string; stack: string[] }[];
  space: { name: string; var: string; value: number }[];
  radius: { name: string; var: string; value: number; pill: boolean }[];
  shadow: { name: string; var: string; value: string }[];
  durations: ExportDuration[];
  easings: ExportEasing[];
  breakpoints: { name: string; var: string; value: number }[];
  keyframes: Keyframes[];
  /** Non-hashed site variables this export does not already declare as a token, resolved (D-083). */
  siteVariables: { name: string; value: string; literal: string; kind?: string }[];
  /** A raw token id to the name of the token that stands for it in this set, as its variable without `--`. */
  refs: Map<string, string>;
  /** Every custom property this export declares: the token variables and the site variables (D-090). */
  declares: Set<string>;
};

export type ExportContext = { doc: RunDocumentPartial; set: ExportSet; runUrl: string };

const radiusNames = ['radius-sm', 'radius-md', 'radius-lg', 'radius-xl'];
const breakpointNames = ['breakpoint-sm', 'breakpoint-md', 'breakpoint-lg', 'breakpoint-xl', 'breakpoint-2xl'];

export const spaceName = (v: number) => `space-${String(v).replace('.', '_')}`;
/** The `--ease-*` group: a name that does not already start with `ease` takes the prefix. */
export const easingVar = (name: string) => (/^ease(-|$)/.test(name) ? `--${name}` : `--ease-${name}`);
const bare = (v: string) => v.replace(/^--/, '');

function stackOf(fallback: string, family: string): string[] {
  const parts = fallback
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
  return parts.length ? parts : [family];
}

/** The tokens of the chosen set: the drift proposal's colors, spacing, type and motion, or the raw extraction. */
export function exportTokens(doc: RunDocumentPartial, set: ExportSet): ExportTokens {
  const t = doc.tokens;
  if (!t?.colors) throw new Error('the run has no tokens');
  const proposal = set === 'proposed' ? doc.drift?.proposal : undefined;
  const refs = new Map<string, string>();
  const rawColors = t.colors;
  const colorVar = (name: string) => rawColors.find((c) => c.name === name && c.siteName)?.siteName ?? `--color-${name}`;
  const usageByName = new Map(rawColors.map((c) => [c.name, c.usage]));
  const colors: ExportColor[] = proposal
    ? proposal.colors.map((c) => ({ name: c.name, var: colorVar(c.name), value: c.value, group: c.group, usage: c.absorbs.reduce((s, n) => s + (usageByName.get(n) ?? 0), 0) }))
    : rawColors.map((c) => ({ name: c.name, var: c.siteName ?? `--color-${c.name}`, value: c.value, group: c.group, usage: c.usage }));
  for (const raw of rawColors) {
    const home = proposal ? colors.find((c) => proposal.colors.find((p) => p.name === c.name)?.absorbs.includes(raw.name)) ?? colors.find((c) => c.name === raw.name) : colors.find((c) => c.name === raw.name);
    if (home) refs.set(raw.id, bare(home.var));
  }
  const overlays: ExportOverlay[] = (t.overlays ?? []).map((o) => ({ name: o.name, var: o.siteName ?? `--overlay-${o.name}`, value: o.value, base: o.base, alpha: o.alpha }));
  for (const [i, o] of (t.overlays ?? []).entries()) refs.set(o.id, bare(overlays[i]!.var));

  const rawType = t.type ?? [];
  const type: ExportType[] = (proposal ? proposal.type : rawType).map((x) => {
    const raw = rawType.find((r) => r.name === x.name);
    return { name: x.name, role: x.role, family: x.family, fallbackStack: raw?.fallbackStack ?? x.family, size: x.size, lineHeight: x.lineHeight, weight: x.weight, letterSpacing: x.letterSpacing };
  });
  for (const raw of rawType) {
    const home = proposal ? proposal.type.find((p) => p.absorbs.includes(raw.name)) : raw;
    if (home) refs.set(raw.id, `type-${home.name}`);
  }
  const body = type.find((x) => x.role === 'body') ?? type[0];
  const display = type.find((x) => x.role === 'display');
  const code = type.find((x) => x.role === 'code');
  const fonts: ExportTokens['fonts'] = [];
  if (body) fonts.push({ name: 'sans', family: body.family, stack: stackOf(body.fallbackStack, body.family) });
  if (display && display.family !== body?.family) fonts.push({ name: 'display', family: display.family, stack: stackOf(display.fallbackStack, display.family) });
  if (code) fonts.push({ name: 'mono', family: code.family, stack: stackOf(code.fallbackStack, code.family) });

  const rawSpace = t.space ?? [];
  const spaceValues = proposal ? proposal.spacing : rawSpace.map((s) => s.value);
  const spaceVar = (v: number) => rawSpace.find((s) => s.value === v && s.siteName)?.siteName ?? `--${spaceName(v)}`;
  const space = [...spaceValues].sort((a, b) => a - b).map((v) => ({ name: bare(spaceVar(v)), var: spaceVar(v), value: v }));
  for (const raw of rawSpace) {
    // An off-grid value in the proposed set is written as the nearest step (drift.md, The proposed set).
    const home = space.find((s) => s.value === raw.value) ?? [...space].sort((a, b) => Math.abs(a.value - raw.value) - Math.abs(b.value - raw.value))[0];
    if (home) refs.set(raw.id, bare(home.var));
  }

  const plain = (t.radius ?? []).filter((r) => !r.isPill).sort((a, b) => a.value - b.value);
  const pill = (t.radius ?? []).filter((r) => r.isPill);
  const radius = [
    ...plain.map((r, i) => ({ id: r.id, var: r.siteName ?? `--${radiusNames[i] ?? `radius-${r.value}`}`, value: r.value, pill: false })),
    ...pill.map((r) => ({ id: r.id, var: r.siteName ?? '--radius-pill', value: 9999, pill: true })),
  ].map((r) => {
    refs.set(r.id, bare(r.var));
    return { name: bare(r.var), var: r.var, value: r.value, pill: r.pill };
  });
  const shadow = (t.shadow ?? []).map((s) => {
    const v = s.siteName ?? `--shadow-${s.name}`;
    refs.set(s.id, bare(v));
    return { name: bare(v), var: v, value: s.value };
  });

  const rawDur = t.duration ?? [];
  const durations: ExportDuration[] = (proposal?.durations ?? rawDur).map((d) => {
    const raw = rawDur.find((r) => r.name === d.name);
    return { name: d.name, var: raw?.siteName ?? `--${d.name}`, ms: d.ms, ...(d.role ? { role: d.role } : {}) };
  });
  for (const raw of rawDur) {
    const home = proposal?.durations ? proposal.durations.find((p) => p.absorbs.includes(raw.name)) : raw;
    const d = home && durations.find((x) => x.name === home.name);
    if (d) refs.set(raw.id, bare(d.var));
  }
  const rawEase = t.easing ?? [];
  const easings: ExportEasing[] = (proposal?.easings ?? rawEase).map((e) => {
    const raw = rawEase.find((r) => r.name === e.name);
    return { name: e.name, var: raw?.siteName ?? easingVar(e.name), value: e.value };
  });
  for (const raw of rawEase) {
    const home = proposal?.easings ? proposal.easings.find((p) => p.absorbs.includes(raw.name)) : raw;
    const e = home && easings.find((x) => x.name === home.name);
    if (e) refs.set(raw.id, bare(e.var));
  }

  const rawBps = [...(t.breakpoints ?? [])].sort((a, b) => a.value - b.value);
  const breakpoints = rawBps.map((b, i) => {
    const v = b.siteName ?? `--${breakpointNames[i] ?? `breakpoint-${b.value}`}`;
    return { name: bare(v), var: v, value: b.value };
  });

  const keyframes = [...(t.keyframes ?? [])].sort((a, b) => Number(b.used) - Number(a.used));
  // Every token variable this export writes, with its value, for the site values that read one (D-090).
  const tokenValues = new Map<string, string>([
    ...colors.map((c) => [c.var, c.value] as const),
    ...overlays.map((o) => [o.var, o.value] as const),
    ...type.flatMap((x) => [[`--type-${x.name}-size`, `${x.size}px`], [`--type-${x.name}-line`, `${x.lineHeight}px`], [`--type-${x.name}-weight`, String(x.weight)], ...(x.letterSpacing ? [[`--type-${x.name}-tracking`, `${x.letterSpacing}px`]] : [])] as [string, string][]),
    ...fonts.map((f) => [`--font-${f.name}`, f.stack.join(', ')] as const),
    ...space.map((s) => [s.var, `${s.value}px`] as const),
    ...radius.map((r) => [r.var, `${r.value}px`] as const),
    ...shadow.map((s) => [s.var, s.value] as const),
    ...durations.map((d) => [d.var, `${d.ms}ms`] as const),
    ...durations.filter((d) => d.role).map((d) => [`--duration-${d.role}`, `${d.ms}ms`] as const),
    ...easings.map((e) => [e.var, e.value] as const),
    ...breakpoints.map((b) => [b.var, `${b.value}px`] as const),
  ]);
  const declared = new Set(tokenValues.keys());
  const siteVariables = resolveSiteVariables(
    (t.siteVariables ?? []).filter((v) => !v.hashed && !declared.has(v.name)),
    tokenValues,
  )
    .map((v) => ({ name: v.name, value: v.written, literal: v.literal, ...(v.kind ? { kind: v.kind } : {}) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const declares = new Set([...declared, ...siteVariables.map((v) => v.name)]);
  const known = (n: string) => declares.has(n);
  const sealed = keyframes.map((k) => ({ ...k, css: sealKeyframes(k.name, k.css, known) }));
  return { set, colors, overlays, type, fonts, space, radius, shadow, durations, easings, breakpoints, keyframes: sealed, siteVariables, refs, declares };
}

/** The name a component's token reference has in this export, or null when the set has no token for it. */
export function tokenRef(t: ExportTokens, tokenId: string): string | null {
  return t.refs.get(tokenId) ?? null;
}

/** Core components first, each tier in the document's order (D-085). */
export function byTier(comps: Component[]): { core: Component[]; page: Component[] } {
  return { core: comps.filter((c) => c.tier !== 'page'), page: comps.filter((c) => c.tier === 'page') };
}

/** The date of the run, YYYY-MM-DD, for headers. */
export function runDate(doc: RunDocumentPartial): string {
  return (doc.finishedAt ?? doc.createdAt ?? '').slice(0, 10);
}

/** `/* Design System Extractor · {host} · run {id} · {set} set · {date} *\/` */
export function headerLine(doc: RunDocumentPartial, set: ExportSet): string {
  return `Design System Extractor · ${doc.host} · run ${doc.id} · ${set} set · ${runDate(doc)}`;
}

export function meta(doc: RunDocumentPartial, set: ExportSet) {
  return { tool: 'Design System Extractor' as const, host: doc.host ?? '', runId: doc.id ?? '', set, date: runDate(doc) };
}

/** Copy rules 1 and 3, asserted on generated prose (docs/specs/exports-and-mcp.md). */
export function assertVoice(text: string, file: string): string {
  if (/[\u2014\u2013]/.test(text)) throw new Error(`${file} contains a dash the copy rules forbid`);
  if (/\b(accessible|compliant|a11y)\b/i.test(text)) throw new Error(`${file} contains a forbidden word`); // qa-copy-allow
  return text;
}

/** Every custom property an export uses but does not declare (D-083). Empty for a sound export. */
export function undeclaredVars(text: string): string[] {
  const declared = new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]!));
  return [...new Set([...text.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!))].filter((v) => !declared.has(v)).sort();
}
