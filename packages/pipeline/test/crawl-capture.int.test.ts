import { mkdtempSync, readFileSync } from 'node:fs';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Browser } from 'playwright';
import { PNG } from 'pngjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RunDocumentPartial } from '@dse/schema';
import { CROP_PAD, cropOf } from '../src/capture/states';
import { buildSelectors, takeSnapshot } from '../src/capture/snapshot-script';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { createRunContext, launchBrowser } from '../src/crawl/browser';
import { loadPage } from '../src/crawl/navigate';
import { Throttle } from '../src/crawl/throttle';
import { ModelClient } from '../src/models/client';
import { runPipeline, type RunDeps } from '../src/run';
import { OPEN_CAP, SCREENSHOT_MAX_HEIGHT, type CaptureOutput } from '../src/stages/capture';
import { keys } from '../src/storage/keys';

// The crawler's and capture's own rules on purpose-built pages (docs/specs/crawler.md,
// capture-and-states.md, preview-fidelity.md, data-model.md Storage keys).

const port = 4195;
const host = `localhost:${port}`;
const UA = 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)';
const font = readFileSync(resolve(import.meta.dirname, '../../../fixtures/fonts/inter/inter-latin-700-normal.woff2'));
let server: Server;
let browser: Browser;
const hits: string[] = [];
const served = new Map<string, number>();
/** Set by the dying site's test: the origin stops answering too. */
let originDown = false;

const page = (body: string, head = '') => `<!doctype html><html><head><meta charset="utf-8"><title>Test</title>${head}</head><body>${body}</body></html>`;
const button = (text: string, extra = '') => `<button class="btn" style="padding:10px 20px;font-size:16px;border-radius:8px;background:#2458e6;color:#fff;border:0" ${extra}>${text}</button>`;
const html = (res: ServerResponse, body: string, status = 200) => res.writeHead(status, { 'content-type': 'text/html' }).end(body);

function serve() {
  return createServer((req, res) => {
    const path = new URL(req.url ?? '/', `http://${host}`).pathname;
    hits.push(path);
    const n = (served.get(path) ?? 0) + 1;
    served.set(path, n);
    if (path === '/robots.txt' || path === '/sitemap.xml' || path === '/sitemap_index.xml' || path === '/sitemap-index.xml') return void res.writeHead(404).end();
    // Always answers its one page, whatever the path, so the synthetic 404 is not a 404 and is dropped.
    if (path.startsWith('/single')) return html(res, page(`<main><h1>One page</h1><p>Only this.</p>${button('Start')}</main>`));
    if (path.startsWith('/consent')) {
      return html(res, page(`<main><h1>Consent</h1>${button('Go')}</main><div id="cookie-consent" style="position:fixed;bottom:0;left:0;right:0;padding:24px;background:#eee">We use cookies. <button aria-label="Close" onclick="this.parentElement.remove()">×</button></div>`));
    }
    if (path.startsWith('/tall')) return html(res, page(`<main><h1>Tall</h1>${button('Top')}<div style="height:12000px"></div></main>`));
    if (path === '/dying' || path === '/dying/') return html(res, page(`<header><nav>${['a', 'b', 'c', 'd'].map((p) => `<a href="/dying/${p}">${p}</a>`).join(' ')}</nav></header><main><h1>Dying</h1>${button('Go')}</main>`));
    // A page answers its fingerprint fetch, then never again; the origin never answers.
    if (path.startsWith('/dying/') && n > 1) return void req.socket.destroy();
    if (path === '/' && originDown) return void req.socket.destroy();
    if (path === '/challenged' || path === '/challenged/') return html(res, page(`<header><nav>${['a', 'b', 'c', 'd', 'e'].map((p) => `<a href="/challenged/${p}">${p}</a>`).join(' ')}</nav></header><main><h1>Challenged</h1></main>`));
    if (/^\/challenged\/[a-d]$/.test(path) && n > 1) return html(res, '<html><body>Please complete the captcha to continue.</body></html>', 403);
    if (path.startsWith('/opens')) {
      const trigger = (i: number, attrs = '') => `<div class="menu-${i}"><button class="trigger-${i}" aria-haspopup="menu" aria-controls="m${i}" aria-expanded="false" onclick="document.getElementById('m${i}').hidden=false;this.setAttribute('aria-expanded','true')" ${attrs}>Menu ${i}</button><ul id="m${i}" role="menu" hidden><li><a href="#x">Item ${i}</a></li></ul></div>`;
      return html(res, page(`<main><h1>Opens</h1>${[1, 2, 3, 4, 5].map((i) => trigger(i)).join('')}<form onsubmit="return false"><button type="submit" class="send" aria-haspopup="true" aria-controls="m9">Send</button></form><div role="tablist"><button role="tab" class="tab" aria-controls="m8" aria-selected="true">Tab</button></div></main>`));
    }
    if (path === '/fonts/brand') return void res.writeHead(200, { 'content-type': 'font/woff2' }).end(font);
    if (path.startsWith('/fonts')) {
      // A font the page loads but the worker cannot copy: no file extension to name its format.
      return html(res, page(`<main><h1 style="font-family:Arial">Fonts</h1><a class="brand" href="#b" style="display:inline-block;padding:20px 40px;font-family:Brand,serif;font-size:56px;font-weight:700;background:#111;color:#fff;border-radius:8px">Wordmark</a></main>`, `<style>@font-face{font-family:Brand;src:url(/fonts/brand) format('woff2');font-weight:700}</style>`));
    }
    if (path.startsWith('/huge')) return html(res, page(`<main><h1>Huge</h1><article class="card" style="width:480px;height:200px;overflow:hidden;border:1px solid #ddd;border-radius:12px;padding:24px"><h2>Long card</h2><p>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(6500)}</p></article></main>`));
    if (path.startsWith('/media')) return html(res, page(`<main><h1>Media</h1><video src="/media/clip.mp4" autoplay muted></video><audio src="/media/sound.mp3" autoplay></audio><p id="facts"></p></main><script>document.getElementById('facts').textContent=[navigator.userAgent, navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone, matchMedia('(prefers-color-scheme: dark)').matches, devicePixelRatio].join('|')</script>`, `<style>@font-face{font-family:Slow;src:url(/media/slow.woff2) format('woff2')}body{font-family:Slow,sans-serif}</style>`));
    if (path === '/media/slow.woff2') return void setTimeout(() => res.writeHead(200, { 'content-type': 'font/woff2' }).end(font), 600);
    if (path === '/media/sw.js') return void res.writeHead(200, { 'content-type': 'text/javascript' }).end('self.addEventListener("install", () => {});');
    if (path.startsWith('/media/')) return void res.writeHead(200, { 'content-type': 'video/mp4' }).end(Buffer.alloc(10));
    html(res, page('<main><p>Nothing at this address.</p></main>'), 404);
  }).listen(port);
}

