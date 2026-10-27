import { createHash } from 'node:crypto';
import type { Page } from 'playwright';
import type { CandidateSource, DiscoverOutput, PageCandidate } from '@dse/schema';
import type { RunContext } from '../context';
import { isBotChallenge, classifyNetworkError } from '../crawl/blocked';
import type { RunBrowserContext } from '../crawl/browser';
import { newPage } from '../crawl/browser';
import { isExcluded, isExcludedHref } from '../crawl/exclusions';
import { guardedFetch } from '../crawl/fetch';
import { pageFacts } from '../crawl/fingerprint';
import { frameworkHint } from '../crawl/framework';
import { loadPage, type LoadResult } from '../crawl/navigate';
import { normalizeUrl, inScope, scopeOf, displayPath, siteHost, type Scope } from '../crawl/normalize';
import { classLists, darkThemeScan, dismissConsent, extractLinks, titleAndH1 } from '../crawl/page-scripts';
import { crawlDelayMs, isAllowed, parseRobots, type Robots } from '../crawl/robots';
import { parseSitemap } from '../crawl/sitemap';
import { type Throttle } from '../crawl/throttle';
import { BlockedError } from '../errors';
import { stableId } from '../ids';
import { checkTarget } from '../net/private-ranges';
import { finalScore, preScore, segmentsOf } from '../select/score';
import { overBudget } from '../budget';

export const CANDIDATE_CAP = 300;
export const FINGERPRINT_CAP = 60;
export const SITEMAP_URL_CAP = 2000;

// The synthetic missing page is one candidate the spec always adds, so a large site keeps it (D-077).
const sourcePriority: CandidateSource[] = ['start', 'include', 'synthetic', 'header', 'nav', 'footer', 'sitemap', 'body'];

export type DiscoverDeps = {
  browser: RunBrowserContext;
  throttle: Throttle;
  sleep?: (ms: number) => Promise<void>;
};

export type DiscoverResult = DiscoverOutput & { robots: Robots | null; startPage: Page };

/** A synthetic missing page that is stable per site, so replays and recordings stay valid. */
export function syntheticNotFoundPath(scope: Scope): string {
  const token = createHash('sha256').update(`dse-404:${scope.host}${scope.prefix}`).digest('hex').slice(0, 10);
  return `${scope.prefix === '/' ? '' : scope.prefix}/${token}-does-not-exist`;
}

function isSoft404(html: string): boolean {
  return /not found|404|does not exist|no longer (here|available)|page is not here/i.test(html.slice(0, 20_000));
}

