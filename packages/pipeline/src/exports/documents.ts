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

/** Snippet caps in the whole-system documents; a component's own prompt keeps all of its code (D-069). */
export const SNIPPET_CAP = { html: 3000, css: 4000 } as const;
/** The component CSS a whole-system prompt carries in all, in grid order. */
export const PROMPT_CODE_BUDGET = 48_000;

/** Code cut at a tag or declaration boundary under the cap, with a comment naming what was kept. */
export function shorten(code: string, lang: 'html' | 'css', cap: number = SNIPPET_CAP[lang]): string {
  const body = code.trim();
  if (body.length <= cap) return body;
  const head = body.slice(0, cap);
  const cut = Math.max(head.lastIndexOf('\n'), lang === 'css' ? Math.max(head.lastIndexOf('; '), head.lastIndexOf('}')) + 1 : head.lastIndexOf('>') + 1);
  const kept = head.slice(0, cut > cap / 2 ? cut : cap).trimEnd();
  const note = `shortened · ${kept.length.toLocaleString('en-US')} of ${body.length.toLocaleString('en-US')} characters · the component's own prompt has all of it`;
  return lang === 'css' ? `${kept}\n/* ${note} */` : `${kept}\n<!-- ${note} -->`;
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
  if (c.code.html) lines.push('', fence(shorten(c.code.html, 'html'), 'html'));
  if (c.code.css) lines.push('', fence(shorten(c.code.css, 'css'), 'css'));
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

function contract(c: Component, names: Map<string, string>, css: string | null): string {
  const captured = c.states.filter((s) => s.captured && s.state !== 'default');
  return [
    `### ${c.name}`,
    '',
    `${componentTypeLabels[c.type]}. Variants: ${c.variants.map((v) => v.name).join(', ')}.`,
    `States: ${['Default', ...captured.map((s) => stateLabels[s.state])].join(', ')}.`,
    ...captured.filter((s) => s.delta.length).map((s) => `- ${stateLabels[s.state]}: ${s.delta.map((x) => `${x.property} ${x.to}`).join('; ')}`),
    `Tokens: ${c.tokensUsed.map((u) => `${names.get(u.tokenId) ?? u.tokenId} for ${u.property}`).join(', ') || 'none'}.`,
    ...(css ? ['', fence(css, 'css')] : []),
  ].join('\n');
}

/** Contracts with their CSS: all of it for one component; for the whole system, shortened and within a budget (D-069). */
function contracts(comps: Component[], names: Map<string, string>, single: boolean): string[] {
  let left = PROMPT_CODE_BUDGET;
  let spent = false;
  const out = comps.flatMap((c) => {
    if (single) return [contract(c, names, c.code.css || null), ''];
    const css = c.code.css ? shorten(c.code.css, 'css') : '';
    const fits = Boolean(css) && css.length <= left;
    if (fits) left -= css.length;
    else if (css) spent = true;
    return [contract(c, names, fits ? css : null), ''];
  });
  return spent ? [...out, 'Code for the components above without a CSS block is in each component\'s own prompt.', ''] : out;
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
    ...contracts(comps, names, Boolean(componentId)),
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
