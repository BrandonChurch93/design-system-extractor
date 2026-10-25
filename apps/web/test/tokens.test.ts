import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@dse/pipeline/color';
import { duration, ease, STAGGER, STAGGER_CAP } from '../lib/motion/timing';

const root = resolve(import.meta.dirname, '../../..');
const ds = readFileSync(resolve(root, 'docs/design/design-system.md'), 'utf8');
const motionMd = readFileSync(resolve(root, 'docs/design/motion.md'), 'utf8');
const css = readFileSync(resolve(import.meta.dirname, '../styles/tokens.css'), 'utf8');

const declared = new Map([...css.matchAll(/--(dse-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
const tok = (name: string) => declared.get(`dse-${name}`);

/** The rows of the first markdown table after a heading. */
function table(md: string, heading: string): string[][] {
  const start = md.indexOf(`\n## ${heading}\n`);
  expect(start, heading).toBeGreaterThan(-1);
  const lines = md.slice(start).split('\n');
  const first = lines.findIndex((l) => l.startsWith('|'));
  const rows: string[][] = [];
  for (const l of lines.slice(first + 2)) {
    if (!l.startsWith('|')) break;
    rows.push(l.split('|').slice(1, -1).map((c) => c.trim()));
  }
  return rows;
}
const code = (cell: string) => /`([^`]+)`/.exec(cell)?.[1] ?? cell;

describe('tokens.css matches design-system.md', () => {
  it('has every color with its exact value, and no undocumented color', () => {
    const rows = table(ds, 'Color');
    expect(rows.length).toBeGreaterThan(15);
    for (const [name, value] of rows) expect(tok(code(name!)), code(name!)).toBe(code(value!));
    const documented = new Set(rows.map((r) => code(r[0]!)));
    const colorish = [...declared.keys()].filter((k) => declared.get(k)!.startsWith('#')).map((k) => k.slice(4));
    for (const c of colorish) expect(documented.has(c), `${c} is in tokens.css but not documented`).toBe(true);
  });

  it('has every type style with size, line height, weight, tracking, family and phone size', () => {
    const rows = table(ds, 'Type').filter((r) => r.length >= 6 && r[0]!.includes('`'));
    expect(rows.length).toBe(18);
    for (const [style, family, sizeLine, weight, tracking, use] of rows) {
      const s = code(style!);
      const [size, line] = sizeLine!.split('/').map((v) => v.trim());
      expect(tok(`type-${s}-size`), `${s} size`).toBe(`${size}px`);
      expect(tok(`type-${s}-line`), `${s} line`).toBe(line);
      expect(tok(`type-${s}-weight`), `${s} weight`).toBe(weight);
      expect(tok(`type-${s}-tracking`), `${s} tracking`).toBe(tracking);
      expect(tok(`type-${s}-family`), `${s} family`).toBe(`var(--dse-font-${family})`);
      const phone = /(?:Fluid to )?(\d+(?:\.\d+)?) at phone/.exec(use!)?.[1];
      if (phone) expect(tok(`type-${s}-size-phone`), `${s} phone`).toBe(`${phone}px`);
      const xl = /(\d+) for the `xl`/.exec(use!)?.[1];
      if (xl) expect(tok(`type-${s}-size-xl`)).toBe(`${xl}px`);
    }
  });

  it('has every spacing, radius and shadow value', () => {
    for (const [name, value] of table(ds, 'Spacing')) expect(tok(code(name!)), code(name!)).toBe(`${value}px`);
    for (const [name, value] of table(ds, 'Radius')) expect(tok(code(name!)), code(name!)).toBe(`${value}px`);
    for (const [name, value] of table(ds, 'Shadow')) expect(tok(code(name!)), code(name!)).toBe(code(value!));
  });

  it('has the content width, gutters and measure', () => {
    expect(ds).toContain('Content width is 1160 px');
    expect(tok('content-width')).toBe('1160px');
    expect(tok('gutter')).toBe('40px');
    expect(tok('gutter-phone')).toBe('20px');
    expect(ds).toContain('at most 600 px');
    expect(tok('measure')).toBe('600px');
  });
});

describe('motion tokens match motion.md', () => {
  const rows = table(motionMd, 'Timings and easing');

  it('has every timing, easing and the stagger in CSS', () => {
    for (const [name, value] of rows) {
      const n = code(name!);
      const v = code(value!);
      if (n === 'stagger') {
        expect(tok('stagger')).toBe(`${/(\d+) ms/.exec(v)![1]}ms`);
        expect(tok('stagger-cap')).toBe(/cap (\d+)/.exec(v)![1]);
      } else if (n.startsWith('ease')) {
        expect(tok(n), n).toBe(v);
      } else {
        expect(tok(n), n).toBe(v.replace(' ', ''));
      }
    }
  });

  it('keeps the JavaScript timings equal to the CSS ones', () => {
    for (const k of ['fast', 'base', 'slow', 'stage'] as const) expect(`${Math.round(duration[k] * 1000)}ms`).toBe(tok(`motion-${k}`));
    expect(`cubic-bezier(${ease.standard.join(', ')})`).toBe(tok('ease-standard'));
    expect(`cubic-bezier(${ease.exit.join(', ')})`).toBe(tok('ease-exit'));
    expect(`${Math.round(STAGGER * 1000)}ms`).toBe(tok('stagger'));
    expect(String(STAGGER_CAP)).toBe(tok('stagger-cap'));
  });
});

describe('contrast table in design-system.md', () => {
  const rows = table(ds, 'Color').filter((r) => r[3] && /:1/.test(r[3]));

  it('lists ratios that meet their threshold and match the computed value within 0.05', () => {
    expect(rows.length).toBe(7);
    const value = (name: string) => tok(name)!;
    for (const [name, , use, contrast] of rows) {
      const n = code(name!);
      const isRing = n.startsWith('focus') || /ring/i.test(use!);
      const threshold = isRing ? 3 : 4.5;
      for (const m of contrast!.matchAll(/([\d.]+):1 on ([a-z-]+)/g)) {
        const printed = Number(m[1]);
        const ground = m[2]!;
        const computed = contrastRatio(value(n), value(ground));
        expect(Math.abs(printed - computed), `${n} on ${ground}: printed ${printed}, computed ${computed.toFixed(3)}`).toBeLessThanOrEqual(0.05);
        expect(computed, `${n} on ${ground}`).toBeGreaterThanOrEqual(threshold);
      }
    }
  });
});
