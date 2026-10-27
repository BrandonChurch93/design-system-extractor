import { checkLabels, componentTypeLabels, durationRoleLabels, motionKindLabels, stateLabels, type Component, type MotionPattern, type RunDocumentPartial } from '@dse/schema';
import { assertVoice, byTier, exportTokens, runDate, tokenRef, type ExportTokens } from './model';
import { triggerWords } from './motion';
import { componentCss } from './substitute';
import { siteVariablesBlock, tokenBlock } from './tokens';
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

/** A component's token lines name the tokens of this export's set (D-083). */
function usedLine(c: Component, t: ExportTokens, joiner: (name: string, property: string) => string): string[] {
  return c.tokensUsed.flatMap((u) => {
    const ref = tokenRef(t, u.tokenId);
    return ref ? [joiner(ref, u.property)] : [];
  });
}

/** The Default line's template (docs/design/copy.md); a part whose value is absent is left out. */
export const DEFAULT_LINE = 'Default: background {token} · text {token} · border {width} {token} · radius {value} · padding {values} · font {token} · shadow {token}';

export function defaultLine(c: Component, t: ExportTokens): string {
  const val = (property: string) => {
    const u = c.tokensUsed.find((x) => x.property === property);
    const ref = u ? tokenRef(t, u.tokenId) : null;
    return ref ?? c.unmapped.find((x) => x.property === property)?.value ?? null;
  };
  const pads = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'].map(val);
  const values = [val('background-color'), val('color'), val('border-color'), val('border-radius'), pads.some(Boolean) ? pads.map((p) => p ?? '0px').join(' ') : null, val('font'), val('box-shadow')];
  const [head, ...rest] = DEFAULT_LINE.split(': ');
  const parts = rest
    .join(': ')
    .split(' · ')
    .flatMap((part, i) => (values[i] ? [part.replace('{width}', `${c.borderWidth ?? 1}px`).replace(/\{(token|value|values)\}/, values[i]!)] : []));
  return parts.length ? `${head}: ${parts.join(' · ')}` : `${head}: ${DEFAULT_LINE.split(': ')[1]!.split(' · ')[0]!.replace(' {token}', '')} none`;
}

/** `Motion: hover · background-color · 160 ms · ease-out-quad; …`, or `Motion: none`. */
export function motionLine(c: Component, t: ExportTokens): string {
  const m = c.motion;
  if (!m) return 'Motion: none';
  const ease = (id: string | undefined, value: string | undefined) => (id && tokenRef(t, id)) || value || 'ease';
  const parts = [
    ...m.transitions.map((x) => `${x.state} · ${x.property} · ${Math.round(x.durationMs)} ms · ${ease(x.easingTokenId, x.easing)}${x.delayMs ? ` · ${Math.round(x.delayMs)} ms delay` : ''}`),
    ...m.animations.map((a) => `${a.keyframesName} · ${Math.round(a.durationMs)} ms · ${ease(a.easingTokenId, a.easing)}${a.iterations === 'infinite' ? ' · loops' : ''}`),
  ];
  if (m.patternIds.length) parts.push(`${m.patternIds.length} motion pattern${m.patternIds.length === 1 ? '' : 's'} in the Motion section`);
  return `Motion: ${parts.join('; ') || 'none'}`;
}

function componentSection(c: Component, t: ExportTokens, depth = 3): string {
  const h = '#'.repeat(depth);
  const captured = c.states.filter((s) => s.captured).map((s) => stateLabels[s.state]);
  const applicable = c.checks.filter((r) => r.status !== 'na');
  const passed = applicable.filter((r) => r.status === 'pass').length;
  const css = componentCss(c, t);
  const lines = [
    `${h} ${c.name}`,
    '',
    `${componentTypeLabels[c.type]} · ${c.variants.length} variant${c.variants.length === 1 ? '' : 's'}: ${c.variants.map((v) => v.name).join(', ')}`,
    `States captured: ${captured.join(', ') || 'none'}`,
    `Tokens used: ${usedLine(c, t, (n, p) => `${n} (${p})`).join(', ') || 'none'}`,
    ...(c.unmapped.length ? [`Unmapped: ${c.unmapped.map((u) => `${u.property} ${u.value}`).join(', ')}`] : []),
    motionLine(c, t),
    `Checks: ${passed} of ${applicable.length}`,
    ...applicable.map((r) => `- ${checkLabels[r.check]} · ${r.status === 'pass' ? 'pass' : 'fail'} · ${r.detail}`),
    '',
    DISCLAIMER,
  ];
  if (c.code.html) lines.push('', fence(shorten(c.code.html, 'html'), 'html'));
  if (css) lines.push('', fence(shorten(css, 'css'), 'css'));
  if (!c.code.html && !css) lines.push('', defaultLine(c, t));
  return lines.join('\n');
}

