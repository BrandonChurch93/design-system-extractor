import type { ColorGroup, ExportSet, RunDocumentPartial } from '@dse/schema';

// The token set an export writes, with the names every format and the panel share
// (docs/specs/exports-and-mcp.md, Formats). Browser-safe: no Node imports anywhere in exports/.

export type ExportColor = { name: string; value: string; group: ColorGroup; usage: number };
export type ExportType = { name: string; role: string; family: string; fallbackStack: string; size: number; lineHeight: number; weight: number; letterSpacing: number };
export type ExportTokens = {
  set: ExportSet;
  colors: ExportColor[];
  type: ExportType[];
  fonts: { name: string; family: string; stack: string[] }[];
  space: { name: string; value: number }[];
  radius: { name: string; value: number; pill: boolean }[];
  shadow: { name: string; value: string }[];
  breakpoints: { name: string; value: number }[];
};

export type ExportContext = { doc: RunDocumentPartial; set: ExportSet; runUrl: string };

const radiusNames = ['radius-sm', 'radius-md', 'radius-lg', 'radius-xl'];
const breakpointNames = ['breakpoint-sm', 'breakpoint-md', 'breakpoint-lg', 'breakpoint-xl', 'breakpoint-2xl'];

export const spaceName = (v: number) => `space-${String(v).replace('.', '_')}`;

function stackOf(fallback: string, family: string): string[] {
  const parts = fallback
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
  return parts.length ? parts : [family];
}

/** The tokens of the chosen set: the drift proposal's colors, spacing and type, or the raw extraction. */
export function exportTokens(doc: RunDocumentPartial, set: ExportSet): ExportTokens {
  const t = doc.tokens;
  if (!t?.colors) throw new Error('the run has no tokens');
  const proposal = set === 'proposed' ? doc.drift?.proposal : undefined;
  const usageByName = new Map(t.colors.map((c) => [c.name, c.usage]));
  const colors: ExportColor[] = proposal
    ? proposal.colors.map((c) => ({ name: c.name, value: c.value, group: c.group, usage: c.absorbs.reduce((s, n) => s + (usageByName.get(n) ?? 0), 0) }))
    : t.colors.map((c) => ({ name: c.name, value: c.value, group: c.group, usage: c.usage }));
  const rawType = t.type ?? [];
  const type: ExportType[] = (proposal ? proposal.type : rawType).map((x) => {
    const raw = rawType.find((r) => r.name === x.name);
    return { name: x.name, role: x.role, family: x.family, fallbackStack: raw?.fallbackStack ?? x.family, size: x.size, lineHeight: x.lineHeight, weight: x.weight, letterSpacing: x.letterSpacing };
  });
  const body = type.find((x) => x.role === 'body') ?? type[0];
  const display = type.find((x) => x.role === 'display');
  const code = type.find((x) => x.role === 'code');
  const fonts: ExportTokens['fonts'] = [];
  if (body) fonts.push({ name: 'sans', family: body.family, stack: stackOf(body.fallbackStack, body.family) });
  if (display && display.family !== body?.family) fonts.push({ name: 'display', family: display.family, stack: stackOf(display.fallbackStack, display.family) });
  if (code) fonts.push({ name: 'mono', family: code.family, stack: stackOf(code.fallbackStack, code.family) });
  const spaceValues = proposal ? proposal.spacing : (t.space ?? []).map((s) => s.value);
  const space = [...spaceValues].sort((a, b) => a - b).map((v) => ({ name: spaceName(v), value: v }));
  const plain = (t.radius ?? []).filter((r) => !r.isPill).sort((a, b) => a.value - b.value);
  const radius = [...plain.map((r, i) => ({ name: radiusNames[i] ?? `radius-${r.value}`, value: r.value, pill: false })), ...(t.radius ?? []).filter((r) => r.isPill).map(() => ({ name: 'radius-pill', value: 9999, pill: true }))];
  const shadow = (t.shadow ?? []).map((s) => ({ name: `shadow-${s.name}`, value: s.value }));
  const breakpoints = [...(t.breakpoints ?? [])].sort((a, b) => a - b).map((v, i) => ({ name: breakpointNames[i] ?? `breakpoint-${v}`, value: v }));
  return { set, colors, type, fonts, space, radius, shadow, breakpoints };
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
