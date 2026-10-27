import type { Page } from '@playwright/test';
import { demoIndex } from '../../apps/web/components/catalog/demo-index';

// Every page and state that design QA, visual regression and axe cover. Each phase adds its pages.

export type QaState = {
  name: string;
  /** Another address for this state (the page's own path otherwise). */
  path?: string;
  /** Runs before the page loads: browser storage the page reads on first paint. */
  before?: (page: Page) => Promise<void>;
  /** Runs after the page has settled: opening a popover, a panel, a disclosure. */
  setup?: (page: Page) => Promise<void>;
};
export type QaPage = { name: string; path: string; states: QaState[]; mask?: string[]; axeExclude?: string[] };

// Time-dependent text: elapsed time, runs left today, hours to the budget reset.
// A pattern read by sampling inline styles differs a little on every run (motion-capture.md, Honesty rules).
const dynamic = ['[data-qa-mask="elapsed"]', '[data-qa-mask="runs-left"]', '[data-qa-mask="hours"]', '[data-qa-mask="sampled"]'];

const recentList = [
  { id: 'seedclean0', host: 'localhost:4100', createdAt: '2026-10-12T15:04:00.000Z', status: 'complete', stats: { colors: 9, typeStyles: 9, spacingSteps: 11, components: 28, checksPassed: 43, checksApplicable: 45 }, palette: [{ value: '#0B1F3A', share: 0.6 }, { value: '#E2E8F0', share: 0.15 }, { value: '#2458E6', share: 0.09 }, { value: '#FFFFFF', share: 0.08 }] },
  { id: 'seedmessy0', host: 'localhost:4100', createdAt: '2026-10-05T17:20:00.000Z', status: 'complete', stats: { colors: 23, typeStyles: 9, spacingSteps: 11, components: 31, checksPassed: 47, checksApplicable: 55 }, palette: [{ value: '#1E1E1E', share: 0.4 }, { value: '#0B1F3A', share: 0.2 }, { value: '#2458E6', share: 0.1 }] },
  { id: 'seedlogin0', host: 'localhost:4198', createdAt: '2026-10-20T15:30:00.000Z', status: 'blocked', blockedReason: 'login' },
  { id: 'seedprog02', host: 'localhost:4100', createdAt: '2026-10-26T15:00:00.000Z', status: 'running' },
];

/** Puts runs in this browser's recent list before the page reads it. */
export const withRecent = async (page: Page) => {
  await page.addInitScript((list) => window.localStorage.setItem('dse_recent', JSON.stringify(list)), recentList);
};
export const withBlocked = (detail: unknown) => async (page: Page) => {
  await page.addInitScript((d) => window.sessionStorage.setItem('dse_blocked', JSON.stringify(d)), detail);
};
const usage = { used: 1.94, budget: 2, runsToday: 41, resetsAt: '2026-10-27T06:00:00.000Z' };

/** The first component of a seeded run, opened in its panel by clicking its card. */
async function openFirstComponent(page: Page) {
  await page.locator('#components article a').first().click();
  await page.locator('[role="dialog"] h2').first().waitFor();
  await page.waitForTimeout(800);
}

/**
 * QA starts every page at one moment, so time-dependent text (elapsed time, "Today, 09:00") renders
 * the same on any day: two minutes and 41 seconds after the frozen in-progress runs started
 * (fixtures/seed.json). Time keeps flowing from there; a fixed clock would stop GSAP's ticker.
 */
export const qaNow = new Date('2026-10-26T15:02:42.000Z');
export const freezeClock = (page: Page) =>
  page.addInitScript((target: number) => {
    const Real = Date;
    const offset = target - Real.now();
    const Shifted = function (this: unknown, ...args: unknown[]) {
      const d = args.length ? new (Real as unknown as new (...a: unknown[]) => Date)(...args) : new Real(Real.now() + offset);
      return new.target ? d : d.toString();
    } as unknown as DateConstructor;
    Object.setPrototypeOf(Shifted, Real);
    (Shifted as { prototype: Date }).prototype = Real.prototype;
    Shifted.now = () => Real.now() + offset;
    globalThis.Date = Shifted;
  }, qaNow.getTime());

export const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '820', width: 820, height: 1180 },
  { name: '390', width: 390, height: 844 },
] as const;

