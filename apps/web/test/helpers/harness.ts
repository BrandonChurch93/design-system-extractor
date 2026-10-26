import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import type { Worker } from 'bullmq';
import { pino, type Logger } from 'pino';
import { closeDb, createDb, resetDatabase, testDatabaseUrl } from '@dse/pipeline/db';
import type { Resolver } from '@dse/pipeline/net/private-ranges';
import { capsFromEnv, createQueue, createRedis, RunCounters, testRedisUrl } from '@dse/pipeline/queue';
import { S3Storage, testS3Config } from '@dse/pipeline/storage';
import { BrowserPool } from '../../../worker/src/browser';
import { createRunWorker, type WorkerDeps } from '../../../worker/src/worker';
import { setServices, type Services } from '../../lib/server/services';
import { BLOCKING_SITES_PORT as SITES_PORT } from '../../../../scripts/blocking-sites';
import { startFixtureServer } from '../../../../scripts/fixtures-serve';

export { startBlockingSites, BLOCKING_SITES_PORT as SITES_PORT } from '../../../../scripts/blocking-sites';
export const APP = 'http://localhost:3000';
export const ADMIN_TOKEN = 'admin-token-for-tests-0123456789abcdef';
const recordingsDir = resolve(import.meta.dirname, '../../../../fixtures/recordings');

export type Harness = Services & {
  startWorker(extra?: Partial<Omit<WorkerDeps, 'config'>> & { config?: Partial<WorkerDeps['config']> }): Worker;
  logLines: string[];
  close(): Promise<void>;
};

/** Test database, Redis database 15, the test bucket; the services the routes read, set for the process. */
export async function startHarness(opts: { env?: Record<string, string>; resolver?: Resolver } = {}): Promise<Harness> {
  const env: Record<string, string | undefined> = { ...process.env, NODE_ENV: 'test', ...opts.env };
  await resetDatabase(testDatabaseUrl());
  const db = createDb(testDatabaseUrl());
  const redis = createRedis(testRedisUrl());
  await redis.flushdb();
  const queue = createQueue(redis);
  const counters = new RunCounters(redis, capsFromEnv(env));
  const storage = new S3Storage(testS3Config());
  const encryptionKey = randomBytes(32).toString('base64');
  const workers: Worker[] = [];
  const pools: BrowserPool[] = [];
  const logLines: string[] = [];
  const log: Logger = pino({ level: 'info' }, { write: (s: string) => void logLines.push(s) });
  const svc: Services = {
    db,
    redis,
    queue,
    counters,
    storage,
    env,
    encryptionKey,
    adminToken: ADMIN_TOKEN,
    appUrl: APP,
    allowPrivateHosts: ['localhost:4100', `localhost:${SITES_PORT}`],
    production: false,
    resolver: opts.resolver,
  };
  setServices(svc);
  return {
    ...svc,
    logLines,
    startWorker(extra = {}) {
      const browsers = extra.browsers ?? new BrowserPool();
      pools.push(browsers);
      const worker = createRunWorker({
        db,
        connection: createRedis(testRedisUrl()),
        counters,
        storage,
        browsers,
        log,
        ...extra,
        config: {
          encryptionKey,
          modelMode: 'replay',
          recordingsDir,
          strictReplay: true,
          userAgent: 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)',
          appUrl: APP,
          timeoutMs: 600_000,
          showcaseTimeoutMs: 900_000,
          allowPrivateHosts: svc.allowPrivateHosts,
          keepIntermediate: false,
          ...extra.config,
        },
      });
      workers.push(worker);
      return worker;
    },
    async close() {
      for (const w of workers) await w.close(true).catch(() => {});
      for (const p of pools) await p.close();
      await queue.close();
      redis.disconnect();
      await closeDb(db);
      setServices(undefined);
    },
  };
}

/** The fixture sites on 4100, started here unless something already serves them. */
export async function ensureFixtureServer(): Promise<{ close(): void } | null> {
  try {
    await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) });
    return null;
  } catch {
    return startFixtureServer(4100);
  }
}

/** A request as the browser would send it, from a given address. */
export function request(path: string, init: { method?: string; body?: unknown; ip?: string; cookie?: string; key?: string; headers?: Record<string, string> } = {}): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'user-agent': 'vitest', 'x-forwarded-for': init.ip ?? '203.0.113.10', ...init.headers };
  if (init.cookie) headers.cookie = `dse_v=${init.cookie}`;
  if (init.key) headers['x-byo-key'] = init.key;
  return new Request(`${APP}${path}`, { method: init.method ?? (init.body === undefined ? 'GET' : 'POST'), headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
}

export const params = <T extends Record<string, string | string[]>>(p: T) => ({ params: Promise.resolve(p) });

export async function until<T>(fn: () => Promise<T | undefined | null | false>, timeoutMs = 240_000, everyMs = 250): Promise<T> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('timed out waiting');
    await new Promise((r) => setTimeout(r, everyMs));
  }
}
