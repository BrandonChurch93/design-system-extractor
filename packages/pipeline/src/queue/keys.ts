// Redis key names and the budget day (docs/specs/caps-and-budget.md, Counting). Every counter
// lives 48 hours; the day is the calendar day in DSE_BUDGET_TIMEZONE.

export const COUNTER_TTL_S = 48 * 3600;
export const HEARTBEAT_KEY = 'worker:heartbeat';

export const keys = {
  visitor: (visitorId: string, day: string) => `cap:visitor:${visitorId}:${day}`,
  ip: (ipHash: string, day: string) => `cap:ip:${ipHash}:${day}`,
  budget: (day: string) => `budget:${day}`,
  reserved: (day: string) => `budget:reserved:${day}`,
  runsToday: (day: string) => `runs:${day}`,
  rateLimit: (ipHash: string) => `rl:runs:${ipHash}`,
  cancel: (runId: string) => `cancel:${runId}`,
  refunded: (runId: string) => `refund:${runId}`,
  reservation: (runId: string) => `reserve:${runId}`,
};

function parts(tz: string, at: Date) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), min: Number(p.minute), s: Number(p.second) };
}

/** `YYYY-MM-DD` of `at` in the time zone. */
export function budgetDay(tz: string, at: Date = new Date()): string {
  const { y, m, d } = parts(tz, at);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Milliseconds the zone's wall clock is ahead of UTC at `at`. */
function offsetMs(tz: string, at: Date): number {
  const p = parts(tz, at);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(at.getTime() / 1000) * 1000;
}

/** The next local midnight in the time zone: when today's counters stop applying. */
export function nextReset(tz: string, at: Date = new Date()): Date {
  const { y, m, d } = parts(tz, at);
  const wall = Date.UTC(y, m - 1, d + 1, 0, 0, 0);
  let guess = wall - offsetMs(tz, new Date(wall));
  // A daylight-saving change between the guess and midnight moves the offset; one correction settles it.
  guess = wall - offsetMs(tz, new Date(guess));
  return new Date(guess);
}

/** Whole hours until the reset, at least one, for "in about {hours} hours". */
export function hoursUntil(reset: Date, at: Date = new Date()): number {
  return Math.max(1, Math.round((reset.getTime() - at.getTime()) / 3_600_000));
}
