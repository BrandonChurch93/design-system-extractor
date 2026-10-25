import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { CostCall, ModelPurpose } from '@dse/schema';
import { models, type ModelSize } from './config';
import { costOf, totalInputTokens, type Usage } from './cost';
import { requestHash } from './hash';
import { openMeter, type BudgetMeter } from './meter';

export type ModelMode = 'live' | 'record' | 'replay';

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; mediaType: 'image/png'; data: string };

export type ModelRequest<T> = {
  purpose: ModelPurpose;
  size: ModelSize;
  /** Static per pipeline version; sent with cache_control. */
  system: string;
  content: ContentBlock[];
  schema: z.ZodType<T>;
  maxTokens: number;
  timeoutMs: number;
};

export type FallbackReason = 'timeout' | 'invalid' | 'budget' | 'error' | 'replay-miss' | 'auth';

export type ModelResult<T> =
  | { ok: true; data: T; by: 'model' | 'model (retry)'; cost: CostCall[] }
  | { ok: false; reason: FallbackReason; detail: string; cost: CostCall[] };

type Recording = { purpose: ModelPurpose; size: ModelSize; model: string; text: string; usage: Usage; recordedAt: string };

/** Thrown in strict replay (tests and evals) when no recording matches, so a changed prompt is noticed. */
export class ReplayMissError extends Error {
  constructor(
    readonly purpose: string,
    readonly hash: string,
  ) {
    super(`no recording for ${purpose} request ${hash.slice(0, 12)}: re-record with DSE_MODEL_MODE=record`);
    this.name = 'ReplayMissError';
  }
}

/** Thrown when Anthropic rejects the key, which ends a BYO run as failed (docs/specs/caps-and-budget.md). */
export class ModelAuthError extends Error {
  constructor() {
    super('Your key was rejected by Anthropic.');
    this.name = 'ModelAuthError';
  }
}

export type ModelClientOptions = {
  mode: ModelMode;
  apiKey?: string;
  recordingsDir: string;
  meter?: BudgetMeter;
  /** Strict replay throws on a miss instead of falling back. */
  strictReplay?: boolean;
  /** Test seam: replaces the SDK call. */
  transport?: (req: { model: string; system: string; content: ContentBlock[]; jsonSchema: unknown; maxTokens: number; timeoutMs: number; feedback?: string; size: ModelSize }) => Promise<{ text: string; usage: Usage }>;
  /** Called with every cost record, for budget counters and logs. */
  onCost?: (call: CostCall) => void;
};

function hashable(req: ModelRequest<unknown>) {
  return {
    purpose: req.purpose,
    size: req.size,
    system: req.system,
    // Image bytes vary by a few pixels between machines; the text beside each image identifies it.
    content: req.content.map((b) => (b.type === 'image' ? { type: 'image' } : b)),
    schema: z.toJSONSchema(req.schema, { io: 'input', unrepresentable: 'any' }),
  };
}

function parseJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  return JSON.parse(trimmed);
}

export class ModelClient {
  private readonly sdk: Anthropic | null;
  private readonly meter: BudgetMeter;

  constructor(private readonly opts: ModelClientOptions) {
    this.meter = opts.meter ?? openMeter;
    this.sdk = opts.mode !== 'replay' && !opts.transport && opts.apiKey ? new Anthropic({ apiKey: opts.apiKey, maxRetries: 1 }) : null;
  }

  get mode(): ModelMode {
    return this.opts.mode;
  }

  recordingPath(purpose: string, hash: string): string {
    return join(this.opts.recordingsDir, purpose, `${hash}.json`);
  }

