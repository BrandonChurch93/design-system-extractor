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

// The showcase never leaves an orphan row at three or two columns (docs/specs/showcase.md, P13 gate).
for (const [width, columns] of [[1440, 3], [820, 2]] as const) {
  test(`the showcase fills every row at ${columns} columns`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await settle(page);
    const rows = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('ul li a[href^="/r/"]')].map((a) => a.closest('li')!.getBoundingClientRect());
      const byTop = new Map<number, number>();
      for (const r of cards) byTop.set(Math.round(r.top), (byTop.get(Math.round(r.top)) ?? 0) + 1);
      return [...byTop.values()];
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((n) => n === columns), rows.join(', ')).toBe(true);
  });
}
