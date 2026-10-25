// Generates the clean, tailwind and css-in-js fixture sites from one source (site.ts).
// Run through `pnpm fixtures:build`; the output in fixtures/sites is committed.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { avatarSvg, documentFor, notFoundPage, pages, sitemap, type Impl } from './site';
import { extendTailwindMerge } from 'tailwind-merge';
import { twInput, twMap } from './tailwind-map';

// Custom theme sizes and utilities tailwind-merge must know so it resolves conflicts as Tailwind would.
const twMerge = extendTailwindMerge({ extend: { classGroups: { shadow: [{ shadow: ['card', 'raised'] }] } } });

const here = import.meta.dirname;
const sitesDir = resolve(here, '../../sites');
const cleanCss = readFileSync(join(here, 'clean.css'), 'utf8');

function write(file: string, content: string) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function emit(site: string, impl: Impl, scrolledClass: string) {
  const base = `/sites/${site}`;
  const dir = join(sitesDir, site);
  for (const page of [...pages, notFoundPage]) write(join(dir, page.file), documentFor(impl, page, base, scrolledClass));
  write(join(dir, 'sitemap.xml'), sitemap(base));
  write(join(dir, 'assets/avatar.svg'), avatarSvg);
}

// clean · semantic classes and one stylesheet.
export function buildClean() {
  const impl: Impl = { name: 'clean', c: (...n) => n.join(' '), s: () => '', head: '<link rel="stylesheet" href="/sites/clean/styles.css">' };
  emit('clean', impl, 'is-scrolled');
  write(join(sitesDir, 'clean/styles.css'), cleanCss);
}

// css-in-js · every class hashed, colors through custom properties, some declarations inline.
const colorVars: Record<string, string> = {
  '#0B1F3A': '--c-ink',
  '#2458E6': '--c-primary',
  '#0F8A8A': '--c-accent',
  '#15803D': '--c-success',
  '#B45309': '--c-warning',
  '#DC2626': '--c-danger',
  '#FFFFFF': '--c-surface',
  '#E2E8F0': '--c-border',
};
const inlineMoves: Record<string, string[]> = {
  card: ['padding'],
  hero: ['max-width'],
  'page-head': ['padding'],
  'footer-inner': ['gap'],
};
const styledNames = new Set(['btn', 'card', 'badge', 'input', 'tab', 'nav-link']);

function hashOf(name: string): string {
  const h = createHash('sha1').update(`dse-fixture:${name}`).digest('hex');
  return styledNames.has(name) ? `sc-${h.slice(0, 5)}` : `css-${h.slice(0, 7)}`;
}

/** Rewrites class names in selectors only, leaving declaration values (URLs, numbers) alone. */
function hashSelectors(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf('{', i);
    if (open < 0) {
      out += source.slice(i);
      break;
    }
    const raw = source.slice(i, open);
    // Statements before the selector (comments, @import, a closing brace) end at the last ';', '*/' or '}'.
    const cut = Math.max(raw.lastIndexOf(';'), raw.lastIndexOf('*/') + 1, raw.lastIndexOf('}'));
    const before = cut > 0 ? raw.slice(0, cut + 1) : '';
    const prelude = cut > 0 ? raw.slice(cut + 1) : raw;
    const isAt = prelude.trim().startsWith('@');
    out += before + (isAt ? prelude : prelude.replace(/\.([a-z][a-z0-9-]*(?:--[a-z0-9-]+)?)/g, (_m, name: string) => `.${hashOf(name)}`));
    out += '{';
    i = open + 1;
    if (isAt) continue;
    const close = source.indexOf('}', i);
    out += source.slice(i, close + 1);
    i = close + 1;
  }
  return out;
}

export function buildCssInJs() {
  const declsFor = new Map<string, string[]>();
  let css = hashSelectors(cleanCss);
  for (const [hex, v] of Object.entries(colorVars)) css = css.replaceAll(hex, `var(${v})`);
  // Move listed declarations out of each single-class rule into inline styles.
  for (const [name, props] of Object.entries(inlineMoves)) {
    const sel = `.${hashOf(name)} {`;
    const start = css.indexOf(sel);
    if (start < 0) throw new Error(`no rule for ${name}`);
    const end = css.indexOf('}', start);
    let body = css.slice(start + sel.length, end);
    const moved: string[] = [];
    for (const prop of props) {
      const re = new RegExp(`\\s*${prop}:\\s*([^;]+);`);
      const m = re.exec(body);
      if (!m) throw new Error(`no ${prop} in ${name}`);
      moved.push(`${prop}: ${m[1]!.trim()}`);
      body = body.replace(re, '');
    }
    for (const [hex, v] of Object.entries(colorVars)) moved.forEach((d, i) => (moved[i] = d.replaceAll(`var(${v})`, hex)));
    declsFor.set(name, moved);
    css = css.slice(0, start + sel.length) + body + css.slice(end);
  }
  const root = `:root { ${Object.entries(colorVars).map(([hex, v]) => `${v}: ${hex};`).join(' ')} }\n`;
  const impl: Impl = {
    name: 'css-in-js',
    c: (...n) => n.map(hashOf).join(' '),
    s: (name) => (declsFor.get(name) ?? []).join('; '),
    // @import must stay the first rule, so the custom properties go right after it.
    head: `<style data-emotion="css">\n${css.replace(/(@import[^;]*;\n)/, `$1${root}`)}</style>`,
  };
  emit('css-in-js', impl, hashOf('is-scrolled'));
}

// tailwind · utility classes; the CSS is compiled from the generated HTML by the Tailwind CLI.
export const tailwindInputFile = join(here, 'tailwind.input.css');

export function buildTailwind() {
  const impl: Impl = {
    name: 'tailwind',
    c: (...n) =>
      n
        .map((name) => {
          const v = twMap[name];
          if (v === undefined) throw new Error(`no Tailwind mapping for ${name}`);
          return v;
        })
        .filter(Boolean)
        .reduce((acc, cls) => twMerge(acc, cls), ''),
    s: () => '',
    head: '<link rel="stylesheet" href="/fonts/inter/inter.css">\n<link rel="stylesheet" href="/sites/tailwind/styles.css">',
  };
  emit('tailwind', impl, twMap['is-scrolled']!);
  write(tailwindInputFile, twInput);
}

export function buildAll() {
  buildClean();
  buildCssInJs();
  buildTailwind();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildAll();
  console.log('fixtures · clean, css-in-js and tailwind generated');
}
