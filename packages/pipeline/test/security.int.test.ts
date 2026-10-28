import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { launchBrowser } from '../src/crawl/browser';
import { openRenderSession, renderPreview, type RenderSession } from '../src/previews/render';
import { startStorageServer } from '../../../scripts/storage-serve';
import { statePreview } from '../src/previews/build';
import { BEACON, hostileCases, hostilePreview } from './helpers/hostile';

const port = 4402;
const hostileDelta = [
  { property: 'background-image', from: 'none', to: `url(${BEACON}/state.png)`, transition: { durationMs: 160, easing: 'ease-out' } },
  { property: 'color', from: `url(${BEACON}/from.png)`, to: 'expression(alert(1))', transition: { durationMs: 160, easing: `url(javascript:alert(1))` } },
  { property: 'border-color', from: '#000', to: '#111</style><script>window.__pwned = 1</script><style>', transition: { durationMs: 200, easing: 'steps(2)' } },
  { property: 'cursor', from: 'auto', to: `url(${BEACON}/cursor.png), auto` },
  { property: 'box-shadow', from: 'none', to: '0 0 0 2px #2458E6', transition: { durationMs: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' } },
];
const storageBase = `http://localhost:${port}`;
const dir = mkdtempSync(join(tmpdir(), 'dse-security-'));
let server: Server;
let browser: Browser;
let session: RenderSession;

beforeAll(async () => {
  mkdirSync(join(dir, 'previews'), { recursive: true });
  hostileCases.forEach((h, i) => writeFileSync(join(dir, 'previews', `${i}.html`), hostilePreview(h, storageBase).html));
  // State files (D-094): the same documents plus a state rule and generated keyframes from a hostile delta.
  hostileCases.forEach((h, i) => writeFileSync(join(dir, 'previews', `${i}-hover.html`), statePreview(hostilePreview(h, storageBase).html, hostileDelta, { storageBase })));
  // The app shows a live preview only as a sandboxed frame of its storage URL.
  writeFileSync(join(dir, 'app.html'), `<!doctype html><body>${hostileCases.flatMap((_, i) => [`${i}.html`, `${i}-hover.html`]).map((f) => `<iframe sandbox="" src="${storageBase}/previews/${f}" title="preview ${f}" width="240" height="140"></iframe>`).join('')}</body>`);
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

  it('renders every state file in the worker with no request outside the allowlist and no script (D-094)', async () => {
    for (let i = 0; i < hostileCases.length; i++) {
      await renderPreview(session, `${storageBase}/previews/${i}-hover.html`, { w: 200, h: 100 });
      await session.page.waitForTimeout(250);
      const ran = await session.page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned ?? 0);
      expect(ran, hostileCases[i]!.name).toBe(0);
      expect(await session.page.evaluate(() => document.querySelectorAll('script').length), hostileCases[i]!.name).toBe(0);
    }
    expect(session.refused).toEqual([]);
  }, 120_000);

  it('renders every case inside the app sandbox with no request outside the allowlist', async () => {
    const app = await openRenderSession(browser, storageBase);
    try {
      await app.page.setViewportSize({ width: 1200, height: 900 });
      await app.page.goto(`${storageBase}/app.html`, { waitUntil: 'load' });
      await app.page.waitForTimeout(500);
      expect(app.page.frames().length).toBe(hostileCases.length * 2 + 1);
      for (const f of app.page.frames().slice(1)) expect(f.url()).toMatch(/\/previews\/\d+(-hover)?\.html$/);
      expect(app.refused).toEqual([]);
    } finally {
      await app.close();
    }
  }, 60_000);
});
