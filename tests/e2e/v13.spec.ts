import { expect, test, type Frame, type Page } from '@playwright/test';
import { RunResponse, type Component, type MotionPattern } from '@dse/schema';
import { runPage } from '../../apps/web/copy/strings';
import { chipValues } from '../../apps/web/lib/chip-scale';

// v1.3 against the seeded runs and the catalog: the ReplayButton's width, the pattern chip's rest,
// card previews that take the pointer, the card's Ground toggle, the drawer at 1:1 (D-101 to D-109).

async function run(page: Page, id: string) {
  return RunResponse.parse(await (await page.request.get(`/api/runs/${id}`)).json()).document;
}

/** What a declaration computes to in the page, for comparing with a computed style. */
async function computed(page: Page | Frame, values: Record<string, string>): Promise<Record<string, string>> {
  return page.evaluate((v) => {
    const probe = document.createElement('i');
    probe.style.display = 'block';
    for (const [p, x] of Object.entries(v)) probe.style.setProperty(p, x);
    document.body.append(probe);
    const cs = getComputedStyle(probe);
    const out = Object.fromEntries(Object.keys(v).map((p) => [p, cs.getPropertyValue(p)]));
    probe.remove();
    return out;
  }, values);
}

const motion = async (page: Page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/r/seedclean0');
  const section = page.locator('#motion');
  await section.scrollIntoViewIfNeeded();
  return section;
};

test('the ReplayButton keeps one width before, during and after a play (D-104)', async ({ page }) => {
  const section = await motion(page);
  const button = section.getByTestId('replay-button').first();
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  await page.waitForTimeout(2500);
  const width = () => button.evaluate((el) => el.getBoundingClientRect().width);
  const before = await width();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(await width()).toBe(before);
  await expect(button).toHaveAttribute('aria-pressed', 'false', { timeout: 15_000 });
  expect(await width()).toBe(before);
});

test('a pattern chip rests on the scaled start state and returns to it after the play (D-104)', async ({ page }) => {
  const doc = await run(page, 'seedclean0');
  const section = await motion(page);
  const rows = section.getByTestId('pattern-row');
  const patterns = doc.motion!.patterns as MotionPattern[];
  const i = patterns.findIndex((p) => 'opacity' in p.start && Object.keys(p.start).some((k) => k === 'transform' || k === 'translate'));
  expect(i).toBeGreaterThanOrEqual(0);
  const p = patterns[i]!;
  const row = rows.nth(i);
  await row.scrollIntoViewIfNeeded();
  const chip = row.getByTestId('pattern-chip').first();
  const keys = Object.keys(chipValues(p.start, true)).filter((k) => ['opacity', 'transform', 'translate', 'filter'].includes(k));
  const rest = await computed(page, Object.fromEntries(keys.map((k) => [k, chipValues(p.start, true)[k]!])));
  const read = () => chip.evaluate((el, ks) => Object.fromEntries(ks.map((k) => [k, getComputedStyle(el).getPropertyValue(k)])), keys);
  // After the auto-preview the chip is back at rest; Replay plays it again and it returns.
  const button = row.getByTestId('replay-button');
  await expect(row).toHaveAttribute('data-previewed', 'true', { timeout: 15_000 });
  await expect.poll(read, { timeout: 5000 }).toEqual(rest);
  await button.click();
  await expect(chip).not.toHaveAttribute('data-at', 'rest');
  await expect(chip).toHaveAttribute('data-at', 'rest', { timeout: 15_000 });
  await expect.poll(read, { timeout: 2000 }).toEqual(rest);
});

/** A live card whose hover delta carries a timed color change. */
function hoverable(doc: { components?: Component[] }) {
  return doc.components!.find((c) => c.preview.mode === 'live' && c.states.find((s) => s.state === 'hover')?.delta.some((d) => d.property === 'background-color'))!;
}

