import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ColorToken, RunConfig } from '@dse/schema';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { parseCssColor } from '../src/color/parse';
import { ModelClient, type ModelClientOptions } from '../src/models/client';
import { buildColors } from '../src/tokens/colors';
import { emptyRaw, type RawColor } from '../src/tokens/collect';
import { nameColors, namingTable } from '../src/tokens/naming';

const config: RunConfig = { url: 'https://t.app/', include: [], pageCap: 12, viewports: ['desktop'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [], timeoutMs: 60_000, keepIntermediate: false, byo: false };
const usage = { input_tokens: 900, output_tokens: 120, cache_creation_input_tokens: 0, cache_read_input_tokens: 600 };

function ctxWith(opts: Partial<ModelClientOptions>) {
  const dir = mkdtempSync(join(tmpdir(), 'dse-naming-'));
  return new MemoryRunContext('abc123def4', config, new ModelClient({ mode: 'live', recordingsDir: dir, ...opts }), new LocalStorage(dir), { id: 'abc123def4', url: config.url, host: 't.app', status: 'running', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop'] });
}

function palette(): ColorToken[] {
  const raw = emptyRaw();
  const c = (hex: string, weight: number, semantic = 0): RawColor => ({ hex, rgba: parseCssColor(hex)!, weight, uses: { text: weight, background: 0, border: 0, other: 0 }, semantic, pages: new Map([['page0000', weight]]) });
  for (const x of [c('#2458E6', 30), c('#E2E8F0', 20), c('#DC2626', 10, 10)]) raw.colors.set(x.hex, x);
  return buildColors(raw).tokens;
}

describe('the color naming model pass', () => {
  it('applies valid names from the model and records the cost', async () => {
    const tokens = palette();
    const blue = tokens.find((t) => t.value === '#2458E6')!;
    const ctx = ctxWith({ transport: async () => ({ text: JSON.stringify({ names: tokens.map((t) => ({ id: t.id, name: t.id === blue.id ? 'blue-action' : t.name })) }), usage }) });
    const out = await nameColors(ctx, tokens, 9);
    expect(out).toEqual({ by: 'model', renamed: 1 });
    expect(blue.name).toBe('blue-action');
    expect(ctx.cost().calls.map((c) => c.purpose)).toEqual(['colors']);
  });

  it('retries once on malformed output, then keeps the deterministic names', async () => {
    const tokens = palette();
    const before = tokens.map((t) => t.name);
    let calls = 0;
    const ctx = ctxWith({ transport: async () => ({ text: calls++ === 0 ? 'not json' : '{"names": "blue"}', usage }) });
    expect(await nameColors(ctx, tokens, 9)).toMatchObject({ by: 'fallback', reason: 'invalid' });
    expect(calls).toBe(2);
    expect(tokens.map((t) => t.name)).toEqual(before);
  });

  it('keeps the deterministic names on a timeout', async () => {
    const tokens = palette();
    const ctx = ctxWith({
      transport: async () => {
        throw Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
      },
    });
    expect(await nameColors(ctx, tokens, 9)).toMatchObject({ by: 'fallback', reason: 'timeout' });
    expect(tokens.map((t) => t.name)).toEqual(['blue-600', 'gray-200', 'danger']);
  });

  it('rejects names that drop the hue word or role, one by one', async () => {
    const tokens = palette();
    const ctx = ctxWith({ transport: async () => ({ text: JSON.stringify({ names: tokens.map((t) => ({ id: t.id, name: t.group === 'semantic' ? 'error-red' : t.name })) }), usage }) });
    expect(await nameColors(ctx, tokens, 9)).toEqual({ by: 'model', renamed: 0 });
    expect(tokens.find((t) => t.group === 'semantic')!.name).toBe('danger');
  });

  it('describes each token to the model on one line', () => {
    const table = namingTable(palette(), 9).split('\n');
    expect(table).toHaveLength(4);
    expect(table[1]).toMatch(/\| blue-600 \| #2458E6 \| brand \| - \| blue \| 600 \| text 30 background 0 border 0 other 0 \| 1 of 9 pages$/);
  });
});
