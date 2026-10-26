import { expect, test } from '@playwright/test';
import { freezeClock, qaPages, settle, viewports, withFullHeight } from './pages';

// Visual regression against committed goldens in apps/web/test/goldens (docs/evals.md).

for (const vp of viewports) {
  for (const p of qaPages) {
    for (const st of p.states) {
      test(`${p.name} · ${vp.name} · ${st.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await freezeClock(page);
        if (st.before) await st.before(page);
        await page.goto(st.path ?? p.path);
        await settle(page);
        if (st.setup) await st.setup(page);
        await withFullHeight(page, () =>
          expect(page).toHaveScreenshot(`${p.name}/${vp.name}/${st.name}.png`, {
            animations: 'disabled',
            caret: 'hide',
            mask: (p.mask ?? []).map((m) => page.locator(m)),
          }),
        );
      });
    }
  }
}

// Open Graph images against goldens (docs/design/pages.md, Page metadata; P13 gate).
for (const [name, path] of [['og-home', '/opengraph-image'], ['og-run', '/api/runs/seedclean0/og']] as const) {
  test(`open graph image · ${name}`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(await res.body()).toMatchSnapshot(`${name}.png`, { maxDiffPixelRatio: 0.001, maxDiffPixels: 25 });
  });
}
