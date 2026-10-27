// Fixture authoring check: the tailwind and css-in-js sites must render like clean, page by page.
import { chromium } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { pages } from '../fixtures/src/clean-family/site';

const paths = [...pages.map((p) => p.path), '/missing-page'];
const browser = await chromium.launch();
let worst = 0;
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  // At rest: the entrance and the reveals would otherwise be caught mid-move.
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  for (const path of paths) {
    const shots: Record<string, PNG> = {};
    for (const site of ['clean', 'tailwind', 'css-in-js']) {
      await page.goto(`http://localhost:4100/sites/${site}${path === '/' ? '/' : path}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      shots[site] = PNG.sync.read(await page.screenshot({ fullPage: true }));
    }
    const a = shots.clean!;
    for (const site of ['tailwind', 'css-in-js']) {
      const b = shots[site]!;
      if (a.width !== b.width || a.height !== b.height) {
        console.log(`${vp.width} ${path} ${site}: size ${b.width}×${b.height} vs ${a.width}×${a.height}`);
        worst = 1;
        continue;
      }
      const diff = pixelmatch(a.data, b.data, undefined, a.width, a.height, { threshold: 0.1 });
      const pct = (diff / (a.width * a.height)) * 100;
      worst = Math.max(worst, pct);
      if (pct > 0) console.log(`${vp.width} ${path} ${site}: ${pct.toFixed(3)} % differs`);
    }
  }
  await page.close();
}
await browser.close();
console.log(worst === 0 ? 'all three render identically' : `worst difference ${worst.toFixed(3)} %`);
