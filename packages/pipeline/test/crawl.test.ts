import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { classifyNetworkError, isBotChallenge, isLoginWalled, looksLikeLoginPage } from '../src/crawl/blocked';
import { isTracker } from '../src/crawl/blocklist';
import { isExcluded, isExcludedHref } from '../src/crawl/exclusions';
import { pageFacts } from '../src/crawl/fingerprint';
import { frameworkHint } from '../src/crawl/framework';
import { displayPath, inScope, normalizeUrl, scopeOf, siteHost } from '../src/crawl/normalize';
import { crawlDelayMs, isAllowed, parseRobots } from '../src/crawl/robots';
import { parseSitemap } from '../src/crawl/sitemap';
import { Throttle } from '../src/crawl/throttle';
import { syntheticNotFoundPath } from '../src/stages/discover';

const body = (f: string) => readFileSync(resolve(import.meta.dirname, 'fixtures/blocked', f), 'utf8');

describe('normalization and scope', () => {
  it('strips fragments, tracking parameters and trailing slashes, lowercases the host', () => {
    expect(normalizeUrl('HTTPS://Tidewater.App/Pricing/?utm_source=x&plan=pro#faq')!.toString()).toBe('https://tidewater.app/Pricing?plan=pro');
    expect(normalizeUrl('https://tidewater.app/?fbclid=1&gclid=2&ref=hn')!.toString()).toBe('https://tidewater.app/');
    expect(normalizeUrl('https://tidewater.app:443/docs/')!.toString()).toBe('https://tidewater.app/docs');
    expect(normalizeUrl('../blog', 'https://tidewater.app/docs/intro')!.toString()).toBe('https://tidewater.app/blog');
    expect(normalizeUrl('mailto:hi@tidewater.app')).toBeNull();
  });

  it('treats www and the bare host as one site', () => {
    expect(siteHost(new URL('https://www.tidewater.app'))).toBe(siteHost(new URL('https://tidewater.app')));
    expect(siteHost(new URL('http://localhost:4100/x'))).toBe('localhost:4100');
  });

  it('scopes a start URL with a path to that prefix', () => {
    const scope = scopeOf(new URL('http://localhost:4100/sites/clean/'));
    expect(scope.prefix).toBe('/sites/clean');
    expect(inScope(new URL('http://localhost:4100/sites/clean/pricing'), scope)).toBe(true);
    expect(inScope(new URL('http://localhost:4100/sites/clean'), scope)).toBe(true);
    expect(inScope(new URL('http://localhost:4100/sites/cleaner'), scope)).toBe(false);
    expect(inScope(new URL('http://localhost:4100/sites/messy/'), scope)).toBe(false);
    expect(displayPath(new URL('http://localhost:4100/sites/clean/docs/intro'), scope)).toBe('/docs/intro');
    expect(displayPath(new URL('http://localhost:4100/sites/clean'), scope)).toBe('/');
  });

  it('gives a site a stable synthetic missing page inside its scope', () => {
    const scope = scopeOf(new URL('http://localhost:4100/sites/clean/'));
    expect(syntheticNotFoundPath(scope)).toMatch(/^\/sites\/clean\/[0-9a-f]{10}-does-not-exist$/);
    expect(syntheticNotFoundPath(scope)).toBe(syntheticNotFoundPath(scope));
    expect(syntheticNotFoundPath(scopeOf(new URL('https://tidewater.app/')))).toMatch(/^\/[0-9a-f]{10}-does-not-exist$/);
  });
});

describe('exclusions', () => {
  const excluded = ['/terms', '/terms-of-art', '/privacy-first-analytics', '/legal/privacy', '/cookies', '/imprint', '/tag/design/', '/category/news/', '/author/sam/', '/page/2/', '/blog?page=3', '/wp-json/v2', '/feed', '/rss', '/amp', '/cdn-cgi/l/email', '/brochure.pdf', '/logo.svg', '/data.json', '/sitemap.xml'];
  const kept = ['/', '/pricing', '/docs/legalese', '/blog/the-feed-we-built', '/pages', '/pagination-guide'];
  it('drops legal pages, archives, pagination and files', () => {
    for (const p of excluded) expect(isExcluded(new URL(`https://t.app${p}`)), p).toBe(true);
  });
  it('keeps ordinary pages', () => {
    for (const p of kept) expect(isExcluded(new URL(`https://t.app${p}`)), p).toBe(false);
  });
  it('drops non-page link schemes', () => {
    for (const h of ['mailto:a@b.c', 'tel:+1', 'javascript:void(0)']) expect(isExcludedHref(h)).toBe(true);
    expect(isExcludedHref('/pricing')).toBe(false);
  });
});

