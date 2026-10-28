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

const keepDecl = (d: MatchedRule['declarations'][number]) => !resetValue.test(d.value.trim()) && !resetProps.has(d.name.toLowerCase()) && d.name.toLowerCase() !== 'all';
export const isUniversal = (rule: MatchedRule) => {
  const parts = splitSelectorList(rule.selector);
  return parts.length > 0 && parts.every((s) => universal.test(s.trim()));
};

const controls = ['button', 'input', 'select', 'textarea', 'optgroup'];
const fontProps = ['font', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'color', 'text-transform'];
/** Properties a browser styles on a tag that a reset value (`a { color: inherit }`) overrides, so the page depends on it. */
const uaStyled: Record<string, string[]> = {
  a: ['color', 'text-decoration', 'text-decoration-line', 'text-decoration-color'],
  ...Object.fromEntries(controls.map((t) => [t, fontProps])),
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
export function universalCarry(rules: MatchedRule[], tags: Set<string>): { selector: string; declarations: MatchedRule['declarations'] }[] {
  const out: { selector: string; declarations: MatchedRule['declarations'] }[] = [];
  const decls = rules.filter(isUniversal).flatMap((r) => r.declarations.filter(keepDecl));
  for (const ua of uaDefaults) {
    const own = [...tags].filter((t) => ua.tags.has(t)).sort();
    const d = decls.filter((x) => ua.prop.test(x.name));
    if (own.length && d.length) out.push({ selector: own.join(', '), declarations: d });
  }
  return out;
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

const inherited = ['font-family', 'font-size', 'color', 'line-height', 'letter-spacing'] as const;

function isInside(s: Snapshot, e: SnapElement, root: SnapElement): boolean {
  for (let p = e.p; p >= 0; p = s.elements[p]!.p) if (p === root.index) return true;
  return false;
}
const placeholderTags = new Set(['img', 'picture', 'video', 'iframe', 'canvas', 'object', 'embed']);

/** Images and embeds become sized blocks in the image's average color, before sanitization. */
export function withPlaceholders(markup: string, snapshot: Snapshot, imageColors: Record<string, string>): { html: string; doc: Document; close: () => void } {
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
    span.setAttribute('style', `display: inline-block; width: ${w}px; height: ${h}px; border-radius: ${radius}; background: ${imageColors[d] ?? '#E5E5E5'}; vertical-align: middle`);
    if (d) span.setAttribute('data-dse-id', d);
    for (const c of el.getAttribute('class')?.split(/\s+/).filter(Boolean) ?? []) span.classList.add(c);
    el.replaceWith(span);
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
    const rest = parts.slice(k).join(' ').replace(/^[>+~]\s*/, '');
    const candidate = `.dse-root ${rest}`;
    if (test(candidate)) return ids(`${candidate}${pseudo}`);
  }
  return null;
}

type Placed = { key: string; rule: MatchedRule; selectors: string[]; pseudo?: string };

/** Merges each element's rules, kept in cascade order, into one list (a rule appears once). */
function mergeInOrder(lists: Placed[][]): Placed[] {
  const out: Placed[] = [];
  const index = new Map<string, Placed>();
  for (const list of lists) {
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
  const { html: placed, doc, close } = withPlaceholders(input.markup, input.snapshot, input.imageColors);
  try {
    return previewOf(input, placed, doc);
  } finally {
    close();
  }
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
      list.push({ key: `${pseudo ?? ''}|${rule.selector}|${JSON.stringify(rule.declarations)}`, rule, selectors, pseudo });
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
        if (!code) return `${s.name}: ${s.value}${d.important ? ' !important' : ''};`;
        // A custom property is code only when the exports declare it; every other is resolved where it is used.
        if (s.name.startsWith('--') && !keep.has(s.name)) return null;
        const value = resolveVars(s.value, input.vars, keep);
        return value === null ? null : `${s.name}: ${value}${d.important ? ' !important' : ''};`;
      })
      .filter(Boolean)
      .join(' ');
  const keep = input.siteVars ?? new Set<string>();
  const tags = new Set([...doc.querySelectorAll('.dse-root *')].map((e) => e.localName));
  const carried = universalCarry(
    rules.map((p) => p.rule),
    tags,
  ).map((c) => ({ p: { key: `carry|${c.selector}`, rule: { selector: c.selector, matched: [c.selector], origin: 'regular', media: [], supports: [], declarations: c.declarations }, selectors: [c.selector] } as Placed, decls: c.declarations }));
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
  const textOf = (code: boolean) =>
    filtered
      .map(({ p, decls }) => {
        const body = declarationText(decls, code);
        return body ? `${p.selectors.join(', ')} { ${body} }` : '';
      })
      .filter(Boolean)
      .join('\n');
  const ruleText = textOf(false);
  const codeText = textOf(true);

  // The root: what the element inherits and the custom properties it uses. Its ground is painted
  // behind the transparent document by the app and the render check alike (D-094).
  const parent = input.root.p >= 0 ? input.snapshot.elements[input.root.p] : undefined;
  const from = parent ?? input.root;
  const rootDecls = [
    ...inherited.map((prop) => sanitizeDeclaration(prop, from.style[prop], policy)).filter(Boolean),
    ...Object.entries(input.vars).map(([n, v]) => sanitizeDeclaration(n, v, policy)).filter(Boolean),
  ] as { name: string; value: string }[];
  // The element keeps the exact box it had on the page, whatever the page's layout gave it.
  const w = Math.round(input.root.w * 100) / 100;
  const h = Math.round(input.root.h * 100) / 100;
  // The page's box model belongs to the preview's shell, like its inherited text, never to the code (D-090).
  const inside = input.snapshot.elements.filter((e) => e.p >= 0 && isInside(input.snapshot, e, input.root));
  const borderBox = inside.length > 0 && inside.filter((e) => e.style['box-sizing'] === 'border-box').length * 2 > inside.length;
  const boxCss = borderBox ? '\n.dse-root *, .dse-root *::before, .dse-root *::after { box-sizing: border-box; }' : '';
  const rootCss = `.dse-root { ${rootDecls.map((d) => `${d.name}: ${d.value};`).join(' ')} display: flex; flex-direction: column; align-items: flex-start; width: ${w}px; }\n.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: ${w}px !important; height: ${h}px !important; flex: none !important;${/^(absolute|fixed|sticky)$/.test(input.root.style.position) ? ' position: relative !important; inset: auto !important;' : ''} }${boxCss}`;
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
  return html.replace('</style></head>', `\n${css}\n</style></head>`);
}
