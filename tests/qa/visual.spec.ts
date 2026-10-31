import { expect, test } from '@playwright/test';
import { demoIndex } from '../../apps/web/components/catalog/demo-index';
import { expectPreviewsPainted, freezeClock, qaPages, settle, viewports, waitForPreviews, withFullHeight } from './pages';

// Visual regression against committed goldens in apps/web/test/goldens (docs/evals.md).

for (const vp of viewports) {
  for (const p of qaPages.filter((x) => x.name !== 'catalog')) {
    for (const st of p.states) {
      test(`${p.name} · ${vp.name} · ${st.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await freezeClock(page);
        if (st.before) await st.before(page);
        await page.goto(st.path ?? p.path);
        await settle(page);
        if (st.setup) await st.setup(page);
        const shot = { animations: 'disabled' as const, caret: 'hide' as const, timeout: 30_000, mask: (p.mask ?? []).map((m) => page.locator(m)) };
        if (st.element) {
          await expectPreviewsPainted(page, st.element(page));
          await expect(st.element(page)).toHaveScreenshot(`${p.name}/${vp.name}/${st.name}.png`, shot);
          return;
        }
        await withFullHeight(page, async () => {
          await waitForPreviews(page);
          await expectPreviewsPainted(page);
          await expect(page).toHaveScreenshot(`${p.name}/${vp.name}/${st.name}.png`, shot);
        });
      });
    }
  }
}

// The catalog section by section: one capture of the whole page at 1440 is a layer of 400 MB that
// Chromium rasterizes in tiles, and a tile can be missing when the capture is taken (D-090).
const catalog = qaPages.find((x) => x.name === 'catalog')!;
for (const vp of viewports) {
  test(`catalog · ${vp.name} · sections`, async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await freezeClock(page);
    await page.goto(catalog.path);
    await settle(page);
    const mask = (catalog.mask ?? []).map((m) => page.locator(m));
    await expect.soft(page).toHaveScreenshot(`catalog/${vp.name}/top.png`, { animations: 'disabled', caret: 'hide', mask });
    for (const d of demoIndex) {
      const section = page.locator(`[data-catalog-section="${d.slug}"]`);
      await section.evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await waitForPreviews(page);
      await page.waitForTimeout(600);
      await expectPreviewsPainted(page, section);
      await expect.soft(section).toHaveScreenshot(`catalog/${vp.name}/${d.slug}.png`, { animations: 'disabled', caret: 'hide', mask, timeout: 15_000 });
    }
  });
}

// Open Graph images against goldens (docs/design/pages.md, Page metadata; P13 gate).
for (const [name, path] of [['og-home', '/opengraph-image'], ['og-run', '/api/runs/seedclean0/og']] as const) {
  test(`open graph image · ${name}`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(await res.body()).toMatchSnapshot(`${name}.png`, { maxDiffPixelRatio: 0.001, maxDiffPixels: 25 });
  });
}
