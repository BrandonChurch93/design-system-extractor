import type { TokensJson } from '@dse/schema';
import { headerLine, meta, type ExportTokens } from './model';
import type { RunDocumentPartial } from '@dse/schema';

// tokens.css, tokens.json, tailwind.tokens.js and tokens.w3c.json from one token model.

const px = (n: number) => `${n}px`;
const quoteFamily = (f: string) => (/^[\w-]+$/.test(f) && !/^\d/.test(f) ? f : `'${f.replace(/'/g, "\\'")}'`);

export function tokensCss(doc: RunDocumentPartial, t: ExportTokens): string {
  const groups: string[][] = [
    t.colors.map((c) => `  --color-${c.name}: ${c.value};`),
    t.fonts.map((f) => `  --font-${f.name}: ${f.stack.map(quoteFamily).join(', ')};`),
    t.type.flatMap((x) => [`  --type-${x.name}-size: ${px(x.size)};`, `  --type-${x.name}-line: ${px(x.lineHeight)};`, `  --type-${x.name}-weight: ${x.weight};`, ...(x.letterSpacing ? [`  --type-${x.name}-tracking: ${px(x.letterSpacing)};`] : [])]),
    t.space.map((s) => `  --${s.name}: ${px(s.value)};`),
    t.radius.map((r) => `  --${r.name}: ${px(r.value)};`),
    t.shadow.map((s) => `  --${s.name}: ${s.value};`),
    t.breakpoints.map((b) => `  --${b.name}: ${px(b.value)};`),
  ].filter((g) => g.length);
  return `/* ${headerLine(doc, t.set)} */\n:root {\n${groups.map((g) => g.join('\n')).join('\n\n')}\n}\n`;
}

export function tokensJson(doc: RunDocumentPartial, t: ExportTokens): TokensJson {
  return {
    $meta: meta(doc, t.set),
    color: Object.fromEntries(t.colors.map((c) => [c.name, { value: c.value, group: c.group, usage: c.usage }])),
    type: Object.fromEntries(t.type.map((x) => [x.name, { family: x.family, size: px(x.size), lineHeight: px(x.lineHeight), weight: x.weight, letterSpacing: px(x.letterSpacing) }])),
    font: Object.fromEntries(t.fonts.map((f) => [f.name, f.stack.map(quoteFamily).join(', ')])),
    space: t.space.map((s) => s.value),
    radius: Object.fromEntries(t.radius.map((r) => [r.name.replace(/^radius-/, ''), px(r.value)])),
    shadow: Object.fromEntries(t.shadow.map((s) => [s.name.replace(/^shadow-/, ''), s.value])),
    breakpoints: t.breakpoints.map((b) => b.value),
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

export function tailwindTokens(doc: RunDocumentPartial, t: ExportTokens): string {
  const theme = {
    colors: tailwindColors(t),
    fontFamily: Object.fromEntries(t.fonts.map((f) => [f.name, f.stack])),
    fontSize: Object.fromEntries(t.type.map((x) => [x.name, [px(x.size), { lineHeight: px(x.lineHeight), fontWeight: String(x.weight), ...(x.letterSpacing ? { letterSpacing: px(x.letterSpacing) } : {}) }]])),
    spacing: Object.fromEntries(t.space.map((s) => [String(s.value), px(s.value)])),
    borderRadius: Object.fromEntries(t.radius.map((r) => [r.name.replace(/^radius-/, ''), px(r.value)])),
    boxShadow: Object.fromEntries(t.shadow.map((s) => [s.name.replace(/^shadow-/, ''), s.value])),
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

/** The DTCG format (2024 draft): groups by kind, `$type` and `$value` per token. */
export function w3cTokens(doc: RunDocumentPartial, t: ExportTokens) {
  const tok = <T>(type: string, value: T, description?: string) => ({ $type: type, $value: value, ...(description ? { $description: description } : {}) });
  return {
    $description: headerLine(doc, t.set),
    $extensions: { 'app.design-system-extractor': meta(doc, t.set) },
    color: Object.fromEntries(t.colors.map((c) => [c.name, tok('color', c.value, `${c.name} · ${c.usage} uses`)])),
    fontFamily: Object.fromEntries(t.fonts.map((f) => [f.name, tok('fontFamily', f.stack)])),
    typography: Object.fromEntries(t.type.map((x) => [x.name, tok('typography', { fontFamily: x.family, fontSize: px(x.size), fontWeight: x.weight, lineHeight: px(x.lineHeight), letterSpacing: px(x.letterSpacing) })])),
    space: Object.fromEntries(t.space.map((s) => [s.name, tok('dimension', px(s.value))])),
    radius: Object.fromEntries(t.radius.map((r) => [r.name, tok('dimension', px(r.value))])),
    shadow: Object.fromEntries(t.shadow.map((s) => [s.name, tok('shadow', w3cShadow(s.value))])),
    breakpoint: Object.fromEntries(t.breakpoints.map((b) => [b.name, tok('dimension', px(b.value))])),
  };
}
