import type { Page, Response } from 'playwright';
import type { Throttle } from './throttle';

export type LoadResult = {
  ok: boolean;
  status: number;
  finalUrl: string;
  redirects: string[];
  html: string;
  error?: string;
};

function chainOf(res: Response | null): string[] {
  const out: string[] = [];
  let req = res?.request().redirectedFrom() ?? null;
  while (req) {
    out.unshift(req.url());
    req = req.redirectedFrom();
  }
  return out;
}

/**
 * Navigates politely (docs/specs/crawler.md, Timeouts): domcontentloaded within 20 s, network idle
 * capped at 5 s, fonts ready, then a 500 ms settle.
 */
export async function loadPage(page: Page, url: string, throttle: Throttle): Promise<LoadResult> {
  const host = new URL(url).host;
  let res: Response | null = null;
  try {
    res = await throttle.run(host, () => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 }));
  } catch (e) {
    return { ok: false, status: 0, finalUrl: url, redirects: [], html: '', error: (e as Error).message.split('\n')[0] };
  }
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => true);
  await page.waitForTimeout(500);
  let html = '';
  try {
    html = (await res?.text()) ?? '';
  } catch {
    html = await page.content().catch(() => '');
  }
  return { ok: Boolean(res), status: res?.status() ?? 0, finalUrl: page.url(), redirects: chainOf(res), html };
}
