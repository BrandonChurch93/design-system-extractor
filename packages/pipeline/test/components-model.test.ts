import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import type { RunConfig, Tokens } from '@dse/schema';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { classify } from '../src/components/classify';
import { clusterItems } from '../src/components/cluster';
import { downscale } from '../src/components/crop';
import { itemsFrom } from '../src/components/items';
import { IMAGE_BELOW_CONFIDENCE, nameComponents, resolveCollisions, type Draft } from '../src/components/model';
import { ModelClient, type ContentBlock, type ModelClientOptions } from '../src/models/client';
import { components } from '../src/stages/components';
import { fakeCapture } from './helpers/capture';
import { snap, type El } from './helpers/snap';

const config: RunConfig = { url: 'https://t.app/', include: [], pageCap: 12, viewports: ['desktop'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [], timeoutMs: 60_000, keepIntermediate: false, byo: false };
const usage = { input_tokens: 2000, output_tokens: 300, cache_creation_input_tokens: 0, cache_read_input_tokens: 1200 };

function ctxWith(opts: Partial<ModelClientOptions>) {
  const dir = mkdtempSync(join(tmpdir(), 'dse-comp-'));
  return new MemoryRunContext('abc123def4', config, new ModelClient({ mode: 'live', recordingsDir: dir, ...opts }), new LocalStorage(dir), { id: 'abc123def4', url: config.url, host: 't.app', status: 'running', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop'] });
}

function drafts(): Draft[] {
  const els: El[] = [
    { tag: 'body', box: [0, 0, 1440, 3000] },
    { tag: 'button', parent: 0, text: 'Send', box: [100, 100, 80, 44], style: { 'background-color': 'rgb(36, 88, 230)' } },
    { tag: 'div', parent: 0, role: 'status', cls: ['notification'], text: 'New receipts', box: [100, 300, 1000, 60], style: { 'background-color': 'rgb(204, 240, 255)' } },
    { tag: 'p', parent: 2, own: 'New receipts', text: 'New receipts', box: [120, 316, 400, 24] },
    { tag: 'strong', parent: 3, own: 'New', text: 'New', box: [120, 316, 40, 24] },
  ];
  const clusters = clusterItems(itemsFrom(fakeCapture([{ path: '/', desktop: snap(els) }])));
  return clusters.map((c, i) => ({ id: `c${i + 1}`, items: c.items, guess: classify(c.items), variantNames: ['Default'] }));
}

describe('the component naming call', () => {
  it('types what the rules were unsure about and names everything', async () => {
    const ds = drafts();
    const ctx = ctxWith({ transport: async () => ({ text: JSON.stringify({ items: ds.map((d) => ({ id: d.id, type: d.guess.confidence < 0.9 ? 'alert' : 'link', name: d.guess.confidence < 0.9 ? 'Notification' : 'Button', isComponent: true, variantHint: null })) }), usage }) });
    const out = await nameComponents(ctx, ds);
    const byGuess = Object.fromEntries(ds.map((d, i) => [d.guess.type, out.namings[i]]));
    expect(byGuess.button).toMatchObject({ type: 'button', name: 'Button', by: 'model' });
    expect(byGuess.other).toMatchObject({ type: 'alert', name: 'Notification', by: 'model' });
    expect(out.calls).toEqual(['by model']);
  });

  it('keeps rule types and generated names after malformed output twice', async () => {
    let calls = 0;
    const ctx = ctxWith({ transport: async () => ({ text: calls++ === 0 ? '{"items": [' : '{"items": "none"}', usage }) });
    const out = await nameComponents(ctx, drafts());
    expect(calls).toBe(2);
    expect(out.namings.map((n) => [n.type, n.name, n.by])).toEqual([
      ['button', 'Button', 'fallback'],
      ['other', 'Other', 'fallback'],
    ]);
  });

  it('falls back on a type outside the enum, and on a timeout', async () => {
    const ds = drafts();
    const wrong = ctxWith({ transport: async () => ({ text: JSON.stringify({ items: ds.map((d) => ({ id: d.id, type: 'widget', name: 'Widget', isComponent: true, variantHint: null })) }), usage }) });
    expect((await nameComponents(wrong, ds)).calls).toEqual(['by fallback (invalid)']);
    const slow = ctxWith({
      transport: async () => {
        throw Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
      },
    });
    expect((await nameComponents(slow, ds)).calls).toEqual(['by fallback (timeout)']);
  });

  it('keeps a generated name when the model breaks the name rules', async () => {
    const ds = drafts();
    const ctx = ctxWith({ transport: async () => ({ text: JSON.stringify({ items: ds.map((d) => ({ id: d.id, type: d.guess.type, name: 'primary-button\u2014big', isComponent: true, variantHint: null })) }), usage }) });
    expect((await nameComponents(ctx, ds)).namings.map((n) => n.name)).toEqual(['Button', 'Other']);
  });
});

const png = (width: number, height: number) => PNG.sync.write(new PNG({ width, height }));
const size = (buf: Buffer) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];

describe('images for the naming call', () => {
  it('downscales a crop so its longer side is at most 512 px, and leaves a small one as it is', () => {
    expect(size(downscale(png(1024, 300)))).toEqual([512, 150]);
    expect(size(downscale(png(300, 900)))).toEqual([171, 512]);
    const small = png(400, 200);
    expect(downscale(small)).toBe(small);
  });

  it('sends a picture only for items the rules were less than 0.9 sure of', async () => {
    const ds = drafts().map((d) => ({ ...d, crop: png(40, 20) }));
    expect(ds.map((d) => d.guess.confidence >= IMAGE_BELOW_CONFIDENCE)).toEqual([true, false]);
    let content: ContentBlock[] = [];
    const ctx = ctxWith({
      transport: async (req) => {
        content = req.content;
        return { text: JSON.stringify({ items: [] }), usage };
      },
    });
    await nameComponents(ctx, ds);
    expect(content.map((b) => (b.type === 'text' ? b.text.split('\n')[0] : 'image'))).toEqual(['Items:', 'Picture of c2:', 'image']);
    expect((content[0] as { text: string }).text.split('\n').map((l) => l.endsWith('picture below'))).toEqual([false, false, true]);
  });
});

describe('the collision call', () => {
  it('merges what the model calls the same, and keeps both apart on failure', async () => {
    const [a, b] = drafts();
    const pairs = [{ id: 'p1', a: a!, b: b!, name: 'Button' }];
    const yes = ctxWith({ transport: async () => ({ text: JSON.stringify({ pairs: [{ id: 'p1', same: true }] }), usage }) });
    expect((await resolveCollisions(yes, pairs)).same).toEqual(new Set(['p1']));
    const broken = ctxWith({ transport: async () => ({ text: 'nope', usage }) });
    expect(await resolveCollisions(broken, pairs)).toEqual({ same: new Set(), by: 'by fallback (invalid)' });
    expect(await resolveCollisions(broken, [])).toEqual({ same: new Set(), by: 'none' });
  });

  it('keeps both apart on an answer outside the schema and on a timeout', async () => {
    const [a, b] = drafts();
    const pairs = [{ id: 'p1', a: a!, b: b!, name: 'Button' }];
    const wrong = ctxWith({ transport: async () => ({ text: JSON.stringify({ pairs: [{ id: 'p1', same: 'maybe' }] }), usage }) });
    expect(await resolveCollisions(wrong, pairs)).toEqual({ same: new Set(), by: 'by fallback (invalid)' });
    const slow = ctxWith({
      transport: async () => {
        throw Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
      },
    });
    expect(await resolveCollisions(slow, pairs)).toEqual({ same: new Set(), by: 'by fallback (timeout)' });
  });

  it('gives the later cluster a numeric suffix when the call falls back', async () => {
    // The second button carries an icon, so the two never cluster; the model names both Button.
    const page = (style: El['style'], box: [number, number, number, number], icon = false) => snap([{ tag: 'body', box: [0, 0, 1440, 900] }, { tag: 'button', parent: 0, own: 'Send', text: 'Send', box, style }, ...(icon ? [{ tag: 'svg', parent: 1, box: [104, 107, 16, 16] } as El] : [])]);
    const capture = fakeCapture([
      { path: '/', desktop: page({ 'background-color': 'rgb(36, 88, 230)', color: 'rgb(255, 255, 255)', 'padding-left': '20px', 'padding-right': '20px', 'border-top-left-radius': '8px' }, [100, 100, 120, 44]) },
      { path: '/pricing', desktop: page({ 'background-color': 'rgb(255, 255, 255)', 'border-top-width': '1px', 'border-top-style': 'solid', 'padding-left': '8px', 'padding-right': '8px', 'font-size': '13px', 'font-weight': '600' }, [100, 100, 80, 30], true) },
    ]);
    const shot = png(1440, 900);
    for (const p of capture.pages) for (const vc of Object.values(p.viewports)) vc!.screenshot.png = shot;
    const asked: string[] = [];
    const ctx = ctxWith({
      transport: async (req) => {
        const text = (req.content[0] as { text: string }).text;
        asked.push(text.split(':')[0]!);
        if (text.startsWith('Pairs:')) throw Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
        const ids = [...text.matchAll(/^(c\d+) guess/gm)].map((m) => m[1]);
        return { text: JSON.stringify({ items: ids.map((id) => ({ id, type: 'button', name: 'Button', isComponent: true, variantHint: null })) }), usage };
      },
    });
    const tokens = { colors: [], type: [], space: [], radius: [], shadow: [] } as unknown as Tokens;
    const out = await components(ctx, capture, tokens);
    expect(asked).toEqual(['Items', 'Pairs']);
    expect(out.components.map((c) => [c.name, c.provenance.firstSeen.path])).toEqual([
      ['Button', '/'],
      ['Button 2', '/pricing'],
    ]);
    expect(ctx.events[0]!.data).toMatchObject({ collisions: 'by fallback (timeout)' });
  });
});
