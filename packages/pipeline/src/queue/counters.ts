import type { Redis } from 'ioredis';
import { budgetDay, COUNTER_TTL_S, HEARTBEAT_KEY, keys, nextReset } from './keys';

// The Redis counters behind the caps and the budget (docs/specs/caps-and-budget.md).

export type CapsConfig = {
  dailyBudgetUsd: number;
  visitorRunsPerDay: number;
  ipRunsPerDay: number;
  worstCaseRunUsd: number;
  timezone: string;
  rateLimitPerMinute: number;
};

export function capsFromEnv(env: Record<string, string | undefined> = process.env): CapsConfig {
  const num = (k: string, d: number) => {
    const v = Number(env[k]);
    return env[k] !== undefined && env[k] !== '' && Number.isFinite(v) && v >= 0 ? v : d;
  };
  return {
    dailyBudgetUsd: num('DSE_GLOBAL_DAILY_BUDGET_USD', 2),
    visitorRunsPerDay: Math.floor(num('DSE_VISITOR_RUNS_PER_DAY', 2)),
    ipRunsPerDay: 6,
    worstCaseRunUsd: num('DSE_WORST_CASE_RUN_USD', 0.6),
    timezone: env.DSE_BUDGET_TIMEZONE || 'America/Boise',
    rateLimitPerMinute: 5,
  };
}

/** The Redis keys a created run incremented, so its refund decrements exactly those. */
export type Counted = { visitorKey: string; ipKey: string };

/** The pre-check's budget rule, in cents: spent plus reserved plus one worst case must fit. */
export function budgetAllows(b: { usedCents: number; reservedCents: number; worstCaseCents: number; dailyCents: number }): boolean {
  return b.usedCents + b.reservedCents + b.worstCaseCents <= b.dailyCents + 1e-9;
}