export const qaPages: QaPage[] = [
  {
    name: 'home',
    path: '/',
    states: [
      { name: 'default' },
      { name: 'include-open', setup: async (page) => void (await page.getByRole('button', { name: 'Also include pages' }).click(), await page.waitForTimeout(500)) },
      { name: 'key-popover', setup: async (page) => void (await page.getByRole('button', { name: 'Use your own key' }).click(), await page.waitForTimeout(400)) },
      { name: 'filtered', setup: async (page) => void (await page.getByRole('radio', { name: 'Finance' }).click(), await page.waitForTimeout(900)) },
    ],
  },
  {
    name: 'run',
    path: '/r/seedclean0',
    mask: dynamic,
    states: [
      { name: 'complete' },
      { name: 'drift', path: '/r/seedmessy0' },
      { name: 'library', path: '/r/seedlibra0' },
      { name: 'share-open', setup: async (page) => void (await page.getByRole('button', { name: 'Share' }).click(), await page.waitForTimeout(400)) },
      { name: 'pages-open', setup: async (page) => void (await page.getByRole('button', { name: /^\d+ pages$/ }).click(), await page.waitForTimeout(400)) },
      { name: 'panel', setup: openFirstComponent },
      { name: 'queued', path: '/r/seedqueue0' },
      { name: 'after-select', path: '/r/seedprog01' },
      { name: 'after-tokens', path: '/r/seedprog02' },
      { name: 'after-components', path: '/r/seedprog03' },
      { name: 'sparse', path: '/r/seedspars0' },
      { name: 'login-partial', path: '/r/seedlogin0?partial=1' },
      { name: 'failed', path: '/r/seedfail00' },
      { name: 'cancelled', path: '/r/seedcanc00' },
      { name: 'not-found', path: '/r/zzzzzzzzzz' },
    ],
  },
  {
    name: 'component',
    path: '/r/seedclean0',
    states: [{ name: 'page', setup: async (page) => void (await page.goto(await page.locator('#components article a').first().evaluate((a) => (a as HTMLAnchorElement).pathname.replace(/\/$/, '') + '/c/' + new URL((a as HTMLAnchorElement).href).searchParams.get('c'))), await settle(page)) }],
  },
  {
    name: 'compare',
    path: '/compare?a=seedmessy0&b=seedmafter',
    states: [
      { name: 'same-site' },
      {
        name: 'two-sites',
        // Compare is desktop only: phones show the columns and the notice, without the toggle.
        setup: async (page) => {
          const toggle = page.getByRole('radio', { name: 'Two sites' });
          if (!(await toggle.isVisible())) return;
          await toggle.click();
          await page.waitForTimeout(400);
        },
      },
      { name: 'picker', path: '/compare?a=seedclean0', before: withRecent },
    ],
  },
  {
    name: 'recent',
    path: '/recent',
    mask: dynamic,
    states: [{ name: 'empty' }, { name: 'runs', before: withRecent }],
  },
  {
    name: 'state',
    path: '/state/budget?url=https%3A%2F%2Ftidewater.app%2F',
    mask: dynamic,
    states: [
      { name: 'budget', before: withBlocked(usage) },
      { name: 'budget-no-detail' },
      { name: 'busy', path: '/state/busy?url=https%3A%2F%2Ftidewater.app%2F', before: withBlocked({ queued: 23 }) },
      { name: 'visitor-cap', path: '/state/visitor-cap?url=https%3A%2F%2Ftidewater.app%2F', before: withBlocked({ used: 2, budget: 2, runsToday: 2, resetsAt: usage.resetsAt }) },
      { name: 'bot', path: '/state/bot?run=seedblock0' },
      { name: 'robots', path: '/state/robots?url=https%3A%2F%2Ftidewater.app%2F' },
      { name: 'login', path: '/state/login?run=seedlogin0' },
      { name: 'unreachable', path: '/state/unreachable?url=https%3A%2F%2Ftidewater.app%2F' },
      { name: 'invalid', path: '/state/invalid?url=http%3A%2F%2F10.0.0.1%2F', before: withBlocked({ reason: 'address 10.0.0.1' }) },
    ],
  },
  {
    name: 'open',
    path: '/open',
    mask: dynamic,
    states: [
      { name: 'empty' },
      {
        name: 'loaded',
        setup: async (page) => {
          const doc = (await (await page.request.get('/api/runs/seedclean0')).json()).document;
          await page.locator('input[type=file]').setInputFiles({ name: 'run.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
          await page.locator('#motion').waitFor();
          await settle(page);
        },
      },
    ],
  },
  { name: 'how-it-works', path: '/how-it-works', states: [{ name: 'default' }] },
  { name: 'about', path: '/about', states: [{ name: 'default' }] },
  { name: 'privacy', path: '/privacy', states: [{ name: 'default' }] },
  { name: 'terms', path: '/terms', states: [{ name: 'default' }] },
  { name: 'not-found', path: '/nothing-here', states: [{ name: 'default' }] },
  {
    name: 'catalog',
    path: '/catalog',
    mask: ['[data-qa-mask="dev-spend"]'],
    // The 390 px frames are routes of their own; axe checks them directly (axePages).
    axeExclude: ['iframe[src^="/catalog/frame/"]'],
    states: [{ name: 'default' }],
  },
];

/** Routes axe checks beyond qaPages: each catalog frame, at the phone width it is built for. */
export const axePages: { name: string; path: string; viewport: (typeof viewports)[number] }[] = demoIndex.map((d) => ({
  name: `catalog-frame-${d.slug}`,
  path: `/catalog/frame/${d.slug}`,
  viewport: viewports[2],
}));
// The TopNav demo's desktop states render in a frame of their own (two Primary navs cannot share a page).
axePages.push({ name: 'catalog-frame-top-nav-states', path: '/catalog/frame/top-nav?view=states', viewport: viewports[0] });

/** Waits for fonts, then scrolls the page through so lazy content and iframes paint. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 140));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  // Bounded: prefetches of routes that do not exist yet never settle.
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  for (const f of page.frames()) await f.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

/**
 * Grows the viewport to the whole document so every frame (including sandboxed, out-of-process
 * preview frames) is in view and painted, then hands back the original size afterwards.
 */
export async function withFullHeight<T>(page: Page, fn: () => Promise<T>): Promise<T> {
  const vp = page.viewportSize();
  if (!vp) return fn();
  const height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, height) });
  await page.waitForTimeout(700);
  try {
    return await fn();
  } finally {
    await page.setViewportSize(vp);
  }
}
