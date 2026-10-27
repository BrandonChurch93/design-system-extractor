import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { allowedPrivateHosts } from '@dse/schema';
import { closeDb, createDb } from '@dse/pipeline/db';
import { defaultRecordingsDir } from '@dse/pipeline/models/client';
import { capsFromEnv, createQueue, createRedis, QUEUE_NAME, RETENTION_JOB, RunCounters } from '@dse/pipeline/queue';
import { S3Storage, s3ConfigFromEnv } from '@dse/pipeline/storage';
import { BrowserPool } from './browser';
import { devMeterFor } from './config';
import { createLogger } from './logger';
import { RETENTION_PATTERN } from './retention';
import { createRunWorker } from './worker';

// The worker service (docs/specs/architecture.md): one BullMQ consumer, one Chromium, a heartbeat.

function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = dirname(dir);
  }
  return process.cwd();
}

function need(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is not set`);
  return v;
}

async function main() {
  const env = process.env;
  const log = createLogger();
  const production = env.NODE_ENV === 'production';
  const root = repoRoot();
  const db = createDb(need('DATABASE_URL'), { max: 3 });
  const connection = createRedis(need('REDIS_URL'));
  const counters = new RunCounters(createRedis(need('REDIS_URL')), capsFromEnv(env));
  const storage = new S3Storage(s3ConfigFromEnv(env));
  const browsers = new BrowserPool();
  const appUrl = need('NEXT_PUBLIC_APP_URL').replace(/\/$/, '');

  const worker = createRunWorker({
    db,
    connection,
    counters,
    storage,
    browsers,
    log,
    config: {
      encryptionKey: need('DSE_JOB_ENCRYPTION_KEY'),
      modelMode: (env.DSE_MODEL_MODE as 'live' | 'record' | 'replay' | undefined) ?? 'live',
      apiKey: env.ANTHROPIC_API_KEY,
      recordingsDir: defaultRecordingsDir(resolve(root)),
      strictReplay: false,
      userAgent: env.DSE_USER_AGENT ?? `DesignSystemExtractorBot/1.0 (+${appUrl}/how-it-works)`,
      appUrl,
      timeoutMs: Number(env.DSE_RUN_TIMEOUT_MS ?? 360_000),
      showcaseTimeoutMs: Number(env.DSE_SHOWCASE_TIMEOUT_MS ?? 900_000),
      allowPrivateHosts: allowedPrivateHosts(env),
      keepIntermediate: env.DSE_KEEP_INTERMEDIATE === '1',
      devMeter: devMeterFor(env, root),
    },
  });

  const queue = createQueue(connection);
  await queue.upsertJobScheduler(RETENTION_JOB, { pattern: RETENTION_PATTERN, tz: capsFromEnv(env).timezone }, { name: RETENTION_JOB });

  const beat = () => counters.heartbeat().catch((e: Error) => log.warn({ err: e.message }, 'heartbeat failed'));
  await beat();
  const heartbeat = setInterval(beat, 15_000);
  log.info({ production }, `worker ready · queue ${QUEUE_NAME} · concurrency 1`);

  let stopping = false;
  const stop = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    log.info({ signal }, 'worker stopping');
    clearInterval(heartbeat);
    await worker.close();
    await queue.close();
    await browsers.close();
    await closeDb(db);
    connection.disconnect();
    counters.redis.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('SIGINT', () => void stop('SIGINT'));
}

main().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
