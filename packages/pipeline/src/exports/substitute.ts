import { hexOf, parseCssColor } from '../color/parse';
import type { ExportTokens } from './model';

// A component's CSS with token variables where a value maps (docs/design/components.md, Code;
// D-069), named as tokens.css names them, so the code and the token files read as one system.

const spaceProps = /^(padding|margin|gap|row-gap|column-gap)(-|$)/;
const radiusProps = /^border(-[a-z]+)*-radius$/;
const colorRe = /(rgba?|hsla?)\([^()]*\)|#[0-9a-fA-F]{3,8}\b/g;
const pxRe = /(^|[\s(,])(\d+(?:\.\d+)?)px\b/g;

export function withTokenVars(css: string, t: Pick<ExportTokens, 'colors' | 'space' | 'radius' | 'shadow'>): string {
  const colors = new Map<string, string>();
  for (const c of t.colors) {
    const rgba = parseCssColor(c.value);
    if (rgba) colors.set(hexOf(rgba), `var(--color-${c.name})`);
  }
  const space = new Map(t.space.filter((s) => s.value > 0).map((s) => [s.value, `var(--${s.name})`]));
  const radius = new Map(t.radius.filter((r) => !r.pill).map((r) => [r.value, `var(--${r.name})`]));
  const shadow = new Map(t.shadow.map((s) => [s.value.replace(/\s+/g, ' ').trim(), `var(--${s.name})`]));

  const value = (prop: string, v: string): string => {
    if (prop === 'box-shadow') {
      const s = shadow.get(v.replace(/\s+/g, ' ').trim());
      if (s) return s;
    }
    let out = v.replace(colorRe, (m) => {
      const rgba = parseCssColor(m);
      return (rgba && colors.get(hexOf(rgba))) ?? m;
    });
    const steps = spaceProps.test(prop) ? space : radiusProps.test(prop) ? radius : null;
    if (steps) out = out.replace(pxRe, (m, lead: string, n: string) => (steps.has(Number(n)) ? `${lead}${steps.get(Number(n))}` : m));
    return out;
  };

  // Declarations inside rule bodies only: selectors and at-rule preludes are left as they are.
  return css.replace(/\{([^{}]*)\}/g, (_, body: string) =>
    `{${body.replace(/(^|;)(\s*)(--[\w-]+|[a-z-]+)(\s*:\s*)([^;]*)/g, (m, sep: string, ws: string, prop: string, colon: string, v: string) =>
      prop.startsWith('--') ? m : `${sep}${ws}${prop}${colon}${value(prop, v.trimEnd())}${v.slice(v.trimEnd().length)}`,
    )}}`,
  );
}
