import { checkLabels, componentTypeLabels, stateLabels, type Component, type RunDocumentPartial } from '@dse/schema';
import { assertVoice, exportTokens, runDate, type ExportTokens } from './model';
import { tokensCss } from './tokens';
import type { ExportSet } from '@dse/schema';

// design-system.md and prompt.md, assembled from facts (docs/specs/exports-and-mcp.md). No model
// writes any of it except the stored intro and narrative.

export const DISCLAIMER = 'The measurable subset of WCAG 2.2, run on every component. Not an accessibility audit.';
export const PROMPT_OPENING = 'You are building an interface that must match this design system exactly.';

const cell = (s: string | number) => String(s).replace(/\|/g, '/').replace(/\n/g, ' ');
const table = (head: string[], rows: (string | number)[][]) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');

/** Site code may hold dashes the copy rules forbid in our prose; in code they are written as escapes. */
function codeSafe(code: string, lang: 'html' | 'css'): string {
  return code.replace(/\u2014/g, lang === 'css' ? '\\2014 ' : '&mdash;').replace(/\u2013/g, lang === 'css' ? '\\2013 ' : '&ndash;');
}

function fence(code: string, lang: 'html' | 'css'): string {
  const body = codeSafe(code.trim(), lang);
  const ticks = body.includes('```') ? '````' : '```';
  return `${ticks}${lang}\n${body}\n${ticks}`;
}

