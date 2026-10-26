import { JSDOM } from 'jsdom';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import type { MatchedStyles } from '../src/capture/matched-css';
import type { SheetScan } from '../src/capture/sheet-scan';
import { buildPreview, rescope, statePreview } from '../src/previews/build';
import { fontsFor, type FontCopier } from '../src/previews/fonts';
import { diffPercent } from '../src/previews/render';
import { snap } from './helpers/snap';

const policy = { storageBase: 'https://store.example/dse' };
const sheets = (over: Partial<SheetScan>): SheetScan => ({ media: [], hasReducedMotionRule: false, googleFonts: [], fontFaces: [], fonts: [], crossOrigin: [], ...over });

describe('fonts', () => {
  it('links Google Fonts for a family the site loaded from fonts.googleapis.com, with the weights used', async () => {
    const copier = { copy: async () => null } as unknown as FontCopier;
    const out = await fontsFor([{ family: 'Plus Jakarta Sans', weights: [600, 400, 600] }], sheets({ googleFonts: ['https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap'] }), copier);
    expect(out).toEqual({ googleLinks: ['https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600&display=swap'], faces: [], mode: 'google' });
  });
  it('copies a self-hosted face and falls back when a file cannot be served', async () => {
    const copier = { copy: async (src: string) => (src.endsWith('ok.woff2') ? 'https://store.example/dse/runs/r/fonts/ok.woff2' : null) } as unknown as FontCopier;
    const copied = await fontsFor([{ family: 'Inter', weights: [400] }], sheets({ fontFaces: [{ family: 'Inter', src: 'http://site.example/ok.woff2', weight: '400', style: 'normal' }] }), copier);
    expect(copied).toMatchObject({ mode: 'copied', faces: [{ family: 'Inter', url: 'https://store.example/dse/runs/r/fonts/ok.woff2', format: 'woff2' }] });
    const failed = await fontsFor([{ family: 'Inter', weights: [400] }], sheets({ fontFaces: [{ family: 'Inter', src: 'http://site.example/big.woff2', weight: '400', style: 'normal' }] }), copier);
    expect(failed.mode).toBe('fallback');
    expect((await fontsFor([{ family: 'system-ui', weights: [400] }], sheets({}), copier)).mode).toBe('none');
  });
});

describe('the preview builder', () => {
  const dom = new JSDOM('<!doctype html><body><div class="dse-root"><a class="btn btn-primary" id="go" data-dse-id="e1">Go <span class="icon"></span></a></div></body>');
  const doc = dom.window.document;
  const a = doc.querySelector('a')!;
  it('keeps selectors that still match and rescopes ancestor ones to .dse-root', () => {
    expect(rescope('.btn', a)).toBe('.btn');
    expect(rescope('.hero .btn-primary', a)).toBe('.dse-root .btn-primary');
    expect(rescope('.pricing-card > a.btn::before', a)).toBe('.dse-root a.btn::before');
    expect(rescope('#go', a)).toBe('#dse-go');
    expect(rescope('.nowhere', a)).toBeNull();
  });

  it('keeps each element’s rules in cascade order when merging them, resolves variables and states', () => {
    const snapshot = snap([{ tag: 'body', box: [0, 0, 400, 300], style: { color: 'rgb(11, 31, 58)', 'font-size': '16px' } }, { tag: 'a', parent: 0, box: [10, 10, 120, 44] }, { tag: 'span', parent: 1, box: [80, 20, 16, 16] }]);
    const rule = (selector: string, declarations: [string, string][]) => ({ selector, matched: [selector], origin: 'regular', media: [], supports: [], declarations: declarations.map(([name, value]) => ({ name, value, important: false })) });
    // `*` matches both elements; the span's list puts .icon before it, so .icon must come first.
    const star = rule('*', [['color', 'var(--c-primary)']]);
    const mid = rule('.icon', [['width', '16px']]);
    const high = rule('.btn-primary', [['background', 'var(--c-primary)']]);
    const matched: Record<string, MatchedStyles> = { e1: { rules: [star, high], inline: [], pseudo: [] }, e2: { rules: [mid, star], inline: [], pseudo: [] } };
    const out = buildPreview({ markup: '<a class="btn btn-primary" data-dse-id="e1">Go <span class="icon" data-dse-id="e2"></span></a>', vars: { '--c-primary': '#2458E6' }, snapshot, root: snapshot.elements[1]!, matched, ground: 'rgb(255, 255, 255)', imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy });
    const order = ['.icon {', '* {', '.btn-primary {'].map((s) => out.css.indexOf(s));
    expect(order.every((n) => n >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((x, y) => x - y));
    expect(out.css).toContain('--c-primary: #2458E6;');
    expect(out.css).toContain('color: rgb(11, 31, 58);');
    expect(out.css).toContain('width: 120px !important; height: 44px !important;');
    expect(out.markup).toBe('<a class="btn btn-primary">Go <span class="icon"></span></a>');
    const hover = statePreview(out.html, [{ property: 'background-color', to: 'rgb(11, 31, 58)' }, { property: 'cursor', to: 'url(https://evil.example/c.png), auto' }], policy);
    expect(hover).toContain('.dse-root > :first-child { background-color: rgb(11, 31, 58) !important; }');
    expect(hover).not.toContain('evil.example');
  });

  it('security · allows fonts and images from the storage base as a path prefix, nothing else', () => {
    const snapshot2 = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'a', parent: 0, box: [10, 10, 120, 44] }]);
    const out = buildPreview({ markup: '<a data-dse-id="e1">Go</a>', vars: {}, snapshot: snapshot2, root: snapshot2.elements[1]!, matched: { e1: { rules: [], inline: [], pseudo: [] } }, ground: 'rgb(255, 255, 255)', imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy });
    const csp = /content="([^"]+)"/.exec(out.html)![1]!;
    // A source path without a trailing slash matches that one path only, which would block every font file.
    expect(csp).toContain('font-src https://fonts.gstatic.com https://store.example/dse/;');
    expect(csp).toContain('img-src data: https://store.example/dse/');
    expect(csp).toMatch(/^default-src 'none';/);
  });
});

describe('the render comparison', () => {
  const png = (w: number, h: number, fill: (x: number, y: number) => number) => {
    const p = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = fill(x, y);
      p.data[i] = v;
      p.data[i + 1] = v;
      p.data[i + 2] = v;
      p.data[i + 3] = 255;
    }
    return PNG.sync.write(p);
  };
  const stripes = (shift: number) => png(60, 40, (x) => ((x + shift) % 10 < 5 ? 0 : 255));
  it('is zero for identical images and forgives a one-pixel offset', () => {
    expect(diffPercent(stripes(0), stripes(0))).toBe(0);
    expect(diffPercent(stripes(0), stripes(1))).toBe(0);
  });
  it('counts real differences and sizes that do not match', () => {
    expect(diffPercent(stripes(0), png(60, 40, () => 255))).toBeGreaterThan(40);
    expect(diffPercent(stripes(0), png(60, 80, (x) => (x % 10 < 5 ? 0 : 255)))).toBeGreaterThan(40);
  });
});
