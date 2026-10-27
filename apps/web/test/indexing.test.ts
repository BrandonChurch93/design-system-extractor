import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import committed from '../content/showcase.json';

// docs/design/pages.md, Indexing.

const base = 'https://dse.example';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', `${base}/`);
  vi.stubEnv('STORAGE_PUBLIC_BASE_URL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('indexing', () => {
  it('lists the static pages and the showcase runs in sitemap.xml, and nothing else', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toEqual([
      base,
      `${base}/how-it-works`,
      `${base}/about`,
      `${base}/privacy`,
      `${base}/terms`,
      ...committed.entries.map((e) => `${base}/r/${e.runId}`),
    ]);
    expect(committed.entries.length).toBeGreaterThan(0);
  });

  it('allows everything in robots.txt except /api/ and /catalog, and points at the sitemap', () => {
    expect(robots()).toEqual({ rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/catalog'] }], sitemap: `${base}/sitemap.xml` });
  });
});
