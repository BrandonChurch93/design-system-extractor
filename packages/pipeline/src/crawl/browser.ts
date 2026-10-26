import { chromium, type Browser, type BrowserContext, type Page, type Route } from 'playwright';
import type { Viewport } from '@dse/schema';
import { viewportSize } from '@dse/schema';
import { createRequestGuard, type Resolver } from '../net/private-ranges';
import { isTracker } from './blocklist';

// Browser setup shared by discover and capture (docs/specs/crawler.md, Browser).

export async function launchBrowser(opts: { executablePath?: string } = {}): Promise<Browser> {
  return chromium.launch({
    headless: true,
    executablePath: opts.executablePath,
    args: ['--disable-dev-shm-usage', '--no-first-run', '--disable-extensions', '--disable-background-networking', '--disable-sync', '--mute-audio', '--hide-scrollbars'],
  });
}

export type ContextOptions = {
  userAgent: string;
  allowPrivateHosts: string[];
  resolver?: Resolver;
};

export type RunBrowserContext = {
  context: BrowserContext;
  /** Requests the guard refused, newest last, for blocked-state classification. */
  refused: { url: string; reason: 'private-address' | 'tracker' | 'media' }[];
  /** Set when the context belongs to someone else (`--cdp`): the guard and scripts go on each page. */
  preparePage?: (page: Page) => Promise<void>;
  close(): Promise<void>;
};

const nameShim = 'window.__name = window.__name || function (f) { return f; };';

function guardHandler(opts: ContextOptions, refused: RunBrowserContext['refused']) {
  const guard = createRequestGuard({ allow: opts.allowPrivateHosts, resolver: opts.resolver });
  return async (route: Route) => {
    const req = route.request();
    const url = req.url();
    const type = req.resourceType();
    if (type === 'media') {
      refused.push({ url, reason: 'media' });
      return route.abort('blockedbyclient');
    }
    if (type === 'script' && isTracker(url)) {
      refused.push({ url, reason: 'tracker' });
      return route.abort('blockedbyclient');
    }
    if (!(await guard(url))) {
      refused.push({ url, reason: 'private-address' });
      return route.abort('blockedbyclient');
    }
    return route.continue();
  };
}

/** One context per run: honest user agent, light scheme, DPR 2, no service workers, guarded requests. */
export async function createRunContext(browser: Browser, opts: ContextOptions): Promise<RunBrowserContext> {
  const context = await browser.newContext({
    userAgent: opts.userAgent,
    locale: 'en-US',
    timezoneId: 'America/Boise',
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    deviceScaleFactor: 2,
    viewport: viewportSize.desktop,
    javaScriptEnabled: true,
    bypassCSP: false,
    serviceWorkers: 'block',
    acceptDownloads: false,
  });
  // Bundlers that keep function names wrap evaluated functions in __name(); define it in the page.
  await context.addInitScript({ content: nameShim });
  const refused: RunBrowserContext['refused'] = [];
  await context.route('**/*', guardHandler(opts, refused));
  return { context, refused, close: () => context.close() };
}

/**
 * The CLI's `--cdp` path: new tabs in a browser the user is running, so the crawl sees whatever the
 * user is signed in to. The guard and scripts go on each tab, never on the user's other tabs, and the
 * user's browser is left open (docs/specs/exports-and-mcp.md, The CLI).
 */
export function adoptContext(context: BrowserContext, opts: ContextOptions): RunBrowserContext {
  const refused: RunBrowserContext['refused'] = [];
  const handler = guardHandler(opts, refused);
  const opened: Page[] = [];
  return {
    context,
    refused,
    preparePage: async (page) => {
      opened.push(page);
      await page.addInitScript({ content: nameShim });
      await page.route('**/*', handler);
    },
    close: async () => {
      await Promise.all(opened.map((p) => p.close().catch(() => {})));
    },
  };
}

export async function newPage(rc: RunBrowserContext, viewport: Viewport): Promise<Page> {
  const page = await rc.context.newPage();
  await rc.preparePage?.(page);
  await page.setViewportSize(viewportSize[viewport]);
  page.setDefaultTimeout(20_000);
  return page;
}