export async function discover(ctx: RunContext, deps: DiscoverDeps): Promise<DiscoverResult> {
  const { throttle } = deps;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const ua = ctx.config.userAgent;
  const allow = ctx.config.allowPrivateHosts;

  const startCheck = await checkTarget(ctx.config.url, { allow });
  if (!startCheck.ok) throw new BlockedError(startCheck.reason, { reason: startCheck.detail });
  const startUrl = normalizeUrl(startCheck.url.toString())!;
  let scope = scopeOf(startUrl);

  // robots.txt, always at the host root.
  let robots: Robots | null = null;
  const robotsRes = await guardedFetch(`${startUrl.origin}/robots.txt`, { userAgent: ua, allow, throttle, retryDelays: [1000] });
  if (robotsRes.ok && robotsRes.status === 200 && !/html/i.test(robotsRes.contentType)) {
    robots = parseRobots(robotsRes.body.toString('utf8'));
    throttle.setInterval(crawlDelayMs(robots, ua));
    if (!isAllowed(robots, ua, scope.prefix === '/' ? '/' : `${scope.prefix}/`)) {
      throw new BlockedError('robots', { attempts: [], robots: robots.raw.slice(0, 2000) });
    }
  }
  await ctx.emit({ stage: 'discover', message: robots ? `robots.txt read · ${robots.groups.length} groups · ${robots.sitemaps.length} sitemaps listed` : 'no robots.txt' });

  // The start page, with the bot-challenge retries and redirect policy.
  const page = await newPage(deps.browser, 'desktop');
  const attempts: { url: string; status: number; marker?: string; retries: number }[] = [];
  let load: LoadResult | null = null;
  const challengeDelays = [4000, 8000];
  const networkDelays = [1000, 3000, 8000];
  let networkTries = 0;
  for (let i = 0; ; i++) {
    load = await loadPage(page, startUrl.toString(), throttle);
    if (!load.ok) {
      const refused = deps.browser.refused.find((r) => r.reason === 'private-address');
      if (refused) throw new BlockedError('private-address', { reason: `redirected to a private address` });
      if (networkTries < networkDelays.length) {
        await sleep(networkDelays[networkTries++]!);
        i--;
        continue;
      }
      const kind = classifyNetworkError(load.error ?? '');
      throw new BlockedError('unreachable', { reason: kind === 'dns' ? 'the address did not resolve' : kind === 'timeout' ? 'no answer within 20 seconds' : `could not connect (${kind})` });
    }
    const challenge = isBotChallenge(load.status, load.html);
    attempts.push({ url: load.finalUrl, status: load.status, marker: challenge.marker, retries: i });
    if (!challenge.blocked) break;
    if (i >= challengeDelays.length) throw new BlockedError('bot', { attempts });
    await sleep(challengeDelays[i]!);
  }
  if (load.redirects.length > 5) throw new BlockedError('invalid-url', { reason: 'more than 5 redirects' });
  const finalUrl = normalizeUrl(load.finalUrl)!;
  if (siteHost(finalUrl) !== siteHost(startUrl)) throw new BlockedError('invalid-url', { reason: 'redirected off-site' });
  if (finalUrl.host !== startUrl.host) scope = { ...scope, origin: finalUrl.origin };
  const consent = await page.evaluate(dismissConsent).catch(() => null);
  if (consent) {
    await page.waitForTimeout(300);
    await ctx.emit({ stage: 'discover', message: `consent dismissed · ${consent}` });
  }

  const links = await page.evaluate(extractLinks);
  const facts = await page.evaluate(titleAndH1);
  const framework = frameworkHint(await page.evaluate(classLists));
  const dark = await page.evaluate(darkThemeScan);
  let darkThemeDetected = dark.found;
  for (const href of dark.crossOrigin.slice(0, 6)) {
    if (darkThemeDetected) break;
    const r = await guardedFetch(href, { userAgent: ua, allow, throttle, retryDelays: [] });
    if (r.ok && /prefers-color-scheme\s*:\s*dark/.test(r.body.toString('utf8'))) darkThemeDetected = true;
  }
  const hashRouter = links.filter((l) => /^#\//.test(l.href)).length >= 3;

  // Candidates from every source, normalized, scoped, excluded and deduped.
  const found = new Map<string, { url: URL; source: CandidateSource }>();
  const seenPaths = new Set<string>();
  const add = (raw: string, source: CandidateSource, base: URL = finalUrl) => {
    if (isExcludedHref(raw)) return;
    const u = normalizeUrl(raw, base);
    if (!u || !inScope(u, scope) || isExcluded(u)) return;
    if (robots && !isAllowed(robots, ua, `${u.pathname}${u.search}`)) return;
    u.protocol = finalUrl.protocol;
    u.host = finalUrl.host;
    const pathKey = u.pathname;
    // A query is kept only when its path alone has not been seen.
    if (u.search && seenPaths.has(pathKey)) return;
    const key = u.toString();
    seenPaths.add(pathKey);
    const prev = found.get(key);
    if (!prev || sourcePriority.indexOf(source) < sourcePriority.indexOf(prev.source)) found.set(key, { url: u, source });
  };
  add(finalUrl.toString(), 'start');
  for (const inc of ctx.config.include.slice(0, 5)) add(inc, 'include');
  for (const l of links) add(l.href, l.where === 'header' ? 'header' : l.where === 'footer' ? 'footer' : l.where === 'nav' ? 'nav' : 'body');

  // Sitemaps: robots-listed, then the usual names; indexes one level deep.
  let sitemapUrls = 0;
  const sitemapSources = [...(robots?.sitemaps ?? []), `${scope.origin}/sitemap.xml`, `${scope.origin}/sitemap_index.xml`, `${scope.origin}/sitemap-index.xml`];
  const fetchedMaps = new Set<string>();
  const readMap = async (url: string, depth: number) => {
    if (fetchedMaps.has(url) || sitemapUrls >= SITEMAP_URL_CAP) return;
    fetchedMaps.add(url);
    const r = await guardedFetch(url, { userAgent: ua, allow, throttle, retryDelays: [], maxBytes: 10_000_000 });
    if (!r.ok || r.status !== 200) return;
    const doc = parseSitemap(r.body);
    if (doc.kind === 'index') {
      if (depth > 0) return;
      for (const loc of doc.locs.slice(0, 50)) await readMap(loc, depth + 1);
      return;
    }
    for (const loc of doc.locs) {
      if (sitemapUrls >= SITEMAP_URL_CAP) break;
      sitemapUrls++;
      add(loc, 'sitemap');
    }
  };
  for (const s of sitemapSources) await readMap(s, 0);

  // The synthetic missing page.
  const notFoundUrl = new URL(syntheticNotFoundPath(scope), scope.origin);
  found.set(notFoundUrl.toString(), { url: notFoundUrl, source: 'synthetic' });

  const counts: Record<string, number> = {};
  for (const v of found.values()) counts[v.source] = (counts[v.source] ?? 0) + 1;
  await ctx.emit({
    stage: 'discover',
    message: `sitemap.xml · ${sitemapUrls} urls · nav ${(counts.header ?? 0) + (counts.nav ?? 0)} · footer ${counts.footer ?? 0} · body ${counts.body ?? 0}`,
    data: { candidates: found.size, sitemapUrls, sources: counts },
  });

  // Pre-score, cap, fingerprint the top 60.
  let candidates = [...found.values()].map(({ url, source }) => {
    const path = displayPath(url, scope);
    const ps = preScore(path, source);
    return { url, source, path, ps };
  });
  candidates.sort(
    (a, b) =>
      Number(b.ps.mandatory) - Number(a.ps.mandatory) ||
      sourcePriority.indexOf(a.source) - sourcePriority.indexOf(b.source) ||
      a.path.length - b.path.length ||
      a.path.localeCompare(b.path),
  );
  candidates = candidates.slice(0, CANDIDATE_CAP);

  const byPre = [...candidates].sort((a, b) => b.ps.score - a.ps.score || a.path.length - b.path.length || a.path.localeCompare(b.path));
  const toFetch = byPre.slice(0, FINGERPRINT_CAP);
  const fetched = new Map<string, { fingerprint?: string; title: string; h1: string; failed: boolean; status: number; html?: string }>();
  let fetchedCount = 0;
  for (const c of toFetch) {
    if (c.source !== 'start' && overBudget(ctx, 'fingerprints')) break;
    if (c.source === 'start') {
      fetched.set(c.url.toString(), { ...pageFacts(load.html), ...facts, failed: false, status: load.status });
      continue;
    }
    fetchedCount++;
    const r = await guardedFetch(c.url.toString(), { userAgent: ua, allow, throttle, timeoutMs: 8000, retryDelays: [1000] });
    if (!r.ok || !/html/i.test(r.contentType)) {
      fetched.set(c.url.toString(), { title: '', h1: '', failed: true, status: r.ok ? r.status : 0 });
      continue;
    }
    const html = r.body.toString('utf8');
    const pf = pageFacts(html);
    const failed = c.source === 'synthetic' ? !(r.status === 404 || isSoft404(html)) : r.status >= 400;
    fetched.set(c.url.toString(), { ...pf, failed, status: r.status });
  }
  const wanted = toFetch.filter((c) => c.source !== 'start').length;
  if (fetchedCount < wanted) await ctx.emit({ stage: 'discover', level: 'warn', message: `fingerprints · ${fetchedCount} of ${wanted} fetched in the time budget · the rest grouped by path` });
  // A synthetic page that answers like a real page is dropped (docs/specs/crawler.md, step 6).
  candidates = candidates.filter((c) => c.source !== 'synthetic' || fetched.get(c.url.toString())?.failed === false);

  // Template groups: by fingerprint among fetched pages, and by path pattern for the rest.
  const parent = new Map<string, string>();
  const findRoot = (k: string): string => {
    const p = parent.get(k) ?? k;
    if (p === k) return k;
    const r = findRoot(p);
    parent.set(k, r);
    return r;
  };
  const union = (a: string, b: string) => parent.set(findRoot(a), findRoot(b));
  const byPrint = new Map<string, string>();
  for (const c of candidates) {
    const f = fetched.get(c.url.toString());
    if (!f?.fingerprint || f.failed || c.source === 'start' || c.source === 'synthetic' || c.source === 'include') continue;
    const k = c.url.toString();
    const other = byPrint.get(f.fingerprint);
    if (other) union(k, other);
    else byPrint.set(f.fingerprint, k);
  }
  const patternKey = (path: string): string | null => {
    const s = segmentsOf(path);
    if (s.length >= 2 && /^(docs|documentation|developers|api|reference|guides)$/i.test(s[0]!)) return `docs:${s[0]}`;
    if (s.length === 2 && /^(blog|news|articles|journal)$/i.test(s[0]!)) return `blog:${s[0]}`;
    if (s.length === 2 && /^products$/i.test(s[0]!)) return 'products';
    return null;
  };
  const patterns = new Map<string, string[]>();
  for (const c of candidates) {
    if (c.ps.mandatory || c.source === 'synthetic') continue;
    const k = patternKey(c.path);
    if (k) patterns.set(k, [...(patterns.get(k) ?? []), c.url.toString()]);
  }
  for (const [k, members] of patterns) {
    if (k.startsWith('blog') && members.length < 10) continue;
    for (const m of members.slice(1)) union(m, members[0]!);
  }
  const groups = new Map<string, string[]>();
  for (const c of candidates) {
    const r = findRoot(c.url.toString());
    groups.set(r, [...(groups.get(r) ?? []), c.url.toString()]);
  }

  const out: PageCandidate[] = [];
  for (const members of groups.values()) {
    const scored = members.map((m) => {
      const c = candidates.find((x) => x.url.toString() === m)!;
      const f = fetched.get(m);
      const size = members.length > 1 ? members.length : undefined;
      return { c, f, score: finalScore(c.ps.score, { templateSize: size, fetchFailed: Boolean(f?.failed) && c.source !== 'synthetic' }) };
    });
    scored.sort((a, b) => b.score - a.score || segmentsOf(b.c.path).length - segmentsOf(a.c.path).length || a.c.path.localeCompare(b.c.path));
    const rep = scored[0]!;
    const groupName = members.length > 1 ? (segmentsOf(rep.c.path)[0] ?? 'page') : undefined;
    out.push({
      id: stableId(rep.c.url.toString()),
      url: rep.c.url.toString(),
      path: rep.c.path,
      source: rep.c.source,
      depth: segmentsOf(rep.c.path).length,
      preScore: rep.c.ps.score,
      finalScore: rep.score,
      reason: groupName && !rep.c.ps.matchedRow ? 'template' : rep.c.ps.reason,
      mandatory: rep.c.ps.mandatory,
      templateGroup: groupName,
      templateSize: members.length > 1 ? members.length : undefined,
      fingerprint: rep.f?.fingerprint,
      fetchFailed: Boolean(rep.f?.failed) && rep.c.source !== 'synthetic',
      title: rep.f?.title ?? '',
      h1: rep.f?.h1 ?? '',
    });
  }
  out.sort((a, b) => Number(b.mandatory) - Number(a.mandatory) || b.finalScore - a.finalScore || a.path.length - b.path.length || a.path.localeCompare(b.path));
  const folded = [...groups.values()].filter((g) => g.length > 1);
  if (folded.length) {
    await ctx.emit({
      stage: 'discover',
      message: `${folded.length} template${folded.length > 1 ? 's' : ''} found (${folded.map((g) => `${segmentsOf(candidates.find((c) => c.url.toString() === g[0])!.path)[0] ?? 'page'} ×${g.length}`).join(', ')})`,
    });
  }

  return {
    startUrl: finalUrl.toString(),
    scopePrefix: scope.prefix,
    host: scope.host,
    candidates: out,
    frameworkHint: framework,
    darkThemeDetected,
    sitemapUrls,
    hashRouter,
    robots,
    startPage: page,
  };
}
