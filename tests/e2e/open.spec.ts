import { expect, test } from '@playwright/test';

// /open renders a CLI run.json entirely in the browser and generates its exports there (D-015).

test('a dropped run.json renders every section and downloads an export', async ({ page, request }) => {
  const doc = (await (await request.get('/api/runs/seedclean0')).json()).document;
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/open');
  await page.locator('input[type=file]').setInputFiles({ name: 'run.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await expect(page.getByText('Local run')).toBeVisible();
  for (const id of ['tokens', 'components', 'checks', 'drift', 'exports']) await expect(page.locator(`#${id}`)).toBeVisible();
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
