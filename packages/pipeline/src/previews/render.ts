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

/** Loads a preview at the instance's size plus the pad, and screenshots its root. */
export async function renderPreview(s: RenderSession, url: string, size: { w: number; h: number }): Promise<Buffer | null> {
  await s.page.setViewportSize({ width: Math.max(1, Math.ceil(size.w + RENDER_PAD * 2)), height: Math.max(1, Math.ceil(size.h + RENDER_PAD * 2)) });
  try {
    await s.page.goto(url, { waitUntil: 'load', timeout: 15_000 });
    await s.page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => true);
    const root = s.page.locator('.dse-root');
    if ((await root.count()) === 0) return null;
    return await root.screenshot({ type: 'png', animations: 'disabled', caret: 'hide', timeout: 10_000 });
  } catch {
    return null;
  }
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
  let best = 1;
  for (let dy = -ALIGN_SLACK; dy <= ALIGN_SLACK; dy++) {
    for (let dx = -ALIGN_SLACK; dx <= ALIGN_SLACK; dx++) {
      const rw = w - Math.abs(dx);
      const rh = h - Math.abs(dy);
      const mismatched = pixelmatch(region(pa, Math.max(dx, 0), Math.max(dy, 0), rw, rh), region(pb, Math.max(-dx, 0), Math.max(-dy, 0), rw, rh), null, rw, rh, { threshold: PIXEL_THRESHOLD, includeAA: false });
      best = Math.min(best, mismatched / (rw * rh));
      if (best === 0) break;
    }
    if (best === 0) break;
  }
  return Math.min(100, Math.round((best + sizePenalty) * 1000) / 10);
}
