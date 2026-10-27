import { expect, test, type Page } from '@playwright/test';
import { RunResponse, type RunEvent } from '@dse/schema';
import { checkLabels, fill } from '@dse/schema/labels';
import { componentPanel, global, runPage } from '../../apps/web/copy/strings';
import { settle } from '../qa/pages';

// The run page's behaviors against the seeded runs (fixtures/seed.json): blocked redirects, the
// panel in the URL, the checks popover, the in-progress skeletons, the sticky section nav, the
// opened card's ring and the live log's scroll (docs/design/pages.md, components.md, motion.md).

/** docs/design/pages.md, the blocked reason to state route table. */
const stateFor: Record<string, string> = { bot: 'bot', robots: 'robots', login: 'login', unreachable: 'unreachable', 'private-address': 'invalid' };

async function run(page: Page, id: string) {
  return RunResponse.parse(await (await page.request.get(`/api/runs/${id}`)).json());
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('a direct visit to a blocked run without ?partial=1 redirects to its state page', async ({ page }) => {
  const seen: Record<string, string> = {};
  const expected: Record<string, string> = {};
  for (const id of ['seedblock0', 'seedlogin0']) {
    const r = await run(page, id);
    expect(r.status).toBe('blocked');
    expected[id] = `/state/${stateFor[r.document.blockedReason!]}?run=${id}`;
    await page.goto(`/r/${id}`);
    const u = new URL(page.url());
    seen[id] = u.pathname + u.search;
  }
  expect(seen).toEqual(expected);
});

test('a login wall with ?partial=1 renders the run page', async ({ page }) => {
  await page.goto('/r/seedlogin0?partial=1');
  await expect(page).toHaveURL('/r/seedlogin0?partial=1');
  await expect(page.locator('main')).toHaveAttribute('data-run-status', 'blocked');
});

test('the first poll that returns blocked navigates to the state route with ?run=', async ({ page }) => {
  const live = await run(page, 'seedprog02');
  expect(live.status).toBe('running');
  const blocked = { ...live, status: 'blocked', document: { ...live.document, status: 'blocked', blockedReason: 'bot' } };
  await page.route('**/api/runs/seedprog02', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(blocked) }));
  await page.goto('/r/seedprog02');
  await expect(page).toHaveURL('/state/bot?run=seedprog02', { timeout: 10_000 });
});

test('opening a component pushes ?c=, a reload reopens the panel, closing removes it and returns focus to the card', async ({ page }) => {
  await page.goto('/r/seedclean0');
  await settle(page);
  const link = page.locator('#components article a').first();
  const href = (await link.getAttribute('href'))!;
  const cid = new URL(href, 'http://x').searchParams.get('c')!;
  const name = (await link.innerText()).trim();
  await link.click();
  await expect(page).toHaveURL(`/r/seedclean0?c=${cid}`);
  const panel = page.getByRole('dialog', { name });
  await expect(panel).toBeVisible();

  await page.reload();
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { level: 2, name })).toBeVisible();

  await panel.getByRole('button', { name: componentPanel.close }).click();
  await expect(page).toHaveURL('/r/seedclean0');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator(`a[href="/r/seedclean0?c=${cid}"]`)).toBeFocused();
});

test('the clicked card gets a 2 px focus-colored ring that fades over motion-slow', async ({ page }) => {
  await page.goto('/r/seedclean0');
  await settle(page);
  const card = page.locator('#components article').first();
  await card.locator('a').first().click();
  await expect(card).toHaveAttribute('data-opened', 'true');
  const ring = await card.evaluate((el) => {
    const anim = el.getAnimations().find((a) => (a as CSSAnimation).animationName?.includes('dse-opened'));
    if (!anim) return null;
    const probe = document.createElement('span');
    probe.style.color = 'var(--dse-focus)';
    document.body.append(probe);
    const focus = getComputedStyle(probe).color;
    probe.remove();
    anim.pause();
    anim.currentTime = 0;
    const start = getComputedStyle(el).outlineColor;
    const width = getComputedStyle(el).outlineWidth;
    const total = Number(anim.effect!.getTiming().duration);
    anim.currentTime = total;
    const end = getComputedStyle(el).outlineColor;
    const token = getComputedStyle(document.documentElement).getPropertyValue('--dse-motion-slow').trim();
    const motionSlow = token.endsWith('ms') ? parseFloat(token) : parseFloat(token) * 1000;
    return { focus, start, end, width, total, motionSlow };
  });
  expect(ring, 'no ring animation on the opened card').not.toBeNull();
  expect(ring!.start).toBe(ring!.focus);
  expect(ring!.end).toMatch(/rgba\(\d+, \d+, \d+, 0\)|transparent/);
  expect(ring!.width).toBe('2px');
  expect(ring!.total).toBe(ring!.motionSlow);
});

