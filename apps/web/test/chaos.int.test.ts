import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CreateRunCreated, MeResponse, RunResponse } from '@dse/schema';
import { tables, testDatabaseUrl } from '@dse/pipeline/db';
import { capsFromEnv, createApiRedis, createQueue, RunCounters, testRedisUrl } from '@dse/pipeline/queue';
import { testS3Config, type Storage } from '@dse/pipeline/storage';
import { POST as createRun } from '../app/api/runs/route';
import { GET as getRun } from '../app/api/runs/[id]/route';
import { GET as me } from '../app/api/me/route';
import { setServices } from '../lib/server/services';
import { APP, ensureFixtureServer, params, request, startHarness, until, type Harness } from './helpers/harness';

// Chaos (docs/plan.md P14, D-074): a worker killed mid-run, Redis gone at enqueue, storage gone
// mid-capture. Each ends in its specified status and gives back what the run took.

const CLEAN = 'http://localhost:4100/sites/clean/';
const root = resolve(import.meta.dirname, '../../..');
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

const runsLeft = async (who: { ip: string; cookie: string }) => MeResponse.parse(await (await me(request('/api/me', who))).json()).runsLeft;

/** The worker service as Railway runs it, against the test database, Redis and bucket. */
function workerProcess(): { child: ChildProcess; output: string[] } {
  const s3 = testS3Config();
  const output: string[] = [];
  const child = spawn(process.execPath, ['--import', 'tsx', 'apps/worker/src/index.ts'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl(),
      REDIS_URL: testRedisUrl(),
      STORAGE_BUCKET: s3.bucket,
      STORAGE_PUBLIC_BASE_URL: s3.publicBaseUrl,
      DSE_MODEL_MODE: 'replay',
      DSE_JOB_ENCRYPTION_KEY: h.encryptionKey,
      DSE_ALLOW_PRIVATE_HOSTS: h.allowPrivateHosts.join(','),
      NEXT_PUBLIC_APP_URL: APP,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout!.on('data', (b: Buffer) => output.push(b.toString()));
  child.stderr!.on('data', (b: Buffer) => output.push(b.toString()));
  return { child, output };
}

describe('chaos · a worker killed mid-run', () => {
  it('is picked up by the next worker, which runs it again from the beginning to complete, counted once', async () => {
    const who = { ip: '203.0.113.81', cookie: 'visitorCHAOSKILL' };
    const { id } = CreateRunCreated.parse(await (await createRun(request('/api/runs', { ...who, body: { url: CLEAN } }))).json());

    const { child, output } = workerProcess();
    try {
      await until(async () => (await poll(id)).events.some((e) => e.stage === 'capture'), 120_000, 200);
    } catch (e) {
      throw new Error(`${(e as Error).message}\n${output.join('')}`);
    } finally {
      child.kill('SIGKILL');
    }
    await new Promise((r) => child.once('exit', r));
    expect((await poll(id)).status).toBe('running');

    // The dead worker's lock lapses; the next worker finds the job stalled and starts it again.
    const next = h.startWorker({ options: { stalledInterval: 1000 } });
    const done = await until(async () => {
      const r = await poll(id);
      return ['complete', 'failed', 'blocked', 'cancelled'].includes(r.status) ? r : null;
    }, 300_000, 500);
    await next.close();

    expect(done.status).toBe('complete');
    expect(done.events.filter((e) => e.stage === 'queue')).toHaveLength(1);
    expect((await h.queue.getJob(id))?.attemptsStarted).toBe(2);
    expect(await runsLeft(who)).toBe(1);
    expect((await h.counters.budget()).reservedCents).toBeCloseTo(0, 6);
  }, 480_000);
});

describe('chaos · Redis unavailable at enqueue', () => {
  it('answers the generic error within seconds when Redis is down, with no run created', async () => {
    const down = createApiRedis('redis://localhost:6399/15', { retryStrategy: () => 200 });
    down.on('error', () => {});
    setServices({ ...h, redis: down, queue: createQueue(down), counters: new RunCounters(down, capsFromEnv(h.env)) });
    const before = (await h.db.select().from(tables.runs)).length;
    const started = Date.now();
    try {
      const res = await createRun(request('/api/runs', { ip: '203.0.113.82', cookie: 'visitorCHAOSDOWN', body: { url: CLEAN } }));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Something broke on our side.' });
    } finally {
      setServices(h);
      down.disconnect();
    }
    expect(Date.now() - started).toBeLessThan(15_000);
    expect((await h.db.select().from(tables.runs)).length).toBe(before);
  }, 30_000);

  it('fails the run it created when the enqueue itself fails, and gives back the count and the reservation', async () => {
    const who = { ip: '203.0.113.83', cookie: 'visitorCHAOSENQU' };
    vi.spyOn(h.queue, 'add').mockRejectedValue(new Error('Connection is closed.'));
    const res = await createRun(request('/api/runs', { ...who, body: { url: CLEAN } }));
    expect(res.status).toBe(500);
    const rows = await h.db.select().from(tables.runs);
    const row = rows.find((r) => r.visitorId === who.cookie)!;
    expect(row.status).toBe('failed');
    expect((await poll(row.id)).document.failedDetail).toBe('The crawler stopped unexpectedly.');
    expect(await runsLeft(who)).toBe(2);
    expect((await h.counters.budget()).reservedCents).toBeCloseTo(0, 6);
  });
});

describe('chaos · storage unavailable mid-capture', () => {
  it('ends the run failed with the stopped detail and refunds it', async () => {
    const who = { ip: '203.0.113.84', cookie: 'visitorCHAOSSTOR' };
    let puts = 0;
    const flaky: Storage = {
      put: async (key, body, opts) => {
        if (++puts > 2) throw new Error('connect ECONNREFUSED 127.0.0.1:9000');
        return h.storage.put(key, body, opts);
      },
      get: (key) => h.storage.get(key),
      publicUrl: (key) => h.storage.publicUrl(key),
      delete: (key) => h.storage.delete(key),
      list: (prefix) => h.storage.list(prefix),
      deletePrefix: (prefix) => h.storage.deletePrefix(prefix),
    };
    const worker = h.startWorker({ storage: flaky });
    const { id } = CreateRunCreated.parse(await (await createRun(request('/api/runs', { ...who, body: { url: CLEAN } }))).json());
    const done = await until(async () => {
      const r = await poll(id);
      return ['complete', 'failed', 'blocked', 'cancelled'].includes(r.status) ? r : null;
    }, 240_000, 500);
    await worker.close();

    expect(puts).toBeGreaterThan(2);
    expect(done.status).toBe('failed');
    expect(done.document.failedDetail).toBe('The crawler stopped unexpectedly.');
    expect(done.events.at(-1)?.message).toBe('done · The crawler stopped unexpectedly.');
    expect(await runsLeft(who)).toBe(2);
    expect((await h.counters.budget()).reservedCents).toBeCloseTo(0, 6);
  }, 300_000);
});
