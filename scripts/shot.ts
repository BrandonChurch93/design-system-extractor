// Dev helper: screenshot one URL. tsx scripts/shot.ts <url> <out.png> [width] [height] [full 1|0] [dpr]
// Scrolls through the page first, as design QA does, so in-view entrances and lazy frames have run.
import { chromium } from '@playwright/test';

const [url, out, w = '1440', h = '900', full = '1', dpr = '1'] = process.argv.slice(2);
if (!url || !out) throw new Error('usage: shot.ts <url> <out.png> [width] [height] [full] [dpr]');
const browser = await chromium.launch({ args: ['--disable-site-isolation-trials', '--disable-features=IsolateOrigins,site-per-process'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: Number(dpr) });
await page.goto(url, { waitUntil: 'load' });
// Prefetches of routes that do not answer yet can keep the network busy; idle is best effort.
await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
if (full === '1') {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
}
await page.waitForTimeout(1500);
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close();