function ctxFor(site: string, viewports: ('desktop' | 'mobile')[] = ['desktop', 'mobile']) {
  const dir = mkdtempSync(join(tmpdir(), 'dse-crawlcap-'));
  const url = `http://${host}/${site}/`;
  const ctx = new MemoryRunContext(
    'crawlcapt1',
    { url, include: [], pageCap: 12, viewports, userAgent: UA, allowPrivateHosts: [host], timeoutMs: 600_000, keepIntermediate: true, byo: false },
    new ModelClient({ mode: 'replay', recordingsDir: dir }),
    new LocalStorage(dir, `http://localhost:4402/x`),
    { id: 'crawlcapt1', url, host, status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports },
  );
  return { ctx, dir };
}

const instant = async () => {};
async function run(site: string, through: RunDeps['through'], viewports?: ('desktop' | 'mobile')[]) {
  const { ctx, dir } = ctxFor(site, viewports);
  let captured: CaptureOutput | undefined;
  const outcome = await runPipeline(ctx, { browser, through, sleep: instant, onCapture: (c) => (captured = c) });
  return { outcome, ctx, dir, captured: captured!, doc: ctx.current() as RunDocumentPartial, log: ctx.events.map((e) => e.message) };
}

beforeAll(async () => {
  server = serve();
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
  server?.close();
});

describe('the browser context', () => {
  it('sets the honest user agent, en-US, Boise time, light scheme, scale 2, no service workers, blocks media, and waits for fonts', async () => {
    const rc = await createRunContext(browser, { userAgent: UA, allowPrivateHosts: [host] });
    const p = await rc.context.newPage();
    const load = await loadPage(p, `http://${host}/media/`, new Throttle(0, 2));
    expect(load.ok).toBe(true);
    expect(await p.evaluate(() => document.fonts.status)).toBe('loaded');
    expect((await p.textContent('#facts'))!.split('|')).toEqual([UA, 'en-US', 'America/Boise', 'false', '2']);
    // Blocked registration resolves with nothing and starts no worker.
    expect(await p.evaluate(() => navigator.serviceWorker.register('/media/sw.js').then((reg) => (reg ? 'registered' : 'refused'), () => 'refused'))).toBe('refused');
    expect(rc.context.serviceWorkers()).toHaveLength(0);
    expect(hits).toContain('/media/slow.woff2');
    expect(hits).not.toContain('/media/clip.mp4');
    expect(hits).not.toContain('/media/sound.mp3');
    await rc.close();
  });

  it('crops an element with 8 CSS px of padding at device pixel ratio 2', async () => {
    const rc = await createRunContext(browser, { userAgent: UA, allowPrivateHosts: [host] });
    const p = await rc.context.newPage();
    await p.addInitScript({ content: 'window.__name = function (f) { return f; };' });
    await p.setContent(page('<button id="b" style="position:absolute;left:100px;top:100px;width:120px;height:40px">Go</button>'));
    await p.evaluate(() => document.getElementById('b')!.setAttribute('data-dse-id', 'e1'));
    const png = PNG.sync.read((await cropOf(p, 'e1'))!);
    expect([png.width, png.height]).toEqual([(120 + 2 * CROP_PAD) * 2, (40 + 2 * CROP_PAD) * 2]);
    await rc.close();
  });
});

