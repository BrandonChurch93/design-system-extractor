import { expect, test } from '@playwright/test';
import { qaPages } from '../qa/pages';

// Headings never wrap more than two lines at desktop (docs/design/design-system.md, Type): at 1440
// every visible h1 and h2 on every page and state of the QA registry is at most two lines tall.

for (const p of qaPages) {
  for (const st of p.states) {
    test(`headings wrap to two lines at most at 1440 · ${p.name} · ${st.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      if (st.before) await st.before(page);
      await page.goto(st.path ?? p.path);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      if (st.setup) await st.setup(page);
      const headings = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('h1, h2')]
          .filter((h) => h.getClientRects().length > 0 && h.offsetWidth > 1 && !h.closest('[aria-hidden="true"], .visually-hidden'))
          .map((h) => {
            const cs = getComputedStyle(h);
            const px = (v: string) => parseFloat(v) || 0;
            const lineHeight = cs.lineHeight === 'normal' ? px(cs.fontSize) * 1.2 : px(cs.lineHeight);
            const content = h.getBoundingClientRect().height - px(cs.paddingTop) - px(cs.paddingBottom) - px(cs.borderTopWidth) - px(cs.borderBottomWidth);
            return { text: h.innerText.trim().slice(0, 80), lines: Math.round(content / lineHeight) };
          }),
      );
      expect(headings.length).toBeGreaterThan(0);
      expect(headings.filter((h) => h.lines < 1 || h.lines > 2)).toEqual([]);
    });
  }
}
