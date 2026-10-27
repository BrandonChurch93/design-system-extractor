import type { TokensJson } from '@dse/schema';
import { hexOf, parseCssColor } from '../color/parse';
import { bezierOf } from '../tokens/easing-table';
import { headerLine, meta, type ExportTokens } from './model';
import type { RunDocumentPartial } from '@dse/schema';

// tokens.css, tokens.json, tailwind.tokens.js and tokens.w3c.json from one token model.

const px = (n: number) => `${n}px`;
const quoteFamily = (f: string) => (/^[\w-]+$/.test(f) && !/^\d/.test(f) ? f : `'${f.replace(/'/g, "\\'")}'`);

/** The site variables block: the custom properties the code may name that no token declares (D-083). */
export function siteVariablesBlock(t: ExportTokens): string {
  if (!t.siteVariables.length) return '';
  return `/* Site variables, resolved */\n:root {\n${t.siteVariables.map((v) => `  ${v.name}: ${v.value};`).join('\n')}\n}\n`;
}

/** The token groups of tokens.css in order, without the header (the prompt and design-system.md embed them). */
export function tokenBlock(t: ExportTokens): string {
  const groups: string[][] = [
    t.colors.map((c) => `  ${c.var}: ${c.value};`),
    t.overlays.map((o) => `  ${o.var}: ${o.value};`),
    t.fonts.map((f) => `  --font-${f.name}: ${f.stack.map(quoteFamily).join(', ')};`),
    t.type.flatMap((x) => [`  --type-${x.name}-size: ${px(x.size)};`, `  --type-${x.name}-line: ${px(x.lineHeight)};`, `  --type-${x.name}-weight: ${x.weight};`, ...(x.letterSpacing ? [`  --type-${x.name}-tracking: ${px(x.letterSpacing)};`] : [])]),
    t.space.map((s) => `  ${s.var}: ${px(s.value)};`),
    t.radius.map((r) => `  ${r.var}: ${px(r.value)};`),
    t.shadow.map((s) => `  ${s.var}: ${s.value};`),
    [...t.durations.map((d) => `  ${d.var}: ${d.ms}ms;`), ...t.durations.filter((d) => d.role).map((d) => `  --duration-${d.role}: var(${d.var});`)],
    t.easings.map((e) => `  ${e.var}: ${e.value};`),
    t.breakpoints.map((b) => `  ${b.var}: ${px(b.value)};`),
  ].filter((g) => g.length);
  return `:root {\n${groups.map((g) => g.join('\n')).join('\n\n')}\n}\n`;
}

export function tokensCss(doc: RunDocumentPartial, t: ExportTokens): string {
  const site = siteVariablesBlock(t);
  return `/* ${headerLine(doc, t.set)} */\n${tokenBlock(t)}${site ? `\n${site}` : ''}`;
}

export function tokensJson(doc: RunDocumentPartial, t: ExportTokens): TokensJson {
  return {
    $meta: meta(doc, t.set),
    color: Object.fromEntries(t.colors.map((c) => [c.name, { value: c.value, group: c.group, usage: c.usage }])),
    overlays: Object.fromEntries(t.overlays.map((o) => [o.name, { value: o.value, base: o.base, alpha: o.alpha }])),
    type: Object.fromEntries(t.type.map((x) => [x.name, { family: x.family, size: px(x.size), lineHeight: px(x.lineHeight), weight: x.weight, letterSpacing: px(x.letterSpacing) }])),
    font: Object.fromEntries(t.fonts.map((f) => [f.name, f.stack.map(quoteFamily).join(', ')])),
    space: t.space.map((s) => s.value),
    radius: Object.fromEntries(t.radius.map((r) => [r.name.replace(/^radius-/, ''), px(r.value)])),
    shadow: Object.fromEntries(t.shadow.map((s) => [s.name.replace(/^shadow-/, ''), s.value])),
    duration: Object.fromEntries(t.durations.map((d) => [d.name, { value: `${d.ms}ms`, ...(d.role ? { role: d.role } : {}) }])),
    easing: Object.fromEntries(t.easings.map((e) => [e.name, e.value])),
    keyframes: Object.fromEntries(t.keyframes.map((k) => [k.name, { css: k.css, used: k.used }])),
    breakpoints: t.breakpoints.map((b) => b.value),
    siteVariables: Object.fromEntries(t.siteVariables.map((v) => [v.name, { value: v.value, ...(v.kind ? { kind: v.kind } : {}) }])),
  };
}

