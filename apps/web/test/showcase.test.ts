import { createServer, type Server } from 'node:http';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ShowcaseContent } from '@dse/schema';
import { Showcase } from '../components/home/Showcase';
import committed from '../content/showcase.json';
import { getShowcaseContent, SHOWCASE_REVALIDATE_S } from '../lib/showcase';

// The home page's showcase: the stored object when it is there and valid, else the committed file (D-020).

let body: string | null = null;
let server: Server;
const base = 'http://localhost:4413/dse';

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/dse/showcase/showcase.json' && body !== null) return void res.writeHead(200, { 'content-type': 'application/json' }).end(body);
    res.writeHead(404).end();
  });
  await new Promise<void>((ok) => server.listen(4413, ok));
});

afterAll(() => {
  server.close();
});

describe('the showcase content read path', () => {
  it('reads the stored object when it is valid', async () => {
    const stored = { generatedAt: '2026-11-01T00:00:00.000Z', appUrl: 'https://design-system-extractor.vercel.app', entries: [] };
    body = JSON.stringify(stored);
    expect(await getShowcaseContent(base)).toEqual(stored);
  });

  it('falls back to the committed file when the object is absent, invalid or storage is unreachable', async () => {
    body = null;
    expect(await getShowcaseContent(base)).toEqual(committed);
    body = '{"entries": "nope"}';
    expect(await getShowcaseContent(base)).toEqual(committed);
    expect(await getShowcaseContent('http://localhost:9/nothing')).toEqual(committed);
    expect(await getShowcaseContent(undefined)).toEqual(committed);
  });

  it('commits six entries from the fixture seed', () => {
    expect(committed.entries.map((e) => e.runId)).toEqual(['seedclean0', 'seedmessy0', 'seedtailw0', 'seedcssin0', 'seedlibra0', 'seedmafter']);
  });
});

describe('the home showcase (docs/specs/showcase.md)', () => {
  it('revalidates the stored content every 3600 s', async () => {
    expect(SHOWCASE_REVALIDATE_S).toBe(3600);
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit & { next?: { revalidate?: number } }) => new Response('{}', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      await getShowcaseContent('https://storage.example/dse');
    } finally {
      vi.unstubAllGlobals();
    }
    expect(fetchMock.mock.calls[0]![0]).toBe('https://storage.example/dse/showcase/showcase.json');
    expect(fetchMock.mock.calls[0]![1].next).toEqual({ revalidate: 3600 });
  });

  it('leaves a category out of the chips when none of its cards made it into the content', () => {
    const chips = (entries: ShowcaseContent['entries']) =>
      [...renderToStaticMarkup(createElement(Showcase, { entries })).matchAll(/role="radio"[^>]*><span>([^<]+)</g)].map((m) => m[1]);
    const all = ShowcaseContent.parse(committed).entries;
    expect(chips(all)).toEqual(['All', 'SaaS', 'Developer tools', 'Finance']);
    expect(chips(all.filter((e) => e.category !== 'Finance'))).toEqual(['All', 'SaaS', 'Developer tools']);
  });
});
