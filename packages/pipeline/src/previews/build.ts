import { JSDOM } from 'jsdom';
import type { MatchedRule, MatchedStyles } from '../capture/matched-css';
import type { SnapElement, Snapshot } from '../capture/snapshot';
import { CSS_CAP_BYTES, GOOGLE_FONTS_CSS, GOOGLE_FONTS_FILES } from './constants';
import { sanitizeDeclaration, sanitizeMarkup, type CssPolicy, type SanitizeReport } from './sanitize';

// The preview builder (docs/specs/preview-fidelity.md, Building the preview).

export type FontFaceOut = { family: string; url: string; weight: string; style: string; format: string };
export type PreviewFonts = { googleLinks: string[]; faces: FontFaceOut[]; mode: 'google' | 'copied' | 'fallback' | 'none'; /** Families left on their fallback stack. */ substituted?: string[] };

export type PreviewInput = {
  markup: string;
  vars: Record<string, string>;
  snapshot: Snapshot;
  root: SnapElement;
  matched: Record<string, MatchedStyles>;
  /** Average color per image element (data-dse-id), sampled from the page screenshot. */
  imageColors: Record<string, string>;
  /** The image's own pixels, cut from the page screenshot and stored, per image element (D-098). */
  imageUrls?: Record<string, string>;
  /** The capture viewport, against which `vw` and `vh` resolve in the preview's CSS (D-098). */
  viewport?: { width: number; height: number };
  fonts: PreviewFonts;
  policy: CssPolicy;
  /** The site variables the exports declare by name; every other custom property is resolved in the code (D-083). */
  siteVars?: ReadonlySet<string>;
};

export type PreviewDoc = {
  html: string;
  css: string;
  /** The component's own rules, reset-filtered, without the preview's fonts and root. */
  rules: string;
  /** The rules as exported code: every custom property resolved but the site variables the exports declare (D-083). */
  code: string;
  markup: string;
  bytes: number;
  tooLarge: boolean;
  report: SanitizeReport;
};

/** Values that only reset (preview-fidelity.md, Reset filtering). */
const resetValue = /^(inherit|unset|initial|revert|revert-layer)$/i;
const resetProps = new Set(['box-sizing', '-webkit-tap-highlight-color']);
const universal = /^(\*|\*::?before|\*::?after|::?before|::?after)$/;

// A custom property set to `initial` stops inheritance, so it is never a reset to drop (D-098).
const keepDecl = (d: MatchedRule['declarations'][number]) => d.name.startsWith('--') || (!resetValue.test(d.value.trim()) && !resetProps.has(d.name.toLowerCase()) && d.name.toLowerCase() !== 'all');
export const isUniversal = (rule: MatchedRule) => {
  const parts = splitSelectorList(rule.selector);
  return parts.length > 0 && parts.every((s) => universal.test(s.trim()));
};

const controls = ['button', 'input', 'select', 'textarea', 'optgroup'];
const fontProps = ['font', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'text-transform'];
/** A control's own box a browser draws: a reset of it (`all: unset`, `background: none`) is how the site styles the control (D-098). */
const controlBox = ['all', 'appearance', 'background', 'background-color', 'border', 'border-width', 'border-style', 'border-color', 'border-radius', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin', 'text-align', 'outline'];
/** Properties a browser styles on a tag that a reset value (`a { color: inherit }`) overrides, so the page depends on it. */
const uaStyled: Record<string, string[]> = {
  a: ['color', 'text-decoration', 'text-decoration-line', 'text-decoration-color'],
  ...Object.fromEntries(controls.map((t) => [t, [...fontProps, ...controlBox]])),
  ...Object.fromEntries(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((t) => [t, ['font-size', 'font-weight']])),
  b: ['font-weight'],
  strong: ['font-weight'],
  small: ['font-size'],
  th: ['font-weight', 'text-align'],
  ...Object.fromEntries(['code', 'kbd', 'samp', 'pre'].map((t) => [t, ['font-family', 'font-size']])),
};

/**
 * Drops what only resets: reset values, `box-sizing`, tap highlights, rules on `*` and the bare
 * pseudo-elements. A reset value that overrides a browser default on a tag the rule matches in the
 * component (`a { color: inherit }`, `button { font: inherit }`) is kept: the layout depends on it (D-090).
 */
export function filterResets(rule: MatchedRule, matchedTags: ReadonlySet<string> = new Set()): MatchedRule['declarations'] | null {
  if (isUniversal(rule)) return null;
  const overrides = (name: string) => [...matchedTags].some((t) => uaStyled[t]?.includes(name.toLowerCase()));
  const decls = rule.declarations.filter((d) => keepDecl(d) || (resetValue.test(d.value.trim()) && !resetProps.has(d.name.toLowerCase()) && overrides(d.name)));
  return decls.length ? decls : null;
}

/** Tags whose browser defaults a universal margin, padding or border reset overrides. */
const uaDefaults: { prop: RegExp; tags: Set<string> }[] = [
  { prop: /^margin/, tags: new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'dl', 'dd', 'figure', 'blockquote', 'pre', 'menu', 'hr', 'fieldset']) },
  { prop: /^padding/, tags: new Set(['ul', 'ol', 'menu', 'fieldset', 'legend', 'td', 'th', 'button', 'input', 'select', 'textarea', 'dialog']) },
  { prop: /^border/, tags: new Set(['input', 'select', 'textarea', 'button', 'fieldset', 'hr', 'iframe']) },
];

