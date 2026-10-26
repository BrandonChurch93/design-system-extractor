import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

// The in-progress page fills stage by stage from polls (D-014): a poll that brings nothing changes
// nothing, a poll that lands a stage changes that region only, and the page is never re-rendered
// whole. The poll answers are the seeded documents of the clean run at each stage, then the
// finished run, served in order for the frozen run seedprog01.

const out = resolve(import.meta.dirname, '../../qa/polling');

async function sequence(page: Page) {
  const get = async (id: string) => (await (await page.request.get(`/api/runs/${id}`)).json()) as { document: Record<string, unknown>; events: unknown[] };
  const [p1, p2, p3, done] = await Promise.all(['seedprog01', 'seedprog02', 'seedprog03', 'seedclean0'].map(get));
  const asRun = (b: { document: Record<string, unknown>; events: unknown[] }, status: string) => ({ id: 'seedprog01', status, isShowcase: false, events: b.events, document: { ...b.document, id: 'seedprog01', status } });
  return [asRun(p1!, 'running'), asRun(p1!, 'running'), asRun(p2!, 'running'), asRun(p2!, 'running'), asRun(p3!, 'running'), asRun(done!, 'complete')];
}

test('each stage lands in place, with no full re-render and nothing on an empty poll', async ({ browser }) => {
  mkdirSync(out, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const answers = await sequence(page);
  let served = 0;
  await page.route('**/api/runs/seedprog01', async (route) => {
    const body = answers[Math.min(served, answers.length - 1)];
    served++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __dseMutations: number };
    w.__dseMutations = 0;
    new MutationObserver((list) => {
      for (const m of list) if (!(m.target as Element).closest?.('[data-qa-mask]') && !(m.target.parentElement?.closest('[data-qa-mask]'))) w.__dseMutations++;
    }).observe(document, { childList: true, subtree: true, characterData: true, attributes: true });
  });
  await page.goto('/r/seedprog01');
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    (document.querySelector('h1') as unknown as { __dseMark: boolean }).__dseMark = true;
    (document.querySelector('nav[aria-label="Sections"]') as unknown as { __dseMark: boolean }).__dseMark = true;
  });
  const perPoll: number[] = [];
  for (let i = 0; i < answers.length; i++) {
    await page.evaluate(() => ((window as unknown as { __dseMutations: number }).__dseMutations = 0));
    const before = served;
    await expect.poll(() => served, { timeout: 5000 }).toBeGreaterThan(before);
    await page.waitForTimeout(1300);
    perPoll.push(await page.evaluate(() => (window as unknown as { __dseMutations: number }).__dseMutations));
    await page.screenshot({ path: resolve(out, `poll-${i}.png`) });
  }
  // The same document twice: the second poll changes nothing.
  expect(perPoll[1]).toBe(0);
  expect(perPoll[3]).toBe(0);
  // Landing polls change the page, but the header and the section nav are the same nodes throughout.
  expect(perPoll[2]).toBeGreaterThan(0);
  const kept = await page.evaluate(() => [Boolean((document.querySelector('h1') as unknown as { __dseMark?: boolean }).__dseMark), Boolean((document.querySelector('nav[aria-label="Sections"]') as unknown as { __dseMark?: boolean }).__dseMark)]);
  expect(kept).toEqual([true, true]);
  await expect(page.locator('main')).toHaveAttribute('data-run-status', 'complete');
  await context.close();
});