const ms = (n: number) => `${Math.round(n).toLocaleString('en-US')} ms`;

/** A pattern in words: kind, where, trigger, what changes, timing. */
export function patternWords(p: MotionPattern, doc: RunDocumentPartial, t: ExportTokens): string {
  const names = new Map((doc.components ?? []).map((c) => [c.id, c.name]));
  const where = p.componentId && names.get(p.componentId) ? names.get(p.componentId)! : p.selector;
  const change = Object.keys(p.end)
    .map((k) => `${k} ${p.start[k]} → ${p.end[k]}`)
    .join(', ');
  const suggestion = t.easings[0]?.name;
  const easing = p.easing ? ((p.easingTokenId && tokenRef(t, p.easingTokenId)) || p.easing) : `easing not recorded, nearest token suggested: ${suggestion ?? 'ease'}`;
  const duration = p.source === 'inline-style' ? `about ${Math.round(p.durationMs)} ms` : ms(p.durationMs);
  return [
    `${motionKindLabels[p.kind]} · ${where} · ${triggerWords(p)}`,
    change,
    `${duration} · ${easing}`,
    ...(p.stagger ? [`${p.stagger.count} items · ${p.stagger.stepMs} ms apart`] : []),
    ...(p.observed ? ['observed'] : []),
  ].join(' · ');
}

function motionSection(doc: RunDocumentPartial, t: ExportTokens, prompt: boolean): string[] {
  const out: string[] = ['## Motion', ''];
  if (!t.durations.length && !t.easings.length && !t.keyframes.length && !(doc.motion?.patterns ?? []).length) return [...out, 'No transitions or animations found.'];
  if (t.durations.length) out.push(prompt ? 'Durations:' : '### Durations', '', table(['Name', 'Value', 'Role'], t.durations.map((d) => [d.name, `${d.ms} ms`, d.role ? durationRoleLabels[d.role as keyof typeof durationRoleLabels] : ''])), '');
  if (t.easings.length) out.push(prompt ? 'Easings:' : '### Easings', '', table(['Name', 'Value'], t.easings.map((e) => [e.name, e.value])), '');
  if (t.keyframes.length) out.push(prompt ? 'Keyframes:' : '### Keyframes', '', fence(t.keyframes.map((k) => (k.used ? k.css : `/* unused */ ${k.css}`)).join('\n'), 'css'), '');
  const patterns = doc.motion?.patterns ?? [];
  if (patterns.length) out.push(prompt ? 'Patterns:' : '### Patterns', '', ...patterns.map((p) => `- ${patternWords(p, doc, t)}`), '');
  return out;
}

function siteVariablesSection(t: ExportTokens): string[] {
  const block = siteVariablesBlock(t);
  return ['## Site variables', '', block ? fence(block, 'css') : 'The site declares no variables beyond the tokens.'];
}

function tokenSections(t: ExportTokens, doc: RunDocumentPartial): string[] {
  const base = doc.tokens?.spaceBase;
  return [
    '## Palette',
    '',
    table(['Name', 'Value', 'Group', 'Uses'], t.colors.map((c) => [c.name, c.value, c.group, c.usage])),
    '',
    '## Overlays',
    '',
    t.overlays.length ? table(['Name', 'Base', 'Alpha', 'Value'], t.overlays.map((o) => [o.name, o.base, `${Math.round(o.alpha * 100)}%`, o.value])) : 'No translucent colors.',
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
    ...motionSection(doc, t, false),
    '',
    '## Breakpoints',
    '',
    ...t.breakpoints.map((b) => `- ${b.name}: ${b.value}px`),
    '',
    // The variables the component code names are declared here, so every var() resolves (D-083, D-090).
    '## Tokens as CSS',
    '',
    fence(tokenBlock(t), 'css'),
    '',
    ...siteVariablesSection(t),
  ];
}

export function designSystemMd(doc: RunDocumentPartial, set: ExportSet): string {
  const t = exportTokens(doc, set);
  const d = doc.drift;
  const { core, page } = byTier(doc.components ?? []);
  const out = [
    `# ${doc.host} design system`,
    '',
    doc.exports?.designSystemIntro ?? '',
    '',
    ...tokenSections(t, doc),
    '',
    '## Core components',
    '',
    ...(core.length ? core.flatMap((c) => [componentSection(c, t), '']) : ['None.', '']),
    '## Page-specific components',
    '',
    ...(page.length ? page.flatMap((c) => [componentSection(c, t), '']) : ['None.', '']),
    '## Drift',
    '',
    d?.headline.sentence ?? '',
    '',
    ...(d?.numbers ?? []).map((n) => `- ${n.before} → ${n.after} ${n.kind}: ${n.caption}`),
    ...(d
      ? [
          '',
          `Proposed set: ${d.proposal.colors.length} colors, ${d.proposal.spacing.length} spacing steps, ${d.proposal.type.length} type styles, ${d.proposal.durations.length} durations, ${d.proposal.easings.length} easings. ${d.proposal.contrastKept ? 'Every proposed pair keeps or improves its contrast ratio on the surfaces it is used on.' : 'Some pairs could not keep their contrast ratio.'}`,
          '',
          d.narrative,
        ]
      : []),
    '',
    '## How this was made',
    '',
    `Extracted by Design System Extractor from ${doc.host} in run ${doc.id} on ${runDate(doc)}. Tokens, motion, components and checks are measured from the rendered pages; motion marked observed was measured at runtime. The introduction and the drift narrative were written by a model from those measurements. Tokens shown are the ${set} set.`,
    '',
  ];
  return assertProse(out.join('\n').replace(/\n{3,}/g, '\n\n'), 'design-system.md');
}

