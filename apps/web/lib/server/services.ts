import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { allowedPrivateHosts } from '@dse/schema';
import { createDb, type Db } from '@dse/pipeline/db';
import type { Resolver } from '@dse/pipeline/net/private-ranges';
import { capsFromEnv, createApiRedis, createQueue, RunCounters } from '@dse/pipeline/queue';
import { S3Storage, s3ConfigFromEnv, type Storage } from '@dse/pipeline/storage';

/** Everything the API routes reach: built once per server process from the environment. */
export type Services = {
  db: Db;
  redis: Redis;
  queue: Queue;
  counters: RunCounters;
  storage: Storage;
  env: Record<string, string | undefined>;
  encryptionKey: string;
  adminToken: string;
  appUrl: string;
  allowPrivateHosts: string[];
  production: boolean;
  /** Test seam for DNS (the rebinding and private-range tests). */
  resolver?: Resolver;
};

const holder = globalThis as unknown as { __dseServices?: Services };

function need(env: Record<string, string | undefined>, key: string): string {
  const v = env[key];
  if (!v) throw new Error(`${key} is not set`);
  return v;
}

export function servicesFromEnv(env: Record<string, string | undefined> = process.env): Services {
  const redis = createApiRedis(need(env, 'REDIS_URL'));
  return {
    db: createDb(need(env, 'DATABASE_URL'), { max: 3 }),
    redis,
    queue: createQueue(redis),
    counters: new RunCounters(redis, capsFromEnv(env)),
    storage: new S3Storage(s3ConfigFromEnv(env)),
    env,
    encryptionKey: need(env, 'DSE_JOB_ENCRYPTION_KEY'),
    adminToken: env.DSE_ADMIN_TOKEN ?? '',
    appUrl: (env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
    allowPrivateHosts: allowedPrivateHosts(env),
    production: env.NODE_ENV === 'production',
  };
}

export function services(): Services {
  holder.__dseServices ??= servicesFromEnv();
  return holder.__dseServices;
}

/** Tests build their own (test database, test Redis, test bucket). */
export function setServices(s: Services | undefined): void {
  holder.__dseServices = s;
}
