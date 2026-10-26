import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { launchBrowser } from '../src/crawl/browser';
import { openRenderSession, renderPreview, type RenderSession } from '../src/previews/render';
import { startStorageServer } from '../../../scripts/storage-serve';
import { BEACON, hostileCases, hostilePreview } from './helpers/hostile';

const port = 4402;
const storageBase = `http://localhost:${port}`;
const dir = mkdtempSync(join(tmpdir(), 'dse-security-'));
let server: Server;
let browser: Browser;
let session: RenderSession;

beforeAll(async () => {
  mkdirSync(join(dir, 'previews'), { recursive: true });
  hostileCases.forEach((h, i) => writeFileSync(join(dir, 'previews', `${i}.html`), hostilePreview(h, storageBase).html));
  // The app shows a live preview only as a sandboxed frame of its storage URL.
  writeFileSync(join(dir, 'app.html'), `<!doctype html><body>${hostileCases.map((_, i) => `<iframe sandbox="" src="${storageBase}/previews/${i}.html" title="preview ${i}" width="240" height="140"></iframe>`).join('')}</body>`);
  writeFileSync(join(dir, 'control.html'), `<!doctype html><body><div class="dse-root"><img src="${BEACON}/control.png" alt=""></div></body>`);
  server = await startStorageServer(dir, port);
  browser = await launchBrowser();
  session = await openRenderSession(browser, storageBase);
}, 60_000);

afterAll(async () => {
  await session?.close();
  await browser?.close();
  server?.close();
});

describe('security · rendering hostile previews', () => {
  it('the request trap sees an unsanitized document reach for the beacon', async () => {
    await renderPreview(session, `${storageBase}/control.html`, { w: 200, h: 100 });
    expect(session.refused.some((u) => u.startsWith(BEACON))).toBe(true);
    session.refused.length = 0;
  });

  it('renders every sanitized case in the worker with no request outside the allowlist and no script', async () => {
    for (let i = 0; i < hostileCases.length; i++) {
      await renderPreview(session, `${storageBase}/previews/${i}.html`, { w: 200, h: 100 });
      const ran = await session.page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned ?? 0);
      expect(ran, hostileCases[i]!.name).toBe(0);
      expect(session.page.url(), hostileCases[i]!.name).toBe(`${storageBase}/previews/${i}.html`);
    }
    expect(session.refused).toEqual([]);
  }, 120_000);

  it('renders every case inside the app sandbox with no request outside the allowlist', async () => {
    const app = await openRenderSession(browser, storageBase);
    try {
      await app.page.setViewportSize({ width: 1200, height: 900 });
      await app.page.goto(`${storageBase}/app.html`, { waitUntil: 'load' });
      await app.page.waitForTimeout(500);
      expect(app.page.frames().length).toBe(hostileCases.length + 1);
      for (const f of app.page.frames().slice(1)) expect(f.url()).toMatch(/\/previews\/\d+\.html$/);
      expect(app.refused).toEqual([]);
    } finally {
      await app.close();
    }
  }, 60_000);
});
