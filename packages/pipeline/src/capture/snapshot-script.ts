// Runs inside the page (docs/specs/capture-and-states.md, DOM snapshot). Self-contained.

export const styleProps = [
  'color',
  'background-color',
  'background-image',
  'border-top-color',
  'border-top-width',
  'border-top-style',
  'border-right-color',
  'border-right-width',
  'border-right-style',
  'border-bottom-color',
  'border-bottom-width',
  'border-bottom-style',
  'border-left-color',
  'border-left-width',
  'border-left-style',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'box-shadow',
  'outline-color',
  'outline-width',
  'outline-style',
  'outline-offset',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-transform',
  'text-decoration-line',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'gap',
  'row-gap',
  'column-gap',
  'width',
  'height',
  'min-height',
  'display',
  'position',
  'opacity',
  'fill',
  'stroke',
  'cursor',
  'animation-name',
  'transition-property',
  'transition-duration',
  'flex-direction',
  'visibility',
  'transform',
  'translate',
  'scale',
  'rotate',
  'filter',
  'backdrop-filter',
  'text-decoration-color',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'transition-timing-function',
  'transition-delay',
  'box-sizing',
  // Inherited text rendering the preview root carries from the element's parent (D-098).
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
  'word-spacing',
  'text-align',
  'white-space',
  // Where an ancestor clips the element, the render check compares the part that shows (D-098).
  'overflow-x',
  'overflow-y',
  // Container query units resolve against the nearest container (D-098).
  'container-type',
  'container-name',
  // The hidden-at-capture rule reads both (D-108).
  'clip',
  'clip-path',
] as const;

/** Longhands the freeze removes, so they are kept from the snapshot taken before it (capture-and-states.md, 2b). */
export const motionProps = [
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
] as const;

export type RawElement = {
  /** data-dse-id */
  d: string;
  /** parent index in the array, -1 for top */
  p: number;
  tag: string;
  id: string;
  cls: string[];
  role: string | null;
  type: string | null;
  href: boolean;
  disabled: boolean;
  aria: Record<string, string>;
  attrs: Record<string, string>;
  /** text content, truncated to 80 */
  text: string;
  /** own text nodes only */
  own: string;
  children: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vis: boolean;
  st: string[];
  /** font family actually available, from document.fonts.check */
  font: string;
  focusable: boolean;
  tab?: boolean;
};

export type SnapshotResult = { elements: RawElement[]; truncated: boolean; docW: number; docH: number; nodeCount: number; title: string; h1: string };

