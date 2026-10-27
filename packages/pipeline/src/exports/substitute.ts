import type { Component } from '@dse/schema';
import { hexOf, parseCssColor } from '../color/parse';
import type { ExportTokens } from './model';

// A component's CSS with token variables where a value maps (docs/design/components.md, Code;
// D-069, D-083), named as this export's tokens.css names them, so the code and the token files read
// as one system and a variable the code names is always declared beside it.

const spaceProps = /^(padding|margin|gap|row-gap|column-gap)(-|$)/;
const radiusProps = /^border(-[a-z]+)*-radius$/;
const motionProps = /^(transition|animation)(-duration|-delay|-timing-function)?$/;
const colorRe = /(rgba?|hsla?)\([^()]*\)|#[0-9a-fA-F]{3,8}\b/g;
const pxRe = /(^|[\s(,])(\d+(?:\.\d+)?)px\b/g;
const timeRe = /(^|[\s,])(\d*\.?\d+)(ms|s)\b/g;
const easingRe = /cubic-bezier\([^()]*\)|steps\([^()]*\)|\b(ease-in-out|ease-in|ease-out|ease|linear)\b/g;

const normEasing = (v: string) => v.replace(/\s+/g, '').toLowerCase();

/** Applies a rewrite to the parts of a value outside `var(…)`, so a variable's own name is never rewritten. */
function outsideVars(v: string, fn: (part: string) => string): string {
  return v
    .split(/(var\([^()]*(?:\([^()]*\)[^()]*)*\))/)
    .map((part, i) => (i % 2 ? part : fn(part)))
    .join('');
}

export function withTokenVars(css: string, t: Pick<ExportTokens, 'colors' | 'space' | 'radius' | 'shadow'> & Partial<Pick<ExportTokens, 'durations' | 'easings' | 'overlays'>>): string {
  const colors = new Map<string, string>();
  for (const c of [...t.colors, ...(t.overlays ?? [])]) {
    const rgba = parseCssColor(c.value);
    if (rgba) colors.set(hexOf(rgba), `var(${c.var})`);
  }
  const space = new Map(t.space.filter((s) => s.value > 0).map((s) => [s.value, `var(${s.var})`]));
  const radius = new Map(t.radius.filter((r) => !r.pill).map((r) => [r.value, `var(${r.var})`]));
  const shadow = new Map(t.shadow.map((s) => [s.value.replace(/\s+/g, ' ').trim(), `var(${s.var})`]));
  const durations = new Map((t.durations ?? []).map((d) => [d.ms, `var(${d.var})`]));
  const easings = new Map((t.easings ?? []).map((e) => [normEasing(e.value), `var(${e.var})`]));

  const value = (prop: string, v: string): string => {
    if (prop === 'box-shadow') {
      const s = shadow.get(v.replace(/\s+/g, ' ').trim());
      if (s) return s;
    }
    let out = outsideVars(v, (part) =>
      part.replace(colorRe, (m) => {
        const rgba = parseCssColor(m);
        return (rgba && colors.get(hexOf(rgba))) ?? m;
      }),
    );
    const steps = spaceProps.test(prop) ? space : radiusProps.test(prop) ? radius : null;
    if (steps) out = outsideVars(out, (part) => part.replace(pxRe, (m, lead: string, n: string) => (steps.has(Number(n)) ? `${lead}${steps.get(Number(n))}` : m)));
    if (motionProps.test(prop)) {
      out = outsideVars(out, (part) =>
        part
          .replace(timeRe, (m, lead: string, n: string, unit: string) => {
            const ms = Math.round(unit === 's' ? Number(n) * 1000 : Number(n));
            return ms > 0 && durations.has(ms) ? `${lead}${durations.get(ms)}` : m;
          })
          .replace(easingRe, (m) => easings.get(normEasing(m)) ?? m),
      );
    }
    return out;
  };

  // Declarations inside rule bodies only: selectors and at-rule preludes are left as they are.
  return css.replace(/\{([^{}]*)\}/g, (_, body: string) =>
    `{${body.replace(/(^|;)(\s*)(--[\w-]+|[a-z-]+)(\s*:\s*)([^;]*)/g, (m, sep: string, ws: string, prop: string, colon: string, v: string) =>
      prop.startsWith('--') ? m : `${sep}${ws}${prop}${colon}${value(prop, v.trimEnd())}${v.slice(v.trimEnd().length)}`,
    )}}`,
  );
}

/** A component's exported CSS: its stored code with this export's token variables. */
export function componentCss(c: Pick<Component, 'code'>, t: ExportTokens): string {
  return c.code.css ? withTokenVars(c.code.css, t) : '';
}
