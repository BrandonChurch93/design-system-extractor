import { expect, test, type Page } from '@playwright/test';

// Under prefers-reduced-motion: reduce, every move collapses to an opacity change: no transform
// animates (docs/design/motion.md). The no-preference run is the control that proves the probe sees
// transform animations when they do run.

const probe = () => {
  const w = window as unknown as { __dseTransforms: string[] };
  w.__dseTransforms = [];
  const isIdentity = (t: string) => !t || t === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t) || /^(translate|scale)[XY]?\((0(px)?|1)\)$/.test(t);
  const record = (what: string) => w.__dseTransforms.push(what);
  const scan = () => {
    for (const a of document.getAnimations()) {
      const effect = a.effect as KeyframeEffect | null;
      const frames = effect?.getKeyframes?.() ?? [];
      const anim = a as Animation & { transitionProperty?: string };
      if (anim.transitionProperty === 'transform' || frames.some((f) => 'transform' in f || 'scale' in f || 'translate' in f)) {
        record(`waapi ${anim.transitionProperty ?? a.id ?? 'animation'}`);
      }
    }
  };
  new MutationObserver((list) => {
    for (const m of list) {
      const el = m.target as HTMLElement;
      // A preview scaled to fit its ground is a size, not a move.
      if (!el.style?.transform || el.closest?.('[data-fit]')) continue;
      // What the reader sees: the computed transform, after every stylesheet rule.
      const t = getComputedStyle(el).transform;
      if (!isIdentity(t)) record(`style ${el.className} ${t}`);
    }
  }).observe(document, { attributes: true, attributeFilter: ['style'], subtree: true });
  setInterval(scan, 16);
};

async function exercise(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalog');
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Menu' }).first().click();
  await page.waitForTimeout(500);
  await page.locator('#sheet').getByRole('button', { name: 'Share' }).first().click();
  await page.waitForTimeout(700);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  await page.locator('#toast').getByRole('button', { name: 'Share' }).click();
  await page.waitForTimeout(700);
  return page.evaluate(() => (window as unknown as { __dseTransforms: string[] }).__dseTransforms);
}

test('no transform animation runs under reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(probe);
  const seen = await exercise(page);
  expect(seen).toEqual([]);
  await context.close();
});

test('control: transforms do animate without the preference', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.addInitScript(probe);
  const seen = await exercise(page);
  expect(seen.length).toBeGreaterThan(0);
  await context.close();
});

async function exerciseRun(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/r/seedmessy0');
  await page.waitForTimeout(800);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await page.waitForTimeout(800);
  return page.evaluate(() => (window as unknown as { __dseTransforms: string[] }).__dseTransforms);
}

test('the run page: no transform animation under reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(probe);
  expect(await exerciseRun(page)).toEqual([]);
  await context.close();
});

test('the run page control: swatches, bars and cards do move without the preference', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.addInitScript(probe);
  expect((await exerciseRun(page)).length).toBeGreaterThan(0);
  await context.close();
});

// docs/design/components.md, ReplayButton: under reduced motion the dot shows the end state still.
async function motionSection(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/r/seedclean0');
  await page.locator('#motion').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  return page.locator('#motion');
}

test('Replay under reduced motion: the dot stays at its end, the buttons are off, one caption says why', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const motion = await motionSection(page);
  const dot = motion.getByTestId('easing-dot').first();
  const before = await dot.evaluate((el) => getComputedStyle(el).transform);
  const replay = motion.getByRole('button', { name: 'Replay' }).first();
  await expect(replay).toBeDisabled();
  await replay.click({ force: true });
  await page.waitForTimeout(400);
  expect(await dot.evaluate((el) => getComputedStyle(el).transform)).toBe(before);
  await expect(dot).toHaveAttribute('data-at', 'end');
  await expect(motion.getByTestId('replay-reduced')).toHaveCount(1);
  await expect(motion.getByTestId('replay-reduced')).toBeVisible();
  await context.close();
});

test('Replay control: without the preference the dot runs the curve and comes to rest at the end', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const motion = await motionSection(page);
  const dot = motion.getByTestId('easing-dot').first();
  await expect(dot).toHaveAttribute('data-at', 'start');
  await motion.getByRole('button', { name: 'Replay' }).first().click();
  await page.waitForTimeout(60);
  const mid = await dot.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  await page.waitForTimeout(1500);
  const end = await dot.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  expect(end).toBe(112);
  expect(mid).toBeLessThan(end);
  await expect(motion.getByTestId('replay-reduced')).toHaveCount(0);
  await context.close();
});
