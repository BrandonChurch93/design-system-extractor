// Renders the catalog's sample capture and crop from apps/web/public/catalog/sample-site.html.
// Run once when the sample changes; the PNGs are committed so QA stays deterministic.
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const dir = resolve(import.meta.dirname, '../apps/web/public/catalog');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(`file://${dir}/sample-site.html`);
await page.screenshot({ path: `${dir}/sample-capture.png`, fullPage: true });
const btn = page.locator('.hero .btn').first();
const box = await btn.boundingBox();
if (!box) throw new Error('sample button not found');
const pad = 8;
await page.screenshot({ path: `${dir}/sample-crop.png`, clip: { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } });
const size = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
console.log(JSON.stringify({ capture: size, button: { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }, crop: { w: Math.round(box.width + pad * 2), h: Math.round(box.height + pad * 2) } }));
await browser.close();
