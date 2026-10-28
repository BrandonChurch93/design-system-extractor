import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { cropShot, paintMargin, pixelAt, shotExtent, type Shot } from '../src/components/crop';
import { bandRegions } from '../src/stages/capture';
import { buildPreview, containerHolds, universalCarry, viewportUnits } from '../src/previews/build';
import { sanitizeMarkup } from '../src/previews/sanitize';
import { reasonWords, renderOrder, visibleBox } from '../src/stages/previews';
import { snap } from './helpers/snap';

const png = (w: number, h: number, rgb: [number, number, number]) => {
  const p = new PNG({ width: w, height: h });
  for (let i = 0; i < p.data.length; i += 4) [p.data[i], p.data[i + 1], p.data[i + 2], p.data[i + 3]] = [...rgb, 255];
  return PNG.sync.write(p);
};

describe('the order of render checks (D-095)', () => {
  it('checks core components first, most instances first within a tier, then grid order', () => {
    const c = (tier: 'core' | 'page', n: number) => ({ tier, instances: Array.from({ length: n }) as never[] });
    expect(renderOrder([c('page', 9), c('core', 2), c('core', 5), c('page', 1), c('core', 5)])).toEqual([2, 4, 1, 0, 3]);
  });

  it('states each captured reason with a count above zero', () => {
    expect(reasonWords({ live: 38, diff: 5, 'css-too-large': 0, 'fonts-unavailable': 2, 'not-checked': 1 })).toBe(' · 5 render differed · 2 fonts unavailable · 1 not checked in time');
    expect(reasonWords({ live: 4, diff: 0, 'css-too-large': 0, 'fonts-unavailable': 0, 'not-checked': 0 })).toBe('');
  });
});

describe('crops below the screenshot cut (D-098)', () => {
  it('covers the elements with 128 px around them in clips of at most 2,000 px', () => {
    expect(bandRegions([{ y: 9000, h: 40 }, { y: 9300, h: 400 }, { y: 12_000, h: 300 }, { y: 30_000, h: 10 }], 24_000)).toEqual([
      { y: 8872, height: 956 },
      { y: 11_872, height: 556 },
    ]);
    expect(bandRegions([{ y: 9000, h: 3000 }], 24_000)).toEqual([{ y: 8872, height: 3256 }]);
  });

  it('reads a box below the cut from its band, and samples pixels from it', () => {
    const shot: Shot = { png: png(20, 20, [255, 255, 255]), width: 10, height: 10, bands: [{ y: 30, height: 10, png: png(20, 20, [11, 13, 16]) }] };
    expect(shotExtent(shot)).toBe(40);
    const crop = PNG.sync.read(cropShot(shot, { x: 2, y: 32, w: 4, h: 4 })!);
    expect([crop.width, crop.height, crop.data[0], crop.data[1], crop.data[2]]).toEqual([8, 8, 11, 13, 16]);
    expect(pixelAt(shot, 1, 35)).toEqual({ r: 11, g: 13, b: 16, a: 1 });
    expect(pixelAt(shot, 1, 20)).toBeNull();
    expect(PNG.sync.read(cropShot(shot, { x: 0, y: 0, w: 4, h: 4 })!).data[0]).toBe(255);
  });

  it('paints a crop margin with the ground and leaves the element inside it', () => {
    const out = PNG.sync.read(paintMargin(png(16, 16, [255, 255, 255]), 2, 8, '#0B0D10'));
    const at = (x: number, y: number) => [...out.data.subarray((y * 16 + x) * 4, (y * 16 + x) * 4 + 3)];
    expect(at(0, 0)).toEqual([11, 13, 16]);
    expect(at(3, 8)).toEqual([11, 13, 16]);
    expect(at(4, 4)).toEqual([255, 255, 255]);
  });
});

