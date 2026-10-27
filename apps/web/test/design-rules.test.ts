import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { oklabToOklch, parseCssColor, rgbToOklab } from '@dse/pipeline/color';
import { NEUTRAL_CHROMA } from '@dse/pipeline/tokens/constants';

// docs/design/design-system.md: tokens live once in tokens.css and nothing else defines a color,
// type size, radius or shadow; the chrome has no chroma; no uppercase; Lucide at stroke 1.75; no emoji.

const web = resolve(import.meta.dirname, '..');
const root = resolve(web, '../..');
const ds = readFileSync(resolve(root, 'docs/design/design-system.md'), 'utf8');
const tokensCss = readFileSync(resolve(web, 'styles/tokens.css'), 'utf8');

function walk(dir: string): string[] {
  return readdirSync(resolve(web, dir), { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return [];
    const p = dir ? `${dir}/${e.name}` : e.name;
    return e.isDirectory() ? walk(p) : [p];
  });
}
const all = walk('').sort();
const cssFiles = all.filter((f) => f.endsWith('.css') && f !== 'styles/tokens.css');
const tsxFiles = all.filter((f) => /^(app|components)\/.*\.tsx$/.test(f));

type Decl = { file: string; line: number; prop: string; value: string };
function declarations(file: string): Decl[] {
  const text = readFileSync(resolve(web, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  return [...text.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map((m) => ({ file, line: text.slice(0, m.index).split('\n').length, prop: m[1]!, value: m[2]!.trim() }));
}
const decls = cssFiles.flatMap(declarations);
const at = (d: Decl) => `${d.file}:${d.line} ${d.prop}: ${d.value}`;

const NAMED =
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen canvas canvastext linktext graytext buttonface buttontext field fieldtext highlight highlighttext mark marktext accentcolor accentcolortext';
const named = new RegExp(`(^|[\\s,(])(${NAMED.split(' ').join('|')})(?=$|[\\s,)])`, 'i');
const literalColor = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i;
const onlyVars = (v: string) => /^var\(--dse-[a-z0-9-]+\)$/.test(v);

describe('no component defines its own color, size, radius or shadow', () => {
  it('scans every stylesheet of the app', () => {
    expect(cssFiles.length).toBeGreaterThan(60);
    expect(cssFiles).toContain('components/Button.module.css');
  });

  it('writes no literal color: every color comes from a token', () => {
    // A mask image is read for its alpha only; nothing in it is painted.
    const found = decls.filter((d) => !/^(-webkit-)?mask(-image)?$/.test(d.prop) && (literalColor.test(d.value) || named.test(d.value)));
    expect(found.map(at)).toEqual([]);
  });

  it('sets every font size from a type token', () => {
    const found = decls.filter((d) => (d.prop === 'font-size' || d.prop === 'font') && !onlyVars(d.value) && d.value !== 'inherit');
    expect(found.map(at)).toEqual([]);
  });

  it('sets every radius from a radius token, or 0, or a 50% circle', () => {
    const radii = new Set([...tokensCss.matchAll(/(--dse-radius-[a-z]+):/g)].map((m) => m[1]));
    const corner = (v: string) => radii.has(/^var\((--dse-radius-[a-z]+)\)$/.exec(v)?.[1] ?? '') || v === '0';
    const found = decls.filter((d) => /^border(-[a-z]+)*-radius$/.test(d.prop) && !['50%', 'inherit'].includes(d.value) && !d.value.split(/\s+/).every(corner));
    expect(found.map(at)).toEqual([]);
  });

  it('sets every shadow from a shadow token; the one exception is the 1 px inner hairline on a swatch-like edge', () => {
    // design-system.md, Color: a swatch lighter than surface gets a 1 px line-soft inner border.
    const layer = (l: string) => /^var\(--dse-shadow-[a-z-]+\)$/.test(l) || /^inset 0 0 0 1px var\(--dse-line(-soft|-strong)?\)$/.test(l);
    const found = decls.filter((d) => d.prop === 'box-shadow' && d.value !== 'none' && !d.value.split(/,\s*(?![^(]*\))/).every((l) => layer(l.trim())));
    expect(found.map(at)).toEqual([]);
    expect(decls.filter((d) => d.prop === 'text-shadow' && d.value !== 'none').map(at)).toEqual([]);
  });

  it('never transforms text to uppercase or title case', () => {
    expect(decls.filter((d) => d.prop === 'text-transform' && d.value !== 'none').map(at)).toEqual([]);
    expect(decls.filter((d) => d.prop === 'font-variant-caps' && d.value !== 'normal').map(at)).toEqual([]);
  });
});

describe('the chrome has no chroma', () => {
  const declared = [...tokensCss.matchAll(/--(dse-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => ({ name: m[1]!, value: m[2]!.trim() }));
  const colorsOf = (value: string) => [...value.matchAll(/(rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi)].map((m) => m[0]);
  const chroma = (c: string) => oklabToOklch(rgbToOklab(parseCssColor(c)!)).c;

  it('has no accent token and no success, warning, danger, error or info token', () => {
    expect(ds).toContain('There is no accent token. There is no success, warning or danger token.');
    expect(declared.map((t) => t.name).filter((n) => /accent|success|warning|danger|error|info|positive|negative|brand/.test(n))).toEqual([]);
  });

  it('keeps every color token neutral, the warm card shadow being the one documented tint', () => {
    const tinted: string[] = [];
    let colors = 0;
    for (const t of declared) {
      for (const c of colorsOf(t.value)) {
        colors++;
        if (chroma(c) >= NEUTRAL_CHROMA) tinted.push(`${t.name} ${c}`);
      }
    }
    expect(colors).toBeGreaterThan(20);
    expect(ds).toContain('The one tinted value in the system is the card shadow');
    expect(tinted).toEqual(['dse-shadow-card rgba(226, 96, 98, 0.07)', 'dse-shadow-card-hover rgba(226, 96, 98, 0.12)']);
  });
});

function parse(file: string) {
  return ts.createSourceFile(file, readFileSync(resolve(web, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

describe('icons', () => {
  type Use = { where: string; props: Map<string, string> };
  const uses: Use[] = [];
  for (const file of tsxFiles) {
    const sf = parse(file);
    const icons = new Set<string>();
    for (const s of sf.statements) {
      if (!ts.isImportDeclaration(s) || (s.moduleSpecifier as ts.StringLiteral).text !== 'lucide-react') continue;
      const b = s.importClause?.namedBindings;
      if (!b || !ts.isNamedImports(b)) continue;
      for (const el of b.elements) {
        if (el.name.text === 'LucideIcon') icons.add('Icon');
        else if (!s.importClause!.isTypeOnly && !el.isTypeOnly) icons.add(el.name.text);
      }
    }
    const visit = (n: ts.Node) => {
      if ((ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) && icons.has(n.tagName.getText(sf))) {
        const props = new Map<string, string>();
        for (const a of n.attributes.properties) {
          if (!ts.isJsxAttribute(a) || !a.initializer) continue;
          const init = a.initializer;
          props.set(a.name.getText(sf), ts.isStringLiteral(init) ? init.text : ts.isJsxExpression(init) ? (init.expression?.getText(sf) ?? '') : '');
        }
        uses.push({ where: `${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} <${n.tagName.getText(sf)}>`, props });
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }

  it('draws every Lucide icon at stroke 1.75', () => {
    expect(uses.length).toBeGreaterThan(20);
    expect(uses.filter((u) => u.props.get('strokeWidth') !== '1.75').map((u) => u.where)).toEqual([]);
  });

  it('sizes every icon 16 inside buttons and badges or 20 standalone', () => {
    expect(uses.filter((u) => !['16', '20'].includes(u.props.get('size') ?? '')).map((u) => `${u.where} size=${u.props.get('size')}`)).toEqual([]);
  });
});

describe('no emoji anywhere', () => {
  const emoji = /[\p{Extended_Pictographic}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
  const sources = ['apps/web/copy/strings.ts', 'packages/schema/src/labels.ts', ...tsxFiles.map((f) => relative(root, resolve(web, f)))];

  it('has no emoji in the copy, the labels or any component', () => {
    expect(sources.length).toBeGreaterThan(80);
    const found = sources.flatMap((f) =>
      readFileSync(resolve(root, f), 'utf8')
        .split('\n')
        .flatMap((l, i) => (emoji.test(l) ? [`${f}:${i + 1} ${l.trim()}`] : [])),
    );
    expect(found).toEqual([]);
  });
});
