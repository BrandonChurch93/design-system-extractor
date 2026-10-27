import { expect, test, type Locator, type Page } from '@playwright/test';
import { componentPanel, global, runPage, statePages } from '../../apps/web/copy/strings';

// The primitives' behaviors on their /catalog demos at desktop (docs/design/components.md,
// Primitives): Popover, Sheet, Tabs, ChipGroup, Toast and CaptureViewer.

async function catalog(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/catalog');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
}

const focusInside = (l: Locator) => l.evaluate((el) => el.contains(document.activeElement));

test.describe('Popover', () => {
  test('opens on click with focus inside; Escape closes it and focus returns to the trigger', async ({ page }) => {
    await catalog(page);
    const trigger = page.locator('#popover').getByRole('button', { name: '12 pages' });
    const pop = page.getByRole('dialog', { name: statePages.recentRuns });
    await trigger.click();
    await expect(pop).toBeVisible();
    await expect.poll(() => focusInside(pop)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(pop).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('opens on Enter; closes on an outside click and when focus leaves', async ({ page }) => {
    await catalog(page);
    const trigger = page.locator('#popover').getByRole('button', { name: '12 pages' });
    const pop = page.getByRole('dialog', { name: statePages.recentRuns });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(pop).toBeVisible();
    await page.mouse.click(1400, 20);
    await expect(pop).toHaveCount(0);
    await trigger.click();
    await expect(pop).toBeVisible();
    await page.locator('#tabs').getByRole('tab').first().focus();
    await expect(pop).toHaveCount(0);
  });

  test('flips to stay inside the viewport when its trigger sits at the bottom edge', async ({ page }) => {
    await catalog(page);
    const trigger = page.locator('#popover').getByRole('button', { name: '12 pages' });
    await trigger.evaluate((el) => {
      el.scrollIntoView({ block: 'end', behavior: 'instant' });
      window.scrollBy({ top: -8, behavior: 'instant' });
    });
    const t = (await trigger.boundingBox())!;
    expect(t.y + t.height).toBeGreaterThan(860);
    await trigger.click();
    const pop = page.getByRole('dialog', { name: statePages.recentRuns });
    await expect(pop).toBeVisible();
    await page.waitForTimeout(300);
    const b = (await pop.boundingBox())!;
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.y + b.height).toBeLessThanOrEqual(900);
    expect(b.y + b.height).toBeLessThanOrEqual(t.y);
  });
});

test.describe('Sheet', () => {
  const open = async (page: Page) => {
    const trigger = page.locator('#sheet').getByRole('button', { name: runPage.buttons.share });
    await trigger.click();
    const sheet = page.getByRole('dialog', { name: runPage.buttons.share });
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(500);
    return { trigger, sheet };
  };

  test('traps focus; Escape closes it and focus returns to the trigger', async ({ page }) => {
    await catalog(page);
    const { trigger, sheet } = await open(page);
    expect(await focusInside(sheet)).toBe(true);
    for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      expect(await focusInside(sheet), key).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('the scrim closes it', async ({ page }) => {
    await catalog(page);
    const { sheet } = await open(page);
    await page.mouse.click(720, 20);
    await expect(sheet).toHaveCount(0);
  });

  test('dragging the handle down closes it', async ({ page }) => {
    await catalog(page);
    const { sheet } = await open(page);
    const handle = (await sheet.getByRole('button', { name: global.icons.close }).boundingBox())!;
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x, y + i * 25);
    await page.mouse.up();
    await expect(sheet).toHaveCount(0);
  });
});

test('Tabs: arrow keys, Home and End move the selection and the focus, wrapping at the ends', async ({ page }) => {
  await catalog(page);
  const list = page.locator('#tabs').getByRole('tablist').first();
  const tab = (name: string) => list.getByRole('tab', { name, exact: true });
  const { html, css, tailwind } = runPage.codeTabs;
  await tab(css).focus();
  for (const [key, name] of [
    ['ArrowRight', tailwind],
    ['ArrowRight', html],
    ['ArrowLeft', tailwind],
    ['Home', html],
    ['End', tailwind],
  ] as const) {
    await page.keyboard.press(key);
    await expect(tab(name), key).toHaveAttribute('aria-selected', 'true');
    await expect(tab(name)).toBeFocused();
  }
  await expect(list.locator('[aria-selected="true"]')).toHaveCount(1);
});

test('ChipGroup: arrow keys, Home and End move the selection and the focus, wrapping at the ends', async ({ page }) => {
  await catalog(page);
  const group = page.locator('#chip').getByRole('radiogroup').first();
  const chips = group.getByRole('radio');
  await expect(chips).toHaveCount(4);
  await chips.nth(0).focus();
  for (const [key, i] of [
    ['ArrowRight', 1],
    ['ArrowDown', 2],
    ['ArrowLeft', 1],
    ['ArrowUp', 0],
    ['ArrowLeft', 3],
    ['Home', 0],
    ['End', 3],
  ] as const) {
    await page.keyboard.press(key);
    await expect(chips.nth(i), key).toHaveAttribute('aria-checked', 'true');
    await expect(chips.nth(i)).toBeFocused();
  }
  await expect(group.locator('[aria-checked="true"]')).toHaveCount(1);
});

test.describe('Toast', () => {
  const show = async (page: Page) => page.locator('#toast').getByRole('button', { name: runPage.buttons.share }).click();
  // A toast is the inverse block inside the status region; the catalog's at-rest sample is not in one.
  const toasts = (page: Page) => page.locator('[role="status"] > [data-inverse]');

  test('dismisses itself after 4 s', async ({ page }) => {
    await catalog(page);
    await show(page);
    await expect(toasts(page)).toHaveText(global.toasts.linkCopied);
    await page.mouse.move(10, 10);
    await page.waitForTimeout(3500);
    await expect(toasts(page)).toHaveCount(1);
    await expect(toasts(page)).toHaveCount(0, { timeout: 1500 });
  });

  test('pauses while hovered and dismisses after the pointer leaves', async ({ page }) => {
    await catalog(page);
    await show(page);
    await toasts(page).first().hover();
    await page.waitForTimeout(5000);
    await expect(toasts(page)).toHaveCount(1);
    await page.mouse.move(10, 10);
    // The time left resumes: about 4 s from the hover, then the exit.
    await page.waitForTimeout(2000);
    await expect(toasts(page)).toHaveCount(1);
    await expect(toasts(page)).toHaveCount(0, { timeout: 3500 });
  });

  test('a second toast replaces the first', async ({ page }) => {
    await catalog(page);
    await show(page);
    await page.waitForTimeout(500);
    await show(page);
    await page.waitForTimeout(800);
    await expect(toasts(page)).toHaveCount(1);
  });

  test('never shows two at once, even while one replaces another', async ({ page }) => {
    await catalog(page);
    const counts: number[] = [];
    await show(page);
    await page.waitForTimeout(500);
    await show(page);
    for (let i = 0; i < 8; i++) {
      counts.push(await toasts(page).count());
      await page.waitForTimeout(60);
    }
    expect(Math.max(...counts), counts.join(', ')).toBe(1);
  });
});

test('CaptureViewer: Escape closes it and focus returns to the opener', async ({ page }) => {
  await catalog(page);
  const opener = page.locator('#capture-viewer').getByRole('button', { name: componentPanel.showOnPage });
  await opener.click();
  const viewer = page.getByRole('dialog', { name: '/ at 1440 px' });
  await expect(viewer).toBeVisible();
  await expect.poll(() => focusInside(viewer)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
  await expect(opener).toBeFocused();
});
