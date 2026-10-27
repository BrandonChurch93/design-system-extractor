import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ModelClient, RECORD_TIMEOUT_MS, type ModelClientOptions, type ModelRequest } from '../src/models/client';
import { models } from '../src/models/config';

// The model client around the SDK (docs/specs/model-calls.md): request shape, cost records, modes.

const Answer = z.object({ pick: z.enum(['a', 'b']) });
const usage = { input_tokens: 900, output_tokens: 40, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
const tmp = () => mkdtempSync(join(tmpdir(), 'dse-models-'));
const request = (over: Partial<ModelRequest<{ pick: 'a' | 'b' }>> = {}): ModelRequest<{ pick: 'a' | 'b' }> => ({
  purpose: 'components',
  size: 'small',
  system: 'Name the components.',
  content: [
    { type: 'text', text: 'Items: c1 button' },
    { type: 'image', mediaType: 'image/png', data: 'AAAA' },
  ],
  schema: Answer,
  maxTokens: 512,
  timeoutMs: 20_000,
  ...over,
});

type Sent = { params: Record<string, unknown>; options: Record<string, unknown> };

/** A client whose SDK is a fake that records each request and answers in turn. */
function withFakeSdk(opts: Partial<ModelClientOptions>, answers: { text: string; usage?: Record<string, number> }[]) {
  const client = new ModelClient({ mode: 'live', apiKey: 'sk-test', recordingsDir: tmp(), ...opts });
  const sent: Sent[] = [];
  let i = 0;
  (client as unknown as { sdk: unknown }).sdk = {
    messages: {
      create: async (params: Record<string, unknown>, options: Record<string, unknown>) => {
        sent.push({ params, options });
        const a = answers[Math.min(i++, answers.length - 1)]!;
        return { content: [{ type: 'text', text: a.text }], usage: a.usage ?? usage };
      },
    },
  };
  return { client, sent };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('the request sent to the SDK', () => {
  it('asks for structured output at effort low, caches the system prompt and sends no sampling parameters', async () => {
    const { client, sent } = withFakeSdk({}, [{ text: '{"pick":"a"}' }]);
    expect(await client.call(request())).toMatchObject({ ok: true, data: { pick: 'a' }, by: 'model' });
    const { params, options } = sent[0]!;
    expect(params.model).toBe(models.small);
    expect(params.max_tokens).toBe(512);
    expect(params.system).toEqual([{ type: 'text', text: 'Name the components.', cache_control: { type: 'ephemeral' } }]);
    expect(params.messages).toEqual([{ role: 'user', content: [{ type: 'text', text: 'Items: c1 button' }, { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } }] }]);
    expect(params.thinking).toEqual({ type: 'disabled' });
    const config = params.output_config as { effort: string; format: { type: string; schema: unknown } };
    expect(config.effort).toBe('low');
    expect(config.format.type).toBe('json_schema');
    expect(config.format.schema).toEqual(zodOutputFormat(Answer).schema);
    for (const k of ['temperature', 'top_p', 'top_k', 'tool_choice', 'tools']) expect(params).not.toHaveProperty(k);
    expect(options).toEqual({ timeout: 20_000, maxRetries: 0 });
  });

  it('runs the large model with adaptive thinking, also at effort low', async () => {
    const { client, sent } = withFakeSdk({}, [{ text: '{"pick":"b"}' }]);
    await client.call(request({ size: 'large', purpose: 'narrative' }));
    expect(sent[0]!.params.model).toBe(models.large);
    expect(sent[0]!.params.thinking).toEqual({ type: 'adaptive' });
    expect((sent[0]!.params.output_config as { effort: string }).effort).toBe('low');
  });

  it('retries once with the validation error appended to the user turn', async () => {
    const { client, sent } = withFakeSdk({}, [{ text: '{"pick":"c"}' }, { text: '{"pick":"b"}' }]);
    expect(await client.call(request())).toMatchObject({ ok: true, by: 'model (retry)' });
    const retry = (sent[1]!.params.messages as { content: { type: string; text?: string }[] }[])[0]!.content;
    expect(retry).toHaveLength(3);
    expect(retry[2]!.text).toMatch(/^Your previous answer did not match the required schema:\n[\s\S]+Answer again with valid JSON only\.$/);
  });

  it('marks a cost record cached when the response reports cached input tokens', async () => {
    const { client } = withFakeSdk({}, [{ text: '{"pick":"a"}', usage: { ...usage, cache_read_input_tokens: 1800 } }]);
    const hit = await client.call(request());
    expect(hit.cost).toEqual([expect.objectContaining({ purpose: 'components', model: models.small, inputTokens: 2700, outputTokens: 40, cached: true })]);
    const { client: cold } = withFakeSdk({}, [{ text: '{"pick":"a"}' }]);
    expect((await cold.call(request())).cost[0]!.cached).toBe(false);
  });
});

describe('record and replay', () => {
  it('records one file per request, waits up to 60 s, and marks an answer that came on the retry', async () => {
    const dir = tmp();
    const { client, sent } = withFakeSdk({ mode: 'record', recordingsDir: dir }, [{ text: 'not json' }, { text: '{"pick":"b"}' }]);
    await client.call(request());
    expect(sent[0]!.options.timeout).toBe(RECORD_TIMEOUT_MS);
    const files = readdirSync(join(dir, 'components'));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^[0-9a-f]{64}\.json$/);
    const rec = JSON.parse(readFileSync(join(dir, 'components', files[0]!), 'utf8'));
    expect(rec).toMatchObject({ purpose: 'components', size: 'small', model: models.small, text: '{"pick":"b"}', request: 'Items: c1 button\n[image]', retried: true });
    const second = withFakeSdk({ mode: 'record', recordingsDir: dir }, [{ text: '{"pick":"a"}' }]);
    await second.client.call(request({ content: [{ type: 'text', text: 'Items: c2 link' }] }));
    expect(readdirSync(join(dir, 'components'))).toHaveLength(2);
  });

  it('replays a recording whatever the image bytes (D-040), and writes a missed request to DSE_REPLAY_MISS_DIR', async () => {
    const dir = tmp();
    const recorder = new ModelClient({ mode: 'record', recordingsDir: dir, transport: async () => ({ text: '{"pick":"a"}', usage }) });
    await recorder.call(request());
    const replay = new ModelClient({ mode: 'replay', recordingsDir: dir });
    const otherPixels = request({ content: [{ type: 'text', text: 'Items: c1 button' }, { type: 'image', mediaType: 'image/png', data: 'BBBBBBBB' }] });
    expect(await replay.call(otherPixels)).toMatchObject({ ok: true, data: { pick: 'a' }, by: 'model' });

    const misses = tmp();
    vi.stubEnv('DSE_REPLAY_MISS_DIR', misses);
    const miss = await replay.call(request({ content: [{ type: 'text', text: 'Items: c9 card' }, { type: 'image', mediaType: 'image/png', data: 'AAAA' }] }));
    expect(miss).toMatchObject({ ok: false, reason: 'replay-miss' });
    const written = readdirSync(misses);
    expect(written).toHaveLength(1);
    expect(written[0]).toMatch(/^components-[0-9a-f]{12}\.txt$/);
    expect(readFileSync(join(misses, written[0]!), 'utf8')).toBe('Items: c9 card\n[image]');
  });
});
