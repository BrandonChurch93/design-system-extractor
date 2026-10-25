// URL normalization and scope (docs/specs/crawler.md).

const tracking = /^(utm_[a-z0-9_]+|fbclid|gclid|ref)$/i;

/** Host without a leading www., lowercase, no port for 80 and 443. */
export function siteHost(url: URL): string {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const port = url.port && url.port !== '80' && url.port !== '443' ? `:${url.port}` : '';
  return `${host}${port}`;
}

export function sameSite(a: URL, b: URL): boolean {
  return siteHost(a) === siteHost(b);
}

/**
 * Resolves `raw` against `base` and normalizes it: lowercase host, fragment and tracking
 * parameters stripped, trailing slash removed except at the root. Returns null when unusable.
 */
export function normalizeUrl(raw: string, base?: string | URL): URL | null {
  let url: URL;
  try {
    url = base ? new URL(raw, base) : new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  for (const key of [...url.searchParams.keys()]) if (tracking.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.replace(/\/+$/, '');
  if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) url.port = '';
  return url;
}

/** A start URL's scope: the host, and the path prefix when the start URL has a path. */
export type Scope = { host: string; prefix: string; origin: string };

export function scopeOf(start: URL): Scope {
  const path = start.pathname.replace(/\/+$/, '');
  return { host: siteHost(start), prefix: path === '' ? '/' : path, origin: start.origin };
}

export function inScope(url: URL, scope: Scope): boolean {
  if (siteHost(url) !== scope.host) return false;
  if (scope.prefix === '/') return true;
  const p = url.pathname.replace(/\/+$/, '');
  return p === scope.prefix || p.startsWith(`${scope.prefix}/`);
}

/** The path a page is shown as: relative to the scope prefix, starting with '/'. */
export function displayPath(url: URL, scope: Scope): string {
  let p = url.pathname.replace(/\/+$/, '') || '/';
  if (scope.prefix !== '/' && (p === scope.prefix || p.startsWith(`${scope.prefix}/`))) p = p.slice(scope.prefix.length) || '/';
  return p + (url.search || '');
}

/** The key that dedupes candidates: query kept only when its path is new (handled by the caller). */
export function dedupeKey(url: URL): string {
  return `${siteHost(url)}${url.pathname}${url.search}`;
}
