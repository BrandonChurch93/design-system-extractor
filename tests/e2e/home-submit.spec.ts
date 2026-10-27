import { expect, test, type Page, type Route } from '@playwright/test';
import { global, home, keyPopover } from '../../apps/web/copy/strings';

// Submitting UrlForm (docs/design/pages.md, Home) against a mocked POST /api/runs, so no run is
// ever created; the visitor cookie (docs/specs/caps-and-budget.md, Visitor identity); the saved key.

type Answer = { status: number; body?: unknown };

/** Answers POST /api/runs; every other method on the route goes to the app. Returns the requests seen. */
async function mockCreate(page: Page, answer: Answer) {
  const seen: { headers: Record<string, string>; body: unknown }[] = [];
  await page.route('**/api/runs', async (route: Route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    seen.push({ headers: req.headers(), body: req.postDataJSON() });
    await route.fulfill({ status: answer.status, contentType: 'application/json', body: JSON.stringify(answer.body ?? {}) });
  });
  return seen;
}

async function openHome(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  // The form submits through React; a click before hydration would be a native GET.
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
}

async function submit(page: Page, url: string) {
  await page.getByLabel(home.inputLabel).fill(url);
  await page.getByRole('button', { name: home.extract, exact: true }).click();
}

test('a created run opens its page', async ({ page }) => {
  const seen = await mockCreate(page, { status: 200, body: { id: 'seedclean0', runsLeft: 1 } });
  await openHome(page);
  await submit(page, 'tidewater.app');
  await expect(page).toHaveURL(/\/r\/seedclean0$/);
  expect(seen.map((s) => s.body)).toEqual([{ url: 'https://tidewater.app/' }]);
});

test('a blocked result is kept in sessionStorage.dse_blocked and opens the state route with the attempted URL', async ({ page }) => {
  const detail = { used: 1.94, budget: 2, runsToday: 41, resetsAt: '2026-10-27T06:00:00.000Z' };
  await mockCreate(page, { status: 200, body: { blocked: 'budget', detail, runsLeft: 1 } });
  await openHome(page);
  await submit(page, 'https://tidewater.app/');
  await expect(page).toHaveURL(`/state/budget?url=${encodeURIComponent('https://tidewater.app/')}`);
  expect(await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('dse_blocked') ?? 'null'))).toEqual(detail);
});

for (const [status, line, name] of [
  [429, global.rateLimit, 'the rate-limit line'],
  [400, global.validation, 'the validation line'],
] as const) {
  test(`a ${status} shows ${name} inline and stays on the page`, async ({ page }) => {
    await mockCreate(page, { status, body: { error: 'no' } });
    await openHome(page);
    await submit(page, 'tidewater.app');
    await expect(page.getByText(line)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/');
  });
}

test('the client checks refuse inline before any request: another host on an include line, a scheme that is not http', async ({ page }) => {
  const seen = await mockCreate(page, { status: 200, body: { id: 'seedclean0', runsLeft: 1 } });
  await openHome(page);
  await page.getByRole('button', { name: home.include.toggle }).click();
  await page.getByRole('textbox', { name: home.include.toggle }).fill('https://tidewater.app/pricing\nhttps://example.com/about');
  await submit(page, 'tidewater.app');
  await expect(page.getByText(home.errors.otherHost)).toBeVisible();
  await submit(page, 'ftp://tidewater.app/');
  await expect(page.getByText(home.errors.notHttp)).toBeVisible();
  await page.waitForTimeout(300);
  expect(seen).toEqual([]);
  expect(new URL(page.url()).pathname).toBe('/');
});

test('a page view of the home page sets no cookie', async ({ page, context }) => {
  await context.clearCookies();
  await openHome(page);
  await page.reload();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  expect(await context.cookies()).toEqual([]);
});

test('KeyPopover saves the key to localStorage.dse_key, sends it as x-byo-key, and Remove clears it', async ({ page }) => {
  const key = 'sk-ant-api03-e2etestkey';
  const seen = await mockCreate(page, { status: 200, body: { id: 'seedclean0', runsLeft: null } });
  await openHome(page);
  await page.getByRole('button', { name: home.capsKey }).click();
  const dialog = page.getByRole('dialog', { name: keyPopover.label });
  await dialog.locator('input[type="password"]').fill(key);
  await dialog.getByRole('button', { name: keyPopover.save }).click();
  expect(await page.evaluate(() => window.localStorage.getItem('dse_key'))).toBe(key);
  await submit(page, 'tidewater.app');
  await expect(page).toHaveURL(/\/r\/seedclean0$/);
  expect(seen[0]!.headers['x-byo-key']).toBe(key);

  await openHome(page);
  await page.getByRole('button', { name: home.capsKey }).click();
  await expect(dialog.getByText(keyPopover.saved)).toBeVisible();
  await dialog.getByRole('button', { name: keyPopover.remove }).click();
  expect(await page.evaluate(() => window.localStorage.getItem('dse_key'))).toBeNull();
});
