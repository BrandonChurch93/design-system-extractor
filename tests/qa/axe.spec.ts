import { test } from '@playwright/test';
import { axeCheck as check } from './axe-check';
import { freezeClock, axePages, qaPages, settle, viewports } from './pages';

// axe on every page and state at every viewport: zero violations (docs/evals.md).

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
        await check(page, p.axeExclude);
      });
    }
  }
}

for (const p of axePages) {
  test(`${p.name} · ${p.viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: p.viewport.width, height: p.viewport.height });
    await page.goto(p.path);
    await settle(page);
    await check(page);
  });
}
