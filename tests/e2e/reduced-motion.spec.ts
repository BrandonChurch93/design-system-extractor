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
      if (!el.style?.transform) continue;
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