describe('robots.txt', () => {
  const robots = parseRobots(`# comment
User-agent: *
Disallow: /admin
Allow: /admin/public
Disallow: /*.pdf$
Crawl-delay: 2

User-agent: DesignSystemExtractorBot
User-agent: OtherBot
Disallow: /private
Crawl-delay: 9

Sitemap: https://t.app/sitemap.xml
Sitemap: https://t.app/blog-sitemap.xml`);
  const ua = 'DesignSystemExtractorBot/1.0 (+https://dse.app/how-it-works)';

  it('applies our own group over the wildcard group', () => {
    expect(isAllowed(robots, ua, '/private/x')).toBe(false);
    expect(isAllowed(robots, ua, '/admin')).toBe(true);
    expect(isAllowed(robots, 'SomeoneElse/2.0', '/admin')).toBe(false);
  });

  it('lets the longest rule win and supports wildcards and anchors', () => {
    expect(isAllowed(robots, 'SomeoneElse/2.0', '/admin/public/page')).toBe(true);
    expect(isAllowed(robots, 'SomeoneElse/2.0', '/files/report.pdf')).toBe(false);
    expect(isAllowed(robots, 'SomeoneElse/2.0', '/files/report.pdf?x=1')).toBe(true);
  });

  it('reads sitemaps and caps the crawl delay between 800 ms and 5 s', () => {
    expect(robots.sitemaps).toEqual(['https://t.app/sitemap.xml', 'https://t.app/blog-sitemap.xml']);
    expect(crawlDelayMs(robots, ua)).toBe(5000);
    expect(crawlDelayMs(robots, 'SomeoneElse')).toBe(2000);
    expect(crawlDelayMs(parseRobots('User-agent: *\nDisallow:'), ua)).toBe(800);
  });

  it('treats an empty Disallow as allowing everything and a root Disallow as blocking', () => {
    expect(isAllowed(parseRobots('User-agent: *\nDisallow:'), ua, '/')).toBe(true);
    expect(isAllowed(parseRobots('User-agent: *\nDisallow: /'), ua, '/')).toBe(false);
  });
});

describe('sitemaps', () => {
  it('reads url sets and indexes, gzip included', () => {
    const set = '<?xml version="1.0"?><urlset><url><loc>https://t.app/</loc></url><url><loc> https://t.app/a?x=1&amp;y=2 </loc></url></urlset>';
    expect(parseSitemap(set)).toEqual({ kind: 'urlset', locs: ['https://t.app/', 'https://t.app/a?x=1&y=2'] });
    const index = '<sitemapindex><sitemap><loc><![CDATA[https://t.app/s1.xml]]></loc></sitemap></sitemapindex>';
    expect(parseSitemap(gzipSync(index))).toEqual({ kind: 'index', locs: ['https://t.app/s1.xml'] });
  });
});

describe('template fingerprints', () => {
  const post = (title: string, id: string) =>
    `<html><head><title>${title}</title></head><body><header class="top"><nav class="nav"><a>x</a></nav></header><main class="post post-${id} css-${id}a1b2c"><h1>${title}</h1><p>Body</p></main></body></html>`;
  it('matches pages built from one template and reads title and h1', () => {
    const a = pageFacts(post('First post', '12'));
    const b = pageFacts(post('Second post', '98'));
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.title).toBe('First post');
    expect(a.h1).toBe('First post');
  });
  it('separates pages with different structure', () => {
    const other = '<html><body><header class="top"><nav class="nav"><a>x</a></nav></header><main class="post"><form><input></form></main></body></html>';
    expect(pageFacts(other).fingerprint).not.toBe(pageFacts(post('x', '1')).fingerprint);
  });
});

