// Runs inside the page: what the stylesheets say beyond computed styles. Self-contained.

export type RootVar = { name: string; value: string; resolved: string; scope: 'root' | 'theme' };
export type KeyframesRule = { name: string; css: string; condition?: string };

export type SheetScan = {
  media: string[];
  hasReducedMotionRule: boolean;
  googleFonts: string[];
  fontFaces: { family: string; src: string; weight: string; style: string }[];
  fonts: { family: string; status: string }[];
  crossOrigin: string[];
  /** Every `@keyframes` block, with the `@media` or `@supports` condition it sat in (motion-capture.md). */
  keyframes: KeyframesRule[];
  /** Custom properties declared on the root, `body` or a theme selector (token-clustering.md, Site variables). */
  rootVars: RootVar[];
};

/** `texts` holds the text of each stylesheet the page cannot read, by its index in document order (D-068). */
export function scanSheets(texts: Record<number, string> = {}): SheetScan {
  const media: string[] = [];
  let hasReducedMotionRule = false;
  const fontFaces: SheetScan['fontFaces'] = [];
  const crossOrigin: string[] = [];
  const keyframes: KeyframesRule[] = [];
  const declared = new Map<string, { name: string; value: string; scope: 'root' | 'theme'; on: Element }>();
  /** A selector with no combinator that names only the root, `body` or a theme: `:root`, `html.dark`, `[data-theme="dark"]`, `.theme-blue`. */
  const rootPart = /^(?::root|html|body)?(?:\.(?:dark|light|theme-[\w-]+)|\[data-(?:theme|mode)(?:[~|^$*]?=["']?[\w-]+["']?)?\]|:root)*$/i;
  const scopeOf = (selectorText: string): { scope: 'root' | 'theme'; on: Element } | null => {
    let found: { scope: 'root' | 'theme'; on: Element } | null = null;
    for (const raw of selectorText.split(',')) {
      const part = raw.trim();
      if (!part || !rootPart.test(part)) continue;
      const plain = /^(?::root|html|body)$/i.test(part);
      const on = /^body/i.test(part) && document.body ? document.body : document.documentElement;
      if (plain) return { scope: 'root', on };
      found ??= { scope: 'theme', on };
    }
    return found;
  };
  const visit = (rules: CSSRuleList, base: string, conditions: string[]) => {
    for (const r of [...rules]) {
      if (r instanceof CSSMediaRule) {
        media.push(r.conditionText);
        if (/prefers-reduced-motion/.test(r.conditionText)) hasReducedMotionRule = true;
      }
      if (r instanceof CSSKeyframesRule) {
        keyframes.push({ name: r.name, css: r.cssText, ...(conditions.length ? { condition: conditions.join(' and ') } : {}) });
        continue;
      }
      if (r instanceof CSSStyleRule) {
        const scope = scopeOf(r.selectorText);
        if (scope) {
          for (let i = 0; i < r.style.length; i++) {
            const name = r.style.item(i);
            if (!name.startsWith('--')) continue;
            // A theme selector never overrides what the root itself declares.
            const prev = declared.get(name);
            if (prev && prev.scope === 'root' && scope.scope === 'theme') continue;
            declared.set(name, { name, value: r.style.getPropertyValue(name).trim(), ...scope });
          }
        }
      }
      if (r instanceof CSSFontFaceRule) {
        const src = r.style.getPropertyValue('src');
        const url = /url\(\s*['"]?([^'")]+)['"]?\s*\)/.exec(src)?.[1];
        fontFaces.push({
          family: r.style.getPropertyValue('font-family').replace(/^['"]|['"]$/g, ''),
          src: url ? new URL(url, base).toString() : '',
          weight: r.style.getPropertyValue('font-weight') || '400',
          style: r.style.getPropertyValue('font-style') || 'normal',
        });
      }
      if (r instanceof CSSImportRule && r.styleSheet) {
        try {
          visit(r.styleSheet.cssRules, r.styleSheet.href ?? base, conditions);
        } catch {
          if (r.styleSheet.href) crossOrigin.push(r.styleSheet.href);
        }
      }
      if ('cssRules' in r && (r as CSSGroupingRule).cssRules && !(r instanceof CSSImportRule)) {
        const cond = r instanceof CSSMediaRule ? `@media ${r.conditionText}` : r instanceof CSSSupportsRule ? `@supports ${r.conditionText}` : null;
        visit((r as CSSGroupingRule).cssRules, base, cond ? [...conditions, cond] : conditions);
      }
    }
  };
  [...document.styleSheets].forEach((sheet, index) => {
    if (sheet.ownerNode instanceof Element && sheet.ownerNode.hasAttribute('data-dse-capture')) return;
    try {
      visit(sheet.cssRules, sheet.href ?? location.href, []);
    } catch {
      if (sheet.href) crossOrigin.push(sheet.href);
      const text = texts[index];
      if (!text) return;
      const copy = new CSSStyleSheet();
      try {
        copy.replaceSync(text);
      } catch {
        return;
      }
      visit(copy.cssRules, sheet.href ?? location.href, []);
    }
  });
  const googleFonts = [...document.querySelectorAll('link[href*="fonts.googleapis.com"]')].map((l) => (l as HTMLLinkElement).href);
  const fonts = [...document.fonts].map((f) => ({ family: f.family.replace(/^['"]|['"]$/g, ''), status: f.status }));
  const rootVars: RootVar[] = [...declared.values()].map((v) => ({ name: v.name, value: v.value, resolved: getComputedStyle(v.on).getPropertyValue(v.name).trim(), scope: v.scope }));
  return { media, hasReducedMotionRule, googleFonts, fontFaces, fonts, crossOrigin, keyframes, rootVars };
}