  async call<T>(req: ModelRequest<T>): Promise<ModelResult<T>> {
    const hash = requestHash(hashable(req as ModelRequest<unknown>));
    if (this.opts.mode === 'replay') return this.replay(req, hash);

    const allowed = await this.meter.allowLive();
    if (!allowed.ok) return { ok: false, reason: 'budget', detail: allowed.reason, cost: [] };
    if (!this.sdk && !this.opts.transport) return { ok: false, reason: 'error', detail: 'no API key', cost: [] };

    const cost: CostCall[] = [];
    let feedback: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      let raw: { text: string; usage: Usage };
      try {
        raw = await this.send(req, feedback);
      } catch (e) {
        if (e instanceof ModelAuthError) throw e;
        const timeout = e instanceof Anthropic.APIConnectionTimeoutError || (e as Error).name === 'AbortError' || /timed? ?out/i.test((e as Error).message);
        return { ok: false, reason: timeout ? 'timeout' : 'error', detail: (e as Error).message.slice(0, 200), cost };
      }
      const call = await this.account(req, raw.usage);
      cost.push(call);
      const parsed = this.validate(req.schema, raw.text);
      if (parsed.ok) {
        if (this.opts.mode === 'record' && attempt === 0) this.writeRecording(req, hash, raw);
        return { ok: true, data: parsed.data, by: attempt === 0 ? 'model' : 'model (retry)', cost };
      }
      feedback = parsed.error;
    }
    return { ok: false, reason: 'invalid', detail: feedback ?? 'invalid output', cost };
  }

  private validate<T>(schema: z.ZodType<T>, text: string): { ok: true; data: T } | { ok: false; error: string } {
    let json: unknown;
    try {
      json = parseJson(text);
    } catch {
      return { ok: false, error: 'The output was not valid JSON.' };
    }
    const r = schema.safeParse(json);
    return r.success ? { ok: true, data: r.data } : { ok: false, error: z.prettifyError(r.error).slice(0, 1200) };
  }

  private replay<T>(req: ModelRequest<T>, hash: string): ModelResult<T> {
    let rec: Recording;
    try {
      rec = JSON.parse(readFileSync(this.recordingPath(req.purpose, hash), 'utf8')) as Recording;
    } catch {
      if (this.opts.strictReplay) throw new ReplayMissError(req.purpose, hash);
      return { ok: false, reason: 'replay-miss', detail: `no recording ${hash.slice(0, 12)}`, cost: [] };
    }
    const parsed = this.validate(req.schema, rec.text);
    const call: CostCall = this.costRecord(req, rec.model, rec.usage);
    if (!parsed.ok) return { ok: false, reason: 'invalid', detail: parsed.error, cost: [call] };
    return { ok: true, data: parsed.data, by: 'model', cost: [call] };
  }

  private writeRecording(req: ModelRequest<unknown>, hash: string, raw: { text: string; usage: Usage }) {
    const file = this.recordingPath(req.purpose, hash);
    mkdirSync(dirname(file), { recursive: true });
    const rec: Recording = { purpose: req.purpose, size: req.size, model: models[req.size], text: raw.text, usage: raw.usage, recordedAt: new Date().toISOString() };
    writeFileSync(file, `${JSON.stringify(rec, null, 2)}\n`);
  }

  private costRecord(req: ModelRequest<unknown>, model: string, usage: Usage): CostCall {
    return {
      model,
      purpose: req.purpose,
      inputTokens: totalInputTokens(usage),
      outputTokens: usage.output_tokens,
      usd: costOf(model, usage),
      cached: (usage.cache_read_input_tokens ?? 0) > 0,
    };
  }

  private async account(req: ModelRequest<unknown>, usage: Usage): Promise<CostCall> {
    const call = this.costRecord(req, models[req.size], usage);
    await this.meter.add(call.usd, req.purpose);
    this.opts.onCost?.(call);
    return call;
  }

  private async send(req: ModelRequest<unknown>, feedback?: string): Promise<{ text: string; usage: Usage }> {
    const model = models[req.size];
    if (this.opts.transport) {
      return this.opts.transport({ model, system: req.system, content: req.content, jsonSchema: z.toJSONSchema(req.schema), maxTokens: req.maxTokens, timeoutMs: req.timeoutMs, feedback, size: req.size });
    }
    const content: Anthropic.ContentBlockParam[] = req.content.map((b) =>
      b.type === 'text' ? { type: 'text', text: b.text } : { type: 'image', source: { type: 'base64', media_type: b.mediaType, data: b.data } },
    );
    if (feedback) content.push({ type: 'text', text: `Your previous answer did not match the required schema:\n${feedback}\nAnswer again with valid JSON only.` });
    try {
      const res = await this.sdk!.messages.create(
        {
          model,
          max_tokens: req.maxTokens,
          system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content }],
          // The small model runs with thinking off; the large model cannot turn it off (D-027).
          thinking: req.size === 'small' ? { type: 'disabled' } : { type: 'adaptive' },
          output_config: { effort: 'low', format: zodOutputFormat(req.schema as z.ZodType) },
        } as Anthropic.MessageCreateParamsNonStreaming,
        { timeout: req.timeoutMs, maxRetries: 0 },
      );
      const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
      return { text, usage: res.usage as Usage };
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new ModelAuthError();
      throw e;
    }
  }
}

/** The repository's recordings folder, or the one named by DSE_RECORDINGS_DIR. */
export function defaultRecordingsDir(repoRoot: string, env: Record<string, string | undefined> = process.env): string {
  return env.DSE_RECORDINGS_DIR ?? join(repoRoot, 'fixtures', 'recordings');
}
