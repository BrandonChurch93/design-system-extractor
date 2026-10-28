import type { Page } from 'playwright';
import type { Declaration, MatchedRule, MatchedStyles } from './matched-css';

// Matched CSS read from the page's own CSSOM (D-068). CDP's CSS.getMatchedStylesForNode answers with
// every ancestor's rules as well (240 KB a node on a large site), so a page of components took half a
// minute. Here each rule is matched once with querySelectorAll, in stylesheet order, which is the
// order the preview needs; the preview document then applies the cascade itself, as on the site.

/** A stylesheet the page cannot read (cross-origin without CORS), by its place in document order. */
type Unreadable = { index: number; href: string };

/** Lists the stylesheets the page cannot read, so the worker can fetch their text. */
export function unreadableSheets(): Unreadable[] {
  const out: Unreadable[] = [];
  [...document.styleSheets].forEach((sheet, index) => {
    try {
      void sheet.cssRules;
    } catch {
      if (sheet.href) out.push({ index, href: sheet.href });
    }
  });
  return out;
}

type MatchArgs = { ids: string[]; texts: Record<number, string> };

/** Runs in the page: matched author rules, inline and pseudo-element declarations, per data-dse-id. */
export function matchInPage({ ids, texts }: MatchArgs): Record<string, { rules: MatchedRuleOut[]; inline: Declaration[]; pseudo: { pseudo: string; rules: MatchedRuleOut[] }[] }> {
  type Out = { rules: MatchedRuleOut[]; inline: Declaration[]; pseudo: Map<string, MatchedRuleOut[]> };
  const wanted = new Set(ids);
  const byEl = new Map<Element, Out>();
  const classes = new Set<string>();
  const tags = new Set<string>();
  const elIds = new Set<string>();
  for (const el of document.querySelectorAll('[data-dse-id]')) {
    if (!wanted.has(el.getAttribute('data-dse-id') ?? '')) continue;
    byEl.set(el, { rules: [], inline: [], pseudo: new Map() });
    el.classList.forEach((c) => classes.add(c));
    tags.add(el.localName);
    if (el.id) elIds.add(el.id);
  }

  /** `name: value` pairs of a serialized declaration block, shorthands as the browser keeps them. */
  const declarations = (text: string): Declaration[] => {
    const out: Declaration[] = [];
    let depth = 0;
    let quote = '';
    let start = 0;
    const push = (part: string) => {
      const i = part.indexOf(':');
      if (i <= 0) return;
      const name = part.slice(0, i).trim();
      let value = part.slice(i + 1).trim();
      const important = /!\s*important$/i.test(value);
      if (important) value = value.replace(/!\s*important$/i, '').trim();
      if (name && value) out.push({ name, value, important });
    };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]!;
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = '';
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ';' && depth === 0) {
        push(text.slice(start, i));
        start = i + 1;
      }
    }
    push(text.slice(start));
    return out;
  };

  /** Splits a selector list at top-level commas. */
  const parts = (list: string): string[] => {
    const out: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < list.length; i++) {
      const ch = list[i];
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (ch === ',' && depth === 0) {
        out.push(list.slice(start, i).trim());
        start = i + 1;
      }
    }
    out.push(list.slice(start).trim());
    return out.filter(Boolean);
  };

  const queried = new Map<string, Element[]>();
  const pseudoRe = /::?(before|after|placeholder|marker)\s*$/i;
  const otherPseudoElement = /::[a-z-]+/i;
  /** Whether the last compound of a selector names a class, id or tag no target carries. */
  const cannotMatch = (sel: string): boolean => {
    // Escaped class names (Tailwind's `md\:flex`) are left to the browser to match.
    if (sel.includes('\\')) return false;
    const last = sel.split(/\s*[>+~\s]\s*(?![^(]*\))/).pop() ?? sel;
    const bare = last.replace(/\([^)]*\)/g, '');
    for (const m of bare.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) if (!classes.has(m[1]!)) return true;
    for (const m of bare.matchAll(/#(-?[_a-zA-Z][\w-]*)/g)) if (!elIds.has(m[1]!)) return true;
    const tag = /^([a-zA-Z][\w-]*)/.exec(bare)?.[1]?.toLowerCase();
    return Boolean(tag && !tags.has(tag));
  };

  // Cascade layers (D-098): every layer path in first-seen order, so ranks can follow the cascade.
  type LayerNode = { kids: Map<string, LayerNode>; path: string };
  const layerRoot: LayerNode = { kids: new Map(), path: '' };
  let anonymous = 0;
  const layerOf = (parent: string, name: string): string => {
    const segs = parent ? parent.split('.') : [];
    let node = layerRoot;
    for (const seg of segs) node = node.kids.get(seg)!;
    for (const seg of (name || `anon${++anonymous}`).split('.')) {
      if (!node.kids.has(seg)) node.kids.set(seg, { kids: new Map(), path: node.path ? `${node.path}.${seg}` : seg });
      node = node.kids.get(seg)!;
    }
    return node.path;
  };
  const layered: { rule: MatchedRuleOut; layer: string }[] = [];

  const styleRule = (rule: CSSStyleRule, media: string[], supports: string[], layer = '') => {
    const hits = new Map<Element, { matched: string[]; pseudo?: string }[]>();
    for (const part of parts(rule.selectorText)) {
      const p = pseudoRe.exec(part);
      const base = p ? part.slice(0, p.index).trim() || '*' : part;
      if (!p && otherPseudoElement.test(part)) continue;
      if (cannotMatch(base)) continue;
      let found = queried.get(base);
      if (found === undefined) {
        try {
          found = [...document.querySelectorAll(base)].filter((el) => byEl.has(el));
        } catch {
          found = [];
        }
        queried.set(base, found);
      }
      for (const el of found) {
        const list = hits.get(el) ?? [];
        const pseudo = p ? p[1]!.toLowerCase() : undefined;
        const same = list.find((h) => h.pseudo === pseudo);
        if (same) same.matched.push(part);
        else list.push({ matched: [part], pseudo });
        hits.set(el, list);
      }
    }
    if (!hits.size) return;
    const decls = declarations(rule.style.cssText);
    if (!decls.length) return;
    for (const [el, list] of hits) {
      const o = byEl.get(el)!;
      for (const h of list) {
        const r: MatchedRuleOut = { selector: rule.selectorText, matched: h.matched, origin: 'regular', media, supports, declarations: decls };
        if (layer) layered.push({ rule: r, layer });
        if (h.pseudo) o.pseudo.set(h.pseudo, [...(o.pseudo.get(h.pseudo) ?? []), r]);
        else o.rules.push(r);
      }
    }
  };

  const walk = (rules: CSSRuleList | undefined, media: string[], supports: string[], layer = '') => {
    if (!rules) return;
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) styleRule(rule, media, supports, layer);
      else if (rule instanceof CSSMediaRule) {
        if (window.matchMedia(rule.media.mediaText).matches) walk(rule.cssRules, [...media, rule.media.mediaText], supports, layer);
      } else if (rule instanceof CSSSupportsRule) {
        if (CSS.supports(rule.conditionText)) walk(rule.cssRules, media, [...supports, rule.conditionText], layer);
      } else if (typeof CSSLayerStatementRule !== 'undefined' && rule instanceof CSSLayerStatementRule) {
        for (const name of rule.nameList) layerOf(layer, name);
      } else if (typeof CSSLayerBlockRule !== 'undefined' && rule instanceof CSSLayerBlockRule) {
        walk(rule.cssRules, media, supports, layerOf(layer, rule.name));
      } else if (rule instanceof CSSImportRule) {
        const named = (rule as CSSImportRule & { layerName?: string | null }).layerName;
        try {
          walk(rule.styleSheet?.cssRules, media, supports, named === null || named === undefined ? layer : layerOf(layer, named));
        } catch {
          // a cross-origin import: its rules are not readable from the page
        }
      } else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules, media, supports, layer);
    }
  };

  [...document.styleSheets].forEach((sheet, index) => {
    if (sheet.ownerNode instanceof Element && sheet.ownerNode.hasAttribute('data-dse-capture')) return;
    let rules: CSSRuleList | undefined;
    try {
      rules = sheet.cssRules;
    } catch {
      const text = texts[index];
      if (!text) return;
      const copy = new CSSStyleSheet({ media: sheet.media.mediaText });
      try {
        copy.replaceSync(text);
      } catch {
        return;
      }
      rules = copy.cssRules;
    }
    if (sheet.media.mediaText && !window.matchMedia(sheet.media.mediaText).matches) return;
    walk(rules, sheet.media.mediaText ? [sheet.media.mediaText] : [], []);
  });
  for (const sheet of document.adoptedStyleSheets ?? []) walk(sheet.cssRules, [], []);
  // A layer's sublayers come before its own rules; all layers before unlayered rules.
  const rank = new Map<string, number>();
  const order = (node: LayerNode) => {
    for (const kid of node.kids.values()) order(kid);
    if (node.path) rank.set(node.path, rank.size);
  };
  order(layerRoot);
  for (const l of layered) l.rule.layerRank = rank.get(l.layer);

  const out: Record<string, { rules: MatchedRuleOut[]; inline: Declaration[]; pseudo: { pseudo: string; rules: MatchedRuleOut[] }[] }> = {};
  for (const [el, o] of byEl) {
    const style = el.getAttribute('style');
    out[el.getAttribute('data-dse-id')!] = {
      rules: o.rules,
      inline: style ? declarations((el as HTMLElement).style.cssText) : [],
      pseudo: [...o.pseudo].map(([pseudo, rules]) => ({ pseudo, rules })),
    };
  }
  return out;
}

type MatchedRuleOut = MatchedRule;

/**
 * Matched CSS for each data-dse-id from the page's CSSOM. Stylesheets the page cannot read are
 * fetched by the worker (`fetchText`, cached per run) and parsed by the browser as constructed sheets.
 */
export async function matchedFromCssom(page: Page, dseIds: string[], fetchText: (href: string) => Promise<string | null>): Promise<Record<string, MatchedStyles>> {
  if (!dseIds.length) return {};
  const unreadable = await page.evaluate(unreadableSheets);
  const texts: Record<number, string> = {};
  for (const u of unreadable) {
    const t = await fetchText(u.href);
    if (t) texts[u.index] = t;
  }
  return page.evaluate(matchInPage, { ids: dseIds, texts });
}