/** Hue-step names nest (`blue-600` → colors.blue[600]); semantic names stay flat. */
function tailwindColors(t: ExportTokens): Record<string, string | Record<string, string>> {
  const out: Record<string, string | Record<string, string>> = {};
  for (const c of t.colors) {
    const [head, ...rest] = c.name.split('-');
    if (c.group === 'semantic' || !rest.length) {
      out[c.name] = c.value;
      continue;
    }
    const group = out[head!];
    const nested = typeof group === 'object' ? group : {};
    if (typeof group === 'string') nested.DEFAULT = group;
    nested[rest.join('-')] = c.value;
    out[head!] = nested;
  }
  return out;
}

/** A keyframes block as the object Tailwind's theme takes: `{ from: { opacity: '0' }, to: { … } }`. */
export function keyframesObject(css: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const body = css.slice(css.indexOf('{') + 1, css.lastIndexOf('}'));
  for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls: Record<string, string> = {};
    for (const d of m[2]!.split(';')) {
      const i = d.indexOf(':');
      if (i > 0) decls[d.slice(0, i).trim()] = d.slice(i + 1).trim();
    }
    out[m[1]!.trim()] = decls;
  }
  return out;
}

/** The most common duration and easing each keyframes block runs with, from the patterns and the components. */
export function animationOf(doc: RunDocumentPartial, name: string): string | null {
  const votes = new Map<string, number>();
  const vote = (ms: number, easing: string, infinite: boolean) => {
    const k = `${name} ${Math.round(ms)}ms ${easing}${infinite ? ' infinite' : ''}`;
    votes.set(k, (votes.get(k) ?? 0) + 1);
  };
  for (const p of doc.motion?.patterns ?? []) if (p.keyframesName === name) vote(p.durationMs, p.easing ?? 'ease', p.iterations === 'infinite');
  const easings = new Map((doc.tokens?.easing ?? []).map((e) => [e.id, e.value]));
  for (const c of doc.components ?? []) for (const a of c.motion?.animations ?? []) if (a.keyframesName === name) vote(a.durationMs, a.easing ?? easings.get(a.easingTokenId ?? '') ?? 'ease', a.iterations === 'infinite');
  return [...votes].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

/** An overlay's Tailwind key: `white/8` on white or black, else `{base}/{alpha}` under the base's hue. */
function overlayKey(o: ExportTokens['overlays'][number], t: ExportTokens): string {
  const pct = Math.round(o.alpha * 100);
  if (o.base === 'white' || o.base === 'black') return `${o.base}/${pct}`;
  const base = o.name.replace(new RegExp(`-${pct}$`), '');
  return t.colors.some((c) => c.name === base) ? `${base}/${pct}` : `${o.name}`;
}

export function tailwindTokens(doc: RunDocumentPartial, t: ExportTokens): string {
  const colors = tailwindColors(t);
  for (const o of t.overlays) {
    const key = overlayKey(o, t);
    const [head, ...rest] = key.split('-');
    const group = colors[head!];
    if (rest.length && typeof group === 'object') group[rest.join('-')] = o.value;
    else colors[key] = o.value;
  }
  const used = t.keyframes.filter((k) => k.used);
  const theme = {
    colors,
    fontFamily: Object.fromEntries(t.fonts.map((f) => [f.name, f.stack])),
    fontSize: Object.fromEntries(t.type.map((x) => [x.name, [px(x.size), { lineHeight: px(x.lineHeight), fontWeight: String(x.weight), ...(x.letterSpacing ? { letterSpacing: px(x.letterSpacing) } : {}) }]])),
    spacing: Object.fromEntries(t.space.map((s) => [String(s.value), px(s.value)])),
    borderRadius: Object.fromEntries(t.radius.map((r) => [r.name.replace(/^radius-/, ''), px(r.value)])),
    boxShadow: Object.fromEntries(t.shadow.map((s) => [s.name.replace(/^shadow-/, ''), s.value])),
    transitionDuration: Object.fromEntries([...t.durations.map((d) => [d.name.replace(/^duration-/, ''), `${d.ms}ms`]), ...t.durations.filter((d) => d.role).map((d) => [d.role!, `${d.ms}ms`])]),
    transitionTimingFunction: Object.fromEntries(t.easings.map((e) => [e.name.replace(/^ease-/, ''), e.value])),
    keyframes: Object.fromEntries(used.map((k) => [k.name, keyframesObject(k.css)])),
    animation: Object.fromEntries(used.flatMap((k) => {
      const a = animationOf(doc, k.name);
      return a ? [[k.name, a]] : [];
    })),
    screens: Object.fromEntries(t.breakpoints.map((b) => [b.name.replace(/^breakpoint-/, ''), px(b.value)])),
  };
  return `/* ${headerLine(doc, t.set)} */\nmodule.exports = ${JSON.stringify({ theme: { extend: theme } }, null, 2)};\n`;
}

type W3cShadow = { color: string; offsetX: string; offsetY: string; blur: string; spread: string; inset?: boolean };

/** A normalized box-shadow ("0px 1px 2px 0px #0B1F3A1F, …") as DTCG shadow values. */
export function w3cShadow(value: string): W3cShadow | W3cShadow[] {
  const layers = value.split(/,\s*(?![^()]*\))/).map((layer) => {
    const inset = /\binset\b/.test(layer);
    const color = /#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\)/.exec(layer)?.[0] ?? '#000000';
    const [x = '0px', y = '0px', blur = '0px', spread = '0px'] = layer.replace(color, '').replace('inset', '').trim().split(/\s+/);
    return { color, offsetX: x, offsetY: y, blur, spread, ...(inset ? { inset } : {}) };
  });
  return layers.length === 1 ? layers[0]! : layers;
}

