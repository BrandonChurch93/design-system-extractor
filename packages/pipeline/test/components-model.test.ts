import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RunConfig } from '@dse/schema';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { classify } from '../src/components/classify';
import { clusterItems } from '../src/components/cluster';
import { itemsFrom } from '../src/components/items';
import { nameComponents, resolveCollisions, type Draft } from '../src/components/model';
import { ModelClient, type ModelClientOptions } from '../src/models/client';
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
});
