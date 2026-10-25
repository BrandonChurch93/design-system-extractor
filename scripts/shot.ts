// Dev helper: screenshot one URL. tsx scripts/shot.ts <url> <out.png> [width] [height] [full 1|0] [dpr]
import { chromium } from '@playwright/test';

const [url, out, w = '1440', h = '900', full = '1', dpr = '1'] = process.argv.slice(2);
if (!url || !out) throw new Error('usage: shot.ts <url> <out.png> [width] [height] [full] [dpr]');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: Number(dpr) });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close();
