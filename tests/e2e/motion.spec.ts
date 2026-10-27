import { expect, test, type Locator, type Page } from '@playwright/test';
import { home } from '../../apps/web/copy/strings';
import { settle, withRecent } from '../qa/pages';

// docs/design/motion.md (Hover and press, Reverses, Performance rules) and design-system.md
// (Focus and hover), on the real pages.

const style = (l: Locator, prop: string, pseudo?: string) => l.evaluate((el, [p, ps]) => getComputedStyle(el, ps ?? null).getPropertyValue(p!), [prop, pseudo] as const);
const hidden = 'inset(0px 0px 100% round 18px)';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

async function homePage(page: Page) {
  await page.goto('/');
  await settle(page);
  await page.locator('#showcase').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
}

test.describe('hover and press', () => {
  test('a card that is a link lifts 1 px and takes the hover shadow', async ({ page }) => {
    await homePage(page);
    const card = page.locator('#showcase li a').first();
    const before = await style(card, 'box-shadow');
    await card.hover();
    await page.waitForTimeout(400);
    expect(await style(card, 'transform')).toBe('matrix(1, 0, 0, 1, 0, -1)');
    expect(await style(card, 'box-shadow')).not.toBe(before);
  });

  test('a primary button keeps its ground, its label goes to 90%, and a press scales it to 0.985', async ({ page }) => {
    await homePage(page);
    const button = page.getByRole('button', { name: home.extract });
    const label = button.locator('[class*="label"]');
    const ground = await style(button, 'background-color');
    await button.hover();
    await page.waitForTimeout(400);
    expect(await style(label, 'opacity')).toBe('0.9');
    expect(await style(button, 'background-color')).toBe(ground);
    await page.mouse.down();
    await page.waitForTimeout(150);
    expect(await style(button, 'transform')).toMatch(/^matrix\(0\.985, 0, 0, 0\.985,/);
    await page.mouse.up();
  });

  test('a chip takes the strong border on hover and swaps ground and text when selected, without moving', async ({ page }) => {
    await homePage(page);
    const chip = page.getByRole('radio', { name: home.categories.Finance });
    const border = await style(chip, 'border-color');
    const box = await chip.boundingBox();
    await chip.hover();
    await page.waitForTimeout(400);
    expect(await style(chip, 'border-color')).not.toBe(border);
    await chip.click();
    await page.waitForTimeout(400);
    await expect(chip).toHaveAttribute('aria-checked', 'true');
    const selected = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return [root.getPropertyValue('--dse-ink').trim(), root.getPropertyValue('--dse-inverse-ink').trim()];
    });
    const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
    expect(await style(chip, 'background-color')).toBe(rgb(selected[0]!));
    expect(await style(chip, 'color')).toBe(rgb(selected[1]!));
    expect(await chip.boundingBox()).toEqual(box);
  });

  test('a ghost button takes the strong border, and a row extends its tint from the left and hides its hairline', async ({ page }) => {
    await withRecent(page);
    await page.goto('/recent');
    await settle(page);
    const row = page.locator('main li').first();
    const ghost = row.getByRole('link', { name: /Compare/ }).or(row.getByRole('button', { name: /Compare/ })).first();
    expect(await style(row, 'transform', '::before')).toBe('matrix(0, 0, 0, 1, 0, 0)');
    const border = await style(ghost, 'border-color');
    await ghost.hover();
    await page.waitForTimeout(400);
    expect(await style(ghost, 'border-color')).not.toBe(border);
    expect(await style(row, 'transform', '::before')).toBe('matrix(1, 0, 0, 1, 0, 0)');
    expect(await style(row, 'border-bottom-color')).toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('reverses', () => {
  test('a filter lets the leaving cards go before the new ones enter, and a card that stays morphs in place', async ({ page }) => {
    await homePage(page);
    const items = page.locator('#showcase li');
    // A SaaS card, marked in the full grid: filtering to SaaS keeps the same element, moved in place.
    await items.filter({ hasText: 'Tidewater · Clean' }).first().evaluate((el) => ((el as HTMLElement & { __kept?: boolean }).__kept = true));
    await page.getByRole('radio', { name: home.categories.SaaS }).click();
    await page.waitForTimeout(1500);
    await expect(items).toHaveCount(3);
    expect(await items.evaluateAll((els) => els.some((el) => (el as HTMLElement & { __kept?: boolean }).__kept === true))).toBe(true);

    // SaaS to Finance: the SaaS cards leave first; the Finance card waits closed until they are gone.
    await page.getByRole('radio', { name: home.categories.Finance }).click();
    await page.waitForTimeout(150);
    const during = await items.evaluateAll((els) => els.map((el) => ({ text: el.textContent ?? '', clip: getComputedStyle(el).clipPath })));
    const entering = during.filter((d) => d.text.startsWith('Ledgerly'));
    expect(during.length).toBeGreaterThan(entering.length);
    expect(entering).toHaveLength(1);
    expect(entering[0]!.clip).toBe(hidden);
    await page.waitForTimeout(1500);
    await expect(items).toHaveCount(1);
    expect(await style(items.first(), 'clip-path')).not.toBe(hidden);
  });
});

test.describe('performance rules', () => {
  test('no entrance runs off screen: cards below the fold wait until they are scrolled to', async ({ page }) => {
    // No settle here: it scrolls the whole page to start every entrance for screenshots.
    await page.goto('/r/seedclean0');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    const card = page.locator('#components [data-move="reveal"]').last();
    expect(await style(card, 'clip-path')).toBe(hidden);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    expect(await style(card, 'clip-path')).not.toBe(hidden);
  });

  test('the run page holds 60 fps while the component cards reveal', async ({ page }) => {
    await page.goto('/r/seedclean0');
    await settle(page);
    const frames = await page.evaluate(async () => {
      const deltas: number[] = [];
      let last = performance.now();
      const stop = last + 1500;
      document.getElementById('components')!.scrollIntoView();
      await new Promise<void>((done) => {
        const tick = (t: number) => {
          deltas.push(t - last);
          last = t;
          if (t < stop) requestAnimationFrame(tick);
          else done();
        };
        requestAnimationFrame(tick);
      });
      return deltas.slice(2);
    });
    const sorted = [...frames].sort((a, b) => a - b);
    const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
    expect(frames.length).toBeGreaterThan(60);
    expect(at(0.5)).toBeLessThan(18);
    expect(at(0.95)).toBeLessThan(34);
  });
});
