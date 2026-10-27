import { Redis, type RedisOptions } from 'ioredis';

/**
 * A Redis client with the settings BullMQ requires (docs/specs/caps-and-budget.md): no per-request
 * retry limit, no ready check, TLS when the URL is `rediss://`.
 */
export function createRedis(url: string, extra: RedisOptions = {}): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(url.startsWith('rediss://') ? { tls: {} } : {}),
    ...extra,
  });
}

/**
 * The web app's client: a request fails within seconds when Redis is down instead of waiting for it
 * (D-074). BullMQ needs the unbounded settings only where it blocks, which is the worker.
 */
export function createApiRedis(url: string, extra: RedisOptions = {}): Redis {
  return createRedis(url, { maxRetriesPerRequest: 1, connectTimeout: 5_000, commandTimeout: 5_000, ...extra });
}

/** The test Redis: the same server, logical database 15, so tests never touch development counters. */
export function testRedisUrl(url: string = process.env.REDIS_URL ?? 'redis://localhost:6379'): string {
  const u = new URL(url);
  u.pathname = '/15';
  return u.toString();
}
