import { expect, test, type Page } from '@playwright/test';
import { qaPages, settle } from '../qa/pages';

// The flag-off test, rendered half (docs/specs/v2-seams.md, D-060): every page and state of the QA
// registry with BILLING_ENABLED off carries no v2 surface, no link to the account or plans, and no
// plan words in the chrome. The catalog is the one page that shows the surfaces always.

const words = /\b(pricing|plans|billing|upgrade|subscription|pro|team)\b/i;

async function assertNoV2(page: Page) {
  expect(await page.locator('[data-testid="v2-surface"]').count()).toBe(0);
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
  expect(hrefs.filter((h) => /^\/account(\/|$)|#plans$/.test(h))).toEqual([]);
  const chrome = await page.locator('[data-testid="chrome"]').allInnerTexts();
  expect(chrome.length).toBeGreaterThan(0);
  expect(chrome.filter((t) => words.test(t))).toEqual([]);
  const metas = await page.locator('head meta[content]').evaluateAll((ms) => ms.map((m) => m.getAttribute('content') ?? ''));
  expect(metas.filter((c) => /\b(pricing|plans|billing|upgrade|subscription)\b/i.test(c))).toEqual([]);
}

for (const width of [1440, 390]) {
  for (const p of qaPages.filter((x) => x.name !== 'catalog')) {
    for (const st of p.states) {
      test(`${p.name} · ${st.name} · ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        if (st.before) await st.before(page);
        await page.goto(st.path ?? p.path);
        await settle(page);
        if (st.setup) await st.setup(page);
        await assertNoV2(page);
        if (width < 768) {
          // The phone menu holds the nav's extra items; a sheet open for the state covers it, so close that first.
          if (await page.getByRole('dialog').count()) await page.keyboard.press('Escape');
          await page.getByRole('dialog').waitFor({ state: 'detached' });
          await page.getByRole('button', { name: 'Menu' }).click();
          await page.locator('#dse-nav-menu').waitFor();
          await assertNoV2(page);
        }
      });
    }
  }
}

test('the account routes are not there with the flag off', async ({ request }) => {
  for (const path of ['/account/billing', '/account']) expect((await request.get(path)).status()).toBe(404);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toMatch(/account|plans|pricing/);
});
