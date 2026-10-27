import type { SiteVariable, TokenKind } from '@dse/schema';
import { deltaE, parseCssColor } from '../color/parse';
import type { CaptureOutput } from '../stages/capture';
import { normalizeShadow } from './collect';

// Site variables (docs/specs/token-clustering.md, Site variables): the custom properties a site
// declares, and the names they give tokens before any generated name (D-082).

export const SITE_VAR_CAP = 400;
const ROOT_SITE_NAME = /^--[a-zA-Z][\w-]*$/;

/** Minified, hashed or framework-internal names never name a token (D-089). */
export function isHashedName(name: string): boolean {
  const bare = name.replace(/^--/, '');
  if (bare.includes('--')) return true;
  if (/^tw-/.test(bare)) return true;
  const last = bare.split('-').pop() ?? '';
  return last.length >= 6 && /[a-z]/i.test(last) && /\d/.test(last);
}

const propKind: [RegExp, TokenKind][] = [
  [/^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-start|-end)?)?-color|outline-color|text-decoration-color|caret-color|fill|stroke|accent-color|column-rule-color)$/, 'color'],
  [/^(padding|margin)(-(top|right|bottom|left|block|inline)(-start|-end)?)?$|^(gap|row-gap|column-gap)$/, 'space'],
  [/^border(-(top|bottom)-(left|right))?-radius$|^border-(start|end)-(start|end)-radius$/, 'radius'],
  [/^font-size$/, 'type'],
  [/^box-shadow$/, 'shadow'],
  [/^(transition|animation)-duration$/, 'duration'],
  [/^(transition|animation)-timing-function$/, 'easing'],
];

