import { expect, test } from '@playwright/test';
import { global, v2 } from '../../apps/web/copy/strings';

// /account/billing with the flag on: noindex, its title and description from copy (pages.md, D-060).

test('the billing page is noindex and carries its metadata from the copy', async ({ page }) => {
  await page.goto('/account/billing');
  const meta = (sel: string) => page.evaluate((q) => document.head.querySelector(q)?.getAttribute('content') ?? null, sel);
  expect(await page.title()).toBe(`${v2.billing.title}${global.titleSuffix}`);
  expect(await meta('meta[name="description"]')).toBe(v2.billing.metaDescription);
  expect(await meta('meta[name="robots"]')).toMatch(/noindex/);
});
