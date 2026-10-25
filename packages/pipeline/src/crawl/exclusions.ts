// URLs that are never page candidates (docs/specs/crawler.md, Exclusions).

const extensions = /\.(pdf|png|jpe?g|gif|svg|webp|zip|mp4|css|js|json|xml|txt)$/i;
const legal = /\/(privacy|terms|legal|cookie|cookies|gdpr|imprint|impressum)\b/i;
const archives = /\/(tag|tags|category|categories|author|page)\//i;
const pagination = /[?&]page=\d/i;
const misc = /\/(wp-json|feed|rss|amp)(\/|$)|\/cdn-cgi\//i;

export function isExcluded(url: URL): boolean {
  const path = url.pathname;
  const full = `${path}${url.search}`;
  return extensions.test(path) || legal.test(path) || archives.test(`${path}/`) || pagination.test(full) || misc.test(path);
}

export function isExcludedHref(href: string): boolean {
  return /^(mailto|tel|javascript|data|blob):/i.test(href.trim());
}
