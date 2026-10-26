import type { MetadataRoute } from 'next';
import { getShowcaseContent } from '../lib/showcase';

/** The static pages and the showcase runs; every other run is unlisted (docs/design/pages.md, Indexing). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const content = await getShowcaseContent();
  return [
    ...['', '/how-it-works', '/about', '/privacy', '/terms'].map((p) => ({ url: `${base}${p}` })),
    ...content.entries.map((e) => ({ url: `${base}/r/${e.runId}` })),
  ];
}