const isLength = (v: string) => /^-?\d*\.?\d+px$/.test(v.trim());
const isTime = (v: string) => /^\d*\.?\d+m?s$/.test(v.trim());
export const isEasing = (v: string) => /^(linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end)$|^(cubic-bezier|steps|linear)\(/.test(v.trim());
const isShadow = (v: string) => normalizeShadow(v) !== '' || shadowKey(v) !== '';

function shapeFits(kind: TokenKind, v: string): boolean {
  switch (kind) {
    case 'color':
      return parseCssColor(v) !== null;
    case 'space':
    case 'radius':
    case 'type':
    case 'breakpoint':
      return isLength(v);
    case 'shadow':
      return isShadow(v);
    case 'duration':
      return isTime(v);
    case 'easing':
      return isEasing(v);
  }
}

/** Kind from where the variable is used, checked against its value; else from the value alone. */
export function inferKind(name: string, resolved: string, usedBy: Map<string, number>): TokenKind | undefined {
  const votes = new Map<TokenKind, number>();
  for (const [prop, n] of usedBy) {
    let kind = propKind.find(([re]) => re.test(prop))?.[1];
    if (!kind && /^(transition|animation)$/.test(prop)) kind = isTime(resolved) ? 'duration' : isEasing(resolved) ? 'easing' : undefined;
    if (!kind && /^(background|border(-(top|right|bottom|left))?|outline)$/.test(prop) && parseCssColor(resolved)) kind = 'color';
    if (kind) votes.set(kind, (votes.get(kind) ?? 0) + n);
  }
  const ranked = [...votes].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  for (const k of ranked) if (shapeFits(k, resolved)) return k;
  if (/(breakpoint|screen|\bbp\b|-bp-)/i.test(name) && isLength(resolved)) return 'breakpoint';
  if (parseCssColor(resolved) && !/^(inherit|initial|unset|currentcolor)$/i.test(resolved)) return 'color';
  if (isEasing(resolved)) return 'easing';
  if (isTime(resolved)) return 'duration';
  return undefined;
}

const bump = (m: Map<string, number>, k: string, n = 1) => m.set(k, (m.get(k) ?? 0) + n);

/** Every custom property the site declares on its root, a theme or an element candidate that a kept declaration references. */
export function collectSiteVariables(capture: CaptureOutput): SiteVariable[] {
  type Acc = { name: string; value: string; resolved: string; scope: SiteVariable['scope']; usage: number; pages: Map<string, number>; usedBy: Map<string, number> };
  const acc = new Map<string, Acc>();
  const ensure = (name: string, value: string, resolved: string, scope: SiteVariable['scope']) => {
    const prev = acc.get(name);
    if (!prev) {
      const a: Acc = { name, value, resolved, scope, usage: 0, pages: new Map(), usedBy: new Map() };
      acc.set(name, a);
      return a;
    }
    // The root's declaration wins over a component's own.
    if (prev.scope === 'component' && scope !== 'component') Object.assign(prev, { value, resolved, scope });
    return prev;
  };
  const refs: { name: string; prop: string; pageId: string }[] = [];
  for (const pc of capture.pages) {
    if (pc.status !== 'captured') continue;
    for (const vc of Object.values(pc.viewports)) {
      if (!vc) continue;
      for (const v of vc.sheets.rootVars ?? []) ensure(v.name, v.value, v.resolved, v.scope);
      const matched = [vc.matched, ...vc.opens.map((o) => o.matched)];
      for (const m of matched) {
        for (const [d, styles] of Object.entries(m)) {
          const decls = [...styles.rules.flatMap((r) => r.declarations), ...styles.inline, ...styles.pseudo.flatMap((p) => p.rules.flatMap((r) => r.declarations))];
          for (const decl of decls) {
            if (decl.name.startsWith('--')) {
              const resolved = vc.markup[d]?.vars[decl.name] ?? '';
              ensure(decl.name, decl.value, resolved || decl.value, 'component');
            }
            for (const ref of decl.value.matchAll(/var\(\s*(--[\w-]+)/g)) refs.push({ name: ref[1]!, prop: decl.name, pageId: pc.page.id });
          }
        }
      }
      for (const mk of Object.values(vc.markup)) for (const [name, value] of Object.entries(mk.vars)) if (!acc.has(name) && value) ensure(name, value, value, 'component');
    }
  }
  for (const r of refs) {
    const a = acc.get(r.name);
    if (!a) continue;
    a.usage++;
    bump(a.pages, r.pageId);
    bump(a.usedBy, r.prop);
  }
  return [...acc.values()]
    .filter((a) => a.usage > 0 && ROOT_SITE_NAME.test(a.name))
    .sort((a, b) => b.usage - a.usage || a.name.localeCompare(b.name))
    .slice(0, SITE_VAR_CAP)
    .map((a) => {
      const resolved = a.resolved.trim();
      const kind = inferKind(a.name, resolved, a.usedBy);
      return {
        name: a.name,
        value: a.value,
        resolved,
        ...(kind ? { kind } : {}),
        hashed: isHashedName(a.name),
        usage: a.usage,
        pages: [...a.pages].map(([pageId, count]) => ({ pageId, count })).sort((x, y) => y.count - x.count || x.pageId.localeCompare(y.pageId)),
        scope: a.scope,
      };
    });
}

const kindPrefix: Partial<Record<TokenKind, RegExp>> = {
  color: /^(color|clr)-/,
  space: /^(space|spacing)-/,
  radius: /^radius-/,
  shadow: /^shadow-/,
  breakpoint: /^breakpoint-/,
};

/** The token name a site variable gives: without `--`, its kind's export prefix, and for type a trailing size word (D-089). */
export function siteTokenName(kind: TokenKind, variable: string): string | null {
  let n = variable.replace(/^--/, '');
  const prefix = kindPrefix[kind];
  if (prefix && prefix.test(n) && n.replace(prefix, '')) n = n.replace(prefix, '');
  if (kind === 'type') n = n.replace(/-(font-)?size$/, '') || n;
  return /^[a-zA-Z][\w-]*$/.test(n) ? n : null;
}

const msOf = (v: string) => (v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);

/** The usable names for one kind: not hashed, with a name a token can take, most used first. */
function candidatesOf(vars: SiteVariable[], kind: TokenKind) {
  return vars.filter((v) => v.kind === kind && !v.hashed && siteTokenName(kind, v.name) !== null).sort((a, b) => b.usage - a.usage || a.name.localeCompare(b.name));
}

/** Whether a variable's resolved value is a token's value, by the kind's rule (ΔE 1 for colors, exact otherwise). */
export function valueMatches(kind: TokenKind, resolved: string, value: string | number): boolean {
  switch (kind) {
    case 'color': {
      const a = parseCssColor(resolved);
      const b = parseCssColor(String(value));
      return Boolean(a && b && Math.abs(a.a - b.a) <= 0.02 && deltaE(a, b) <= 1);
    }
    case 'space':
    case 'radius':
    case 'type':
    case 'breakpoint':
      return isLength(resolved) && Math.abs(parseFloat(resolved) - Number(value)) < 0.01;
    case 'shadow':
      return shadowKey(resolved) !== '' && shadowKey(resolved) === shadowKey(String(value));
    case 'duration':
      return isTime(resolved) && Math.abs(msOf(resolved) - Number(value)) < 0.5;
    case 'easing':
      return normalizeEasingValue(resolved) === normalizeEasingValue(String(value));
  }
}

/** A shadow as its layers' parts, so a declared `0 1px 2px rgba(…)` equals the computed `rgba(…) 0px 1px 2px 0px`. */
export function shadowKey(value: string): string {
  if (!value || value.trim() === 'none') return '';
  const layers: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      layers.push(cur);
      cur = '';
    } else cur += ch;
  }
  layers.push(cur);
  return layers
    .map((layer) => {
      const colors = [...layer.matchAll(/(rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b|\b[a-z]+\b/gi)].map((m) => m[0]).filter((c) => c !== 'inset' && parseCssColor(c));
      const color = colors.length ? parseCssColor(colors[0]!) : null;
      const rest = layer.replace(/(rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi, ' ');
      const lengths = (rest.match(/-?\d*\.?\d+(px)?(?![\w%])/g) ?? []).map((n) => parseFloat(n));
      while (lengths.length < 4) lengths.push(0);
      if (!color || lengths.every((n) => n === 0)) return '';
      return `${/\binset\b/.test(layer) ? 'inset ' : ''}${lengths.slice(0, 4).join(' ')} ${color.r},${color.g},${color.b},${Math.round(color.a * 100)}`;
    })
    .filter(Boolean)
    .join(' | ');
}

export function normalizeEasingValue(v: string): string {
  return v
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(\d*\.\d*?)0+(?=[,)\s]|$)/g, '$1')
    .replace(/\.(?=[,)\s]|$)/g, '');
}

