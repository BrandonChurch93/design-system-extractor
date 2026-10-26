import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { axeCheck } from '../qa/axe-check';
import { freezeClock, settle, viewports, withBlocked, withFullHeight } from '../qa/pages';

// With BILLING_ENABLED on, every flagged surface renders in its place (docs/specs/v2-seams.md):
// captured for review into qa/billing and checked by axe at three viewports.

const out = resolve(import.meta.dirname, '../../qa/billing');
const usage = { used: 1.94, budget: 2, runsToday: 41, resetsAt: '2026-10-27T06:00:00.000Z' };

async function openSignIn(page: Page, width: number) {
  if (width < 768) await page.getByRole('button', { name: 'Menu' }).click();
  await page.locator('#dse-nav-menu, header nav').getByRole('button', { name: 'Sign in' }).locator('visible=true').first().click();
  await page.getByRole('dialog', { name: 'Sign in' }).waitFor();
  await page.waitForTimeout(600);
}

type Shot = { name: string; path: string; before?: (page: Page) => Promise<void>; setup?: (page: Page, width: number) => Promise<void>; surfaces: number };

const shots: Shot[] = [
  { name: 'home', path: '/', surfaces: 2, setup: async (page) => void (await page.locator('#plans').scrollIntoViewIfNeeded()) },
  { name: 'sign-in', path: '/', surfaces: 2, setup: openSignIn },
  { name: 'budget', path: '/state/budget?url=https%3A%2F%2Ftidewater.app%2F', before: withBlocked(usage), surfaces: 2 },
  { name: 'visitor-cap', path: '/state/visitor-cap?url=https%3A%2F%2Ftidewater.app%2F', before: withBlocked({ used: 2, budget: 2, runsToday: 2, resetsAt: usage.resetsAt }), surfaces: 2 },
  { name: 'billing', path: '/account/billing', surfaces: 2 },
];

for (const vp of viewports) {
  for (const s of shots) {
    test(`${s.name} · ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await freezeClock(page);
      if (s.before) await s.before(page);
      const res = await page.goto(s.path);
      expect(res?.status()).toBe(200);
      await settle(page);
      if (s.setup) await s.setup(page, vp.width);
      expect(await page.locator('[data-testid="v2-surface"]').count()).toBeGreaterThanOrEqual(s.surfaces);
      const dir = join(out, vp.name);
      mkdirSync(dir, { recursive: true });
      await withFullHeight(page, () => page.screenshot({ path: join(dir, `${s.name}.png`) }));
      await axeCheck(page);
    });
  }
}

test('choosing a paid plan without a session asks to sign in, and the mock says sign-in is off', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await page.getByRole('button', { name: 'Choose Pro' }).click();
  const sheet = page.getByRole('dialog', { name: 'Sign in' });
  await sheet.getByLabel('Email').fill('ada@tidewater.app');
  await sheet.getByRole('button', { name: 'Send a sign-in link' }).click();
  await expect(page.getByRole('status')).toContainText('Sign-in is not enabled yet.');
});
