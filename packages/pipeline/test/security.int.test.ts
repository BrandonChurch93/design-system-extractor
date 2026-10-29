import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { launchBrowser } from '../src/crawl/browser';
import { openRenderSession, renderPreview, type RenderSession } from '../src/previews/render';
import { startStorageServer } from '../../../scripts/storage-serve';
import { buildPreview, statePreview, withStateRules } from '../src/previews/build';
import { snap } from './helpers/snap';
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
  // Default documents with state rules (D-106): the hostile delta as hover, focus and active rules.
  const ruleStates = (['hover', 'focus', 'active'] as const).map((state) => ({ state, captured: true, delta: hostileDelta }));
  hostileCases.forEach((h, i) => writeFileSync(join(dir, 'previews', `${i}-rules.html`), withStateRules(hostilePreview(h, storageBase).html, ruleStates, { storageBase })));
  // A component of links, to click inside a frame.
  const links = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'nav', parent: 0, box: [0, 0, 300, 60] }]);
  writeFileSync(join(dir, 'previews', 'links.html'), buildPreview({ markup: `<nav data-dse-id="e1"><a href="https://example.com/away" style="display:block;width:300px;height:30px">Away</a><a href="/pricing" style="display:block;width:300px;height:30px">Pricing</a></nav>`, vars: {}, snapshot: links, root: links.elements[1]!, matched: {}, imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase } }).html);
  // The app shows a live preview only as a sandboxed frame of its storage URL.
  writeFileSync(join(dir, 'app.html'), `<!doctype html><body>${hostileCases.flatMap((_, i) => [`${i}.html`, `${i}-hover.html`, `${i}-rules.html`]).map((f) => `<iframe sandbox="" src="${storageBase}/previews/${f}" title="preview ${f}" width="240" height="140"></iframe>`).join('')}</body>`);
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

  it('renders every default document with state rules, hovered and pressed, with no request outside the allowlist and no script (D-106)', async () => {
    for (let i = 0; i < hostileCases.length; i++) {
      await renderPreview(session, `${storageBase}/previews/${i}-rules.html`, { w: 200, h: 100 });
      await session.page.mouse.move(20, 20);
      await session.page.mouse.down();
      await session.page.keyboard.press('Tab');
      await session.page.mouse.up();
      await session.page.waitForTimeout(250);
      expect(await session.page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned ?? 0), hostileCases[i]!.name).toBe(0);
      expect(await session.page.evaluate(() => document.querySelectorAll('script').length), hostileCases[i]!.name).toBe(0);
    }
    await session.page.mouse.move(0, 0);
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
      expect(app.page.frames().length).toBe(hostileCases.length * 3 + 1);
      for (const f of app.page.frames().slice(1)) expect(f.url()).toMatch(/\/previews\/\d+(-hover|-rules)?\.html$/);
      // The pointer reaches the frames now (D-106): hover and press each one.
      for (const el of await app.page.locator('iframe').all()) {
        await el.hover();
        await app.page.mouse.down();
        await app.page.mouse.up();
      }
      await app.page.waitForTimeout(300);
      expect(app.refused).toEqual([]);
    } finally {
      await app.close();
    }
  }, 60_000);

  it('a click on a link inside a sandboxed preview frame leaves the frame on its document (D-106)', async () => {
    const app = await openRenderSession(browser, storageBase);
    try {
      writeFileSync(join(dir, 'links-app.html'), `<!doctype html><body><iframe sandbox="" src="${storageBase}/previews/links.html" title="links" width="320" height="80" tabindex="-1"></iframe></body>`);
      await app.page.goto(`${storageBase}/links-app.html`, { waitUntil: 'load' });
      const frame = app.page.frames()[1]!;
      expect(await frame.evaluate(() => [...document.querySelectorAll('a')].map((a) => a.getAttribute('href')))).toEqual(['#', '#']);
      for (const name of ['Away', 'Pricing']) {
        await app.page.frameLocator('iframe').getByText(name).click();
        await app.page.waitForTimeout(200);
        expect(frame.url().replace(/#.*$/, '')).toBe(`${storageBase}/previews/links.html`);
      }
      expect(app.refused).toEqual([]);
    } finally {
      await app.close();
    }
  }, 60_000);
});
