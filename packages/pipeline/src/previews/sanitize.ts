import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { GOOGLE_FONTS_CSS, GOOGLE_FONTS_FILES } from './constants';

// Sanitization (docs/specs/preview-fidelity.md, hard rules). Every byte comes from a hostile site.

export type CssPolicy = { storageBase: string };

/** CSS text with comments removed and escapes decoded, lowercased, for the checks only. */
export function normalizeCss(value: string): string {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1')
    .toLowerCase();
}

function allowedUrl(target: string, policy: CssPolicy): boolean {
  const t = target.trim().replace(/^['"]|['"]$/g, '').trim();
  if (/^data:image\//i.test(t)) return true;
  return [GOOGLE_FONTS_CSS, GOOGLE_FONTS_FILES, policy.storageBase].some((base) => base && t.toLowerCase().startsWith(`${base.toLowerCase()}/`));
}

/**
 * One declaration through the CSS rules: null when it must go, a replacement value for the
 * positions that would escape the preview box.
 */
export function sanitizeDeclaration(name: string, value: string, policy: CssPolicy): { name: string; value: string } | null {
  const n = normalizeCss(name).trim();
  const v = normalizeCss(value);
  if (!/^(--[\w-]+|-?[a-z][a-z-]*)$/.test(n)) return null;
  if (n === 'behavior' || n === '-moz-binding') return null;
  if (/expression\s*\(|-moz-binding|behavior\s*:|@import|javascript:|vbscript:/.test(v)) return null;
  // Outside a quoted string no value has a brace or a `<`: they are how a value leaves its rule or its style element.
  if (/[{}<]/.test(v.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""'))) return null;
  if (/image-set\s*\(|(^|[^-\w])src\s*\(/.test(v)) return null;
  for (const m of v.matchAll(/url\s*\(\s*([^)]*)\)/g)) if (!allowedUrl(m[1]!, policy)) return null;
  if (n === 'position' && /\b(fixed|sticky)\b/.test(v)) return { name, value: 'relative' };
  return { name, value };
}

/** Splits a style attribute into declarations, respecting strings and parentheses. */
export function parseDeclarations(text: string): { name: string; value: string; important: boolean }[] {
  const out: { name: string; value: string; important: boolean }[] = [];
  let depth = 0;
  let quote = '';
  let cur = '';
  const flush = () => {
    const i = cur.indexOf(':');
    if (i > 0) {
      let value = cur.slice(i + 1).trim();
      const important = /!\s*important\s*$/i.test(value);
      value = value.replace(/!\s*important\s*$/i, '').trim();
      out.push({ name: cur.slice(0, i).trim(), value, important });
    }
    cur = '';
  };
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = '';
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ';' && depth === 0) {
      flush();
      continue;
    }
    cur += ch;
  }
  flush();
  return out;
}

export function sanitizeStyleAttribute(text: string, policy: CssPolicy): string {
  return parseDeclarations(text)
    .map((d) => {
      const s = sanitizeDeclaration(d.name, d.value, policy);
      return s ? `${s.name}: ${s.value}${d.important ? ' !important' : ''}` : null;
    })
    .filter(Boolean)
    .join('; ');
}

// Browsers ignore control characters and spaces inside a URL scheme (`java\tscript:`), so the checks do too.
const invisible = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}\\s]+`, 'g');

const forbiddenTags = ['script', 'noscript', 'template', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'link', 'meta', 'base', 'style', 'foreignobject', 'animate', 'animatemotion', 'animatetransform', 'set', 'portal'];
const urlAttributes = ['href', 'src', 'srcset', 'xlink:href', 'formaction', 'poster', 'action', 'background', 'lowsrc', 'ping', 'cite', 'longdesc', 'dynsrc', 'data'];
const textLikeTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'number', 'date', 'time', 'checkbox', 'radio', 'submit', 'button'];

function safeUrl(value: string): 'keep' | 'relative' | 'drop' {
  const v = value.trim().replace(invisible, '').toLowerCase();
  if (v.startsWith('https:')) return 'keep';
  if (v.startsWith('data:image/') && !v.startsWith('data:image/svg')) return 'keep';
  if (/^[a-z][a-z0-9+.-]*:/.test(v) || v.startsWith('//')) return 'drop';
  return 'relative';
}

let purifier: ReturnType<typeof createDOMPurify> | null = null;
let window_: JSDOM['window'] | null = null;

function purify() {
  if (!purifier) {
    window_ = new JSDOM('').window;
    purifier = createDOMPurify(window_ as unknown as Parameters<typeof createDOMPurify>[0]);
  }
  return { purifier, window: window_! };
}

export type SanitizeReport = { removedTags: number; removedAttributes: number; secondPass: string[] };

/**
 * Markup through the whitelist sanitizer, then a second pass of explicit checks. Images and
 * embeds must already be placeholders (see build.ts); anything left is removed here.
 */
export function sanitizeMarkup(html: string, policy: CssPolicy): { html: string; report: SanitizeReport } {
  const { purifier: p, window } = purify();
  const report: SanitizeReport = { removedTags: 0, removedAttributes: 0, secondPass: [] };
  p.removeAllHooks();
  p.addHook('uponSanitizeAttribute', (node, data) => {
    const name = data.attrName.toLowerCase();
    const el = node as Element;
    if (name.startsWith('on') || name === 'target' || name.startsWith('data-dse') || name === 'srcdoc') {
      data.keepAttr = false;
      return;
    }
    if (urlAttributes.includes(name)) {
      const verdict = name === 'srcset' ? (data.attrValue.split(',').every((part) => safeUrl(part.trim().split(/\s+/)[0] ?? '') === 'keep') ? 'keep' : 'drop') : safeUrl(data.attrValue);
      if (verdict === 'drop') data.keepAttr = false;
      else if (verdict === 'relative' && (name === 'href' || name === 'xlink:href')) data.attrValue = '#';
      else if (verdict === 'relative') data.keepAttr = false;
      // Previews never navigate or submit; an svg `use` may only point inside the document.
      if (name === 'action' || name === 'formaction') data.keepAttr = false;
      if (el.nodeName.toLowerCase() === 'use' && (name === 'href' || name === 'xlink:href') && !data.attrValue.startsWith('#')) data.keepAttr = false;
      return;
    }
    if (name === 'style') {
      data.attrValue = sanitizeStyleAttribute(data.attrValue, policy);
      return;
    }
    // References to ids inside the component follow the ids' `dse-` prefix (D-098).
    if (['fill', 'stroke', 'clip-path', 'mask', 'filter', 'marker-start', 'marker-mid', 'marker-end'].includes(name) && /url\(\s*['"]?#/.test(data.attrValue)) {
      data.attrValue = data.attrValue.replace(/url\(\s*(['"]?)#(-?[_a-zA-Z][\w-]*)/g, 'url($1#dse-$2');
      return;
    }
    if (name === 'id' || name === 'for' || name === 'aria-labelledby' || name === 'aria-describedby' || name === 'aria-controls') {
      data.attrValue = data.attrValue
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => `dse-${id}`)
        .join(' ');
      return;
    }
    if (el.nodeName.toLowerCase() === 'form' && name === 'method') data.keepAttr = false;
    if (el.nodeName.toLowerCase() === 'input' && name === 'name') data.keepAttr = false;
    if (el.nodeName.toLowerCase() === 'input' && name === 'type' && !textLikeTypes.includes(data.attrValue.toLowerCase())) data.attrValue = 'text';
  });
  p.addHook('uponSanitizeElement', (node, data) => {
    if (forbiddenTags.includes(data.tagName)) report.removedTags++;
  });
  const clean = p.sanitize(html, {
    FORBID_TAGS: forbiddenTags,
    ADD_ATTR: ['xlink:href'],
    ALLOW_DATA_ATTR: true,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    WHOLE_DOCUMENT: false,
    RETURN_TRUSTED_TYPE: false,
  }) as string;
  report.removedAttributes = p.removed.filter((r) => 'attribute' in r).length;
  return { html: secondPass(clean, window, report), report };
}

/** Explicit checks on the sanitizer's output; anything that survived is removed and reported. */
function secondPass(html: string, window: JSDOM['window'], report: SanitizeReport): string {
  // A template parses inertly into its one shared content document; a new document per call is retained (D-075).
  const host = window.document.createElement('template');
  host.innerHTML = html;
  for (const el of [...host.content.querySelectorAll('*')]) {
    const tag = el.tagName.toLowerCase();
    if (forbiddenTags.includes(tag)) {
      report.secondPass.push(`tag ${tag}`);
      el.remove();
      continue;
    }
    for (const a of [...el.attributes]) {
      const name = a.name.toLowerCase();
      const value = a.value.toLowerCase().replace(invisible, '');
      if (name.startsWith('on') || name === 'srcdoc' || name === 'target' || name.startsWith('data-dse') || /javascript:|vbscript:|data:text/.test(value) || (urlAttributes.includes(name) && /^[a-z][a-z0-9+.-]*:/.test(value) && !value.startsWith('https:') && !value.startsWith('data:image/'))) {
        report.secondPass.push(`attribute ${name}`);
        el.removeAttribute(a.name);
      }
    }
  }
  return host.innerHTML;
}