describe('selectors', () => {
  it('use a unique unhashed id, else the shortest unique tag.class chain, else nth-of-type', async () => {
    const p = await browser.newPage();
    await p.addInitScript({ content: 'window.__name = function (f) { return f; };' });
    await p.setContent(page('<main><button id="save" class="btn">Save</button><div id="css-a8f3k2x"><span class="price">$9</span></div><section><p>One</p><p>Two</p></section></main>'));
    const snap = await p.evaluate(takeSnapshot, { props: ['display'], cap: 100 });
    const d = (pred: (e: (typeof snap.elements)[number]) => boolean) => snap.elements.find(pred)!.d;
    const ids = [d((e) => e.tag === 'button'), d((e) => e.tag === 'span'), d((e) => e.tag === 'p' && e.text === 'Two')];
    const sel = await p.evaluate(buildSelectors, ids);
    expect(sel[ids[0]!]).toBe('#save');
    expect(sel[ids[1]!]).not.toContain('css-a8f3k2x');
    expect(sel[ids[1]!]).toMatch(/span\.price/);
    expect(sel[ids[2]!]).toMatch(/p:nth-of-type\(2\)/);
    for (const id of ids) expect(await p.locator(sel[id]!).count()).toBe(1);
    await p.close();
  });
});

describe('discovery and capture rules', () => {
  it('captures a single-page site as home alone at both viewports, with its crawl and capture lines', async () => {
    const r = await run('single', 'capture');
    expect(r.outcome.status).toBe('complete');
    // Paths are shown under the start URL's prefix, so the start page is `/`.
    expect(r.doc.pages?.map((p) => p.path)).toEqual(['/']);
    expect(Object.keys(r.captured.pages[0]!.viewports).sort()).toEqual(['desktop', 'mobile']);
    expect(r.log.some((m) => /sitemap\.xml · 0 urls · nav \d+ · footer \d+ · body \d+/.test(m))).toBe(true);
    expect(r.log.some((m) => /· \/ · 1440 and 390 · 2 screenshots · [\d,]+ nodes/.test(m))).toBe(true);
    expect(r.log.some((m) => /· \/ · 1440 · hover \d+ · focus \d+ · tab \d+ · active \d+ · open \d+/.test(m))).toBe(true);
  }, 120_000);

  it('closes a consent banner by its close button when it has no accept button', async () => {
    const r = await run('consent', 'capture', ['desktop']);
    expect(r.log.some((m) => /consent dismissed/.test(m))).toBe(true);
    const banner = r.captured.pages[0]!.viewports.desktop!.snapshot.elements.find((e) => e.attrs.id === 'cookie-consent');
    expect(banner).toBeUndefined();
  }, 120_000);

  it('cuts a page taller than 8,000 px, says so, and stores the screenshot at scale 2', async () => {
    const r = await run('tall', 'capture', ['desktop']);
    expect(r.log.some((m) => m.includes(`/ · cut at ${SCREENSHOT_MAX_HEIGHT} px`))).toBe(true);
    const shot = PNG.sync.read(readFileSync(join(r.dir, keys.pageScreenshot('crawlcapt1', r.doc.pages![0]!.id, 'desktop'))));
    expect([shot.width, shot.height]).toEqual([1440 * 2, SCREENSHOT_MAX_HEIGHT * 2]);
  }, 120_000);

  it('opens at most three popups a page, never a submit button or a tab', async () => {
    const r = await run('opens', 'capture', ['desktop']);
    const vc = r.captured.pages[0]!.viewports.desktop!;
    expect(vc.opens.length).toBe(OPEN_CAP);
    const triggers = vc.opens.map((o) => vc.snapshot.byDse.get(o.trigger)!);
    expect(triggers.every((t) => /^trigger-/.test(t.cls[0] ?? ''))).toBe(true);
  }, 120_000);

  it('checks the origin after two failed pages in a row and blocks a site that stopped answering', async () => {
    originDown = true;
    const r = await run('dying', 'capture', ['desktop']).finally(() => (originDown = false));
    expect(r.outcome).toMatchObject({ status: 'blocked', reason: 'unreachable', detail: { reason: 'the site stopped answering' } });
  }, 120_000);

  it('blocks the run as bot when more than half of the selected pages are challenged', async () => {
    const r = await run('challenged', 'capture', ['desktop']);
    expect(r.outcome).toMatchObject({ status: 'blocked', reason: 'bot' });
  }, 120_000);
});

describe('captured previews', () => {
  it('keeps a component whose web font cannot be copied as captured, reason fonts unavailable', async () => {
    const r = await run('fonts', 'previews', ['desktop']);
    const brand = r.doc.components?.find((c) => c.instances.some((i) => /brand/.test(i.selector)));
    expect(brand?.preview).toMatchObject({ mode: 'captured', capturedReason: 'fonts-unavailable' });
  }, 180_000);

  it('keeps a component whose markup is over 300 KB as captured, reason styles too large', async () => {
    const r = await run('huge', 'previews', ['desktop']);
    const card = r.doc.components?.find((c) => c.type === 'card' || c.instances.some((i) => /article|card/.test(i.selector)));
    expect(card?.preview).toMatchObject({ mode: 'captured', capturedReason: 'css-too-large' });
  }, 180_000);
});