/** A color with alpha as the 8-digit hex the DTCG color type takes. */
function hex8(value: string): string {
  const c = parseCssColor(value);
  return c ? hexOf(c) : value;
}

/** The DTCG format (2024 draft): groups by kind, `$type` and `$value` per token. */
export function w3cTokens(doc: RunDocumentPartial, t: ExportTokens) {
  const tok = <T>(type: string, value: T, description?: string) => ({ $type: type, $value: value, ...(description ? { $description: description } : {}) });
  const easing = (e: ExportTokens['easings'][number]) => {
    const b = bezierOf(e.value);
    return b ? tok('cubicBezier', b) : tok('string', e.value, 'The DTCG format has no type for steps() or linear() easings; the value is the CSS timing function.');
  };
  return {
    $description: headerLine(doc, t.set),
    $extensions: { 'app.design-system-extractor': meta(doc, t.set) },
    color: Object.fromEntries(t.colors.map((c) => [c.name, tok('color', c.value, `${c.name} · ${c.usage} uses`)])),
    overlay: Object.fromEntries(t.overlays.map((o) => [o.name, tok('color', hex8(o.value), `${o.base} at ${Math.round(o.alpha * 100)}%`)])),
    fontFamily: Object.fromEntries(t.fonts.map((f) => [f.name, tok('fontFamily', f.stack)])),
    typography: Object.fromEntries(t.type.map((x) => [x.name, tok('typography', { fontFamily: x.family, fontSize: px(x.size), fontWeight: x.weight, lineHeight: px(x.lineHeight), letterSpacing: px(x.letterSpacing) })])),
    space: Object.fromEntries(t.space.map((s) => [s.name, tok('dimension', px(s.value))])),
    radius: Object.fromEntries(t.radius.map((r) => [r.name, tok('dimension', px(r.value))])),
    shadow: Object.fromEntries(t.shadow.map((s) => [s.name, tok('shadow', w3cShadow(s.value))])),
    duration: Object.fromEntries(t.durations.map((d) => [d.name, tok('duration', { value: d.ms, unit: 'ms' }, d.role)])),
    easing: Object.fromEntries(t.easings.map((e) => [e.name, easing(e)])),
    breakpoint: Object.fromEntries(t.breakpoints.map((b) => [b.name, tok('dimension', px(b.value))])),
  };
}
