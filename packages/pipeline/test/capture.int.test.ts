import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { allowedPrivateHosts } from '@dse/schema';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { launchBrowser } from '../src/crawl/browser';
import { ModelClient } from '../src/models/client';
import { runPipeline } from '../src/run';
import { pageGuards, type CaptureOutput, type PageCapture, type ViewportCapture } from '../src/stages/capture';
import { startFixtureServer } from '../../../scripts/fixtures-serve';

const recordingsDir = resolve(import.meta.dirname, '../../../fixtures/recordings');
let browser: Browser;
let server: Awaited<ReturnType<typeof startFixtureServer>> | null = null;

async function runThroughCapture(site: string, through: 'discover' | 'capture' = 'capture') {
  const dir = mkdtempSync(join(tmpdir(), `dse-capture-${site}-`));
  const url = `http://localhost:4100/sites/${site}/`;
  const models = new ModelClient({ mode: 'replay', recordingsDir, strictReplay: true });
  const ctx = new MemoryRunContext(
    'capturetst',
    { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)', allowPrivateHosts: allowedPrivateHosts({ DSE_ALLOW_PRIVATE_HOSTS: 'localhost:4100' }), timeoutMs: 600_000, keepIntermediate: false, byo: false },
    models,
    new LocalStorage(dir),
    { id: 'capturetst', url, host: 'localhost:4100', status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'] },
  );
  let captured: CaptureOutput | null = null;
  const outcome = await runPipeline(ctx, { browser, through, onCapture: (c) => (captured = c) });
  return { outcome, captured: captured as unknown as CaptureOutput, ctx };
}

const page = (c: CaptureOutput, path: string): PageCapture => {
  const p = c.pages.find((x) => x.page.path === path);
  if (!p) throw new Error(`no page ${path}`);
  return p;
};
const byText = (vc: ViewportCapture, tag: string, text: string) => vc.snapshot.elements.find((e) => e.tag === tag && e.text === text && e.vis)!;

beforeAll(async () => {
  try {
    await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) });
  } catch {
    server = await startFixtureServer(4100);
  }
  browser = await launchBrowser();
});

afterAll(async () => {
  await browser?.close();
  server?.close();
});

