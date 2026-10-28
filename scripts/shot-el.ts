// Dev helper: screenshot one element of a page. tsx scripts/shot-el.ts <url> <out.png> <selector> [width] [reduce|no-preference] [dpr]
import { chromium } from '@playwright/test';

const [url, out, selector, w = '1440', motion = 'reduce', dpr = '1'] = process.argv.slice(2);
if (!url || !out || !selector) throw new Error('usage: shot-el.ts <url> <out.png> <selector> [width] [reduce|no-preference] [dpr]');
const browser = await chromium.launch({ args: ['--disable-site-isolation-trials', '--disable-features=IsolateOrigins,site-per-process'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: 900 }, reducedMotion: motion === 'reduce' ? 'reduce' : 'no-preference', deviceScaleFactor: Number(dpr) });
await page.goto(url, { waitUntil: 'load' });
await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
const el = page.locator(selector).first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await el.screenshot({ path: out });
await browser.close();
