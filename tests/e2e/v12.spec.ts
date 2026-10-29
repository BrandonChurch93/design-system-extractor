import { expect, test, type Page } from '@playwright/test';
import { RunResponse } from '@dse/schema';
import { runPage } from '../../apps/web/copy/strings';

// v1.2 against the seeded runs: Compare across document versions (D-092), the stat strip's six cells
// and the Passing all checks filter (D-096), the CheckBadge looks, and pinning a state (D-094).

async function run(page: Page, id: string) {
  return RunResponse.parse(await (await page.request.get(`/api/runs/${id}`)).json());
}

test('Compare renders a stored v1.0 run against a current one, every row, the Motion rows at 0 for the old run', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const old = await run(page, 'seedv10cln');
  expect(old.document.pipelineVersion).toBe('1.0.0');
  expect(old.document.components!.every((c) => c.tier && c.slug)).toBe(true);
  const now = await run(page, 'seedclean0');
  await page.goto('/compare?a=seedv10cln&b=seedclean0');
  // Both runs are of Oct 12: the title and the two buttons say so by order (D-099).
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What changed today');
  await expect(page.getByRole('link', { name: 'Open the earlier run' })).toHaveAttribute('href', '/r/seedv10cln');
  await expect(page.getByRole('link', { name: 'Open the later run' })).toHaveAttribute('href', '/r/seedclean0');
  for (const label of ['Durations', 'Easings', 'Keyframes', 'Patterns']) {
    const row = page.getByRole('row', { name: new RegExp(`^${label} `) });
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell').nth(0)).toHaveText('0');
  }
  await expect(page.getByRole('row', { name: /^Durations 0 / })).toContainText(String(now.document.tokens!.duration!.length));
  await expect(page.getByRole('table').last()).toBeVisible();
  await page.goto('/r/seedv10cln');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(old.document.host!);
  await expect(page.locator('#components')).toBeVisible();
});

test('Compare answers a run it cannot read with its StateCard, never a stack trace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/compare?a=nope000000&b=seedclean0');
  await expect(page.getByRole('heading', { name: 'We could not compare these runs.' })).toBeVisible();
  await expect(page.getByText('No run with the link nope000000.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open localhost:4100' })).toHaveAttribute('href', '/r/seedclean0');
});

for (const [width, cols] of [
  [1440, 6],
  [820, 3],
  [390, 2],
] as const) {
  test(`the stat strip shows six cells in ${cols} columns at ${width} with no orphan`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/r/seedclean0');
    const cells = page.locator('[data-cells="6"] > *');
    await expect(cells).toHaveCount(6);
    const boxes = await cells.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) })));
    const rows = new Map<number, number>();
    for (const b of boxes) rows.set(b.y, (rows.get(b.y) ?? 0) + 1);
    expect([...rows.values()]).toEqual(Array(6 / cols).fill(cols));
    expect(new Set(boxes.map((b) => b.w)).size).toBeLessThanOrEqual(2);
  });
}

test('the Components passing cell turns on the Passing all checks filter; every card left reads All checks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/r/seedclean0');
  const doc = (await run(page, 'seedclean0')).document;
  const passing = doc.components!.filter((c) => c.checks.some((r) => r.status !== 'na') && c.checks.every((r) => r.status !== 'fail'));
  await page.getByRole('link', { name: runPage.statLabels.componentsPassing }).click();
  await expect(page).toHaveURL(/#components-passing$/);
  const chip = page.getByRole('button', { name: runPage.components.passingAll });
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  const cards = page.locator('#components [data-testid="component-card"]');
  await expect(cards.first()).toBeVisible();
  const n = await cards.count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThanOrEqual(passing.length);
  for (let i = 0; i < n; i++) await expect(cards.nth(i).getByRole('button', { name: runPage.components.badgeAll })).toBeVisible();
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
});

test('the CheckBadge is a filled Pill when every check passes and an outlined count otherwise', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/catalog');
  const all = page.getByRole('button', { name: runPage.components.badgeAll }).first();
  const some = page.getByRole('button', { name: /^\d+ of \d+ checks$/ }).first();
  const fill = (l: typeof all) => l.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await fill(all)).not.toBe('rgba(0, 0, 0, 0)');
  expect(await fill(some)).toBe('rgba(0, 0, 0, 0)');
  await expect(page.getByTestId('check-badge-none').locator('button')).toHaveCount(0);
});

test('pinning Hover loads the hover file, whose root reaches the recorded values after the recorded duration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const doc = (await run(page, 'seedclean0')).document;
  const c = doc.components!.find((x) => x.preview.mode === 'live' && x.preview.stateHtmlKeys?.hover && x.states.find((s) => s.state === 'hover')?.delta.some((d) => d.transition && d.transition.durationMs >= 100))!;
  expect(c).toBeTruthy();
  const hover = c.states.find((s) => s.state === 'hover')!;
  const timed = hover.delta.find((d) => d.transition && d.property === 'background-color') ?? hover.delta.find((d) => d.transition)!;
  await page.goto(`/r/seedclean0?c=${c.id}`);
  const stage = page.getByTestId('preview-stage');
  await expect(stage).toBeVisible();
  await page.getByRole('radiogroup', { name: runPage.preview.states }).getByRole('radio', { name: 'Hover' }).click();
  const frame = stage.locator('iframe');
  await expect(frame).toHaveAttribute('src', new RegExp(`${c.preview.stateHtmlKeys!.hover!.replace(/[.]/g, '\\.')}$`));
  await expect(stage).toHaveAttribute('data-state', 'hover');
  // The frame is sandboxed with no scripts; the test reads its root through the browser's own frame tree.
  // Choosing Hover again mounts a new frame, which plays the state's generated keyframes on load (D-094).
  await page.getByRole('radiogroup', { name: runPage.preview.states }).getByRole('radio', { name: 'Hover' }).click();
  await page.waitForTimeout(50);
  const replayed = (await (await frame.elementHandle())!.contentFrame())!;
  expect(replayed.url()).toMatch(new RegExp(`${c.preview.stateHtmlKeys!.hover!.replace(/[.]/g, '\\.')}$`));
  const names = await replayed.evaluate(() => document.getAnimations().map((a) => (a as CSSAnimation).animationName));
  expect(names.some((n) => n.startsWith('dse-state-'))).toBe(true);
  await page.waitForTimeout(timed.transition!.durationMs + 250);
  const late = await replayed.evaluate((p) => getComputedStyle(document.querySelector('.dse-root > :first-child')!).getPropertyValue(p), timed.property);
  const expected = await replayed.evaluate(([p, v]) => {
    const probe = document.createElement('i');
    probe.style.setProperty(p!, v!);
    document.body.append(probe);
    const out = getComputedStyle(probe).getPropertyValue(p!);
    probe.remove();
    return out;
  }, [timed.property, timed.to]);
  expect(late).toBe(expected);
});