/**
 * A universal reset is never code, but the part of it that overrides a browser default on the
 * component's own tags (a heading's margin, a list's padding) is kept as a plain rule on those tags,
 * so the preview and the code keep the layout the page had (D-090).
 */
export function universalCarry(rules: MatchedRule[], tags: Set<string>): { selector: string; declarations: MatchedRule['declarations']; layerRank?: number }[] {
  const out: { selector: string; declarations: MatchedRule['declarations']; layerRank?: number }[] = [];
  // Each carry keeps the cascade layer of the reset it came from, so the site's layered rules still beat it (D-098).
  const ranks = [...new Set(rules.filter(isUniversal).map((r) => r.layerRank))];
  for (const rank of ranks) {
    const decls = rules.filter((r) => isUniversal(r) && r.layerRank === rank).flatMap((r) => r.declarations.filter(keepDecl));
    for (const ua of uaDefaults) {
      const own = [...tags].filter((t) => ua.tags.has(t)).sort();
      const d = decls.filter((x) => ua.prop.test(x.name));
      if (own.length && d.length) out.push({ selector: own.join(', '), declarations: d, ...(rank !== undefined ? { layerRank: rank } : {}) });
    }
  }
  return out;
}

/**
 * Viewport units resolved against the viewport the instance was captured at: the render check's page
 * is only the element's size, so `8vw` would otherwise read against it (D-098). Preview CSS only; the
 * exported code keeps the site's units.
 */
export function viewportUnits(value: string, vp: { width: number; height: number }, container?: { width: number; height: number }): string {
  // Container units take the nearest container's content box, else the small viewport, as the spec falls back.
  const cq = container ?? vp;
  value = value.replace(/(-?\d*\.?\d+)(cqw|cqi|cqh|cqb|cqmin|cqmax)\b/g, (_, n: string, unit: string) => {
    const base = unit === 'cqw' || unit === 'cqi' ? cq.width : unit === 'cqh' || unit === 'cqb' ? cq.height : unit === 'cqmin' ? Math.min(cq.width, cq.height) : Math.max(cq.width, cq.height);
    return `${Math.round(((Number(n) * base) / 100) * 100) / 100}px`;
  });
  return value.replace(/(-?\d*\.?\d+)(d|s|l)?(vw|vh|vmin|vmax)\b/g, (_, n: string, _k: string | undefined, unit: string) => {
    const base = unit === 'vw' ? vp.width : unit === 'vh' ? vp.height : unit === 'vmin' ? Math.min(vp.width, vp.height) : Math.max(vp.width, vp.height);
    return `${Math.round(((Number(n) * base) / 100) * 100) / 100}px`;
  });
}

