import { describe, expect, it } from 'vitest';
import { budgetAllows, budgetDay, bullPriority, capsFromEnv, decryptSecret, encryptSecret, hoursUntil, identityHash, isByoKeyShape, nextReset } from '../src/queue';

const KEY = Buffer.alloc(32, 7).toString('base64');
const OTHER = Buffer.alloc(32, 8).toString('base64');
const TZ = 'America/Boise';

describe('the budget day', () => {
  it('is the calendar day in the budget time zone', () => {
    expect(budgetDay(TZ, new Date('2026-10-26T05:59:00Z'))).toBe('2026-10-25');
    expect(budgetDay(TZ, new Date('2026-10-26T06:00:00Z'))).toBe('2026-10-26');
    expect(budgetDay('UTC', new Date('2026-10-26T05:59:00Z'))).toBe('2026-10-26');
  });

  it('resets at the next local midnight, across the end of daylight saving time', () => {
    expect(nextReset(TZ, new Date('2026-10-26T12:00:00Z')).toISOString()).toBe('2026-10-27T06:00:00.000Z');
    expect(nextReset(TZ, new Date('2026-10-31T12:00:00Z')).toISOString()).toBe('2026-11-01T06:00:00.000Z');
    expect(nextReset(TZ, new Date('2026-11-01T12:00:00Z')).toISOString()).toBe('2026-11-02T07:00:00.000Z');
    expect(nextReset(TZ, new Date('2026-03-08T12:00:00Z')).toISOString()).toBe('2026-03-09T06:00:00.000Z');
  });

  it('rounds the hours left to whole hours, at least one', () => {
    const now = new Date('2026-10-26T12:00:00Z');
    expect(hoursUntil(nextReset(TZ, now), now)).toBe(18);
    expect(hoursUntil(new Date(now.getTime() + 60_000), now)).toBe(1);
  });
});

describe('budget arithmetic', () => {
  it('requires spent plus reserved plus a worst case to fit, in cents', () => {
    const daily = 200;
    const cases: [number, number, boolean][] = [
      [0, 0, true],
      [140, 0, true],
      [140.01, 0, false],
      [80, 60, true],
      [80, 120, false],
      [0, 140, true],
      [0, 180, false],
    ];
    for (const [usedCents, reservedCents, ok] of cases) expect(budgetAllows({ usedCents, reservedCents, worstCaseCents: 60, dailyCents: daily }), `${usedCents}+${reservedCents}`).toBe(ok);
  });

  it('reads the caps from the environment with the documented defaults', () => {
    expect(capsFromEnv({})).toEqual({ dailyBudgetUsd: 2, visitorRunsPerDay: 2, ipRunsPerDay: 6, worstCaseRunUsd: 0.6, timezone: 'America/Boise', rateLimitPerMinute: 5 });
    expect(capsFromEnv({ DSE_GLOBAL_DAILY_BUDGET_USD: '5', DSE_VISITOR_RUNS_PER_DAY: '3', DSE_WORST_CASE_RUN_USD: '0.25', DSE_BUDGET_TIMEZONE: 'UTC' })).toMatchObject({ dailyBudgetUsd: 5, visitorRunsPerDay: 3, worstCaseRunUsd: 0.25, timezone: 'UTC' });
  });
});

describe('queue priority', () => {
  it('takes showcase, then team, then pro, then free (BullMQ takes the lowest number first)', () => {
    const order = [0, 5, 7, 10].map(bullPriority);
    expect(order).toEqual([100, 95, 93, 90]);
    expect([...order].sort((a, b) => a - b)).toEqual([90, 93, 95, 100]);
  });
});

describe('security · BYO key sealing', () => {
  const key = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789';

  it('round-trips with a fresh IV each time and never contains the key', () => {
    const a = encryptSecret(key, KEY);
    const b = encryptSecret(key, KEY);
    expect(a).not.toBe(b);
    expect(a).not.toContain('sk-ant');
    expect(decryptSecret(a, KEY)).toBe(key);
  });

  it('refuses altered ciphertext and the wrong key', () => {
    const sealed = encryptSecret(key, KEY);
    const raw = Buffer.from(sealed, 'base64url');
    raw[raw.length - 1] = raw[raw.length - 1]! ^ 1;
    expect(() => decryptSecret(raw.toString('base64url'), KEY)).toThrow();
    expect(() => decryptSecret(sealed, OTHER)).toThrow();
    expect(() => decryptSecret('short', KEY)).toThrow();
    expect(() => encryptSecret(key, Buffer.alloc(16).toString('base64'))).toThrow(/32 bytes/);
  });

  it('accepts only the key shape: the prefix, safe characters, at most 200 characters', () => {
    const table: [string | null, boolean][] = [
      [key, true],
      ['sk-ant-x', true],
      [`sk-ant-${'a'.repeat(193)}`, true],
      [`sk-ant-${'a'.repeat(194)}`, false],
      ['sk-proj-abc', false],
      ['sk-ant-abc def', false],
      ['sk-ant-abc\nX-Other: 1', false],
      ['', false],
      [null, false],
    ];
    for (const [v, ok] of table) expect(isByoKeyShape(v), String(v)).toBe(ok);
  });

  it('hashes identities with the key, stably, to a cookie-safe value', () => {
    const h = identityHash('203.0.113.9', KEY);
    expect(h).toMatch(/^[0-9A-Za-z_-]{16}$/);
    expect(identityHash('203.0.113.9', KEY)).toBe(h);
    expect(identityHash('203.0.113.9', OTHER)).not.toBe(h);
    expect(identityHash('203.0.113.10', KEY)).not.toBe(h);
  });
});