describe('what the render check compares (D-098)', () => {
  it('takes the part of a box the viewport and a clipping ancestor show', () => {
    const s = snap([
      { tag: 'body', box: [0, 0, 1440, 3000] },
      { tag: 'div', parent: 0, box: [100, 100, 384, 300], style: { 'overflow-x': 'hidden', 'overflow-y': 'hidden' } },
      { tag: 'div', parent: 1, box: [100, 120, 784, 80] },
      { tag: 'div', parent: 0, box: [-203, 400, 260, 40] },
    ]);
    expect(visibleBox({ el: s.elements[2]!, snapshot: s, viewport: 'desktop' })).toEqual({ x: 100, y: 120, w: 384, h: 80 });
    expect(visibleBox({ el: s.elements[3]!, snapshot: s, viewport: 'desktop' })).toEqual({ x: 0, y: 400, w: 57, h: 40 });
  });

  it("keeps a rule in its cascade layer, declared in the page's order, under the unlayered rules", () => {
    const s = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'a', parent: 0, box: [10, 10, 120, 44] }]);
    const rule = (selector: string, decl: [string, string], layerRank?: number) => ({ selector, matched: [selector], origin: 'regular', media: [], supports: [], declarations: [{ name: decl[0], value: decl[1], important: false }], ...(layerRank === undefined ? {} : { layerRank }) });
    const out = buildPreview({ markup: '<a class="anchor reset" data-dse-id="e1">Go</a>', vars: {}, snapshot: s, root: s.elements[1]!, matched: { e1: { rules: [rule('.anchor', ['color', 'rgb(1, 2, 3)']), rule('.reset', ['color', 'inherit'], 1), rule('.reset', ['padding', '0px'], 0)], inline: [], pseudo: [] } }, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase: 'https://store.example/dse' } });
    expect(out.rules).toContain('@layer dse-l0, dse-l1;');
    expect(out.rules).toContain('@layer dse-l0 { .reset { padding: 0px; } }');
    expect(out.rules).toContain('.anchor { color: rgb(1, 2, 3); }');
    expect(out.code).not.toContain('@layer');
  });

  it("does not apply the root's own translation again, since its box was measured with it", () => {
    const s = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'div', parent: 0, box: [10, 10, 120, 44], style: { transform: 'matrix(1, 0, 0, 1, -60, 0)' } }]);
    const out = buildPreview({ markup: '<div data-dse-id="e1">Go</div>', vars: {}, snapshot: s, root: s.elements[1]!, matched: {}, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase: 'https://store.example/dse' } });
    expect(out.css).toContain('.dse-root > :first-child:not(#dse-shift) { transform: none !important; }');
    const turned = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'div', parent: 0, box: [10, 10, 120, 44], style: { transform: 'matrix(0.7, 0.7, -0.7, 0.7, 0, 0)' } }]);
    expect(buildPreview({ markup: '<div data-dse-id="e1">Go</div>', vars: {}, snapshot: turned, root: turned.elements[1]!, matched: {}, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase: 'https://store.example/dse' } }).css).not.toContain('dse-shift');
  });

  it('places a rule the page loads twice where its last copy sits, so a media override after it still wins', () => {
    const s = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'div', parent: 0, box: [10, 10, 120, 44] }]);
    const rule = (selector: string, decl: [string, string], media: string[] = []) => ({ selector, matched: [selector], origin: 'regular', media, supports: [], declarations: [{ name: decl[0], value: decl[1], important: false }] });
    const base = rule('.root', ['padding-top', '460px']);
    const small = rule('.root', ['padding-top', '284px'], ['(max-width: 640px)']);
    const out = buildPreview({ markup: '<div class="root" data-dse-id="e1">Go</div>', vars: {}, snapshot: s, root: s.elements[1]!, matched: { e1: { rules: [base, small, base, small], inline: [], pseudo: [] } }, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase: 'https://store.example/dse' } });
    expect(out.rules.indexOf('padding-top: 460px')).toBeLessThan(out.rules.indexOf('padding-top: 284px'));
  });

  it("gives an inline root its content height as line height, carries its ancestors' opacity, and reads var() in svg attributes", () => {
    const s = snap([
      { tag: 'body', box: [0, 0, 400, 300] },
      { tag: 'div', parent: 0, box: [0, 0, 400, 300], style: { opacity: '0.8' } },
      { tag: 'span', parent: 1, box: [10, 10, 60, 20], style: { display: 'inline', 'padding-top': '2px', 'padding-bottom': '2px' } },
      { tag: 'svg', parent: 2, box: [10, 10, 16, 16], style: { fill: 'rgb(16, 185, 129)' } },
    ]);
    const out = buildPreview({ markup: '<span data-dse-id="e2">Go<svg data-dse-id="e3" fill="var(--color-green)"></svg></span>', vars: {}, snapshot: s, root: s.elements[2]!, matched: {}, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase: 'https://store.example/dse' } });
    expect(out.css).toContain('line-height: 16px !important;');
    expect(out.css).toMatch(/\.dse-root \{[^}]*opacity: 0\.8;/);
    expect(out.markup).toContain('fill="rgb(16, 185, 129)"');
  });

  it('keeps a var() svg attribute with no snapshot value, and takes the paint written on an svg child at capture', () => {
    const s = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'div', parent: 0, box: [10, 10, 40, 40] }]);
    const out = buildPreview({ markup: '<div data-dse-id="e1"><svg><path fill="var(--card-fill)" d="M0 0h1v1z"></path><rect class="bg" data-dse-fill="rgb(255, 255, 255)" data-dse-stroke="url(https://evil.example/#g)" width="4" height="4"></rect></svg></div>', vars: {}, snapshot: s, root: s.elements[1]!, matched: {}, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase: 'https://store.example/dse' } });
    expect(out.markup).toContain('fill="var(--card-fill)"');
    expect(out.markup).toContain('fill="rgb(255, 255, 255)"');
    expect(out.markup).not.toContain('evil.example');
    expect(out.markup).not.toContain('data-dse-');
  });

  it("lays an element out at its own size and scales it by its ancestors' scale", () => {
    const s = snap([
      { tag: 'body', box: [0, 0, 400, 300] },
      { tag: 'div', parent: 0, box: [0, 0, 400, 300], style: { transform: 'matrix(0.8, 0, 0, 0.8, 0, 0)' } },
      { tag: 'div', parent: 1, box: [10, 10, 200, 40] },
    ]);
    const out = buildPreview({ markup: '<div data-dse-id="e2">Row</div>', vars: {}, snapshot: s, root: s.elements[2]!, matched: {}, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase: 'https://store.example/dse' } });
    expect(out.css).toContain('.dse-root > :first-child:not(#dse-shift) { width: 250px !important; height: 50px !important; transform: scale(0.8) !important; transform-origin: 0 0 !important; }');
  });

  it('reads a container query against the container the page had, and leaves one it cannot read to the browser', () => {
    const box = (width: number) => () => ({ width, height: 400, inline: true });
    expect(containerHolds('developer-systems (min-width: 600px)', box(1232))).toBe(true);
    expect(containerHolds('(width >= 37.5rem) and (max-width: 700px)', box(608))).toBe(true);
    expect(containerHolds('sessions-banner (min-width: 400px)', box(193))).toBe(false);
    expect(containerHolds('(min-height: 10px)', box(500))).toBe(false);
    expect(containerHolds('card (min-width: 10px)', () => null)).toBe(false);
    expect(containerHolds('style(--dark: 1)', box(500))).toBeNull();
    expect(containerHolds('(min-width: 400px) or (max-width: 10px)', box(500))).toBeNull();
    const s = snap([
      { tag: 'body', box: [0, 0, 1440, 900] },
      { tag: 'section', parent: 0, box: [0, 0, 1232, 600], style: { 'container-type': 'inline-size', 'container-name': 'developer-systems' } },
      { tag: 'span', parent: 1, box: [10, 10, 60, 20] },
    ]);
    const rule = (selector: string, container: string) => ({ selector, matched: [selector], origin: 'regular', media: [], supports: [], container: [container], declarations: [{ name: 'font-size', value: '14px', important: false }] });
    const out = buildPreview({ markup: '<span class="tag" data-dse-id="e2">SDK</span>', vars: {}, snapshot: s, root: s.elements[2]!, matched: { e2: { rules: [rule('.tag', 'developer-systems (min-width: 600px)'), rule('.tag', 'developer-systems (min-width: 1300px)'), rule('.tag', 'style(--x: 1)')], inline: [], pseudo: [] } }, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase: 'https://store.example/dse' } });
    expect(out.rules).toBe('.tag { font-size: 14px; }\n@container style(--x: 1) { .tag { font-size: 14px; } }');
  });

  it('carries a layered reset in its own layer, and keeps hidden inputs hidden', () => {
    const star = { selector: '*', matched: ['*'], origin: 'regular', media: [], supports: [], layerRank: 0, declarations: [{ name: 'margin', value: '0', important: false }] };
    expect(universalCarry([star], new Set(['h3']))).toEqual([{ selector: 'h3', declarations: star.declarations, layerRank: 0 }]);
    expect(sanitizeMarkup('<form><input type="hidden" value="footer_email"><input type="color"></form>', { storageBase: 'https://store.example/dse' }).html).toBe('<form><input type="hidden" value="footer_email"><input type="text"></form>');
  });

  it('resolves container query units against the nearest container', () => {
    expect(viewportUnits('calc(50cqw - 8px)', { width: 1440, height: 900 }, { width: 1300, height: 600 })).toBe('calc(650px - 8px)');
    expect(viewportUnits('10cqh', { width: 1440, height: 900 })).toBe('90px');
  });
});
