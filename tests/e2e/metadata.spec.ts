import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { RunResponse } from '@dse/schema';

// Every route's title, description, link preview and indexing, read against copy.md (Page metadata,
// Global) and pages.md (Indexing, Page metadata). D-065.

const copy = readFileSync(resolve(import.meta.dirname, '../../docs/design/copy.md'), 'utf8');
/** The backticked strings of the copy.md line that starts with `- {label}:`. */
const line = (label: string) => {
  const l = copy.split('\n').find((x) => x.startsWith(`- ${label}:`));
  if (!l) throw new Error(`copy.md has no line for ${label}`);
  return [...l.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
};
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k]));
const [suffixPattern, homeTitle] = line('Meta title pattern');
const suffix = suffixPattern!.replace('{page}', '');
const [globalDescription] = line('Meta description');
const appNotFoundBody = line('App 404')[1]!;

type Expect = { path: string; title: string; description: string; index: boolean; image: 'home' | string };

async function run(request: APIRequestContext, id: string) {
  return RunResponse.parse(await (await request.get(`/api/runs/${id}`)).json());
}

async function read(page: Page) {
  const attr = (sel: string) => page.evaluate((q) => document.head.querySelector(q)?.getAttribute('content') ?? null, sel);
  return {
    title: await page.title(),
    description: await attr('meta[name="description"]'),
    ogTitle: await attr('meta[property="og:title"]'),
    ogDescription: await attr('meta[property="og:description"]'),
    ogSite: await attr('meta[property="og:site_name"]'),
    ogImage: await attr('meta[property="og:image"]'),
    twitterCard: await attr('meta[name="twitter:card"]'),
    twitterImage: await attr('meta[name="twitter:image"]'),
    robots: await attr('meta[name="robots"]'),
  };
}

test('every route carries the title, description, preview and indexing from the copy', async ({ page, request }) => {
  const clean = await run(request, 'seedclean0');
  const messy = await run(request, 'seedmessy0');
  const progress = await run(request, 'seedprog02');
  const d = clean.document;
  const component = d.components![0]!;
  const [runTitle, runDescription] = line('Run');
  const [componentTitle, componentDescription] = line('Component');
  const [compareOne, , compareDescription] = line('Compare');
  const states = line('State pages');
  const page1 = (label: string) => line(label);
  const [runsPaused, runLimit, couldNotCrawl, loginWall, stateDescription] = states;
  const fixed = (label: string, path: string, index: boolean): Expect => {
    const [t, desc] = page1(label);
    return { path, title: `${t}${suffix}`, description: desc!, index, image: 'home' };
  };

  const expected: Expect[] = [
    { path: '/', title: homeTitle!, description: globalDescription!, index: true, image: 'home' },
    {
      path: '/r/seedclean0',
      title: `${fill(runTitle!, { host: d.host! })}${suffix}`,
      description: fill(runDescription!, { colors: d.tokens!.colors.length, typeStyles: d.tokens!.type.length, components: d.components!.length, host: d.host! }),
      index: true,
      image: '/api/runs/seedclean0/og',
    },
    { path: '/r/seedprog02', title: `${fill(runTitle!, { host: progress.document.host! })}${suffix}`, description: globalDescription!, index: false, image: '/api/runs/seedprog02/og' },
    {
      path: `/r/seedclean0/c/${component.id}`,
      title: `${fill(componentTitle!, { name: component.name, host: d.host! })}${suffix}`,
      description: fill(componentDescription!, { name: component.name, host: d.host! }),
      index: false,
      image: '/api/runs/seedclean0/og',
    },
    { path: '/compare?a=seedmessy0&b=seedmafter', title: `${fill(compareOne!, { hostA: messy.document.host! })}${suffix}`, description: compareDescription!, index: false, image: 'home' },
    fixed('Recent runs', '/recent', false),
    fixed('How it works', '/how-it-works', true),
    fixed('Open a local run', '/open', false),
    fixed('Catalog', '/catalog', false),
    ...(['About', 'Privacy', 'Terms'] as const).map((label) => {
      const l = line('About');
      const i = ['About', 'Privacy', 'Terms'].indexOf(label);
      return { path: `/${label.toLowerCase()}`, title: `${l[i * 2]}${suffix}`, description: l[i * 2 + 1]!, index: true, image: 'home' } as Expect;
    }),
    ...(
      [
        ['budget', runsPaused],
        ['busy', runsPaused],
        ['visitor-cap', runLimit],
        ['bot', couldNotCrawl],
        ['robots', couldNotCrawl],
        ['unreachable', couldNotCrawl],
        ['invalid', couldNotCrawl],
        ['login', loginWall],
      ] as const
    ).map(([r, t]) => ({ path: `/state/${r}`, title: `${t}${suffix}`, description: stateDescription!, index: false, image: 'home' })),
    { path: '/no-such-page', title: `Not found${suffix}`, description: appNotFoundBody, index: false, image: 'home' },
  ];

  for (const e of expected) {
    await page.goto(e.path);
    const m = await read(page);
    const where = `${e.path}: `;
    expect(m.title, where).toBe(e.title);
    expect(m.description, where).toBe(e.description);
    expect(m.ogTitle, where).toBe(e.title);
    expect(m.ogDescription, where).toBe(e.description);
    expect(m.ogSite, where).toBe('Design System Extractor');
    expect(m.twitterCard, where).toBe('summary_large_image');
    if (e.image === 'home') expect(m.ogImage, where).toMatch(/\/opengraph-image(\?|$|-)/);
    else expect(new URL(m.ogImage!).pathname, where).toBe(e.image);
    expect(m.twitterImage, where).toBe(m.ogImage);
    if (e.index) expect(m.robots ?? '', where).not.toMatch(/noindex/);
    else expect(m.robots, where).toMatch(/noindex/);
  }
});

test('the preview images answer as images at 1200 × 630', async ({ page, request }) => {
  await page.goto('/about');
  for (const src of [await page.evaluate(() => document.head.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? ''), '/api/runs/seedclean0/og']) {
    const res = await request.get(new URL(src!, 'http://localhost').pathname + new URL(src!, 'http://localhost').search);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('image/png');
    const png = await res.body();
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  }
});
