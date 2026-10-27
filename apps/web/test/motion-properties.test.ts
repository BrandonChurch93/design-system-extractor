import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { drawVariants, extendVariants, revealContentVariants, revealFrameVariants, reducedVariants, slideVariants, variantsFor, type Edge } from '../lib/motion/moves';

// docs/design/motion.md, Performance rules: animate only transform, opacity, clip-path and
// stroke-dashoffset. Hover and press names the only other changes that animate: the card lift's
// shadow and the chip's ground and text swap.

const web = resolve(import.meta.dirname, '..');

function walk(dir: string): string[] {
  return readdirSync(resolve(web, dir), { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return [];
    const p = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(p) : [p];
  });
}
const files = ['app', 'components', 'lib', 'styles'].flatMap(walk).sort();
const read = (f: string) => readFileSync(resolve(web, f), 'utf8');

const CSS_ALLOWED = new Set(['transform', 'translate', 'scale', 'rotate', 'opacity', 'clip-path', 'stroke-dashoffset']);
const HOVER_ALLOWED = new Set(['box-shadow', 'background-color', 'background', 'color', 'border-color', 'outline-color', 'text-decoration-color']);
const LAYOUT = /^(width|height|(min|max)-(width|height)|top|right|bottom|left|inset|margin(-[a-z]+)?|padding(-[a-z]+)?|border(-[a-z]+)?-width|font-size|line-height|gap|row-gap|column-gap|grid-template-[a-z]+|flex(-basis)?|all)$/;
// Motion and GSAP names for the same four properties. pathLength is Motion's stroke-dashoffset draw.
const JS_ALLOWED = new Set(['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate', 'opacity', 'clipPath', 'strokeDashoffset', 'pathLength']);
const NOT_ANIMATED = new Set(['transition', 'transitionEnd', 'duration', 'ease', 'delay', 'clearProps', 'transformOrigin', 'onUpdate', 'onComplete', 'when']);

type Animated = { where: string; prop: string; kind: 'transition' | 'keyframes' };

function cssAnimated(): Animated[] {
  const out: Animated[] = [];
  for (const file of files.filter((f) => f.endsWith('.css'))) {
    const text = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of text.matchAll(/(?:^|[;{\s])transition(-property)?\s*:\s*([^;{}]+);/g)) {
      for (const item of m[2]!.split(/,(?![^(]*\))/)) {
        const prop = item.trim().split(/\s+/)[0]!;
        if (prop && prop !== 'none') out.push({ where: file, prop, kind: 'transition' });
      }
    }
    for (const m of text.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/g)) {
      for (const d of m[2]!.matchAll(/([a-z-]+)\s*:/g)) out.push({ where: `${file} @keyframes ${m[1]}`, prop: d[1]!, kind: 'keyframes' });
    }
  }
  return out;
}

describe('stylesheets', () => {
  const animated = cssAnimated();

  it('reads every transition and keyframe block of the app', () => {
    expect(animated.some((a) => a.kind === 'keyframes')).toBe(true);
    expect(animated.filter((a) => a.kind === 'transition').length).toBeGreaterThan(10);
  });

  it('never animate a property that moves layout (height only through Motion layout on regions)', () => {
    expect(animated.filter((a) => LAYOUT.test(a.prop)).map((a) => `${a.where} ${a.prop}`)).toEqual([]);
  });

  it('animate only transform, opacity, clip-path and stroke-dashoffset, plus hover and focus colors and the opened ring (D-078)', () => {
    const ring = (a: (typeof animated)[number]) => a.kind === 'keyframes' && a.prop === 'outline-color' && /ComponentCard/.test(a.where);
    const bad = animated.filter((a) => !CSS_ALLOWED.has(a.prop) && !(a.kind === 'transition' && HOVER_ALLOWED.has(a.prop)) && !ring(a));
    expect(bad.map((a) => `${a.where} ${a.kind} ${a.prop}`)).toEqual([]);
  });
});

/** The keys a Motion target or variant sets, without its timing. */
function targetKeys(value: unknown, i = 0): string[] {
  const v = typeof value === 'function' ? (value as (n: number) => unknown)(i) : value;
  if (!v || typeof v !== 'object') return [];
  return Object.keys(v).filter((k) => !NOT_ANIMATED.has(k));
}

