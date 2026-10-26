import { describe, expect, it } from 'vitest';
import { byoKeyOf, check, clientIp, limitsFor, resolveViewer, type RunFacts } from '../lib/entitlements';
import { etagOf, isAdmin, visitorCookie } from '../lib/server/http';

const SECRET = Buffer.alloc(32, 3).toString('base64');
const KEY = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789';

const req = (headers: Record<string, string> = {}) => new Request('http://localhost:3000/api/runs', { method: 'POST', headers });

describe('resolveViewer', () => {
  it('reads the visitor cookie when it is well formed', () => {
    const v = resolveViewer(req({ cookie: 'a=1; dse_v=AbCdEfGh_-012345; b=2', 'x-forwarded-for': '203.0.113.9' }), SECRET);
    expect(v).toMatchObject({ visitorId: 'AbCdEfGh_-012345', userId: null, plan: 'free', byoKey: false, cookieMissing: false });
  });

  it('falls back to a keyed hash of the address and user agent, the same on every request', () => {
    const a = resolveViewer(req({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1', 'user-agent': 'A' }), SECRET);
    const b = resolveViewer(req({ 'x-forwarded-for': '203.0.113.9', 'user-agent': 'A', cookie: 'dse_v=not valid!' }), SECRET);
    const c = resolveViewer(req({ 'x-forwarded-for': '203.0.113.9', 'user-agent': 'B' }), SECRET);
    expect(a.cookieMissing).toBe(true);
    expect(a.visitorId).toMatch(/^[0-9A-Za-z_-]{16}$/);
    expect(b.visitorId).toBe(a.visitorId);
    expect(c.visitorId).not.toBe(a.visitorId);
    expect(c.ipHash).toBe(a.ipHash);
  });

  it('takes the first forwarded address, else the real-ip header, else loopback', () => {
    expect(clientIp(req({ 'x-forwarded-for': ' 198.51.100.4 , 10.0.0.1' }))).toBe('198.51.100.4');
    expect(clientIp(req({ 'x-real-ip': '198.51.100.5' }))).toBe('198.51.100.5');
    expect(clientIp(req())).toBe('127.0.0.1');
  });

  it('notices a key only when it has the key shape', () => {
    expect(resolveViewer(req({ 'x-byo-key': KEY }), SECRET).byoKey).toBe(true);
    expect(byoKeyOf(req({ 'x-byo-key': KEY }))).toBe(KEY);
    expect(resolveViewer(req({ 'x-byo-key': 'sk-wrong' }), SECRET).byoKey).toBe(false);
    expect(byoKeyOf(req({ 'x-byo-key': 'sk-wrong' }))).toBeUndefined();
  });
});

describe('limitsFor', () => {
  const free = { visitorId: 'v', userId: null, plan: 'free' as const, byoKey: false };
  it('applies the env page caps to free and to a key', () => {
    expect(limitsFor(free, {})).toMatchObject({ runsPerDay: 2, pageCap: 12, includeCap: 5, priority: 0, retentionDays: 90 });
    expect(limitsFor(free, { DSE_PAGE_CAP: '8', DSE_VISITOR_RUNS_PER_DAY: '4' })).toMatchObject({ runsPerDay: 4, pageCap: 8 });
    expect(limitsFor({ ...free, byoKey: true }, {})).toMatchObject({ runsPerDay: Infinity, pageCap: 40, includeCap: 5 });
    expect(limitsFor({ ...free, byoKey: true }, { DSE_BYO_PAGE_CAP: '30' }).pageCap).toBe(30);
  });
});

describe('check', () => {
  const viewer = { visitorId: 'v', userId: null, plan: 'free' as const, byoKey: false };
  const byo = { ...viewer, byoKey: true };
  const base: RunFacts = { queueDepth: 0, visitorRuns: 0, ipRuns: 0, ipRunsPerDay: 6, usedCents: 0, reservedCents: 0, worstCaseCents: 60, dailyBudgetCents: 200, runsToday: 7, resetsAt: '2026-10-27T06:00:00.000Z' };
  const run = (v: typeof viewer, f: Partial<RunFacts>) => check(v, { type: 'create-run', facts: { ...base, ...f } }, {});

  it('decides in the order busy, visitor cap, budget', () => {
    const table: [typeof viewer, Partial<RunFacts>, string][] = [
      [viewer, {}, 'ok'],
      [viewer, { queueDepth: 20 }, 'ok'],
      [viewer, { queueDepth: 21, visitorRuns: 5, usedCents: 999 }, 'busy'],
      [byo, { queueDepth: 21 }, 'busy'],
      [viewer, { visitorRuns: 2, usedCents: 999 }, 'visitor-cap'],
      [viewer, { ipRuns: 6 }, 'visitor-cap'],
      [viewer, { ipRuns: 5 }, 'ok'],
      [viewer, { usedCents: 141 }, 'budget'],
      [viewer, { usedCents: 80, reservedCents: 61 }, 'budget'],
      [viewer, { usedCents: 80, reservedCents: 60 }, 'ok'],
      [byo, { visitorRuns: 9, ipRuns: 9, usedCents: 999 }, 'ok'],
    ];
    for (const [v, f, want] of table) {
      const r = run(v, f);
      expect(r.ok ? 'ok' : r.blocked, JSON.stringify(f)).toBe(want);
    }
  });

  it('lets a showcase run past the cap and the budget, never the queue', () => {
    expect(run(viewer, { showcase: true, visitorRuns: 9, usedCents: 999 })).toEqual({ ok: true });
    expect(run(viewer, { showcase: true, queueDepth: 30 })).toMatchObject({ blocked: 'busy', detail: { queued: 30 } });
  });

  it('gives the state pages their numbers', () => {
    expect(run(viewer, { usedCents: 187.4 })).toEqual({ ok: false, blocked: 'budget', detail: { used: 1.87, budget: 2, runsToday: 7, resetsAt: base.resetsAt } });
    expect(run(viewer, { visitorRuns: 2 })).toEqual({ ok: false, blocked: 'visitor-cap', detail: { used: 2, budget: 2, runsToday: 2, resetsAt: base.resetsAt } });
  });

  it('caps added pages at five for everyone', () => {
    expect(check(viewer, { type: 'include-urls', count: 5 }, {})).toEqual({ ok: true });
    expect(check(byo, { type: 'include-urls', count: 6 }, {})).toMatchObject({ blocked: 'invalid-url' });
  });
});

describe('http helpers', () => {
  it('sets the visitor cookie for a year, httpOnly, lax, secure in production', () => {
    expect(visitorCookie('AbCdEfGh_-012345', false)).toBe('dse_v=AbCdEfGh_-012345; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax');
    expect(visitorCookie('AbCdEfGh_-012345', true)).toMatch(/; Secure$/);
  });

  it('security · admits only the exact bearer token, and nobody when the token is short or unset', () => {
    const token = 't'.repeat(40);
    const auth = (v: string) => new Request('http://x/', { headers: { authorization: v } });
    expect(isAdmin(auth(`Bearer ${token}`), token)).toBe(true);
    expect(isAdmin(auth(`bearer ${token}`), token)).toBe(true);
    expect(isAdmin(auth(`Bearer ${token}x`), token)).toBe(false);
    expect(isAdmin(auth(token), token)).toBe(false);
    expect(isAdmin(auth('Bearer '), '')).toBe(false);
    expect(isAdmin(auth('Bearer short'), 'short')).toBe(false);
  });

  it('makes a weak ETag from the body', () => {
    expect(etagOf('{"a":1}')).toBe(etagOf('{"a":1}'));
    expect(etagOf('{"a":1}')).not.toBe(etagOf('{"a":2}'));
    expect(etagOf('x')).toMatch(/^W\/".+"$/);
  });
});
