import { expect, test } from '@playwright/test';
import { HealthResponse, RunDocumentComplete, RunResponse } from '@dse/schema';
import { loadRun } from '../../packages/mcp/src/index';

// The API routes on the production build, against the seeded fixture runs (pnpm db:seed:fixtures).

test('a seeded run is served complete, cached publicly, with an ETag', async ({ request }) => {
  const res = await request.get('/api/runs/seedclean0');
  expect(res.status(), 'run pnpm db:seed:fixtures first').toBe(200);
  expect(res.headers()['cache-control']).toBe('public, max-age=3600, stale-while-revalidate=86400');
  const body = RunResponse.parse(await res.json());
  expect(body).toMatchObject({ id: 'seedclean0', status: 'complete', isShowcase: true });
  RunDocumentComplete.parse(body.document);
  const again = await request.get('/api/runs/seedclean0', { headers: { 'if-none-match': res.headers().etag! } });
  expect(again.status()).toBe(304);
});

test('a frozen in-progress run is served as it stands, never cached', async ({ request }) => {
  const res = await request.get('/api/runs/seedprog02');
  expect(res.headers()['cache-control']).toBe('no-store');
  const body = RunResponse.parse(await res.json());
  expect(body.status).toBe('running');
  expect(body.document.tokens?.colors?.length).toBe(9);
  expect(body.document.components).toBeUndefined();
  expect(body.events.at(-1)?.stage).toBe('tokens');
});

test('exports, captures and the Open Graph image are served by the app', async ({ request }) => {
  const css = await request.get('/api/runs/seedclean0/export/tokens.css');
  expect(css.headers()['content-type']).toBe('text/css; charset=utf-8');
  expect(await css.text()).toContain('--color-');
  const run = RunResponse.parse(await (await request.get('/api/runs/seedclean0')).json());
  const page = run.document.pages![0]!;
  const cap = await request.get(`/api/runs/seedclean0/pages/${page.id}/capture?viewport=desktop`, { maxRedirects: 0 });
  expect(cap.status()).toBe(302);
  const og = await request.get('/api/runs/seedclean0/og');
  expect(og.headers()['content-type']).toBe('image/png');
});

test('health reports the queue and the budget; unknown runs are 404', async ({ request }) => {
  HealthResponse.parse(await (await request.get('/api/health')).json());
  expect((await request.get('/api/runs/zzzzzzzzzz')).status()).toBe(404);
});

test('the MCP server loads a run with --run from the app', async ({ baseURL }) => {
  const { doc, runUrl } = await loadRun(['--run', 'seedclean0', '--app-url', baseURL!]);
  expect(runUrl).toBe(`${baseURL}/r/seedclean0`);
  expect(doc.components?.length).toBe(29);
});

test('the compare page shows the messy-after deltas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/compare?a=seedmessy0&b=seedmafter');
  // messy-after's dark band (D-094) adds one gray (#0B0D10) and three components to the v1.1 deltas.
  await expect(page.getByText('Grays · 4 fewer, still 2 to go')).toBeVisible();
  await expect(page.getByText('Components · 5 new')).toBeVisible();
  for (const name of ['Band button', 'Feature card (night mode digests)']) await expect(page.getByRole('row', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')} New`) })).toBeVisible();
  await expect(page.getByRole('row', { name: /Button Changed 7 variants 6 variants/ })).toBeVisible();
  for (const name of ['Newsletter input', 'Status badge']) await expect(page.getByRole('row', { name: new RegExp(`^${name} Changed`) })).toBeVisible();
  await expect(page.getByRole('row', { name: /^Toast New/ })).toBeVisible();
});
