import { describe, expect, it } from 'vitest';
import { closeValue, resolveSiteVariables, sealCss, sealHtml, sealKeyframes } from '../src/exports/vars';

// docs/specs/exports-and-mcp.md, the variable-resolution assertion (D-090): what real sites write.

const known = (names: string[]) => (n: string) => names.includes(n);

describe('closing a value over the declared properties', () => {
  it('keeps declared references, takes fallbacks, nests, and gives up without one', () => {
    expect(closeValue('var(--a) var(--b, 4px)', known(['--a']))).toBe('var(--a) 4px');
    expect(closeValue('calc(var(--x, var(--y, 0)) * 0.9)', known([]))).toBe('calc(0 * 0.9)');
    expect(closeValue('var(--x)', known([]))).toBeNull();
  });
});

describe('site variables', () => {
  const v = (name: string, value: string, resolved = '') => ({ name, value, resolved });
  it('takes a theme value when the root has none, resolves chains through the block and tokens, and leaves out what never resolves', () => {
    const out = resolveSiteVariables(
      [v('--accentColor', '#fff'), v('--linkColor', 'var(--accentColor)', 'var(--accentColor)'), v('--menu', 'var(--duration-160) var(--easing)'), v('--scale', 'calc(var(--bar-index) / 3)'), v('--loop', 'var(--loop)')],
      new Map([['--duration-160', '160ms']]),
    );
    expect(out.map((x) => [x.name, x.written, x.literal])).toEqual([
      ['--accentColor', '#fff', '#fff'],
      ['--linkColor', 'var(--accentColor)', '#fff'],
    ]);
  });
});

describe('sealing CSS, keyframes and markup', () => {
  it('leaves out a declaration that reads a runtime property, with a comment, and keeps the rest', () => {
    const css = '.rail { width: var(--railWidth); color: var(--ink, #111); --x: var(--ok); }';
    expect(sealCss(css, known(['--ok']))).toBe('.rail { /* width left out: it reads --railWidth, which the site sets at runtime */; color: #111; --x: var(--ok); }');
  });

  it('writes a keyframes block that cannot close as a comment naming what it reads', () => {
    expect(sealKeyframes('fly', '@keyframes fly { 0% { --i: 0; } 100% { --i: calc(var(--count) - 1); } }', known([]))).toBe('/* @keyframes fly left out: it reads --count, which the site sets on the element at runtime */');
    expect(sealKeyframes('fade', '@keyframes fade { to { opacity: var(--o, 1); } }', known([]))).toBe('@keyframes fade { to { opacity: 1; } }');
  });

  it('drops an attribute that reads a runtime property and keeps one with a fallback', () => {
    expect(sealHtml('<circle fill="var(--icon)" opacity="var(--o, .15)" r="10"></circle>', known([]))).toBe('<circle opacity=".15" r="10"></circle>');
    expect(sealHtml('<p style="color: var(--x); margin: 0">a</p>', known([]))).toBe('<p style="margin: 0">a</p>');
  });
});
