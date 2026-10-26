import { JSDOM } from 'jsdom';
import type { MatchedRule, MatchedStyles } from '../capture/matched-css';
import type { SnapElement, Snapshot } from '../capture/snapshot';
import { CSS_CAP_BYTES, GOOGLE_FONTS_CSS, GOOGLE_FONTS_FILES } from './constants';
import { sanitizeDeclaration, sanitizeMarkup, type CssPolicy, type SanitizeReport } from './sanitize';

// The preview builder (docs/specs/preview-fidelity.md, Building the preview).

export type FontFaceOut = { family: string; url: string; weight: string; style: string; format: string };
export type PreviewFonts = { googleLinks: string[]; faces: FontFaceOut[]; mode: 'google' | 'copied' | 'fallback' | 'none' };

export type PreviewInput = {
  markup: string;
  vars: Record<string, string>;
  snapshot: Snapshot;
  root: SnapElement;
  matched: Record<string, MatchedStyles>;
  /** The opaque color the element sat on, shown behind it as on the page. */
  ground: string;
  /** Average color per image element (data-dse-id), sampled from the page screenshot. */
  imageColors: Record<string, string>;
  fonts: PreviewFonts;
  policy: CssPolicy;
};

export type PreviewDoc = { html: string; css: string; /** The component's own rules, without the preview's fonts and root. */ rules: string; markup: string; bytes: number; tooLarge: boolean; report: SanitizeReport };

const inherited = ['font-family', 'font-size', 'color', 'line-height', 'letter-spacing'] as const;
const placeholderTags = new Set(['img', 'picture', 'video', 'iframe', 'canvas', 'object', 'embed']);

/** Images and embeds become sized blocks in the image's average color, before sanitization. */
export function withPlaceholders(markup: string, snapshot: Snapshot, imageColors: Record<string, string>): { html: string; doc: Document } {
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
  return { html: doc.querySelector('.dse-root')!.innerHTML, doc };
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
  const { html: placed, doc } = withPlaceholders(input.markup, input.snapshot, input.imageColors);
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
  const declarationText = (decls: MatchedRule['declarations']) =>
    decls
      .map((d) => {
        const s = sanitizeDeclaration(d.name, d.value, policy);
        return s ? `${s.name}: ${s.value}${d.important ? ' !important' : ''};` : null;
      })
      .filter(Boolean)
      .join(' ');
  const ruleText = rules
    .map((p) => {
      const body = declarationText(p.rule.declarations);
      return body ? `${p.selectors.join(', ')} { ${body} }` : '';
    })
    .filter(Boolean)
    .join('\n');

  // The root: what the element inherits, the custom properties it uses, its ground.
  const parent = input.root.p >= 0 ? input.snapshot.elements[input.root.p] : undefined;
  const from = parent ?? input.root;
  const rootDecls = [
    ...inherited.map((prop) => sanitizeDeclaration(prop, from.style[prop], policy)).filter(Boolean),
    ...Object.entries(input.vars).map(([n, v]) => sanitizeDeclaration(n, v, policy)).filter(Boolean),
  ] as { name: string; value: string }[];
  // The element keeps the exact box it had on the page, whatever the page's layout gave it.
  const w = Math.round(input.root.w * 100) / 100;
  const h = Math.round(input.root.h * 100) / 100;
  const rootCss = `.dse-root { ${rootDecls.map((d) => `${d.name}: ${d.value};`).join(' ')} display: flex; flex-direction: column; align-items: flex-start; width: ${w}px; background: ${input.ground}; }\n.dse-root > :first-child { margin: 0 !important; box-sizing: border-box !important; width: ${w}px !important; height: ${h}px !important; flex: none !important;${/^(absolute|fixed|sticky)$/.test(input.root.style.position) ? ' position: relative !important; inset: auto !important;' : ''} }`;
  const fontCss = input.fonts.faces.map((f) => `@font-face { font-family: '${f.family}'; src: url('${f.url}') format('${f.format}'); font-weight: ${f.weight}; font-style: ${f.style}; font-display: block; }`).join('\n');
  const css = [fontCss, rootCss, ruleText].filter(Boolean).join('\n');

  const sanitized = sanitizeMarkup(placed, policy);
  // A CSP source with a path matches that exact path unless it ends with a slash; the base is a prefix.
  const base = `${policy.storageBase.replace(/\/$/, '')}/`;
  const csp = `default-src 'none'; style-src 'unsafe-inline' ${GOOGLE_FONTS_CSS}; font-src ${GOOGLE_FONTS_FILES} ${base}; img-src data: ${base}`;
  const links = input.fonts.googleLinks.map((href) => `<link rel="stylesheet" href="${href.replace(/"/g, '&quot;')}">`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>html,body{margin:0;background:transparent}</style>${links}<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style></head><body><div class="dse-root">${sanitized.html}</div></body></html>`;
  const bytes = Buffer.byteLength(css, 'utf8');
  return { html, css, rules: ruleText, markup: sanitized.html, bytes, tooLarge: bytes > CSS_CAP_BYTES, report: sanitized.report };
}

/** The same document plus one rule that applies a state's computed-style diff to the root element. */
export function statePreview(html: string, delta: { property: string; to: string }[], policy: CssPolicy): string {
  const decls = delta
    .map((d) => sanitizeDeclaration(d.property, d.to, policy))
    .filter(Boolean)
    .map((d) => `${d!.name}: ${d!.value} !important;`)
    .join(' ');
  return html.replace('</style></head>', `\n.dse-root > :first-child { ${decls} }\n</style></head>`);
}
