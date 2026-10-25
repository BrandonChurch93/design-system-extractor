import { gunzipSync } from 'node:zlib';

export type SitemapDoc = { kind: 'index' | 'urlset'; locs: string[] };

/** Reads a sitemap or sitemap index (gzip supported) into its <loc> values. */
export function parseSitemap(body: Buffer | string): SitemapDoc {
  let text: string;
  if (typeof body === 'string') text = body;
  else text = body[0] === 0x1f && body[1] === 0x8b ? gunzipSync(body).toString('utf8') : body.toString('utf8');
  const kind = /<sitemapindex[\s>]/i.test(text) ? 'index' : 'urlset';
  const locs = [...text.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?\s*<\/loc>/gi)].map((m) => m[1]!.trim().replace(/&amp;/g, '&'));
  return { kind, locs };
}