export type SiteNamed<T> = { token: T; variable: SiteVariable; name: string };

/**
 * For each token of one kind, the most used site variable whose value matches it. A variable names one
 * token; the others that resolve to a named token get `mapsTo` it. Returns the names given.
 */
export function applySiteNames<T extends { id?: string }>(kind: TokenKind, tokens: T[], valueOf: (t: T) => string | number, vars: SiteVariable[], idOf: (t: T) => string = (t) => t.id ?? ''): SiteNamed<T>[] {
  const out: SiteNamed<T>[] = [];
  const used = new Set<string>();
  const taken = new Set<string>();
  for (const t of tokens) {
    const hits = candidatesOf(vars, kind).filter((v) => valueMatches(kind, v.resolved, valueOf(t)));
    const first = hits.find((v) => !used.has(v.name) && !taken.has(siteTokenName(kind, v.name)!));
    if (!first) continue;
    used.add(first.name);
    const name = siteTokenName(kind, first.name)!;
    taken.add(name);
    out.push({ token: t, variable: first, name });
    for (const other of hits) if (other !== first && !other.mapsTo) other.mapsTo = idOf(t);
  }
  return out;
}

/** A generated name that a site name of the same kind already holds takes the collision letter (D-051, D-089). */
export function freeName(base: string, taken: Set<string>): string {
  let name = base;
  for (let n = 1; taken.has(name); n++) name = `${base}${String.fromCharCode(97 + n)}`;
  taken.add(name);
  return name;
}
