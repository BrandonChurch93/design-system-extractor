import { expect, test, type Locator, type Page } from '@playwright/test';
import { RunResponse } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../apps/web/copy/strings';

// The Patterns list and the drift Evidence table show six rows, then Show all, as the keyframes list does (D-113).

async function run(page: Page, id: string) {
  return RunResponse.parse(await (await page.request.get(`/api/runs/${id}`)).json()).document;
}

/** The page may still be hydrating, which replaces the element; the scroll is retried until it holds. */
async function scrollTo(target: Locator) {
  await expect(async () => target.scrollIntoViewIfNeeded({ timeout: 2000 })).toPass();
  return target;
}

/** The catalog's long pattern list: the first twelve patterns of a real run. */
async function longPatterns(page: Page) {
  await page.goto('/catalog');
  return scrollTo(page.locator('#pattern-list').getByText('Long list', { exact: true }).locator('xpath=..'));
}

async function evidence(page: Page) {
  await page.goto('/r/seedmessy0');
  return scrollTo(page.locator('#drift'));
}

test('the Patterns card shows six rows, all of them after Show all, and six again on Show fewer with focus kept and no hidden row playing (D-113)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  const cell = await longPatterns(page);
  const rows = cell.getByTestId('pattern-row');
  await expect(rows).toHaveCount(6);
  // Every row shown at rest has had its auto-preview, so a play seen after collapsing could only be a hidden row's.
  for (let i = 0; i < 6; i++) {
    await rows.nth(i).scrollIntoViewIfNeeded();
    await expect(rows.nth(i)).toHaveAttribute('data-previewed', 'true', { timeout: 15_000 });
  }
  const toggle = cell.getByTestId('show-all');
  await expect(toggle).toHaveText(fill(runPage.motion.showAllPatterns, { n: '12' }));
  await toggle.click();
  await expect(rows).toHaveCount(12);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveText(runPage.showFewer);
  await expect(toggle).toBeFocused();
  // Revealed rows preview as they enter.
  await rows.nth(11).scrollIntoViewIfNeeded();
  await expect(rows.nth(11)).toHaveAttribute('data-previewed', 'true', { timeout: 15_000 });
  const hidden = rows.nth(7);
  await hidden.scrollIntoViewIfNeeded();
  await expect(hidden).toHaveAttribute('data-previewed', 'true', { timeout: 15_000 });
  await hidden.getByTestId('replay-button').click();
  await expect(hidden).toHaveAttribute('data-playing', 'true');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(6);
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveText(fill(runPage.motion.showAllPatterns, { n: '12' }));
  await expect(cell.locator('[data-playing]')).toHaveCount(0);
  // Past the end of the cut play's timers: nothing comes back to life.
  await page.waitForTimeout(2500);
  await expect(cell.locator('[data-playing]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the Evidence table shows six rows in the document order, all of them after Show all inside its Card, and six on Show fewer with focus kept (D-113)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const rowsInDoc = (await run(page, 'seedmessy0')).drift!.evidence;
  expect(rowsInDoc.length).toBeGreaterThan(6);
  const drift = await evidence(page);
  const rows = drift.getByTestId('evidence-row');
  await expect(rows).toHaveCount(6);
  expect(await rows.locator('td:first-child').allTextContents()).toEqual(rowsInDoc.slice(0, 6).map((r) => r.a));
  const toggle = drift.getByTestId('show-all');
  expect(await toggle.evaluate((el) => Boolean(el.closest('[class*="tableCard"]')))).toBe(true);
  await expect(toggle).toHaveText(fill(runPage.drift.showAllEvidence, { n: String(rowsInDoc.length) }));
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(rowsInDoc.length);
  expect(await rows.locator('td:first-child').allTextContents()).toEqual(rowsInDoc.map((r) => r.a));
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveText(runPage.showFewer);
  await toggle.click();
  await expect(rows).toHaveCount(6);
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('under reduced motion the revealed patterns and evidence rows appear at once, with no stagger (D-113)', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  // Reduced motion is a 200 ms opacity change with no stagger, so every revealed row is whole well before a 12-row stagger would end.
  const settled = async (selector: string) =>
    page.evaluate(
      (s) => [...document.querySelectorAll(s)].map((el) => { const cs = getComputedStyle(el); return cs.opacity === '1' && (cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)'); }),
      selector,
    );
  const cell = await longPatterns(page);
  await cell.getByTestId('show-all').click();
  await expect(cell.getByTestId('pattern-row')).toHaveCount(12);
  await page.waitForTimeout(350);
  const patterns = await settled('#pattern-list [data-testid="pattern-row"][data-move]');
  expect(patterns).toHaveLength(6);
  expect(patterns.every(Boolean)).toBe(true);
  const drift = await evidence(page);
  await drift.getByTestId('show-all').click();
  await page.waitForTimeout(350);
  const cells = await settled('#drift [data-testid="evidence-row"] [data-move]');
  expect(cells.length).toBeGreaterThan(6);
  expect(cells.every(Boolean)).toBe(true);
  await context.close();
});

test('stacked on a phone, a staggered row leaves its ReplayButton room beside the chips (D-113)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cell = await longPatterns(page);
  await cell.getByTestId('show-all').click();
  const rows = cell.getByTestId('pattern-row');
  await expect(rows).toHaveCount(12);
  const overflow = await rows.evaluateAll((els) =>
    els.filter((row) => {
      const button = row.querySelector('[data-testid="replay-button"]')!.getBoundingClientRect();
      return button.right > row.getBoundingClientRect().right + 0.5;
    }).length,
  );
  expect(overflow).toBe(0);
  // The owner's five-item staggers still play more than one chip.
  expect(await rows.first().getByTestId('pattern-chip').count()).toBeGreaterThan(1);
});

for (const width of [1440, 820, 390]) {
  test(`the Motion skeleton has the real section's height at ${width} (D-113)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const height = async (id: string) => {
      await page.goto(`/r/${id}`);
      const section = page.locator('#motion');
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      return section.evaluate((el) => Math.round(el.getBoundingClientRect().height));
    };
    const real = await height('seedclean0');
    const skeleton = await height('seedprog01');
    expect(Math.abs(skeleton - real), `${skeleton} vs ${real}`).toBeLessThanOrEqual(4);
  });
}
