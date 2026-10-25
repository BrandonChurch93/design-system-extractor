// Functions evaluated inside the crawled page. Each is self-contained: no closures, no imports.

export type FoundLink = { href: string; where: 'header' | 'footer' | 'nav' | 'body' };

export function extractLinks(): FoundLink[] {
  const zone = (el: Element): FoundLink['where'] => {
    for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
      const tag = n.tagName.toLowerCase();
      const role = n.getAttribute('role');
      const idc = `${n.id} ${typeof n.className === 'string' ? n.className : ''}`.toLowerCase();
      if (tag === 'header' || role === 'banner' || /header/.test(idc)) return 'header';
      if (tag === 'footer' || role === 'contentinfo' || /footer/.test(idc)) return 'footer';
      if (tag === 'nav' || role === 'navigation' || /nav|menu/.test(idc)) return 'nav';
    }
    return 'body';
  };
  return [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.getAttribute('href') ?? '', where: zone(a) }));
}

export function classLists(): string[][] {
  return [...document.querySelectorAll('[class]')].map((el) => (typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean) : []));
}

/** Dark theme rules in same-origin sheets, plus cross-origin sheet URLs to fetch and scan. */
export function darkThemeScan(): { found: boolean; crossOrigin: string[] } {
  let found = false;
  const crossOrigin: string[] = [];
  const visit = (rules: CSSRuleList) => {
    for (const r of [...rules]) {
      if (r instanceof CSSMediaRule && /prefers-color-scheme\s*:\s*dark/.test(r.conditionText)) found = true;
      if (r instanceof CSSStyleRule && /\[data-theme|\.dark\b|\.theme-dark\b/.test(r.selectorText)) found = true;
      if ('cssRules' in r && (r as CSSGroupingRule).cssRules) visit((r as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of [...document.styleSheets]) {
    try {
      visit(sheet.cssRules);
    } catch {
      if (sheet.href) crossOrigin.push(sheet.href);
    }
  }
  if (document.querySelector('[data-theme]')) found = true;
  return { found, crossOrigin };
}

/** Clicks the accept or close button inside a consent container, if there is one. */
export function dismissConsent(): string | null {
  const container = /cookie|consent|gdpr|privacy-banner/i;
  const accept = /^(accept|accept all|agree|i agree|got it|ok|okay|allow all|dismiss|close)$/i;
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const candidates = [...document.querySelectorAll('body *')].filter((el) => {
    const idc = `${el.id} ${typeof el.className === 'string' ? el.className : ''} ${el.getAttribute('aria-label') ?? ''}`;
    return container.test(idc) && visible(el);
  });
  for (const c of candidates) {
    const buttons = [...c.querySelectorAll('button, [role=button], a, input[type=button], input[type=submit]')].filter(visible) as HTMLElement[];
    const hit = buttons.find((b) => accept.test((b.innerText || (b as HTMLInputElement).value || '').trim()));
    if (hit) {
      hit.click();
      return `${(hit.innerText || 'button').trim()} in ${c.id ? `#${c.id}` : c.tagName.toLowerCase()}`;
    }
    const close = buttons.find((b) => /^close$/i.test(b.getAttribute('aria-label') ?? '') || (b.innerText || '').trim() === '×');
    if (close) {
      close.click();
      return `close in ${c.id ? `#${c.id}` : c.tagName.toLowerCase()}`;
    }
  }
  return null;
}

export function loginFacts(): { formCount: number; hasPassword: boolean; textLength: number } {
  const main = document.querySelector('main') ?? document.body;
  return {
    formCount: main.querySelectorAll('form').length,
    hasPassword: Boolean(main.querySelector('input[type=password]')),
    textLength: (main.innerText || '').replace(/\s+/g, ' ').trim().length,
  };
}

export function titleAndH1(): { title: string; h1: string } {
  const clip = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 120);
  return { title: clip(document.title || ''), h1: clip(document.querySelector('h1')?.textContent ?? '') };
}
