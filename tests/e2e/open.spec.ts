import { createServer, type Server } from 'node:http';
import { expect, test } from '@playwright/test';
import { RunDocumentComplete } from '@dse/schema';
import { global, openPage } from '../../apps/web/copy/strings';

// /open renders a CLI run.json entirely in the browser and generates its exports there (D-015).

test('a dropped run.json renders every section and downloads an export', async ({ page, request }) => {
  const doc = (await (await request.get('/api/runs/seedclean0')).json()).document;
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/open');
  await page.locator('input[type=file]').setInputFiles({ name: 'run.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await expect(page.getByText('Local run')).toBeVisible();
  for (const id of ['tokens', 'motion', 'components', 'checks', 'drift', 'exports']) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.getByText('Captured image not available locally. Run dse serve to show it.').first()).toBeAttached();
  await expect(page.getByRole('button', { name: 'Share' })).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.locator('#exports').getByRole('button', { name: 'Download', exact: true }).first().click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('tokens.css');
  const css = await (await file.createReadStream()).toArray();
  expect(Buffer.concat(css).toString()).toContain('--color-');
  expect(requests.filter((u) => u.includes('/api/'))).toEqual([]);
});

test('a file that is not a complete run is refused with the validation line', async ({ page, request }) => {
  const doc = (await (await request.get('/api/runs/seedclean0')).json()).document;
  for (const body of ['{not json', JSON.stringify({ ...doc, tokens: undefined })]) {
    await page.goto('/open');
    await page.locator('input[type=file]').setInputFiles({ name: 'run.json', mimeType: 'application/json', buffer: Buffer.from(body) });
    await expect(page.getByText(global.validation)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: openPage.title })).toBeVisible();
    await expect(page.locator('#tokens')).toHaveCount(0);
  }
});

test('with local.base set, crops and previews load from that base instead of the placeholder', async ({ page, request }) => {
  // dse serve always answers on http://localhost:4300, the one origin the /open CSP allows (pages.md, /open).
  const served: string[] = [];
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const server: Server = createServer((req, res) => {
    served.push(req.url ?? '');
    const html = (req.url ?? '').endsWith('.html');
    res.writeHead(200, { 'content-type': html ? 'text/html' : 'image/png', 'access-control-allow-origin': '*' });
    res.end(html ? '<!doctype html><title>preview</title><button>Preview</button>' : png);
  });
  await new Promise<void>((done, fail) => server.once('error', fail).listen(4300, 'localhost', done));
  try {
    const doc = RunDocumentComplete.parse((await (await request.get('/api/runs/seedclean0')).json()).document);
    const local = { ...doc, local: { base: 'http://localhost:4300' } };
    const first = doc.components![0]!.preview;
    const key = first.mode === 'live' ? first.htmlKey : first.cropKey;
    await page.goto('/open');
    await page.locator('input[type=file]').setInputFiles({ name: 'run.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(local)) });
    await expect(page.getByText(global.breadcrumbs.local)).toBeVisible();
    await page.locator('#components').scrollIntoViewIfNeeded();
    await expect.poll(() => served, { timeout: 10_000 }).toContain(`/${key}`);
    await expect(page.getByText(openPage.placeholder)).toHaveCount(0);
    const sources = await page.locator('#components article').first().locator('iframe, img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
    expect(sources).toEqual([`http://localhost:4300/${key}`]);
  } finally {
    await new Promise((done) => server.close(done));
  }
});