export function takeSnapshot(args: { props: string[]; cap: number; root?: string; prefix?: string }): SnapshotResult {
  const { props, cap } = args;
  const prefix = args.prefix ?? 'e';
  // Past the cap only element candidates and their ancestors are recorded (docs/specs/capture-and-states.md).
  let keep: Set<Element> | null = null;
  const pastCap = (el: Element) => {
    if (!keep) {
      keep = new Set();
      for (const c of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role], [aria-haspopup]')) {
        for (let a: Element | null = c; a && !keep.has(a); a = a.parentElement) keep.add(a);
      }
    }
    return !keep.has(el);
  };
  const out: RawElement[] = [];
  const index = new Map<Element, number>();
  // One counter per page and prefix: a second snapshot must never hand out an id an element already carries (D-098).
  const counters = ((window as unknown as { __dseIds?: Record<string, number> }).__dseIds ??= {});
  let truncated = false;
  const sx = window.scrollX;
  const sy = window.scrollY;
  const fontCache = new Map<string, string>();
  const resolveFont = (stack: string, size: string, weight: string) => {
    const key = `${stack}|${weight}`;
    const hit = fontCache.get(key);
    if (hit !== undefined) return hit;
    const families = stack.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, ''));
    let found = families[0] ?? '';
    for (const f of families) {
      try {
        if (document.fonts.check(`${weight} ${size} "${f}"`)) {
          found = f;
          break;
        }
      } catch {
        // an invalid family name in the stack
      }
    }
    fontCache.set(key, found);
    return found;
  };
  const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'TITLE']);
  const isFocusable = (el: Element) => {
    const h = el as HTMLElement;
    if (h.tabIndex < 0) return false;
    if ((h as HTMLButtonElement).disabled) return false;
    return h.matches('a[href], button, input:not([type=hidden]), select, textarea, [tabindex], [contenteditable=true], summary');
  };
  const walk = (el: Element, parent: number) => {
    if (skip.has(el.tagName)) return;
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const zero = rect.width === 0 && rect.height === 0;
    const vis = !zero && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0 && rect.right + sx > -1000 && rect.bottom + sy > -1000;
    let me = parent;
    const isSvgChild = el.namespaceURI === 'http://www.w3.org/2000/svg' && el.tagName.toLowerCase() !== 'svg';
    if (!isSvgChild && (!zero || cs.display === 'contents' || el.children.length)) {
      if (out.length >= cap && pastCap(el)) {
        truncated = true;
      } else {
        let dse = el.getAttribute('data-dse-id');
        if (!dse) {
          dse = `${prefix}${(counters[prefix] = (counters[prefix] ?? 0) + 1) - 1}`;
          el.setAttribute('data-dse-id', dse);
        }
        const aria: Record<string, string> = {};
        const attrs: Record<string, string> = {};
        for (const a of [...el.attributes]) {
          if (a.name.startsWith('aria-')) aria[a.name] = a.value.slice(0, 200);
          else if (['for', 'name', 'placeholder', 'title', 'alt', 'tabindex', 'checked', 'selected', 'open', 'value', 'action', 'method', 'src', 'width', 'height', 'id', 'href'].includes(a.name)) attrs[a.name] = a.value.slice(0, 200);
        }
        let own = '';
        for (const n of [...el.childNodes]) if (n.nodeType === 3) own += n.textContent ?? '';
        own = own.replace(/\s+/g, ' ').trim();
        const text = ((el as HTMLElement).innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
        const st = props.map((p) => cs.getPropertyValue(p));
        me = out.length;
        index.set(el, me);
        out.push({
          d: dse,
          p: parent,
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          cls: typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean) : [...((el as SVGElement).classList ?? [])],
          role: el.getAttribute('role'),
          type: el.getAttribute('type'),
          href: el.hasAttribute('href'),
          disabled: (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true',
          aria,
          attrs,
          text,
          own: own.slice(0, 200),
          children: el.children.length,
          x: Math.round((rect.left + sx) * 100) / 100,
          y: Math.round((rect.top + sy) * 100) / 100,
          w: Math.round(rect.width * 100) / 100,
          h: Math.round(rect.height * 100) / 100,
          vis,
          st,
          font: own ? resolveFont(cs.fontFamily, cs.fontSize, cs.fontWeight) : '',
          focusable: vis && isFocusable(el),
          tab: isFocusable(el),
        });
      }
    }
    if (el.tagName.toLowerCase() === 'svg') {
      // Svg children are not in the snapshot, so the paint a class rule or a custom property gave them is written on them (D-098).
      for (const c of el.querySelectorAll('*')) {
        const ccs = getComputedStyle(c);
        const pcs = c.parentElement ? getComputedStyle(c.parentElement) : cs;
        for (const a of ['fill', 'stroke'] as const) {
          const v = ccs.getPropertyValue(a);
          if (/var\(/.test(c.getAttribute(a) ?? '') || (c.getAttribute('class') && v !== pcs.getPropertyValue(a) && v !== ccs.color)) c.setAttribute(`data-dse-${a}`, v);
        }
      }
      return;
    }
    for (const c of [...el.children]) walk(c, me);
  };
  const start = args.root ? document.querySelector(args.root) : document.body;
  if (start) walk(start, -1);
  const doc = document.documentElement;
  return {
    elements: out,
    truncated,
    docW: Math.max(doc.scrollWidth, document.body.scrollWidth),
    docH: Math.max(doc.scrollHeight, document.body.scrollHeight),
    nodeCount: document.getElementsByTagName('*').length,
    title: (document.title || '').replace(/\s+/g, ' ').trim().slice(0, 120),
    h1: (document.querySelector('h1')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
  };
}

/** Stable selectors (docs/specs/capture-and-states.md, Selectors) for the given data-dse-ids. */
export function buildSelectors(ids: string[]): Record<string, string> {
  const hashed = /[0-9a-f]{5,}|^css-|^sc-|^_/;
  const esc = (s: string) => CSS.escape(s);
  const unique = (sel: string) => {
    try {
      return document.querySelectorAll(sel).length === 1;
    } catch {
      return false;
    }
  };
  const goodClasses = (el: Element) => (typeof el.className === 'string' ? el.className.split(/\s+/).filter((c) => c && !hashed.test(c)) : []);
  const segment = (el: Element) => {
    const cls = goodClasses(el).slice(0, 3);
    return `${el.tagName.toLowerCase()}${cls.map((c) => `.${esc(c)}`).join('')}`;
  };
  const nth = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    const parent = el.parentElement;
    if (!parent) return tag;
    const same = [...parent.children].filter((c) => c.tagName === el.tagName);
    return same.length === 1 ? tag : `${tag}:nth-of-type(${same.indexOf(el) + 1})`;
  };
  const stable = (el: Element): string | null => {
    if (el.id && !hashed.test(el.id) && unique(`#${esc(el.id)}`)) return `#${esc(el.id)}`;
    const chain: string[] = [];
    for (let n: Element | null = el; n && n !== document.documentElement && chain.length < 4; n = n.parentElement) {
      if (!goodClasses(n).length && n !== el) continue;
      chain.unshift(segment(n));
      const sel = chain.join(' ');
      if (goodClasses(el).length && unique(sel)) return sel;
    }
    return null;
  };
  const out: Record<string, string> = {};
  for (const id of ids) {
    const el = document.querySelector(`[data-dse-id="${id}"]`);
    if (!el) continue;
    let sel = stable(el);
    if (!sel) {
      const parts: string[] = [];
      let n: Element | null = el;
      while (n && n !== document.body) {
        const s: string | null = n !== el ? stable(n) : null;
        if (s) {
          parts.unshift(s);
          break;
        }
        parts.unshift(nth(n));
        n = n.parentElement;
      }
      if (!n || n === document.body) parts.unshift('body');
      sel = parts.join(' > ');
    }
    out[id] = sel;
  }
  return out;
}
