import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CreateRunCreated, MeResponse, RunResponse } from '@dse/schema';
import { tables } from '@dse/pipeline/db';
import type { DbRunContext } from '@dse/pipeline/db/context';
import { ModelAuthError } from '@dse/pipeline/errors';
import { RUN_JOB } from '@dse/pipeline/queue';
import { runRetention } from '../../worker/src/retention';
import { POST as createRun } from '../app/api/runs/route';
import { GET as getRun } from '../app/api/runs/[id]/route';
import { GET as me } from '../app/api/me/route';
import { POST as showcaseRun } from '../app/api/admin/showcase/run/route';
import { ADMIN_TOKEN, ensureFixtureServer, params, request, startHarness, until, type Harness } from './helpers/harness';

// The worker's failure paths: a crash is retried once from the beginning, a second one fails the
// run; the status gate; a visitor's key never reaches a log, a row or a plain Redis value.

const CLEAN = 'http://localhost:4100/sites/clean/';
const KEY = 'sk-ant-api03-SECRET-never-logged-0123456789abcdefghijklmnop';
let h: Harness;
let fixtures: { close(): void } | null;

beforeAll(async () => {
  fixtures = await ensureFixtureServer();
  h = await startHarness();
}, 120_000);

afterAll(async () => {
  await h?.close();
  fixtures?.close();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function poll(id: string) {
  return RunResponse.parse(await (await getRun(request(`/api/runs/${id}`), params({ id }))).json());
}

describe('a crashed worker', () => {
  it('retries the run once from the beginning, then fails it with the stopped detail and refunds', async () => {
    const who = { ip: '203.0.113.70', cookie: 'visitorCRASHCRAS' };
    const { id } = CreateRunCreated.parse(await (await createRun(request('/api/runs', { ...who, body: { url: CLEAN } }))).json());
    let starts = 0;
    const hang = async (ctx: DbRunContext) => {
      starts++;
      await ctx.emit({ stage: 'queue', message: `attempt ${starts}`, patch: { status: 'running' } });
      return new Promise<never>(() => {});
    };
    const fast = { lockDuration: 1000, stalledInterval: 300 };

    // First worker takes the job and dies holding it.
    const a = h.startWorker({ pipeline: hang, options: fast });
    await until(async () => starts === 1, 20_000, 50);
    await a.close(true);

    // The second finds it stalled, starts it again from a clean document, and dies too.
    const b = h.startWorker({ pipeline: hang, options: fast });
    await until(async () => starts === 2, 20_000, 50);
    const restarted = await poll(id);
    expect(restarted.events.map((e) => e.message)).toEqual(['queue · attempt 2']);
    await b.close(true);

    // The third finds the second stall and fails the job without starting it.
    const c = h.startWorker({ pipeline: hang, options: fast });
    const failed = await until(async () => {
      const r = await poll(id);
      return r.status === 'failed' ? r : null;
    }, 30_000);
    await c.close(true);
    expect(starts).toBe(2);
    expect(failed.document.failedDetail).toBe('The crawler stopped unexpectedly.');
    expect(failed.events.at(-1)?.message).toBe('done · The crawler stopped unexpectedly.');
    expect(MeResponse.parse(await (await me(request('/api/me', who))).json()).runsLeft).toBe(2);
    expect((await h.counters.budget()).reservedCents).toBeCloseTo(0, 6);
  }, 90_000);

  it('never processes a run twice: a finished run is skipped by the status gate', async () => {
    const [row] = await h.db.select().from(tables.runs);
    let called = false;
    const w = h.startWorker({ pipeline: async () => ((called = true), { status: 'complete' as const }) });
    const job = await h.queue.add(RUN_JOB, { runId: row!.id }, { jobId: `${row!.id}-again`, priority: 100 });
    await until(async () => (await job.getState()) === 'completed', 20_000, 100);
    await w.close();
    expect(called).toBe(false);
    expect((await poll(row!.id)).status).toBe('failed');
  });
});

describe('the retention job', () => {
  it('deletes runs past their retention with their files, and never a showcase run', async () => {
    const doc = (id: string) => ({ id, url: CLEAN, host: 'localhost:4100', status: 'complete', createdAt: '2026-01-01T00:00:00.000Z', pipelineVersion: '1.0.0', viewports: ['desktop'] });
    const base = { url: CLEAN, host: 'localhost:4100', status: 'complete' as const, visitorId: 'visitorRETENTION', pageCap: 12, pipelineVersion: '1.0.0' };
    await h.db.insert(tables.runs).values([
      { ...base, id: 'expired001', document: doc('expired001'), retentionUntil: '2026-04-01T00:00:00.000Z' },
      { ...base, id: 'current001', document: doc('current001'), retentionUntil: '2099-01-01T00:00:00.000Z' },
      { ...base, id: 'showcase01', document: doc('showcase01'), retentionUntil: null, isShowcase: true },
    ]);
    await h.storage.put('runs/expired001/og.png', Buffer.from([1]), { contentType: 'image/png' });
    await h.storage.put('runs/current001/og.png', Buffer.from([1]), { contentType: 'image/png' });
    const lines: string[] = [];
    const log = { info: (o: object, m: string) => void lines.push(`${m} ${JSON.stringify(o)}`) } as never;
    expect(await runRetention(h.db, h.storage, log)).toBe(1);
    const left = (await h.db.select({ id: tables.runs.id }).from(tables.runs)).map((r) => r.id);
    expect(left).toContain('current001');
    expect(left).toContain('showcase01');
    expect(left).not.toContain('expired001');
    expect(await h.storage.get('runs/expired001/og.png')).toBeNull();
    expect(await h.storage.get('runs/current001/og.png')).not.toBeNull();
    expect(lines[0]).toContain('expired001');
  });
});

describe('security · a visitor key', () => {
  it('is rejected by Anthropic: the run fails with the key detail, and the key is in no log, row or plain Redis value', async () => {
    const out: string[] = [];
    for (const m of ['log', 'info', 'warn', 'error'] as const) vi.spyOn(console, m).mockImplementation((...args: unknown[]) => void out.push(args.map(String).join(' ')));
    const transport = async () => {
      throw new ModelAuthError();
    };
    const w = h.startWorker({ config: { modelMode: 'live', strictReplay: false, modelTransport: transport } });
    const res = await createRun(request('/api/runs', { ip: '203.0.113.71', cookie: 'visitorKEYKEYKEY', key: KEY, body: { url: CLEAN } }));
    const { id } = CreateRunCreated.parse(await res.json());
    const done = await until(async () => {
      const r = await poll(id);
      return ['complete', 'failed', 'blocked', 'cancelled'].includes(r.status) ? r : null;
    });
    await w.close();
    expect(done.status).toBe('failed');
    expect(done.document.failedDetail).toBe('Your key was rejected by Anthropic.');

    const everything = [
      ...h.logLines,
      ...out,
      JSON.stringify(await h.db.select().from(tables.runs)),
      JSON.stringify(await h.db.select().from(tables.runEvents)),
      JSON.stringify(await h.db.select().from(tables.visitors)),
    ];
    for (const k of await h.redis.keys('*')) {
      const type = await h.redis.type(k);
      if (type === 'string') everything.push(String(await h.redis.get(k)));
      if (type === 'hash') everything.push(JSON.stringify(await h.redis.hgetall(k)));
      if (type === 'list') everything.push(JSON.stringify(await h.redis.lrange(k, '0', '-1')));
      if (type === 'zset') everything.push(JSON.stringify(await h.redis.zrange(k, '0', '-1')));
      if (type === 'stream') everything.push(JSON.stringify(await h.redis.xrange(k, '-', '+')));
    }
    const haystack = everything.join('\n');
    expect(haystack).not.toContain(KEY);
    expect(haystack).not.toContain('SECRET-never-logged');
    expect(h.logLines.join('\n')).toContain('run finished');
  }, 240_000);
});

describe('the run timeout', () => {
  it('gives a showcase run its own, longer timeout and a visitor run the standard one (D-071)', async () => {
    const seen = new Map<string, number>();
    const w = h.startWorker({ pipeline: async (ctx) => (seen.set(ctx.runId, ctx.config.timeoutMs), { status: 'complete' as const }) });
    const visitor = CreateRunCreated.parse(await (await createRun(request('/api/runs', { ip: '203.0.113.81', cookie: 'visitorTIMEOUT01', body: { url: CLEAN } }))).json());
    const showcase = CreateRunCreated.parse(await (await showcaseRun(request('/api/admin/showcase/run', { body: { url: CLEAN }, headers: { authorization: `Bearer ${ADMIN_TOKEN}` } }))).json());
    await until(async () => seen.has(visitor.id) && seen.has(showcase.id), 20_000, 100);
    await w.close();
    expect(seen.get(visitor.id)).toBe(600_000);
    expect(seen.get(showcase.id)).toBe(900_000);
  });
});
