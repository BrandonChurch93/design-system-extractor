import { expect, test } from '@playwright/test';
import { qaPages, settle } from '../qa/pages';

// Every page and state works at 390 px with no horizontal scroll (CLAUDE.md rule 10).

for (const p of qaPages) {
  for (const st of p.states) {
    test(`no horizontal scroll at 390 · ${p.name} · ${st.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      if (st.before) await st.before(page);
      await page.goto(st.path ?? p.path);
      await settle(page);
      if (st.setup) await st.setup(page);
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const wide = [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right > doc.clientWidth + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('[data-scroll-x]');
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80));
        return { scroll: doc.scrollWidth - doc.clientWidth, wide };
      });
      expect(overflow.scroll, overflow.wide.join(' | ')).toBeLessThanOrEqual(0);
    });
  }
}