test('hovering a card frame plays the site\'s hover inside it, and the frame stays on its document (D-106)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const doc = await run(page, 'seedclean0');
  const c = hoverable(doc);
  expect(c).toBeTruthy();
  const delta = c.states.find((s) => s.state === 'hover')!.delta.find((d) => d.property === 'background-color')!;
  await page.goto('/r/seedclean0');
  const card = page.locator('#components [data-testid="component-card"]').filter({ has: page.getByRole('link', { name: c.name, exact: true }) }).first();
  await card.scrollIntoViewIfNeeded();
  const iframe = card.getByTestId('card-preview').locator('iframe');
  await expect(iframe).toBeVisible();
  const frame = (await (await iframe.elementHandle())!.contentFrame())!;
  await frame.waitForLoadState('load');
  const bg = () => frame.evaluate(() => getComputedStyle(document.querySelector('.dse-root > :first-child')!).backgroundColor);
  const before = await bg();
  await iframe.hover();
  await page.waitForTimeout((delta.transition?.durationMs ?? 0) + 250);
  const want = (await computed(frame, { 'background-color': delta.to }))['background-color'];
  expect(await bg()).toBe(want);
  expect(want).not.toBe(before);
  // A press inside the frame changes nothing outside it: the drawer stays shut.
  await iframe.click();
  await expect(page.getByTestId('preview-stage')).toHaveCount(0);
});

test('a click on the name row opens the drawer; the card Ground toggle repaints and does not (D-106, D-109)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/r/seedclean0');
  const card = page.locator('#components [data-testid="component-card"]').first();
  await card.scrollIntoViewIfNeeded();
  const region = card.getByTestId('card-preview');
  const paint = () => region.evaluate((el) => getComputedStyle(el).backgroundColor);
  const site = await paint();
  await card.getByRole('radiogroup', { name: runPage.preview.ground }).getByRole('radio', { name: runPage.preview.grounds.dark }).click();
  await expect.poll(paint).not.toBe(site);
  await expect(page.getByTestId('preview-stage')).toHaveCount(0);
  await expect(page).not.toHaveURL(/[?&]c=/);
  await card.getByRole('radiogroup', { name: runPage.preview.ground }).getByRole('radio', { name: runPage.preview.grounds.site }).click();
  await expect.poll(paint).toBe(site);
  await card.locator('p').first().click();
  await expect(page.getByTestId('preview-stage')).toBeVisible();
  await expect(page).toHaveURL(/[?&]c=/);
});

test('on touch, a tap on the card preview opens the drawer (D-106)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/r/seedclean0');
  expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
  const card = page.locator('#components [data-testid="component-card"]').first();
  await card.scrollIntoViewIfNeeded();
  await card.getByTestId('card-preview').tap({ position: { x: 40, y: 40 } });
  await expect(page.getByTestId('preview-stage')).toBeVisible();
  await context.close();
});

test('the drawer shows a component wider than its stage at 1:1, scrolling sideways (D-107)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const doc = await run(page, 'seedclean0');
  const wide = doc.components!.filter((c) => c.preview.mode === 'live').sort((a, b) => b.preview.width - a.preview.width)[0]!;
  expect(wide.preview.width).toBeGreaterThan(600);
  await page.goto(`/r/seedclean0?c=${wide.id}`);
  const stage = page.getByTestId('preview-stage');
  await expect(stage).toBeVisible();
  const scroller = stage.locator('[data-ground]').first();
  const m = await scroller.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, x: getComputedStyle(el).overflowX }));
  expect(m.x).toBe('auto');
  expect(m.sw).toBeGreaterThan(m.cw);
  await expect(stage.locator('iframe')).toHaveAttribute('width', String(Math.ceil(wide.preview.width)));
});

test('no card preview renders below 0.6×, and a cut one says so (D-107)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/r/seedclean0');
  await page.locator('#components').scrollIntoViewIfNeeded();
  const scales = await page.locator('#components [data-testid="card-preview"] [data-scale]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-scale'))));
  expect(scales.length).toBeGreaterThan(0);
  expect(Math.min(...scales)).toBeGreaterThanOrEqual(0.6);
  await page.goto('/catalog');
  const cut = page.locator('[data-cut]').first();
  await cut.scrollIntoViewIfNeeded();
  await expect(cut).toContainText(', cut to fit');
});

test('the easing stages of a row sit at one height, and the Dense strip stays under 300 px at 390 (D-101, D-102)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/catalog');
  const grid = page.getByTestId('twelve-easings');
  await grid.scrollIntoViewIfNeeded();
  const tops = await grid.getByTestId('easing-stage').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width) })));
  const rows = new Map<number, number[]>();
  for (const t of tops) rows.set(t.bottom, [...(rows.get(t.bottom) ?? []), t.top]);
  for (const ts of rows.values()) expect(new Set(ts).size).toBe(1);
  expect(rows.size).toBe(4);
  await page.setViewportSize({ width: 390, height: 844 });
  const dense = page.getByText('Dense', { exact: true }).locator('xpath=..').getByTestId('duration-strip');
  await dense.scrollIntoViewIfNeeded();
  expect(await dense.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(300);
});
