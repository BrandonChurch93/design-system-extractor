// Dev helper: screenshot one URL. tsx scripts/shot.ts <url> <out.png> [width] [height] [full 1|0] [dpr]
import { chromium } from '@playwright/test';

const [url, out, w = '1440', h = '900', full = '1', dpr = '1'] = process.argv.slice(2);
if (!url || !out) throw new Error('usage: shot.ts <url> <out.png> [width] [height] [full] [dpr]');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: Number(dpr) });
await page.goto(url, { waitUntil: 'load' });
// Prefetches of routes that do not answer yet can keep the network busy; idle is best effort.
await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close();
