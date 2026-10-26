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

/** The test Redis: the same server, logical database 15, so tests never touch development counters. */
export function testRedisUrl(url: string = process.env.REDIS_URL ?? 'redis://localhost:6379'): string {
  const u = new URL(url);
  u.pathname = '/15';
  return u.toString();
}
