import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { JSDOM } from 'jsdom';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import type { MatchedStyles } from '../src/capture/matched-css';
import type { SheetScan } from '../src/capture/sheet-scan';
import { buildPreview, rescope, statePreview } from '../src/previews/build';
import { FontCopier, fontsFor } from '../src/previews/fonts';
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

  it('copies a same-site font file of 300 KB, refuses one byte more, and copies another origin\'s font only when CORS allows it', async () => {
    const server = createServer((req, res) => res.end(Buffer.alloc(req.url === '/big.woff2' ? 300_001 : 300_000, 1)));
    const cdn = createServer((req, res) => {
      if (req.url === '/cors.woff2' && req.headers.origin) res.setHeader('access-control-allow-origin', '*');
      res.end(Buffer.alloc(1_000, 1));
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    await new Promise<void>((r) => cdn.listen(0, '127.0.0.1', r));
    const host = `127.0.0.1:${(server.address() as AddressInfo).port}`;
    const other = `127.0.0.1:${(cdn.address() as AddressInfo).port}`;
    const put: string[] = [];
    const ctx = { runId: 'abc123def4', config: { url: `http://${host}/`, userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [host, other] }, files: { put: async (key: string) => void put.push(key), publicUrl: (key: string) => `https://store.example/dse/${key}` } };
    try {
      const copier = new FontCopier(ctx as never);
      expect(await copier.copy(`http://${host}/ok.woff2`)).toMatch(/^https:\/\/store\.example\/dse\/runs\/abc123def4\/fonts\/[0-9a-f]{16}\.woff2$/);
      expect(await copier.copy(`http://${host}/big.woff2`)).toBeNull();
      expect(await copier.copy(`http://${other}/cors.woff2`)).not.toBeNull();
      expect(await copier.copy(`http://${other}/plain.woff2`)).toBeNull();
      expect(put).toHaveLength(2);
    } finally {
      server.close();
      cdn.close();
    }
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

  it('turns images and embeds into aria-hidden blocks of their size, radius and average color', () => {
    const snapshot = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'div', parent: 0, box: [0, 0, 200, 100] }, { tag: 'img', parent: 1, cls: ['avatar'], box: [8, 8, 48.4, 32], style: { 'border-top-left-radius': '50%' } }]);
    const out = buildPreview({ markup: '<div data-dse-id="e1"><img class="avatar" data-dse-id="e2" src="https://cdn.example/a.png" alt="Ada"><video width="120" height="60"></video></div>', vars: {}, snapshot, root: snapshot.elements[1]!, matched: {}, ground: 'rgb(255, 255, 255)', imageColors: { e2: 'rgb(120, 96, 80)' }, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy });
    expect(out.markup).toBe(
      '<div><span aria-hidden="true" style="display: inline-block; width: 48px; height: 32px; border-radius: 50%; background: rgb(120, 96, 80); vertical-align: middle" class="avatar"></span>' +
        '<span aria-hidden="true" style="display: inline-block; width: 120px; height: 60px; border-radius: 0px; background: #E5E5E5; vertical-align: middle"></span></div>',
    );
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
  it('forgives a shift of two device pixels and not three', () => {
    expect(diffPercent(stripes(0), stripes(2))).toBe(0);
    expect(diffPercent(stripes(0), stripes(3))).toBeGreaterThan(0);
  });
  it('forgives a size difference of four device pixels and counts the fifth as differing', () => {
    const flat = (w: number) => png(w, 40, () => 255);
    expect(diffPercent(flat(60), flat(64))).toBe(0);
    // One column of 40 pixels past the slack, over the larger image's 65 × 40.
    expect(diffPercent(flat(60), flat(65))).toBe(1.5);
  });
  it('counts real differences and sizes that do not match', () => {
    expect(diffPercent(stripes(0), png(60, 40, () => 255))).toBeGreaterThan(40);
    expect(diffPercent(stripes(0), png(60, 80, (x) => (x % 10 < 5 ? 0 : 255)))).toBeGreaterThan(40);
  });
});
