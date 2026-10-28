import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { Browser, BrowserContext, Page } from 'playwright';
import { GOOGLE_FONTS_CSS, GOOGLE_FONTS_FILES, PIXEL_THRESHOLD, RENDER_PAD } from './constants';

// The render check (docs/specs/preview-fidelity.md, step 5): load the stored preview from its storage
// URL, exactly as the app's sandboxed iframe will, and compare it with the captured crop.

export type RenderSession = {
  context: BrowserContext;
  page: Page;
  /** Requests the session refused because they left the allowlist. */
  refused: string[];
  close(): Promise<void>;
};

export async function openRenderSession(browser: Browser, storageBase: string): Promise<RenderSession> {
  const context = await browser.newContext({ deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
  const refused: string[] = [];
  const allowed = [storageBase, GOOGLE_FONTS_CSS, GOOGLE_FONTS_FILES].filter(Boolean).map((b) => `${b.replace(/\/$/, '')}/`);
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('data:') || allowed.some((a) => url.startsWith(a))) return route.continue();
    refused.push(url);
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  return { context, page, refused, close: () => context.close() };
}

/**
 * Loads a preview at the instance's size plus the pad, paints its ground behind the transparent
 * document as the app's frame does (D-094), and screenshots its root.
 */
/**
 * `place`: the element's fractional place on the page and the span the reference crop covers, so the
 * render starts where the page's pixels do (the crop begins on a whole device pixel, D-098).
 */
export type Placement = { phase: { x: number; y: number }; clip: { w: number; h: number } };

export async function renderPreview(s: RenderSession, url: string, size: { w: number; h: number }, ground?: string, place?: Placement): Promise<Buffer | null> {
  await s.page.setViewportSize({ width: Math.max(1, Math.ceil(size.w + RENDER_PAD * 2)), height: Math.max(1, Math.ceil(size.h + RENDER_PAD * 2)) });
  try {
    await s.page.goto(url, { waitUntil: 'load', timeout: 15_000 });
    if (ground && /^#[0-9A-F]{6}$/i.test(ground)) await s.page.addStyleTag({ content: `html { background: ${ground}; }` });
    await s.page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => true);
    const root = s.page.locator('.dse-root');
    if ((await root.count()) === 0) return null;
    if (place && (place.phase.x > 0 || place.phase.y > 0)) {
      await s.page.addStyleTag({ content: `.dse-root { position: relative; left: ${place.phase.x}px; top: ${place.phase.y}px; }` });
      const o = await root.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - Number.parseFloat(getComputedStyle(el).left || '0'), y: r.top - Number.parseFloat(getComputedStyle(el).top || '0') };
      });
      return await s.page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide', timeout: 10_000, clip: { x: o.x, y: o.y, width: place.clip.w, height: place.clip.h } });
    }
    return await root.screenshot({ type: 'png', animations: 'disabled', caret: 'hide', timeout: 10_000 });
  } catch {
    return null;
  }
}

/** The boxes of the text in the loaded preview, in CSS px from its root (the masked font comparison, D-095). */
export async function textBoxes(s: RenderSession): Promise<{ x: number; y: number; w: number; h: number }[]> {
  return s.page
    .evaluate(() => {
      const root = document.querySelector('.dse-root');
      if (!root) return [];
      const o = root.getBoundingClientRect();
      const out: { x: number; y: number; w: number; h: number }[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent?.trim()) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const b of r.getClientRects()) if (b.width > 0 && b.height > 0) out.push({ x: b.left - o.left, y: b.top - o.top, w: b.width, h: b.height });
      }
      return out;
    })
    .catch(() => []);
}

/** The image with each box (grown by 2 CSS px for glyph overhang) painted one flat color, so text alone cannot differ. */
export function maskBoxes(png: Buffer, boxes: { x: number; y: number; w: number; h: number }[], cssWidth: number): Buffer {
  const img = PNG.sync.read(png);
  const scale = img.width / cssWidth;
  for (const b of boxes) {
    const x0 = Math.max(0, Math.floor((b.x - 2) * scale));
    const y0 = Math.max(0, Math.floor((b.y - 2) * scale));
    const x1 = Math.min(img.width, Math.ceil((b.x + b.w + 2) * scale));
    const y1 = Math.min(img.height, Math.ceil((b.y + b.h + 2) * scale));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * img.width + x) * 4;
        img.data[i] = 255;
        img.data[i + 1] = 0;
        img.data[i + 2] = 255;
        img.data[i + 3] = 255;
      }
    }
  }
  return PNG.sync.write(img);
}

/** Device pixels the comparison may shift by, and the size difference it forgives (fractional page boxes). */
export const ALIGN_SLACK = 2;
export const SIZE_SLACK = 4;

/**
 * Differing pixels in percent, at the best alignment within two device pixels. A size difference
 * beyond four device pixels counts as differing, so a preview that renders too big or small is not live.
 */
export function diffPercent(a: Buffer, b: Buffer): number {
  const pa = PNG.sync.read(a);
  const pb = PNG.sync.read(b);
  const w = Math.min(pa.width, pb.width);
  const h = Math.min(pa.height, pb.height);
  if (w <= ALIGN_SLACK * 2 || h <= ALIGN_SLACK * 2) return 100;
  const total = Math.max(pa.width * pa.height, pb.width * pb.height);
  const extraW = Math.max(0, Math.abs(pa.width - pb.width) - SIZE_SLACK);
  const extraH = Math.max(0, Math.abs(pa.height - pb.height) - SIZE_SLACK);
  const sizePenalty = (extraW * h + extraH * w) / total;
  const region = (p: PNG, x0: number, y0: number, rw: number, rh: number) => {
    const out = new PNG({ width: rw, height: rh });
    PNG.bitblt(p, out, x0, y0, rw, rh, 0, 0);
    return out.data;
  };
  const cache = new Map<string, number>();
  const at = (dx: number, dy: number) => {
    const k = `${dx},${dy}`;
    let v = cache.get(k);
    if (v === undefined) {
      const rw = w - Math.abs(dx);
      const rh = h - Math.abs(dy);
      v = pixelmatch(region(pa, Math.max(dx, 0), Math.max(dy, 0), rw, rh), region(pb, Math.max(-dx, 0), Math.max(-dy, 0), rw, rh), null, rw, rh, { threshold: PIXEL_THRESHOLD, includeAA: false }) / (rw * rh);
      cache.set(k, v);
    }
    return v;
  };
  // Descend from the unshifted position to the best neighbour until none is better, within the slack:
  // the same minimum as trying all 25 shifts when the difference falls toward the true alignment.
  let pos = { dx: 0, dy: 0 };
  let best = at(0, 0);
  while (best > 0) {
    let step: { dx: number; dy: number } | null = null;
    for (let dy = pos.dy - 1; dy <= pos.dy + 1; dy++) {
      for (let dx = pos.dx - 1; dx <= pos.dx + 1; dx++) {
        if (Math.abs(dx) > ALIGN_SLACK || Math.abs(dy) > ALIGN_SLACK) continue;
        const v = at(dx, dy);
        if (v < best) {
          best = v;
          step = { dx, dy };
        }
      }
    }
    if (!step) break;
    pos = step;
  }
  return Math.min(100, Math.round((best + sizePenalty) * 1000) / 10);
}