test('ChecksTable "· {n} more" opens a popover listing every failing component of that check, from components[].checks', async ({ page }) => {
  // No seeded run fails one check on more than 3 components, so the messy run's document is
  // served as the poll answer of a frozen run with one check failing wherever it applies.
  const messy = await run(page, 'seedmessy0');
  const check = messy.document.checks!.byCheck[0]!.check;
  const components = messy.document.components!.map((c) => ({ ...c, checks: c.checks.map((r) => (r.check === check && r.status !== 'na' ? { ...r, status: 'fail' as const } : r)) }));
  const failing = components.flatMap((c) => c.checks.filter((r) => r.check === check && r.status === 'fail').map((r) => fill(runPage.checks.failing, { component: c.name, detail: r.detail })));
  expect(failing.length).toBeGreaterThan(3);
  const answer = { ...messy, id: 'seedprog01', isShowcase: false, document: { ...messy.document, id: 'seedprog01', components } };
  await page.route('**/api/runs/seedprog01', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer) }));
  await page.goto('/r/seedprog01');
  await expect(page.locator('main')).toHaveAttribute('data-run-status', 'complete', { timeout: 10_000 });
  await settle(page);
  const row = page.locator('#checks tbody tr').filter({ has: page.getByRole('rowheader', { name: checkLabels[check], exact: true }) });
  await expect(row).not.toContainText(failing[3]!);
  await row.getByRole('button', { name: fill(runPage.checks.more, { n: failing.length - 3 }) }).click();
  const pop = page.getByRole('dialog', { name: checkLabels[check] });
  await expect(pop).toBeVisible();
  expect(await pop.getByRole('listitem').allInnerTexts()).toEqual(failing);
});

type Region = { rows: number; heights: number[]; height: number; tops: number[] };