function contract(c: Component, t: ExportTokens, css: string | null): string {
  const captured = c.states.filter((s) => s.captured && s.state !== 'default');
  return [
    `### ${c.name}`,
    '',
    `${componentTypeLabels[c.type]}. Variants: ${c.variants.map((v) => v.name).join(', ')}.`,
    `States: ${['Default', ...captured.map((s) => stateLabels[s.state])].join(', ')}.`,
    ...captured.filter((s) => s.delta.length).map((s) => `- ${stateLabels[s.state]}: ${s.delta.map((x) => `${x.property} ${x.to}${x.transition ? ` (${Math.round(x.transition.durationMs)} ms)` : ''}`).join('; ')}`),
    `Tokens: ${usedLine(c, t, (n, p) => `${n} for ${p}`).join(', ') || 'none'}.`,
    defaultLine(c, t),
    motionLine(c, t),
    ...(css ? ['', fence(css, 'css')] : []),
  ].join('\n');
}

/** Contracts with their CSS: all of it for one component; for the whole system, shortened and within a budget (D-069). */
function contracts(comps: Component[], t: ExportTokens, single: boolean, withCode = true): string[] {
  let left = PROMPT_CODE_BUDGET;
  let spent = false;
  const out = comps.flatMap((c) => {
    const full = componentCss(c, t);
    if (single) return [contract(c, t, full || null), ''];
    if (!withCode) return [contract(c, t, null), ''];
    const css = full ? shorten(full, 'css') : '';
    const fits = Boolean(css) && css.length <= left;
    if (fits) left -= css.length;
    else if (css) spent = true;
    return [contract(c, t, fits ? css : null), ''];
  });
  return spent ? [...out, 'Code for the components above without a CSS block is in each component\'s own prompt.', ''] : out;
}

/** Page-specific components carry their code in the whole-system prompt only on a small run (D-085). */
export const PROMPT_PAGE_CODE_MAX = 12;

/** The prompt for the whole system, or for one component (`componentId`). */
export function promptMd(doc: RunDocumentPartial, set: ExportSet, runUrl: string, componentId?: string): string {
  const t = exportTokens(doc, set);
  const all = doc.components ?? [];
  const comps = all.filter((c) => !componentId || c.id === componentId);
  if (componentId && !comps.length) throw new Error(`no component ${componentId}`);
  const { core, page } = byTier(comps);
  const site = siteVariablesSection(t);
  const out = [
    PROMPT_OPENING,
    '',
    '## Tokens',
    '',
    fence(tokenBlock(t), 'css'),
    '',
    '## Type scale',
    '',
    table(['Name', 'Size', 'Line height', 'Weight', 'Family'], t.type.map((x) => [x.name, `${x.size}px`, `${x.lineHeight}px`, x.weight, x.family])),
    '',
    ...motionSection(doc, t, true),
    '',
    ...site,
    '',
    ...(componentId
      ? ['## Component', '', ...contracts(comps, t, true)]
      : [
          '## Core components',
          '',
          ...(core.length ? contracts(core, t, false) : ['None.', '']),
          '## Page-specific components',
          '',
          ...(page.length ? contracts(page, t, false, all.length <= PROMPT_PAGE_CODE_MAX) : ['None.', '']),
        ]),
    '## Rules',
    '',
    '- Use only these tokens. Do not invent colors, sizes, spacing, radii or shadows.',
    '- Keep every text and background pair at the contrast ratio it has here.',
    '- Match each component contract, including its states.',
    '- Use only these durations and easings. Apply the entrance and scroll patterns to the equivalent elements of what you build; patterns marked observed were measured at runtime and their easing is the nearest token when none was recorded.',
    '- No em dashes in any copy you write.',
    '',
    `Source: ${runUrl}`,
    '',
  ];
  return assertProse(out.join('\n').replace(/\n{3,}/g, '\n\n'), componentId ? 'component-prompt.md' : 'prompt.md');
}