describe('Motion variants and targets', () => {
  it('the six moves and their reduced forms animate only the allowed properties', () => {
    const edges: Edge[] = ['right', 'bottom', 'left', 'top'];
    const sets = [
      drawVariants(),
      extendVariants(),
      extendVariants(undefined, 'y'),
      ...edges.map((e) => slideVariants(e)),
      revealFrameVariants(),
      revealContentVariants(),
      reducedVariants(),
      ...(['draw', 'wipe', 'extend', 'slide', 'reveal'] as const).flatMap((m) => [variantsFor(m, false), variantsFor(m, true)]),
    ];
    const keys = new Set(sets.flatMap((s) => Object.values(s).flatMap((t) => targetKeys(t, 3))));
    expect(keys.size).toBeGreaterThan(3);
    expect([...keys].filter((k) => !JS_ALLOWED.has(k))).toEqual([]);
  });

  // Inline targets in the app's JSX: initial, animate, exit and the while* props, read from the source.
  const MOTION_PROPS = new Set(['initial', 'animate', 'exit', 'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag']);
  const FACTORIES = new Set(['variantsFor', 'drawVariants', 'wipeVariants', 'extendVariants', 'slideVariants', 'revealFrameVariants', 'revealContentVariants', 'reducedVariants']);

  function keysOf(node: ts.Expression, sf: ts.SourceFile, unresolved: string[], variantMap = false): string[] {
    const at = () => `${sf.fileName.slice(web.length + 1)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) return keysOf(node.expression, sf, unresolved, variantMap);
    if (ts.isConditionalExpression(node)) return [...keysOf(node.whenTrue, sf, unresolved, variantMap), ...keysOf(node.whenFalse, sf, unresolved, variantMap)];
    if (ts.isBinaryExpression(node)) return [...keysOf(node.left, sf, unresolved, variantMap), ...keysOf(node.right, sf, unresolved, variantMap)];
    if (ts.isStringLiteral(node) || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.TrueKeyword) return [];
    if (ts.isIdentifier(node)) {
      if (node.text === 'undefined') return [];
      let init: ts.Expression | undefined;
      const find = (n: ts.Node) => {
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === node.text && n.initializer) init = n.initializer;
        n.forEachChild(find);
      };
      find(sf);
      if (init) return keysOf(init, sf, unresolved, variantMap);
      unresolved.push(`${at()} ${node.text}`);
      return [];
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && FACTORIES.has(node.expression.text)) return [];
    if (ts.isElementAccessExpression(node)) return keysOf(node.expression, sf, unresolved, true);
    if (ts.isObjectLiteralExpression(node)) {
      return node.properties.flatMap((p) => {
        if (ts.isSpreadAssignment(p)) return keysOf(p.expression, sf, unresolved);
        if (variantMap && ts.isPropertyAssignment(p)) return keysOf(p.initializer, sf, unresolved);
        const name = p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : '?';
        return NOT_ANIMATED.has(name) ? [] : [name];
      });
    }
    unresolved.push(`${at()} ${node.getText(sf).slice(0, 60)}`);
    return [];
  }

  it('every inline target in the app animates only the allowed properties', () => {
    const found: string[] = [];
    const unresolved: string[] = [];
    let seen = 0;
    for (const file of files.filter((f) => f.endsWith('.tsx'))) {
      const sf = ts.createSourceFile(resolve(web, file), read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (n: ts.Node) => {
        if (ts.isJsxAttribute(n) && ts.isIdentifier(n.name) && MOTION_PROPS.has(n.name.text) && n.initializer && ts.isJsxExpression(n.initializer) && n.initializer.expression) {
          // Only motion elements: AnimatePresence's initial={false} and other components' props are not targets.
          const tag = (n.parent.parent as ts.JsxOpeningLikeElement).tagName.getText(sf);
          if (tag.startsWith('motion.')) {
            seen++;
            for (const k of keysOf(n.initializer.expression, sf, unresolved)) if (!JS_ALLOWED.has(k)) found.push(`${file} ${n.name.text} ${k}`);
          }
        }
        n.forEachChild(visit);
      };
      visit(sf);
    }
    expect(seen).toBeGreaterThan(10);
    expect(unresolved).toEqual([]);
    expect(found).toEqual([]);
  });

  it('every GSAP tween on an element animates only the allowed properties', () => {
    const file = 'lib/motion/gsap.ts';
    const sf = ts.createSourceFile(resolve(web, file), read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const found: string[] = [];
    let tweens = 0;
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.expression.getText(sf) === 'gsap' && ['to', 'fromTo', 'from'].includes(n.expression.name.text)) {
        // countTo tweens a plain number holder, not an element.
        if (n.arguments[0]?.getText(sf) !== 'state') {
          tweens++;
          for (const arg of n.arguments.slice(1)) {
            if (!ts.isObjectLiteralExpression(arg)) continue;
            for (const p of arg.properties) {
              const names = p.name && ts.isComputedPropertyName(p.name) ? ['scaleX', 'scaleY'] : [p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : '?'];
              // A dash array is set once so the offset can draw; it is never tweened.
              for (const k of names) if (!NOT_ANIMATED.has(k) && k !== 'strokeDasharray' && !JS_ALLOWED.has(k)) found.push(`${file} ${k}`);
            }
          }
        }
      }
      n.forEachChild(visit);
    };
    visit(sf);
    expect(tweens).toBeGreaterThan(3);
    expect(found).toEqual([]);
  });
});
