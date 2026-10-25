// Runs inside the page: what the stylesheets say beyond computed styles. Self-contained.

export type SheetScan = {
  media: string[];
  hasReducedMotionRule: boolean;
  googleFonts: string[];
  fontFaces: { family: string; src: string; weight: string; style: string }[];
  fonts: { family: string; status: string }[];
  crossOrigin: string[];
};

export function scanSheets(): SheetScan {
  const media: string[] = [];
  let hasReducedMotionRule = false;
  const fontFaces: SheetScan['fontFaces'] = [];
  const crossOrigin: string[] = [];
  const visit = (rules: CSSRuleList, base: string) => {
    for (const r of [...rules]) {
      if (r instanceof CSSMediaRule) {
        media.push(r.conditionText);
        if (/prefers-reduced-motion/.test(r.conditionText)) hasReducedMotionRule = true;
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
          visit(r.styleSheet.cssRules, r.styleSheet.href ?? base);
        } catch {
          if (r.styleSheet.href) crossOrigin.push(r.styleSheet.href);
        }
      }
      if ('cssRules' in r && (r as CSSGroupingRule).cssRules && !(r instanceof CSSImportRule)) visit((r as CSSGroupingRule).cssRules, base);
    }
  };
  for (const sheet of [...document.styleSheets]) {
    try {
      visit(sheet.cssRules, sheet.href ?? location.href);
    } catch {
      if (sheet.href) crossOrigin.push(sheet.href);
    }
  }
  const googleFonts = [...document.querySelectorAll('link[href*="fonts.googleapis.com"]')].map((l) => (l as HTMLLinkElement).href);
  const fonts = [...document.fonts].map((f) => ({ family: f.family.replace(/^['"]|['"]$/g, ''), status: f.status }));
  return { media, hasReducedMotionRule, googleFonts, fontFaces, fonts, crossOrigin };
}