describe('blocked-state classification on recorded bodies', () => {
  it('recognizes Cloudflare, DataDome and access-denied challenges', () => {
    expect(isBotChallenge(403, body('cloudflare-403.html'))).toEqual({ blocked: true, marker: 'challenge-platform' });
    expect(isBotChallenge(403, body('datadome-403.html'))).toMatchObject({ blocked: true, marker: 'captcha' });
    expect(isBotChallenge(200, body('access-denied-200.html'))).toEqual({ blocked: true, marker: 'access denied' });
    expect(isBotChallenge(503, body('cloudflare-403.html')).blocked).toBe(true);
  });
  it('does not call an ordinary error or a long page that mentions a captcha a challenge', () => {
    expect(isBotChallenge(403, body('ordinary-403.html')).blocked).toBe(false);
    expect(isBotChallenge(200, body('big-200-with-word.html')).blocked).toBe(false);
    expect(isBotChallenge(404, body('cloudflare-403.html')).blocked).toBe(false);
  });
  it('recognizes a login wall by URL or by a lone password form', () => {
    expect(looksLikeLoginPage({ formCount: 1, hasPassword: true, textLength: 120 })).toBe(true);
    expect(looksLikeLoginPage({ formCount: 1, hasPassword: true, textLength: 4000 })).toBe(false);
    expect(looksLikeLoginPage({ formCount: 2, hasPassword: true, textLength: 100 })).toBe(false);
    const walled = Array.from({ length: 5 }, () => ({ finalUrl: 'https://t.app/users/sign_in?next=/x', looksLikeLogin: false }));
    expect(isLoginWalled(walled)).toBe(true);
    expect(isLoginWalled([...walled.slice(0, 4), { finalUrl: 'https://t.app/pricing', looksLikeLogin: false }])).toBe(false);
    expect(isLoginWalled([{ finalUrl: 'https://t.app/', looksLikeLogin: true }])).toBe(true);
  });
  it('classifies network failures for the unreachable detail', () => {
    expect(classifyNetworkError('getaddrinfo ENOTFOUND nowhere.example')).toBe('dns');
    expect(classifyNetworkError('net::ERR_NAME_NOT_RESOLVED')).toBe('dns');
    expect(classifyNetworkError('connect ECONNREFUSED 1.2.3.4:443')).toBe('refused');
    expect(classifyNetworkError('net::ERR_CERT_AUTHORITY_INVALID')).toBe('tls');
    expect(classifyNetworkError('Timeout 20000ms exceeded')).toBe('timeout');
  });
});

describe('framework hints and trackers', () => {
  const lists = (cls: string[], n: number) => Array.from({ length: n }, () => cls);
  it('detects Tailwind, Bootstrap, MUI, Chakra and CSS-in-JS', () => {
    expect(frameworkHint(lists(['flex', 'px-4', 'bg-blue-600'], 20))).toBe('tailwind');
    expect(frameworkHint(lists(['flex'], 19))).toBeUndefined();
    expect(frameworkHint(lists(['btn', 'btn-primary'], 20))).toBe('bootstrap');
    expect(frameworkHint([['MuiButton-root'], ['x']])).toBe('mui');
    expect(frameworkHint([['chakra-button']])).toBe('chakra');
    expect(frameworkHint([['css-1a2b3c4'], ['sc-AxjAm', 'a1b2c3d4e5'], ['nav']])).toBe('css-in-js');
    expect(frameworkHint([['nav', 'card']])).toBeUndefined();
  });
  it('blocks known tracker scripts only', () => {
    expect(isTracker('https://www.googletagmanager.com/gtag/js?id=G-1')).toBe(true);
    expect(isTracker('https://static.hotjar.com/c/hotjar-1.js')).toBe(true);
    expect(isTracker('https://snap.licdn.com/li.lms-analytics/insight.min.js')).toBe(true);
    expect(isTracker('https://cdn.jsdelivr.net/npm/react@18/umd/react.js')).toBe(false);
    expect(isTracker('https://tidewater.app/app.js')).toBe(false);
  });
});

describe('politeness', () => {
  it('keeps 800 ms between starts on one host and at most two requests in flight', async () => {
    let now = 0;
    const starts: { host: string; at: number }[] = [];
    let inFlight = 0;
    let peak = 0;
    const throttle = new Throttle(800, 2, () => now, async (ms) => {
      now += ms;
    });
    const task = (host: string) =>
      throttle.run(host, async () => {
        starts.push({ host, at: now });
        inFlight++;
        peak = Math.max(peak, inFlight);
        await Promise.resolve();
        inFlight--;
      });
    await Promise.all([task('a.com'), task('a.com'), task('a.com'), task('b.com'), task('a.com')]);
    const a = starts.filter((s) => s.host === 'a.com').map((s) => s.at);
    for (let i = 1; i < a.length; i++) expect(a[i]! - a[i - 1]!).toBeGreaterThanOrEqual(800);
    expect(peak).toBeLessThanOrEqual(2);
  });
});