/** The end of a `var(` call, nested parentheses included. */
function closing(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

/**
 * Every `var()` resolved to the value the element computed, except the names in `keep`; a reference
 * nothing resolves takes its fallback, else its declaration is dropped.
 */
export function resolveVars(value: string, vars: Record<string, string>, keep: ReadonlySet<string>): string | null {
  let out = '';
  let i = 0;
  for (;;) {
    const at = value.indexOf('var(', i);
    if (at < 0) return out + value.slice(i);
    const end = closing(value, at + 3);
    if (end < 0) return null;
    const inner = value.slice(at + 4, end);
    const comma = inner.indexOf(',');
    const name = (comma >= 0 ? inner.slice(0, comma) : inner).trim();
    const fallback = comma >= 0 ? inner.slice(comma + 1).trim() : undefined;
    out += value.slice(i, at);
    if (keep.has(name)) out += value.slice(at, end + 1);
    else {
      const v = vars[name] ?? (fallback !== undefined ? resolveVars(fallback, vars, keep) : null);
      if (v === null || v === undefined || v === '') return null;
      out += v;
    }
    i = end + 1;
  }
}

/** What the element inherits from its parent, carried onto the root: the text and its rendering (D-053, D-098). */
const inherited = [
  'font-family',
  'font-size',
  'color',
  'line-height',
  'letter-spacing',
  'font-weight',
  'font-style',
  'font-stretch',
  'font-feature-settings',
  'font-variation-settings',
  'font-variant-ligatures',
  'font-variant-numeric',
  'font-kerning',
  'font-optical-sizing',
  '-webkit-font-smoothing',
  'text-rendering',
  'text-transform',
  'word-spacing',
  'text-align',
  'white-space',
] as const;

function isInside(s: Snapshot, e: SnapElement, root: SnapElement): boolean {
  for (let p = e.p; p >= 0; p = s.elements[p]!.p) if (p === root.index) return true;
  return false;
}
const placeholderTags = new Set(['img', 'picture', 'video', 'iframe', 'canvas', 'object', 'embed']);

/** Images and embeds become sized blocks in the image's average color, before sanitization. */
export function withPlaceholders(markup: string, snapshot: Snapshot, imageColors: Record<string, string>, imageUrls: Record<string, string> = {}): { html: string; doc: Document; close: () => void } {
  const dom = new JSDOM(`<!doctype html><body><div class="dse-root">${markup}</div></body>`);
  const doc = dom.window.document;
  for (const el of [...doc.querySelectorAll([...placeholderTags].join(','))]) {
    const d = el.getAttribute('data-dse-id') ?? '';
    const snap = snapshot.byDse.get(d);
    const span = doc.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    const w = snap ? Math.round(snap.w) : Number(el.getAttribute('width')) || 0;
    const h = snap ? Math.round(snap.h) : Number(el.getAttribute('height')) || 0;
    const radius = snap?.style['border-top-left-radius'] ?? '0px';
    const fill = imageUrls[d] ? `url('${imageUrls[d]}') center / 100% 100% no-repeat ${imageColors[d] ?? '#E5E5E5'}` : (imageColors[d] ?? '#E5E5E5');
    span.setAttribute('style', `display: inline-block; width: ${w}px; height: ${h}px; border-radius: ${radius}; background: ${fill}; background-origin: border-box; vertical-align: middle`);
    if (d) span.setAttribute('data-dse-id', d);
    for (const c of el.getAttribute('class')?.split(/\s+/).filter(Boolean) ?? []) span.classList.add(c);
    el.replaceWith(span);
  }
  // The sanitizer removes every `use`: one that points at a symbol inside the component is inlined first (D-098).
  const SVG = 'http://www.w3.org/2000/svg';
  for (const use of [...doc.querySelectorAll('use')]) {
    const href = use.getAttribute('href') ?? use.getAttribute('xlink:href') ?? '';
    const target = href.startsWith('#') ? doc.getElementById(href.slice(1)) : null;
    if (!target || target.contains(use)) continue;
    let node: Element;
    if (target.localName === 'symbol') {
      node = doc.createElementNS(SVG, 'svg');
      for (const a of ['viewBox', 'preserveAspectRatio']) if (target.getAttribute(a)) node.setAttribute(a, target.getAttribute(a)!);
      for (const a of ['x', 'y', 'width', 'height']) if (use.getAttribute(a)) node.setAttribute(a, use.getAttribute(a)!);
      if (!node.getAttribute('width')) node.setAttribute('width', '100%');
      if (!node.getAttribute('height')) node.setAttribute('height', '100%');
      for (const c of [...target.childNodes]) node.append(c.cloneNode(true));
    } else {
      node = doc.createElementNS(SVG, 'g');
      const x = use.getAttribute('x');
      const y = use.getAttribute('y');
      if (x || y) node.setAttribute('transform', `translate(${Number(x) || 0} ${Number(y) || 0})`);
      const clone = target.cloneNode(true) as Element;
      clone.removeAttribute('id');
      node.append(clone);
    }
    for (const a of ['class', 'fill', 'stroke', 'style']) if (use.getAttribute(a) && !node.getAttribute(a)) node.setAttribute(a, use.getAttribute(a)!);
    use.replaceWith(node);
  }
  // A presentation attribute reading a custom property takes the value the page computed, and an svg
  // child takes the paint its class rules gave it, written on it at capture (D-098).
  // Walked, not queried: jsdom's selector engine misses a parenthesis inside an attribute value.
  for (const el of [...doc.querySelectorAll('.dse-root *')]) {
    const snap = snapshot.byDse.get(el.getAttribute('data-dse-id') ?? '');
    for (const a of ['fill', 'stroke'] as const) {
      const painted = el.getAttribute(`data-dse-${a}`);
      el.removeAttribute(`data-dse-${a}`);
      const v = painted || (el.getAttribute(a)?.includes('var(') ? snap?.style[a] : undefined);
      // A paint server outside the component is never fetched.
      if (v && (!/url\(/i.test(v) || /^url\(\s*['"]?#/i.test(v))) el.setAttribute(a, v);
    }
  }
  // An unclosed window stays reachable after the run (D-075), so the caller closes it.
  return { html: doc.querySelector('.dse-root')!.innerHTML, doc, close: () => dom.window.close() };
}

function splitSelectorList(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Compounds of a complex selector with the combinators kept: `.a > .b c` → ['.a', '> .b', 'c']. */
function compounds(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  const s = selector.replace(/\s*([>+~])\s*/g, ' $1');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ' ' && depth === 0) {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  // Re-attach a lone combinator to the compound after it.
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    if (/^[>+~]$/.test(p) && parts[i + 1]) {
      out.push(`${p} ${parts[++i]}`);
    } else out.push(p);
  }
  return out;
}

const pseudoElement = /::?(before|after|placeholder|marker|first-line|first-letter|selection)\b.*$/i;

/**
 * A selector that matched `target` on the site, rewritten to match it inside the preview: kept when
 * it still matches, else its leading ancestors are replaced by `.dse-root`.
 */
export function rescope(selector: string, target: Element): string | null {
  const base = selector.replace(pseudoElement, '');
  const pseudo = selector.slice(base.length);
  const test = (sel: string) => {
    try {
      return target.matches(sel || '*');
    } catch {
      return false;
    }
  };
  // The sanitizer prefixes ids, so id selectors follow.
  const ids = (sel: string) => sel.replace(/#(-?[_a-zA-Z][\w-]*)/g, '#dse-$1');
  if (test(base)) return ids(selector);
  const parts = compounds(base);
  for (let k = 1; k < parts.length; k++) {
    const joined = parts.slice(k).join(' ');
    // A child combinator kept where it still matches is closer to the site's rule than a descendant one (D-098).
    const kept = /^>\s*/.test(joined) ? `.dse-root > ${joined.replace(/^>\s*/, '')}` : null;
    if (kept && test(kept)) return ids(`${kept}${pseudo}`);
    const candidate = `.dse-root ${joined.replace(/^[>+~]\s*/, '')}`;
    if (test(candidate)) return ids(`${candidate}${pseudo}`);
  }
  // Ancestors inside `:where()` or `:is()` are rescoped within it, which keeps the selector's specificity (D-098).
  const inner = rescopeGroups(base);
  if (inner !== base && test(inner)) return ids(`${inner}${pseudo}`);
  return null;
}

/** `:where(.frame button)` → `:where(.dse-root button)`: each argument's leading ancestors become `.dse-root`. */
function rescopeGroups(selector: string): string {
  let out = '';
  let i = 0;
  for (;;) {
    const m = /:(where|is)\(/g;
    m.lastIndex = i;
    const hit = m.exec(selector);
    if (!hit) return out + selector.slice(i);
    const open = hit.index + hit[0].length - 1;
    const end = closing(selector, open);
    if (end < 0) return out + selector.slice(i);
    const args = splitSelectorList(selector.slice(open + 1, end)).map((a) => {
      const c = compounds(a);
      return c.length > 1 ? `.dse-root ${c.at(-1)!.replace(/^[>+~]\s*/, '')}` : a;
    });
    out += `${selector.slice(i, open + 1)}${args.join(', ')})`;
    i = end + 1;
  }
}

type Placed = { key: string; rule: MatchedRule; selectors: string[]; pseudo?: string };

/** Merges each element's rules, kept in cascade order, into one list (a rule appears once). */
function mergeInOrder(lists: Placed[][]): Placed[] {
  const out: Placed[] = [];
  const index = new Map<string, Placed>();
  for (const all of lists) {
    // A rule the page loads twice (one CSS module in two sheets) sits where its last copy does in the cascade (D-098).
    const list = all.filter((p, i) => all.findLastIndex((q) => q.key === p.key) === i);
    for (let i = 0; i < list.length; i++) {
      const p = list[i]!;
      const have = index.get(p.key);
      if (have) {
        for (const s of p.selectors) if (!have.selectors.includes(s)) have.selectors.push(s);
        continue;
      }
      // Insert before the next rule of this list that is already placed, so its order holds.
      const next = list.slice(i + 1).find((q) => index.has(q.key));
      const at = next ? out.indexOf(index.get(next.key)!) : out.length;
      out.splice(at, 0, p);
      index.set(p.key, p);
    }
  }
  return out;
}

export function buildPreview(input: PreviewInput): PreviewDoc {
  const { html: placed, doc, close } = withPlaceholders(input.markup, input.snapshot, input.imageColors, input.imageUrls);
  try {
    return previewOf(input, placed, doc);
  } finally {
    close();
  }
}

type Box = { width: number; height: number };

function contentBox(e: SnapElement): Box {
  const n = (v: string | undefined) => Number.parseFloat(v ?? '0') || 0;
  const st = e.style;
  return {
    width: e.w - n(st['padding-left']) - n(st['padding-right']) - n(st['border-left-width']) - n(st['border-right-width']),
    height: e.h - n(st['padding-top']) - n(st['padding-bottom']) - n(st['border-top-width']) - n(st['border-bottom-width']),
  };
}

const isContainer = (e: SnapElement, name: string | undefined) => {
  const type = e.style['container-type'];
  if (!type || type === 'normal') return false;
  return !name || (e.style['container-name'] ?? '').split(/\s+/).includes(name);
};

/**
 * A size container query read against the container the page had: true or false when the condition is
 * a name and `and`-joined width or height features in px, rem or em, null for anything else (D-098).
 */
export function containerHolds(condition: string, find: (name: string | undefined) => (Box & { inline: boolean }) | null): boolean | null {
  const m = /^\s*(?:(-?[_a-zA-Z][\w-]*)\s+)?(\(.*\))\s*$/.exec(condition);
  if (!m || (m[1] && /^(not|and|or|style|scroll-state)$/i.test(m[1]))) return null;
  const parts = m[2]!.split(/\)\s+and\s+\(/i).map((x) => x.replace(/^\(|\)$/g, '').trim());
  const box = find(m[1]);
  const len = (v: string) => {
    const u = /^(-?\d*\.?\d+)(px|rem|em)$/.exec(v.trim());
    return u ? Number(u[1]) * (u[2] === 'px' ? 1 : 16) : null;
  };
  let ok = true;
  for (const part of parts) {
    if (/[()]/.test(part)) return null;
    let axis: string;
    let op: string;
    let value: number | null;
    const colon = /^(min|max)-(width|height|inline-size|block-size)\s*:\s*(.+)$/i.exec(part);
    const range = /^(width|height|inline-size|block-size)\s*(>=|<=|>|<)\s*(.+)$/i.exec(part);
    if (colon) [axis, op, value] = [colon[2]!.toLowerCase(), colon[1]!.toLowerCase() === 'min' ? '>=' : '<=', len(colon[3]!)];
    else if (range) [axis, op, value] = [range[1]!.toLowerCase(), range[2]!, len(range[3]!)];
    else return null;
    if (value === null) return null;
    if (!box) return false;
    const vertical = axis === 'height' || axis === 'block-size';
    if (vertical && box.inline) return false;
    const size = vertical ? box.height : box.width;
    ok &&= op === '>=' ? size >= value : op === '<=' ? size <= value : op === '>' ? size > value : size < value;
  }
  return ok;
}

function previewOf(input: PreviewInput, placed: string, doc: Document): PreviewDoc {
  const policy = input.policy;
  const lists: Placed[][] = [];
  for (const el of [doc.querySelector('.dse-root')!.firstElementChild, ...doc.querySelectorAll('.dse-root [data-dse-id]')]) {
    if (!el) continue;
    const d = el.getAttribute('data-dse-id') ?? '';
    const m = input.matched[d];
    if (!m) continue;
    const list: Placed[] = [];
    const add = (rule: MatchedRule, pseudo?: string) => {
      const selectors = (rule.matched.length ? rule.matched : splitSelectorList(rule.selector)).map((s) => rescope(s, el)).filter((s): s is string => Boolean(s));
      if (!selectors.length) return;
      list.push({ key: `${pseudo ?? ''}|${rule.selector}|${JSON.stringify([rule.media, rule.supports, rule.container, rule.layerRank, rule.declarations])}`, rule, selectors, pseudo });
    };
    for (const r of m.rules) add(r);
    for (const p of m.pseudo) for (const r of p.rules) add(r, p.pseudo);
    lists.push(list);
  }
  const rules = mergeInOrder(lists);
  const declarationText = (decls: MatchedRule['declarations'], code = false) =>
    decls
      .map((d) => {
        const s = sanitizeDeclaration(d.name, d.value, policy);
        if (!s) return null;
        if (!code) return `${s.name}: ${input.viewport ? viewportUnits(s.value, input.viewport, container) : s.value}${d.important ? ' !important' : ''};`;
        // A custom property is code only when the exports declare it; every other is resolved where it is used.
        if (s.name.startsWith('--') && !keep.has(s.name)) return null;
        const value = resolveVars(s.value, input.vars, keep);
        return value === null ? null : `${s.name}: ${value}${d.important ? ' !important' : ''};`;
      })
      .filter(Boolean)
      .join(' ');
  const keep = input.siteVars ?? new Set<string>();
  const ancestors: SnapElement[] = [];
  for (let a = input.root.p; a >= 0; a = input.snapshot.elements[a]!.p) ancestors.push(input.snapshot.elements[a]!);
  const nearest = ancestors.find((e) => isContainer(e, undefined));
  const container = nearest ? contentBox(nearest) : undefined;
  // A container inside the component answers its own queries in the preview; one outside it is not there,
  // so its conditions are read against the box it had on the page (D-098).
  const own = [input.root, ...input.snapshot.elements.filter((e) => e.p >= 0 && isInside(input.snapshot, e, input.root))];
  const queried = (c: string) => {
    const name = /^\s*(-?[_a-zA-Z][\w-]*)\s+\(/.exec(c)?.[1];
    if (own.some((e) => isContainer(e, name))) return null;
    return containerHolds(c, (n) => {
      const e = ancestors.find((x) => isContainer(x, n));
      return e ? { ...contentBox(e), inline: e.style['container-type'] === 'inline-size' } : null;
    });
  };
  const tags = new Set([...doc.querySelectorAll('.dse-root *')].map((e) => e.localName));
  const carried = universalCarry(
    rules.map((p) => p.rule),
    tags,
  ).map((c) => ({ p: { key: `carry|${c.layerRank ?? ''}|${c.selector}`, rule: { selector: c.selector, matched: [c.selector], origin: 'regular', media: [], supports: [], declarations: c.declarations, ...(c.layerRank !== undefined ? { layerRank: c.layerRank } : {}) }, selectors: [c.selector] } as Placed, decls: c.declarations }));
  const root = doc.querySelector('.dse-root')!;
  const tagsOf = (p: Placed) => {
    const out = new Set<string>();
    for (const sel of p.selectors) {
      try {
        for (const el of root.querySelectorAll(sel.replace(pseudoElement, '') || '*')) out.add(el.localName);
        if (root.firstElementChild?.matches(sel.replace(pseudoElement, '') || '*')) out.add(root.firstElementChild.localName);
      } catch {
        // a selector jsdom cannot read
      }
    }
    return out;
  };
  const filtered = [...carried, ...rules.map((p) => ({ p, decls: filterResets(p.rule, tagsOf(p)) })).filter((x): x is { p: Placed; decls: MatchedRule['declarations'] } => x.decls !== null)];
  // A rule in a cascade layer keeps its place under the site's unlayered rules: the preview declares
  // the layers in the page's order and wraps each rule in its own (D-098). The exported code is unwrapped.
  const ranks = [...new Set(filtered.map((x) => x.p.rule.layerRank).filter((r): r is number => r !== undefined))].sort((a, b) => a - b);
  const textOf = (code: boolean) =>
    [
      ...(!code && ranks.length ? [`@layer ${ranks.map((r) => `dse-l${r}`).join(', ')};`] : []),
      ...filtered.map(({ p, decls }) => {
        const body = declarationText(decls, code);
        if (!body) return '';
        let rule = `${p.selectors.join(', ')} { ${body} }`;
        if (code) return rule;
        // A condition is the site's text: one that could leave its block drops the rule.
        if ((p.rule.container ?? []).some((c) => /[{}<;]/.test(c))) return '';
        for (const c of [...(p.rule.container ?? [])].reverse()) {
          const holds = queried(c);
          if (holds === false) return '';
          if (holds === null) rule = `@container ${c} { ${rule} }`;
        }
        return p.rule.layerRank !== undefined ? `@layer dse-l${p.rule.layerRank} { ${rule} }` : rule;
      }),
    ]
      .filter(Boolean)
      .join('\n');
  const ruleText = textOf(false);
  const codeText = textOf(true);

  // The root: what the element inherits and the custom properties it uses. Its ground is painted
  // behind the transparent document by the app and the render check alike (D-094).
  const parent = input.root.p >= 0 ? input.snapshot.elements[input.root.p] : undefined;
  const from = parent ?? input.root;
  const rootDecls = [
    ...inherited.map((prop) => (from.style[prop] ? sanitizeDeclaration(prop, from.style[prop], policy) : null)).filter(Boolean),
    ...Object.entries(input.vars).map(([n, v]) => sanitizeDeclaration(n, input.viewport ? viewportUnits(v, input.viewport, container) : v, policy)).filter(Boolean),
  ] as { name: string; value: string }[];
  // The element keeps the exact box it had on the page, whatever the page's layout gave it.
  const w = Math.round(input.root.w * 100) / 100;
  const h = Math.round(input.root.h * 100) / 100;
  // The page's box model belongs to the preview's shell, like its inherited text, never to the code (D-090).
  const inside = input.snapshot.elements.filter((e) => e.p >= 0 && isInside(input.snapshot, e, input.root));
  const borderBox = inside.length > 0 && inside.filter((e) => e.style['box-sizing'] === 'border-box').length * 2 > inside.length;
  const boxCss = borderBox ? '\n.dse-root *, .dse-root *::before, .dse-root *::after { box-sizing: border-box; }' : '';
  // The box was measured with the element's own translation applied, so the preview does not apply it again (D-098).
  // A computed transform of `none` is what the page applied, whatever the matched rules say (D-098).
  const shift = /^(none|matrix\(1, 0, 0, 1, [-\d.e]+, [-\d.e]+\))$/.test(input.root.style.transform ?? '');
  const ownTranslate = input.root.style.translate && input.root.style.translate !== 'none';
  const unshift = shift || ownTranslate ? `\n.dse-root > :first-child:not(#dse-shift) { ${shift ? 'transform: none !important; ' : ''}${ownTranslate ? 'translate: none !important; ' : ''}}` : '';
  // An ancestor's scale drew the element smaller than it was laid out: the preview lays it out at its own size and scales it the same (D-098).
  let scale = 1;
  for (const e of ancestors) {
    if (e.tag === 'body' || e.tag === 'html') break;
    const m = /^matrix\(([^)]+)\)$/.exec(e.style.transform ?? '');
    if (!m) continue;
    const [a, b, c, d] = m[1]!.split(',').map(Number) as [number, number, number, number];
    if (b !== 0 || c !== 0 || Math.abs(a - d) > 0.001 || !(a > 0)) continue;
    scale *= a;
  }
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const scaled = Math.abs(scale - 1) > 0.002 && scale > 0.2 ? `\n.dse-root { height: ${h}px; }\n.dse-root > :first-child:not(#dse-shift) { width: ${r2(w / scale)}px !important; height: ${r2(h / scale)}px !important; transform: scale(${Math.round(scale * 10000) / 10000}) !important; transform-origin: 0 0 !important; }` : '';
  // The ancestors' opacity the element shows through, above a floor so a mid-entrance capture never hides it (D-098).
  let faded = 1;
  for (let a = input.root.p; a >= 0; a = input.snapshot.elements[a]!.p) {
    const e = input.snapshot.elements[a]!;
    if (e.tag === 'body' || e.tag === 'html') break;
    const o = Number.parseFloat(e.style.opacity ?? '1');
    if (Number.isFinite(o)) faded *= o;
  }
  const fade = faded < 0.999 && faded >= 0.2 ? ` opacity: ${Math.round(faded * 1000) / 1000};` : '';
  // An inline root's box is its content area: blockified, it takes that height as its line height (D-098).
  const px = (v: string | undefined) => Number.parseFloat(v ?? '0') || 0;
  const st = input.root.style;
  const inlineLine = st.display === 'inline' ? ` line-height: ${Math.round((input.root.h - px(st['padding-top']) - px(st['padding-bottom']) - px(st['border-top-width']) - px(st['border-bottom-width'])) * 100) / 100}px !important;` : '';
  const rootCss = `.dse-root { ${rootDecls.map((d) => `${d.name}: ${d.value};`).join(' ')}${fade} display: flex; flex-direction: column; align-items: flex-start; width: ${w}px; }\n.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: ${w}px !important; height: ${h}px !important; flex: none !important;${inlineLine}${/^(absolute|fixed|sticky)$/.test(input.root.style.position) ? ' position: relative !important; inset: auto !important;' : ''} }${boxCss}${unshift}${scaled}`;
  const fontCss = input.fonts.faces.map((f) => `@font-face { font-family: '${f.family}'; src: url('${f.url}') format('${f.format}'); font-weight: ${f.weight}; font-style: ${f.style}; font-display: block; }`).join('\n');
  const css = [fontCss, rootCss, ruleText].filter(Boolean).join('\n');

  const sanitized = sanitizeMarkup(placed, policy);
  // A CSP source with a path matches that exact path unless it ends with a slash; the base is a prefix.
  const base = `${policy.storageBase.replace(/\/$/, '')}/`;
  const csp = `default-src 'none'; style-src 'unsafe-inline' ${GOOGLE_FONTS_CSS}; font-src ${GOOGLE_FONTS_FILES} ${base}; img-src data: ${base}`;
  const links = input.fonts.googleLinks.map((href) => `<link rel="stylesheet" href="${href.replace(/"/g, '&quot;')}">`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>html,body{margin:0;background:transparent}</style>${links}<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style></head><body><div class="dse-root">${sanitized.html}</div></body></html>`;
  const bytes = Buffer.byteLength(css, 'utf8');
  return { html, css, rules: ruleText, code: codeText, markup: sanitized.html, bytes, tooLarge: bytes > CSS_CAP_BYTES, report: sanitized.report };
}

export type StateDelta = { property: string; from: string; to: string; transition?: { durationMs: number; easing: string } };

/** The selector the state's values sit on: an id-level specificity no site class selector beats, without `!important`, so the animation plays over it (D-094, D-098). */
const STATE_TARGET = '.dse-root > :first-child:not(#dse-state)';

/**
 * The same document plus the state: one rule with the state's values, and the entries the site
 * transitions played from the default values with the recorded timing, one generated keyframes block
 * per duration and easing, so loading the file shows the transition and reloading replays it (D-094).
 * Under reduced motion the end values show at once.
 */
export function statePreview(html: string, delta: StateDelta[], policy: CssPolicy): string {
  const decl = (property: string, value: string) => {
    const d = sanitizeDeclaration(property, value, policy);
    return d ? `${d.name}: ${d.value};` : '';
  };
  const values = delta.map((d) => decl(d.property, d.to)).filter(Boolean).join(' ');
  const groups = new Map<string, { durationMs: number; easing: string; entries: StateDelta[] }>();
  for (const d of delta) {
    if (!d.transition || d.transition.durationMs <= 0) continue;
    const easing = sanitizeDeclaration('animation-timing-function', d.transition.easing, policy)?.value ?? 'ease';
    const k = `${d.transition.durationMs}|${easing}`;
    const g = groups.get(k) ?? { durationMs: d.transition.durationMs, easing, entries: [] };
    g.entries.push(d);
    groups.set(k, g);
  }
  const blocks: string[] = [];
  const animations: string[] = [];
  [...groups.values()].forEach((g, i) => {
    const from = g.entries.map((d) => decl(d.property, d.from)).filter(Boolean).join(' ');
    const to = g.entries.map((d) => decl(d.property, d.to)).filter(Boolean).join(' ');
    if (!from || !to) return;
    blocks.push(`@keyframes dse-state-${i} { from { ${from} } to { ${to} } }`);
    animations.push(`dse-state-${i} ${Math.round(g.durationMs)}ms ${g.easing} both`);
  });
  const css = [
    `${STATE_TARGET} { ${values}${animations.length ? ` animation: ${animations.join(', ')};` : ''} }`,
    ...blocks,
    ...(animations.length ? [`@media (prefers-reduced-motion: reduce) { ${STATE_TARGET} { animation: none; } }`] : []),
  ].join('\n');
  return html.replace('</style></head>', `\n${css.replace(/<\/style/gi, '<\\/style')}\n</style></head>`);
}