/** Our own prose must keep the voice; fenced site code is data and is left out of the check. */
function assertProse(md: string, file: string): string {
  assertVoice(md.replace(/(`{3,4})[\s\S]*?\1/g, ''), file);
  return md;
}

function tokenNames(doc: RunDocumentPartial): Map<string, string> {
  const t = doc.tokens;
  const m = new Map<string, string>();
  for (const c of t?.colors ?? []) m.set(c.id, c.name);
  for (const x of t?.type ?? []) m.set(x.id, x.name);
  for (const s of t?.space ?? []) m.set(s.id, `space-${s.value}`);
  for (const r of t?.radius ?? []) m.set(r.id, r.isPill ? 'radius-pill' : `radius ${r.value}px`);
  for (const s of t?.shadow ?? []) m.set(s.id, `shadow-${s.name}`);
  return m;
}

function componentSection(c: Component, names: Map<string, string>, depth = 3): string {
  const h = '#'.repeat(depth);
  const captured = c.states.filter((s) => s.captured).map((s) => stateLabels[s.state]);
  const applicable = c.checks.filter((r) => r.status !== 'na');
  const passed = applicable.filter((r) => r.status === 'pass').length;
  const used = c.tokensUsed.map((u) => `${names.get(u.tokenId) ?? u.tokenId} (${u.property})`);
  const lines = [
    `${h} ${c.name}`,
    '',
    `${componentTypeLabels[c.type]} · ${c.variants.length} variant${c.variants.length === 1 ? '' : 's'}: ${c.variants.map((v) => v.name).join(', ')}`,
    `States captured: ${captured.join(', ') || 'none'}`,
    `Tokens used: ${used.join(', ') || 'none'}`,
    ...(c.unmapped.length ? [`Unmapped: ${c.unmapped.map((u) => `${u.property} ${u.value}`).join(', ')}`] : []),
    `Checks: ${passed} of ${applicable.length}`,
    ...applicable.map((r) => `- ${checkLabels[r.check]} · ${r.status === 'pass' ? 'pass' : 'fail'} · ${r.detail}`),
    '',
    DISCLAIMER,
  ];
  if (c.code.html) lines.push('', fence(c.code.html, 'html'));
  if (c.code.css) lines.push('', fence(c.code.css, 'css'));
  return lines.join('\n');
}

function tokenSections(t: ExportTokens, doc: RunDocumentPartial): string[] {
  const base = doc.tokens?.spaceBase;
  return [
    '## Palette',
    '',
    table(['Name', 'Value', 'Group', 'Uses'], t.colors.map((c) => [c.name, c.value, c.group, c.usage])),
    '',
    '## Type',
    '',
    table(['Name', 'Role', 'Family', 'Size', 'Line height', 'Weight'], t.type.map((x) => [x.name, x.role, x.family, `${x.size}px`, `${x.lineHeight}px`, x.weight])),
    '',
    '## Spacing',
    '',
    `${base?.value ?? 4} px base. Steps: ${t.space.map((s) => s.value).join(', ')}.`,
    '',
    '## Radius',
    '',
    ...t.radius.map((r) => `- ${r.name}: ${r.value}px`),
    '',
    '## Shadow',
    '',
    ...t.shadow.map((s) => `- ${s.name}: ${s.value}`),
    '',
    '## Breakpoints',
    '',
    ...t.breakpoints.map((b) => `- ${b.name}: ${b.value}px`),
  ];
}

export function designSystemMd(doc: RunDocumentPartial, set: ExportSet): string {
  const t = exportTokens(doc, set);
  const names = tokenNames(doc);
  const d = doc.drift;
  const out = [
    `# ${doc.host} design system`,
    '',
    doc.exports?.designSystemIntro ?? '',
    '',
    ...tokenSections(t, doc),
    '',
    '## Components',
    '',
    ...(doc.components ?? []).flatMap((c) => [componentSection(c, names), '']),
    '## Drift',
    '',
    d?.headline.sentence ?? '',
    '',
    ...(d?.numbers ?? []).map((n) => `- ${n.before} → ${n.after} ${n.kind}: ${n.caption}`),
    ...(d ? ['', `Proposed set: ${d.proposal.colors.length} colors, ${d.proposal.spacing.length} spacing steps, ${d.proposal.type.length} type styles. ${d.proposal.contrastKept ? 'Every proposed pair keeps or improves its contrast ratio on the surfaces it is used on.' : 'Some pairs could not keep their contrast ratio.'}`, '', d.narrative] : []),
    '',
    '## How this was made',
    '',
    `Extracted by Design System Extractor from ${doc.host} in run ${doc.id} on ${runDate(doc)}. Tokens, components and checks are measured from the rendered pages. The introduction and the drift narrative were written by a model from those measurements. Tokens shown are the ${set} set.`,
    '',
  ];
  return assertProse(out.join('\n').replace(/\n{3,}/g, '\n\n'), 'design-system.md');
}

function contract(c: Component, names: Map<string, string>): string {
  const captured = c.states.filter((s) => s.captured && s.state !== 'default');
  return [
    `### ${c.name}`,
    '',
    `${componentTypeLabels[c.type]}. Variants: ${c.variants.map((v) => v.name).join(', ')}.`,
    `States: ${['Default', ...captured.map((s) => stateLabels[s.state])].join(', ')}.`,
    ...captured.filter((s) => s.delta.length).map((s) => `- ${stateLabels[s.state]}: ${s.delta.map((x) => `${x.property} ${x.to}`).join('; ')}`),
    `Tokens: ${c.tokensUsed.map((u) => `${names.get(u.tokenId) ?? u.tokenId} for ${u.property}`).join(', ') || 'none'}.`,
    ...(c.code.css ? ['', fence(c.code.css, 'css')] : []),
  ].join('\n');
}

/** The prompt for the whole system, or for one component (`componentId`). */
export function promptMd(doc: RunDocumentPartial, set: ExportSet, runUrl: string, componentId?: string): string {
  const t = exportTokens(doc, set);
  const names = tokenNames(doc);
  const comps = (doc.components ?? []).filter((c) => !componentId || c.id === componentId);
  if (componentId && !comps.length) throw new Error(`no component ${componentId}`);
  const css = tokensCss(doc, t).split('\n').slice(1).join('\n').trim();
  const out = [
    PROMPT_OPENING,
    '',
    '## Tokens',
    '',
    fence(css, 'css'),
    '',
    '## Type scale',
    '',
    table(['Name', 'Size', 'Line height', 'Weight', 'Family'], t.type.map((x) => [x.name, `${x.size}px`, `${x.lineHeight}px`, x.weight, x.family])),
    '',
    componentId ? '## Component' : '## Components',
    '',
    ...comps.flatMap((c) => [contract(c, names), '']),
    '## Rules',
    '',
    '- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.',
    '- Keep every text and background pair at the contrast ratio it has here.',
    '- Match each component contract, including its states.',
    '- No em dashes in any copy you write.',
    '',
    `Source: ${runUrl}`,
    '',
  ];
  return assertProse(out.join('\n').replace(/\n{3,}/g, '\n\n'), componentId ? 'component-prompt.md' : 'prompt.md');
}
