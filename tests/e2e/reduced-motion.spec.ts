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
      // A paused animation never moves: the Motion section's still curves are drawn that way (D-093).
      if (a.playState !== 'running') continue;
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

// docs/design/motion.md, Ambient loops (D-093): the easings loop on one clock, pause off screen, and
// are drawn still under reduced motion.
async function motionSection(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/r/seedclean0');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.locator('#motion').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(600);
  return page.locator('#motion');
}

const x = (el: Element) => new DOMMatrix(getComputedStyle(el).transform).m41;
const y = (el: Element) => new DOMMatrix(getComputedStyle(el).transform).m42;

test('the easings under reduced motion: still at 60% of the curve, nothing runs, the caption says why', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const motion = await motionSection(page);
  const dot = motion.getByTestId('easing-dot').first();
  const curve = motion.getByTestId('easing-curve-dot').first();
  const before = [await dot.evaluate(x), await curve.evaluate(y)];
  await page.waitForTimeout(900);
  expect([await dot.evaluate(x), await curve.evaluate(y)]).toEqual(before);
  // Somewhere along the track, not at either end: the still frame is drawn at 60% of the time, and the dot crosses the track's full width (D-101).
  const travel = (await motion.getByTestId('easing-track').first().evaluate((el) => el.getBoundingClientRect().width)) - 10;
  expect(travel).toBeGreaterThan(200);
  expect(before[0]).toBeGreaterThan(0);
  expect(before[0]).toBeLessThan(travel);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
  await expect(motion.getByTestId('easing-reduced')).toBeVisible();
  await expect(motion.getByTestId('easing-caption')).toHaveCount(0);
  await context.close();
});

test('the easings loop: every card on one start time, moving, paused off screen and back in step', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const motion = await motionSection(page);
  await expect(motion.getByTestId('easing-caption')).toBeVisible();
  const dot = motion.getByTestId('easing-dot').first();
  const a = await dot.evaluate(x);
  await page.waitForTimeout(450);
  const b = await dot.evaluate(x);
  await page.waitForTimeout(450);
  const c = await dot.evaluate(x);
  expect(new Set([a, b, c]).size).toBeGreaterThan(1);
  const clock = () => motion.evaluate((el) => [...el.querySelectorAll('[data-testid="easing-dot"], [data-testid="easing-curve-dot"], [data-testid="duration-dot"]')].flatMap((d) => d.getAnimations().map((an) => ({ start: an.startTime, state: an.playState }))));
  const running = await clock();
  expect(running.length).toBeGreaterThan(4);
  expect(new Set(running.map((r) => r.start)).size).toBe(1);
  expect(running.every((r) => r.state === 'running')).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
  expect((await clock()).every((r) => r.state === 'paused')).toBe(true);
  await motion.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  const back = await clock();
  expect(back.every((r) => r.state === 'running')).toBe(true);
  expect(new Set(back.map((r) => r.start))).toEqual(new Set(running.map((r) => r.start)));
  await context.close();
});

test('no long task over 50 ms while twelve easings loop (the catalog sample)', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/catalog');
  // The catalog's lazy preview frames can keep the network busy; idle is a courtesy, not a condition.
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const grid = page.getByTestId('twelve-easings');
  await grid.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  expect(await grid.getByTestId('easing-card').count()).toBe(12);
  const longest = await page.evaluate(
    () =>
      new Promise<number>((done) => {
        let max = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) max = Math.max(max, e.duration);
        }).observe({ type: 'longtask', buffered: false });
        setTimeout(() => done(max), 4400);
      }),
  );
  expect(longest).toBeLessThanOrEqual(50);
  await context.close();
});

test('a pattern previews itself once when it scrolls into view, then offers Replay', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const motion = await motionSection(page);
  const row = motion.getByTestId('pattern-row').first();
  await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(row).toHaveAttribute('data-previewed', 'true', { timeout: 15_000 });
  await expect(row.getByRole('button', { name: 'Replay' })).toBeVisible();
  await context.close();
});