test('RegionSkeleton: every region before its stage lands has the documented shape, at its real height', async ({ page }) => {
  await page.goto('/r/seedprog01');
  await settle(page);
  const shapes = await page.evaluate((paletteLabel) => {
    const box = (el: Element) => el.getBoundingClientRect();
    const roots = (scope: Element) => [...scope.querySelectorAll('[aria-hidden="true"]')].filter((el) => el.children.length > 0 && el.tagName !== 'svg' && !el.parentElement!.closest('[aria-hidden="true"]'));
    const shape = (el: Element): Region => {
      const kids = [...el.children];
      return {
        rows: kids.length,
        heights: kids.map((k) => Math.round(box(k.firstElementChild ?? k).height)),
        height: Math.round(box(el).height),
        tops: [...new Set(kids.map((k) => Math.round(box(k).top)))],
      };
    };
    const palette = [...document.querySelectorAll('main p')].find((p) => p.textContent === paletteLabel)!.parentElement!;
    const tokens = roots(document.getElementById('tokens')!);
    const [checks] = roots(document.getElementById('checks')!);
    const [drift] = roots(document.getElementById('drift')!);
    const [exportsRoot] = roots(document.getElementById('exports')!);
    return {
      palette: shape(roots(palette)[0]!),
      type: shape(tokens[0]!),
      spacing: shape(tokens[1]!),
      componentsParts: roots(document.getElementById('components')!)[0]!.children.length,
      components: shape(roots(document.getElementById('components')!)[0]!.children[2]!),
      motion: (([m]) => ({ parts: m!.children.length, easings: m!.children[1]!.children.length, rows: m!.children[2]!.children.length }))(roots(document.getElementById('motion')!)),
      checks: { summary: Math.round(box(checks!.children[0]!).height), rows: checks!.children[1]!.children.length },
      drift: { numbers: drift!.children[0]!.children.length },
      exports: { cards: exportsRoot!.children[1]!.children.length, grid: Math.round(box(exportsRoot!.children[1]!).width), mcp: Math.round(box(exportsRoot!.children[2]!).width), parts: exportsRoot!.children.length },
    };
  }, runPage.palette.label);
  expect(shapes.palette.rows).toBe(8);
  expect(new Set(shapes.palette.heights)).toEqual(new Set([96]));
  expect(shapes.type.rows).toBe(8);
  // Heights are the typical result's at 1440 (D-080).
  expect(shapes.type.height).toBe(580);
  expect(shapes.spacing.rows).toBe(9);
  expect(shapes.spacing.height).toBe(446);
  // The duration strip, two easing cards, four pattern rows.
  expect(shapes.motion).toEqual({ parts: 3, easings: 2, rows: 4 });
  // The filter row, the tier heading, the six cards, Show all.
  expect(shapes.componentsParts).toBe(4);
  expect(shapes.components.rows).toBe(6);
  expect(shapes.components.tops).toHaveLength(2);
  expect(shapes.components.heights.every((h) => h === 152)).toBe(true);
  expect(shapes.checks.summary).toBeGreaterThan(0);
  expect(shapes.checks.rows).toBe(5);
  expect(shapes.drift.numbers).toBe(3);
  // The download row, the eight cards, the MCP card.
  expect(shapes.exports).toMatchObject({ cards: 8, parts: 3 });
  expect(shapes.exports.mcp).toBe(shapes.exports.grid);
});

test('SectionNav sticks at the top while scrolling and marks the section in view', async ({ page }) => {
  await page.goto('/r/seedclean0');
  await settle(page);
  const nav = page.getByRole('navigation', { name: global.sectionsLabel });
  expect((await nav.boundingBox())!.y).toBeGreaterThan(0);
  for (const [id, label] of [
    ['components', runPage.sectionNav.components],
    ['drift', runPage.sectionNav.drift],
  ] as const) {
    await page.evaluate((s) => window.scrollTo({ top: document.getElementById(s)!.getBoundingClientRect().top + window.scrollY - 120, behavior: 'instant' }), id);
    await expect(nav.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'true');
    await expect(nav.locator('[aria-current="true"]')).toHaveCount(1);
    expect(Math.round((await nav.boundingBox())!.y)).toBe(0);
  }
});

test('the live log autoscrolls only when the reader was already at the bottom', async ({ page }) => {
  const live = await run(page, 'seedprog02');
  const last = live.events.at(-1)!;
  const more = (from: number, n: number): RunEvent[] => Array.from({ length: n }, (_, i) => ({ ...last, id: last.id + from + i + 1, message: `Line ${from + i + 1}` }));
  let events = [...live.events, ...more(0, 30)];
  await page.route('**/api/runs/seedprog02', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...live, events }) }));
  await page.goto('/r/seedprog02');
  const log = page.getByRole('region', { name: runPage.liveLog.label }).locator('ol');
  await expect(log.locator('li')).toHaveCount(events.length, { timeout: 10_000 });
  const fromBottom = () => log.evaluate((el) => Math.round(el.scrollHeight - el.scrollTop - el.clientHeight));
  expect(await log.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect.poll(fromBottom).toBeLessThanOrEqual(1);

  // Scrolled up: new lines do not move the reader.
  await log.evaluate((el) => el.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(100);
  events = [...events, ...more(30, 5)];
  await expect(log.locator('li')).toHaveCount(events.length, { timeout: 10_000 });
  await page.waitForTimeout(200);
  expect(await log.evaluate((el) => el.scrollTop)).toBe(0);

  // Back at the bottom: the next lines follow.
  await log.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(100);
  events = [...events, ...more(35, 5)];
  await expect(log.locator('li')).toHaveCount(events.length, { timeout: 10_000 });
  await expect.poll(fromBottom).toBeLessThanOrEqual(1);
});