// Sliding window: drop entries older than the window, refuse at the limit (returning the ms until
// the oldest entry leaves), else record this request.
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local n = redis.call('ZCARD', key)
if n >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return tonumber(oldest[2]) + window - now
end
redis.call('ZADD', key, now, ARGV[4])
redis.call('PEXPIRE', key, window)
return 0
`;

export class RunCounters {
  constructor(
    readonly redis: Redis,
    readonly caps: CapsConfig,
  ) {}

  day(at: Date = new Date()): string {
    return budgetDay(this.caps.timezone, at);
  }

  resetsAt(at: Date = new Date()): Date {
    return nextReset(this.caps.timezone, at);
  }

  async counts(visitorId: string, ipHash: string, day = this.day()): Promise<{ visitor: number; ip: number }> {
    const [v, i] = await this.redis.mget(keys.visitor(visitorId, day), keys.ip(ipHash, day));
    return { visitor: Number(v ?? 0), ip: Number(i ?? 0) };
  }

  /** Runs left today for a visitor: the stricter of the cookie count and the shared IP count. */
  async runsLeft(visitorId: string, ipHash: string, runsPerDay = this.caps.visitorRunsPerDay): Promise<number> {
    const c = await this.counts(visitorId, ipHash);
    return Math.max(0, Math.min(runsPerDay - c.visitor, this.caps.ipRunsPerDay - c.ip));
  }

  /** Counts a created run against the visitor and the IP. */
  async count(visitorId: string, ipHash: string, day = this.day()): Promise<Counted> {
    const counted = { visitorKey: keys.visitor(visitorId, day), ipKey: keys.ip(ipHash, day) };
    await this.redis
      .multi()
      .incr(counted.visitorKey)
      .expire(counted.visitorKey, COUNTER_TTL_S)
      .incr(counted.ipKey)
      .expire(counted.ipKey, COUNTER_TTL_S)
      .exec();
    return counted;
  }

  /** Gives a run back to its visitor; once per run however many paths reach it. */
  async refund(runId: string, counted: Counted): Promise<boolean> {
    const first = await this.redis.set(keys.refunded(runId), '1', 'EX', COUNTER_TTL_S, 'NX');
    if (first !== 'OK') return false;
    await this.redis.multi().decr(counted.visitorKey).decr(counted.ipKey).exec();
    return true;
  }

  /** Counts a created run toward today's site-wide total (the budget page's runs-today line). */
  async countRunToday(day = this.day()): Promise<void> {
    await this.redis.multi().incr(keys.runsToday(day)).expire(keys.runsToday(day), COUNTER_TTL_S).exec();
  }

  async runsToday(day = this.day()): Promise<number> {
    return Number((await this.redis.get(keys.runsToday(day))) ?? 0);
  }

  /** 0 when allowed, else the milliseconds until a request would be. */
  async rateLimit(ipHash: string, now = Date.now()): Promise<number> {
    const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;
    const wait = await this.redis.eval(RATE_LIMIT_LUA, 1, keys.rateLimit(ipHash), now, 60_000, this.caps.rateLimitPerMinute, member);
    return Math.max(0, Number(wait));
  }

  async budget(day = this.day()): Promise<{ usedCents: number; reservedCents: number }> {
    const [u, r] = await this.redis.mget(keys.budget(day), keys.reserved(day));
    return { usedCents: Number(u ?? 0), reservedCents: Math.max(0, Number(r ?? 0)) };
  }

  async budgetAllows(day = this.day()): Promise<boolean> {
    const b = await this.budget(day);
    return budgetAllows({ ...b, worstCaseCents: this.caps.worstCaseRunUsd * 100, dailyCents: this.caps.dailyBudgetUsd * 100 });
  }

  /** Remaining budget in USD: what is neither spent nor reserved. */
  async remainingUsd(day = this.day()): Promise<number> {
    const b = await this.budget(day);
    return Math.max(0, Math.round(this.caps.dailyBudgetUsd * 100 - b.usedCents - b.reservedCents) / 100);
  }

  /** Holds a worst case for a run until it ends; the actual spend replaces it call by call. */
  async reserve(runId: string, day = this.day()): Promise<void> {
    const cents = this.caps.worstCaseRunUsd * 100;
    await this.redis
      .multi()
      .incrbyfloat(keys.reserved(day), cents)
      .expire(keys.reserved(day), COUNTER_TTL_S)
      .set(keys.reservation(runId), `${day}:${cents}`, 'EX', COUNTER_TTL_S)
      .exec();
  }

  /** Releases a run's reservation; a no-op when it has none or was already released. */
  async release(runId: string): Promise<void> {
    const held = await this.redis.getdel(keys.reservation(runId));
    if (!held) return;
    const [day, cents] = held.split(':');
    await this.redis.incrbyfloat(keys.reserved(day!), -Number(cents));
  }

  /** Adds a model call's cost to today's spend. Cents are kept fractional: one call costs less than a cent. */
  async addSpend(usd: number, day = this.day()): Promise<void> {
    if (!(usd > 0)) return;
    await this.redis.multi().incrbyfloat(keys.budget(day), usd * 100).expire(keys.budget(day), COUNTER_TTL_S).exec();
  }

  async heartbeat(at: Date = new Date()): Promise<void> {
    await this.redis.set(HEARTBEAT_KEY, at.toISOString(), 'EX', 60);
  }

  /** Seconds since the worker's last heartbeat, or null when there is none. */
  async heartbeatAge(at: Date = new Date()): Promise<number | null> {
    const v = await this.redis.get(HEARTBEAT_KEY);
    if (!v) return null;
    return Math.max(0, (at.getTime() - Date.parse(v)) / 1000);
  }

  async requestCancel(runId: string): Promise<void> {
    await this.redis.set(keys.cancel(runId), '1', 'EX', 3600);
  }

  async cancelRequested(runId: string): Promise<boolean> {
    return (await this.redis.exists(keys.cancel(runId))) === 1;
  }
}