describe('capture on the clean fixture', () => {
  let clean: Awaited<ReturnType<typeof runThroughCapture>>;
  beforeAll(async () => {
    clean = await runThroughCapture('clean');
  }, 300_000);

  it('captures every selected page at both viewports', () => {
    expect(clean.outcome.status).toBe('complete');
    expect(clean.captured.pages).toHaveLength(9);
    for (const p of clean.captured.pages) {
      expect(p.status, p.page.path).toBe('captured');
      expect(Object.keys(p.viewports).sort()).toEqual(['desktop', 'mobile']);
    }
    const docPages = clean.ctx.document.pages ?? [];
    expect(docPages.every((p) => p.status === 'captured' && p.captures.desktop && p.captures.mobile)).toBe(true);
  });

  it('finds the known element candidates on the home page', () => {
    const vc = page(clean.captured, '/').viewports.desktop!;
    const tags = vc.candidates.map((c) => vc.snapshot.byDse.get(c.dse)!).map((e) => `${e.tag}${e.cls.length ? `.${e.cls[0]}` : ''}`);
    for (const want of ['header.site-header', 'footer.site-footer', 'a.btn', 'button.dropdown-trigger', 'article.card', 'span.tag-new', 'img.avatar']) expect(tags, want).toContain(want);
    // The known shape of the home page: these counts change only if the fixture or the rules do.
    expect(vc.candidates.filter((c) => c.interactive).length).toBe(5);
    expect(vc.candidates.length).toBe(14);
    expect(page(clean.captured, '/').viewports.mobile!.candidates.filter((c) => c.interactive).length).toBe(3);
  });

  it('captures hover, focus and active on the primary button with real style changes', () => {
    const vc = page(clean.captured, '/').viewports.desktop!;
    const btn = vc.snapshot.elements.find((e) => e.tag === 'a' && e.text === 'Start free' && e.cls.includes('btn-primary') && e.y > 200)!;
    const recs = vc.states[btn.d] ?? [];
    const of = (s: string) => recs.find((r) => r.state === s)!;
    expect(of('hover').delta.map((d) => d.property)).toContain('background-color');
    expect(of('focus').delta.map((d) => d.property)).toEqual(expect.arrayContaining(['outline-width', 'outline-style']));
    expect(of('focus').reachedByKeyboard).toBe(true);
    expect(of('active').delta.map((d) => d.property)).toContain('background-color');
    for (const s of ['hover', 'focus', 'active']) expect(of(s).crop?.length, s).toBeGreaterThan(500);
  });

  it('walks the tab order the page defines', () => {
    const vc = page(clean.captured, '/').viewports.desktop!;
    const order = vc.tabOrder.map((d) => vc.snapshot.byDse.get(d)?.text);
    expect(order.slice(0, 10)).toEqual(['Tidewater', 'Product', 'Pricing', 'Docs', 'Contact', 'Resources', 'Sign in', 'Start free', 'Start free', 'See pricing']);
  });

  it('finds the disabled button and the invalid input on the signup page', () => {
    const vc = page(clean.captured, '/signup').viewports.desktop!;
    const disabled = vc.snapshot.elements.find((e) => e.disabled && e.tag === 'button');
    expect(disabled?.text).toBe('Continue with SSO');
    expect(vc.candidates.map((c) => c.dse)).toContain(disabled!.d);
    const invalid = vc.snapshot.elements.find((e) => e.aria['aria-invalid'] === 'true');
    expect(invalid?.tag).toBe('input');
  });

  it('opens the dropdown and captures the revealed menu', () => {
    const vc = page(clean.captured, '/').viewports.desktop!;
    const open = vc.opens.find((o) => vc.snapshot.byDse.get(o.trigger)?.text === 'Resources')!;
    expect(open).toBeDefined();
    const root = open.snapshot.byDse.get(open.revealed)!;
    expect(root.role).toBe('menu');
    expect(open.snapshot.elements.filter((e) => e.role === 'menuitem').map((e) => e.text)).toEqual(['Guides', 'API reference', 'Support']);
    expect(open.triggerDelta.map((d) => d.property)).toContain('background-color');
    expect(Object.keys(open.matched).length).toBeGreaterThan(0);
  });

  it('opens the mobile menu at 390 px', () => {
    const vc = page(clean.captured, '/').viewports.mobile!;
    const open = vc.opens.find((o) => vc.snapshot.byDse.get(o.trigger)?.attrs['aria-label'] === undefined && vc.snapshot.byDse.get(o.trigger)?.aria['aria-label'] === 'Open menu')!;
    expect(open).toBeDefined();
    expect(open.snapshot.byDse.get(open.revealed)!.tag).toBe('nav');
    expect(open.snapshot.elements.filter((e) => e.tag === 'a').map((e) => e.text)).toEqual(['Product', 'Pricing', 'Docs', 'Contact', 'Sign in']);
  });

  it('captures the header scrolled state', () => {
    const vc = page(clean.captured, '/').viewports.desktop!;
    const header = vc.snapshot.elements.find((e) => e.tag === 'header')!;
    const scrolled = (vc.states[header.d] ?? []).find((s) => s.state === 'scrolled');
    expect(scrolled?.delta.map((d) => d.property)).toContain('box-shadow');
  });

  it('records matched CSS for candidates and their descendants', () => {
    const vc = page(clean.captured, '/').viewports.desktop!;
    const btn = byText(vc, 'a', 'See pricing');
    const rules = vc.matched[btn.d]!.rules.map((r) => r.selector);
    expect(rules).toEqual(expect.arrayContaining(['.btn', '.btn-secondary']));
    expect(vc.sheets.media).toEqual(expect.arrayContaining(['(min-width: 1024px)', '(max-width: 640px)']));
    expect(vc.sheets.fonts.some((f) => f.family === 'Inter' && f.status === 'loaded')).toBe(true);
  });

  it('measures motion under reduced motion with the probe', () => {
    const vc = page(clean.captured, '/').viewports.desktop!;
    const btn = vc.snapshot.elements.find((e) => e.tag === 'a' && e.cls.includes('btn-primary'))!;
    expect(vc.motionMain[btn.d]?.transition).toBe(true);
    expect(vc.motionReduced[btn.d]).toEqual({ animation: false, transition: false });
  });
});

