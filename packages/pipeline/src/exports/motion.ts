import { ordinalWords, type Component, type MotionPattern, type RunDocumentPartial } from '@dse/schema';
import { headerLine, meta, type ExportTokens } from './model';

// motion.css and motion.json (docs/specs/motion-capture.md, Exports).

/** A duration as this export's token variable when it has one, else in ms. */
export function durationRef(ms: number, t: ExportTokens): string {
  const d = t.durations.find((x) => x.ms === Math.round(ms));
  return d ? `var(${d.var})` : `${Math.round(ms)}ms`;
}

const norm = (v: string) => v.replace(/\s+/g, '').toLowerCase();

/** An easing as this export's token variable when it has one, else the value. */
export function easingRef(easing: string | null | undefined, tokenId: string | undefined, doc: RunDocumentPartial, t: ExportTokens): string {
  const fromId = tokenId ? t.refs.get(tokenId) : undefined;
  if (fromId) return `var(--${fromId})`;
  if (!easing) return '';
  const e = t.easings.find((x) => norm(x.value) === norm(easing));
  return e ? `var(${e.var})` : easing;
}

/** The run's most used easing token: the suggestion for a pattern whose easing was not recorded. */
export function suggestedEasing(t: ExportTokens): ExportTokens['easings'][number] | undefined {
  return t.easings[0];
}

/** The trigger in words for a comment or a list: the copy's phrases, lowercased for the middle of a line. */
export function triggerWords(p: MotionPattern): string {
  if (p.kind === 'loop') return `loops every ${Math.round(p.durationMs).toLocaleString('en-US')} ms`;
  switch (p.trigger.type) {
    case 'load':
      return 'on load';
    case 'in-view':
      return `when it enters the viewport at ${Math.round((p.trigger.value ?? 0) * 100)}% from the bottom`;
    case 'scroll':
      return p.kind === 'scrolled-header' ? `after ${p.trigger.value ?? 400} px of scrolling` : `over ${p.trigger.value ?? 1} viewport heights of scrolling`;
    case 'hover':
      return 'on hover';
    case 'open':
      return 'when it opens';
  }
}

/** Class names for each pattern: the keyframes or the component it belongs to, then its kind; repeats take an ordinal word. */
export function patternClasses(doc: RunDocumentPartial): Map<string, string> {
  const slugs = new Map((doc.components ?? []).map((c) => [c.id, c.slug]));
  const used = new Map<string, number>();
  const out = new Map<string, string>();
  for (const p of doc.motion?.patterns ?? []) {
    const base = `m-${p.keyframesName ?? (p.componentId && slugs.get(p.componentId) ? `${slugs.get(p.componentId)}-${p.kind}` : p.kind)}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    out.set(p.id, n === 1 ? base : `${base}-${ordinalWords[n - 2] ?? 'more'}`);
  }
  return out;
}

const declarations = (values: Record<string, string>) =>
  Object.entries(values)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');

function patternRule(p: MotionPattern, cls: string, doc: RunDocumentPartial, t: ExportTokens): string {
  const suggestion = suggestedEasing(t);
  const ease = p.easing ? easingRef(p.easing, p.easingTokenId, doc, t) : suggestion ? `var(${suggestion.var})` : 'ease';
  const duration = durationRef(p.durationMs, t);
  const notes = [p.kind === 'loop' ? triggerWords(p) : `add .${cls}-end ${triggerWords(p)}`];
  if (p.stagger) notes.push(`${p.stagger.count} items · ${p.stagger.stepMs} ms apart`);
  if (p.observed) notes.push(p.easing ? 'observed' : `observed · easing not recorded, nearest token suggested: ${suggestion?.name ?? 'ease'}`);
  if (p.source === 'inline-style') notes.push(`about ${Math.round(p.durationMs)} ms`);
  const comment = `/* ${notes.join(' · ')} */`;
  if (p.kind === 'loop' && p.keyframesName) return `${comment}\n.${cls} { animation: ${p.keyframesName} ${duration} ${ease} infinite; }`;
  const delay = p.delayMs ? ` ${Math.round(p.delayMs)}ms` : '';
  const transition = Object.keys(p.end)
    .map((prop) => `${prop} ${duration} ${ease}${delay}`)
    .join(', ');
  return `${comment}\n.${cls}-start { ${declarations(p.start)} }\n.${cls}-end { ${declarations(p.end)} transition: ${transition}; }`;
}

function componentRule(c: Component, doc: RunDocumentPartial, t: ExportTokens): string | null {
  const transitions = (c.motion?.transitions ?? []).filter((x, i, all) => all.findIndex((y) => y.property === x.property) === i);
  if (!transitions.length) return null;
  const list = transitions.map((x) => `${x.property} ${durationRef(x.durationMs, t)} ${easingRef(x.easing, x.easingTokenId, doc, t) || 'ease'}${x.delayMs ? ` ${Math.round(x.delayMs)}ms` : ''}`);
  return `.c-${c.slug} { transition: ${list.join(', ')}; }`;
}

export function motionCss(doc: RunDocumentPartial, t: ExportTokens): string {
  const root = [...t.durations.map((d) => `  ${d.var}: ${d.ms}ms;`), ...t.durations.filter((d) => d.role).map((d) => `  --duration-${d.role}: var(${d.var});`), ...t.easings.map((e) => `  ${e.var}: ${e.value};`)];
  const used = t.keyframes.filter((k) => k.used).map((k) => k.css);
  const unused = t.keyframes.filter((k) => !k.used).map((k) => k.css);
  const classes = patternClasses(doc);
  const parts = [
    `/* ${headerLine(doc, t.set)} */`,
    root.length ? `:root {\n${root.join('\n')}\n}` : '',
    used.join('\n'),
    unused.length ? `/* Unused keyframes */\n${unused.join('\n')}` : '',
    (doc.components ?? []).map((c) => componentRule(c, doc, t)).filter(Boolean).join('\n'),
    (doc.motion?.patterns ?? []).map((p) => patternRule(p, classes.get(p.id)!, doc, t)).join('\n\n'),
  ].filter(Boolean);
  return `${parts.join('\n\n')}\n`;
}

export function motionJson(doc: RunDocumentPartial, t: ExportTokens) {
  return {
    $meta: meta(doc, t.set),
    durations: t.durations.map((d) => ({ name: d.name, ms: d.ms, ...(d.role ? { role: d.role } : {}) })),
    easings: t.easings.map((e) => ({ name: e.name, value: e.value })),
    keyframes: t.keyframes,
    patterns: doc.motion?.patterns ?? [],
    components: (doc.components ?? []).filter((c) => c.motion).map((c) => ({ id: c.id, name: c.name, slug: c.slug, ...c.motion! })),
  };
}
