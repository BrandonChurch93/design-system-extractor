// Every `var(--…)` an export writes names a property the same file declares (docs/specs/exports-and-mcp.md,
// the variable-resolution assertion; D-090). Site values are resolved through each other and through
// `var()` fallbacks; what still names a property the site sets on an element at runtime is left out.

type Ref = { start: number; end: number; name: string; fallback?: string };

/** The `var(…)` references at the top level of a value, with balanced parentheses. */
function refsOf(v: string): Ref[] {
  const out: Ref[] = [];
  const re = /var\(\s*(--[\w-]+)\s*(,)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(v))) {
    let depth = 1;
    let i = re.lastIndex;
    for (; i < v.length && depth > 0; i++) {
      if (v[i] === '(') depth++;
      else if (v[i] === ')') depth--;
    }
    out.push({ start: m.index, end: i, name: m[1]!, ...(m[2] ? { fallback: v.slice(re.lastIndex, i - 1).trim() } : {}) });
    re.lastIndex = i;
  }
  return out;
}

/**
 * A value with every reference to an undeclared property replaced by its fallback (resolved the same
 * way), or null when one has none. `inline` resolves a reference to a known site value in place
 * instead of keeping it.
 */
export function closeValue(v: string, known: (name: string) => boolean, inline?: (name: string) => string | null): string | null {
  let out = '';
  let at = 0;
  for (const r of refsOf(v)) {
    out += v.slice(at, r.start);
    at = r.end;
    if (known(r.name)) {
      out += v.slice(r.start, r.end);
      continue;
    }
    const own = inline?.(r.name);
    if (own != null) {
      out += own;
      continue;
    }
    if (r.fallback === undefined) return null;
    const fb = closeValue(r.fallback, known, inline);
    if (fb === null) return null;
    out += fb;
  }
  return out + v.slice(at);
}

/**
 * The site variables an export can declare: each one's value (the root's computed value, else the
 * value the site declared, for a variable set on a theme class), with references to other site
 * variables and to token variables kept when those resolve and fallbacks taken otherwise; and the
 * same value with every reference inlined, for a data file that declares nothing. A variable that
 * cannot resolve is left out.
 */
export function resolveSiteVariables<T extends { name: string; value: string; resolved: string }>(vars: T[], tokenValues: Map<string, string>): (T & { written: string; literal: string })[] {
  const byName = new Map(vars.map((v) => [v.name, v]));
  const written = new Map<string, string | null>();
  const resolve = (name: string, seen: Set<string>): string | null => {
    if (written.has(name)) return written.get(name)!;
    const v = byName.get(name);
    if (!v || seen.has(name)) return null;
    const raw = v.resolved && !/var\(/.test(v.resolved) ? v.resolved : v.value || v.resolved;
    const next = new Set(seen).add(name);
    const out = raw ? closeValue(raw, (n) => tokenValues.has(n) || (byName.has(n) && resolve(n, next) !== null)) : null;
    written.set(name, out === '' ? null : out);
    return written.get(name)!;
  };
  const literals = new Map<string, string | null>();
  const literal = (name: string, seen: Set<string>): string | null => {
    if (literals.has(name)) return literals.get(name)!;
    const w = resolve(name, new Set());
    if (w === null || seen.has(name)) return null;
    const next = new Set(seen).add(name);
    const out = closeValue(w, () => false, (n) => tokenValues.get(n) ?? literal(n, next));
    literals.set(name, out);
    return out;
  };
  return vars.flatMap((v) => {
    const w = resolve(v.name, new Set());
    const l = w === null ? null : literal(v.name, new Set());
    return w === null || l === null ? [] : [{ ...v, written: w, literal: l }];
  });
}

/** CSS rules with each declaration closed over the declared names; one that cannot close is left out with a comment. */
export function sealCss(css: string, known: (name: string) => boolean): string {
  return css.replace(/\{([^{}]*)\}/g, (_, body: string) =>
    `{${body.replace(/(^|;)(\s*)(--[\w-]+|[a-z-]+)(\s*:\s*)([^;]*)/g, (m, sep: string, ws: string, prop: string, colon: string, v: string) => {
      if (!/var\(/.test(v)) return m;
      const closed = closeValue(v, known);
      if (closed !== null) return `${sep}${ws}${prop}${colon}${closed}`;
      return `${sep}${ws}/* ${prop} left out: it reads ${missing(v, known).join(', ')}, which the site sets at runtime */`;
    })}}`,
  );
}

/** A @keyframes block closed over the declared names, or a comment naming what it reads when it cannot be. */
export function sealKeyframes(name: string, css: string, known: (name: string) => boolean): string {
  const sealed = sealCss(css, known);
  if (!/left out:/.test(sealed)) return sealed;
  return `/* @keyframes ${name} left out: it reads ${missing(css, known).join(', ')}, which the site sets on the element at runtime */`;
}

function missing(v: string, known: (name: string) => boolean): string[] {
  return [...new Set([...v.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!).filter((n) => !known(n)))];
}

/** Markup whose attributes name only declared properties: a fallback where one is given, else the attribute is left out. */
export function sealHtml(html: string, known: (name: string) => boolean): string {
  return html.replace(/\s([\w:-]+)="([^"]*var\(--[^"]*)"/g, (m, attr: string, v: string) => {
    if (attr === 'style') {
      const kept = v.split(';').flatMap((d) => {
        const closed = /var\(/.test(d) ? closeValue(d, known) : d;
        return closed === null || !closed.trim() ? [] : [closed.trim()];
      });
      return kept.length ? ` style="${kept.join('; ')}"` : '';
    }
    const closed = closeValue(v, known);
    return closed === null ? '' : ` ${attr}="${closed}"`;
  });
}