describe('capture on the messy fixture', () => {
  let messy: Awaited<ReturnType<typeof runThroughCapture>>;
  beforeAll(async () => {
    messy = await runThroughCapture('messy');
  }, 300_000);

  it('dismisses the consent banner and blocks the tracker', () => {
    expect(messy.ctx.events.some((e) => /consent dismissed · Accept in #cookie-consent/.test(e.message))).toBe(true);
    const vc = page(messy.captured, '/').viewports.desktop!;
    expect(vc.snapshot.elements.some((e) => e.id === 'cookie-consent' && e.vis)).toBe(false);
  });

  it('never submits a form', () => {
    const signup = page(messy.captured, '/signup');
    for (const vc of Object.values(signup.viewports)) {
      expect(vc!.submittedMarkers).toBe(0);
      expect(vc!.submitAttempts).toBe(0);
    }
  });

  it('dismisses the confirm() dialog and logs it', () => {
    const contact = page(messy.captured, '/contact');
    expect(contact.viewports.desktop!.dialogs).toEqual(['confirm: Discard this draft?']);
    expect(messy.ctx.events.some((e) => e.message === 'capture · /contact · 1 dialog dismissed')).toBe(true);
  });

  it('keeps the live-dot animation under reduced motion', () => {
    const vc = page(messy.captured, '/changelog').viewports.desktop!;
    const dot = vc.snapshot.elements.find((e) => e.cls.includes('live-dot'))!;
    const badge = vc.snapshot.elements[dot.p]!;
    expect(dot.style['animation-name']).toBe('pulse');
    expect(vc.motionMain[badge.d]).toEqual({ animation: true, transition: false });
    expect(vc.motionReduced[badge.d]?.animation).toBe(true);
  });

  it('captures the mobile menu', () => {
    const vc = page(messy.captured, '/').viewports.mobile!;
    expect(vc.opens.some((o) => o.snapshot.byDse.get(o.revealed)?.tag === 'nav')).toBe(true);
  });
});

describe('discovery hints', () => {
  it('detects the Tailwind fixture, its dark theme stylesheet, and no dark theme on clean', async () => {
    const tw = await runThroughCapture('tailwind', 'discover');
    expect(tw.ctx.document).toMatchObject({ frameworkHint: 'tailwind', darkThemeDetected: true });
    const cssInJs = await runThroughCapture('css-in-js', 'discover');
    expect(cssInJs.ctx.document).toMatchObject({ frameworkHint: 'css-in-js', darkThemeDetected: false });
  }, 120_000);
});

describe('the page guards', () => {
  it('stop a real submit and leave the marker unset', async () => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.addInitScript({ content: 'window.__name = function (f) { return f; };' });
    await p.addInitScript(pageGuards);
    await p.goto('http://localhost:4100/sites/messy/signup');
    const submits = () => p.evaluate(() => (window as unknown as { __dseSubmits: number }).__dseSubmits);
    const marked = () => p.evaluate(() => document.querySelectorAll('[data-submitted]').length);
    await p.locator('#name').focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(200);
    expect(await marked()).toBe(0);
    const before = await submits();
    await p.evaluate(() => (document.querySelector('[data-form]') as HTMLFormElement).requestSubmit());
    await p.evaluate(() => (document.querySelector('[data-form]') as HTMLFormElement).submit());
    expect(await submits()).toBe(before + 2);
    await p.locator('button[type=submit]').first().click();
    await p.waitForTimeout(200);
    expect(await marked()).toBe(0);
    expect(p.url()).toContain('/sites/messy/signup');
    await ctx.close();
  });
});
