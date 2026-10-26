import { byoLimitsFrom, planLimits, VisitorId, type BlockedDetail, type BlockedReason, type Limits, type Viewer } from '@dse/schema';
import { budgetAllows } from '@dse/pipeline/queue/counters';
import { identityHash, isByoKeyShape } from '@dse/pipeline/queue/crypto';

// The one module that answers what a viewer may do (docs/specs/v2-seams.md, docs/specs/caps-and-budget.md).
// `resolveViewer` is the only place identity is read; every limit decision goes through `check`.

export const VISITOR_COOKIE = 'dse_v';
export const BYO_HEADER = 'x-byo-key';
export const QUEUE_BUSY_OVER = 20;

/** A viewer, plus the keyed hash of its IP and whether the visitor cookie still has to be set. */
export type ResolvedViewer = Viewer & { ipHash: string; cookieMissing: boolean };

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** The client address from the platform's forwarded header (Vercel sets the first entry). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return fwd || request.headers.get('x-real-ip')?.trim() || '127.0.0.1';
}

/**
 * The visitor is the `dse_v` cookie. Without one, the visitor is a keyed hash of the IP and the
 * user agent, and that same value becomes the cookie, so a client that refuses cookies keeps one
 * identity and a first-time visitor's first run counts where the next ones will (D-057).
 */
export function resolveViewer(request: Request, secret: string): ResolvedViewer {
  const ip = clientIp(request);
  const cookie = cookieValue(request, VISITOR_COOKIE);
  const fromCookie = cookie && VisitorId.safeParse(cookie).success ? cookie : undefined;
  const visitorId = fromCookie ?? identityHash(`${ip}\n${request.headers.get('user-agent') ?? ''}`, secret, 16);
  return {
    visitorId,
    userId: null,
    plan: 'free',
    byoKey: isByoKeyShape(request.headers.get(BYO_HEADER)),
    ipHash: identityHash(ip, secret, 16),
    cookieMissing: !fromCookie,
  };
}

/** The key a request carries, when it has the right shape. Read once, passed straight to sealing. */
export function byoKeyOf(request: Request): string | undefined {
  const v = request.headers.get(BYO_HEADER);
  return isByoKeyShape(v) ? v : undefined;
}

export function limitsFor(viewer: Viewer, env: Record<string, string | undefined> = process.env): Limits {
  return viewer.byoKey ? byoLimitsFrom(env) : planLimits(viewer.plan, env);
}

/** What the pre-check measured before asking (steps 5 to 7 of the pre-check). */
export type RunFacts = {
  queueDepth: number;
  visitorRuns: number;
  ipRuns: number;
  ipRunsPerDay: number;
  usedCents: number;
  reservedCents: number;
  worstCaseCents: number;
  dailyBudgetCents: number;
  runsToday: number;
  resetsAt: string;
  /** Showcase runs (the owner's) skip the visitor cap and the budget, never the queue. */
  showcase?: boolean;
};

export type Action = { type: 'create-run'; facts: RunFacts } | { type: 'include-urls'; count: number };

export type CheckResult = { ok: true } | { ok: false; blocked: BlockedReason; detail: BlockedDetail };

export function check(viewer: Viewer, action: Action, env: Record<string, string | undefined> = process.env): CheckResult {
  const limits = limitsFor(viewer, env);
  if (action.type === 'include-urls') {
    return action.count <= limits.includeCap ? { ok: true } : { ok: false, blocked: 'invalid-url', detail: { reason: `more than ${limits.includeCap} added pages` } };
  }
  const f = action.facts;
  if (f.queueDepth > QUEUE_BUSY_OVER) return { ok: false, blocked: 'busy', detail: { queued: f.queueDepth } };
  if (f.showcase) return { ok: true };
  if (!viewer.byoKey && (f.visitorRuns >= limits.runsPerDay || f.ipRuns >= f.ipRunsPerDay)) {
    const used = Math.max(f.visitorRuns, Math.min(f.ipRuns, limits.runsPerDay));
    return { ok: false, blocked: 'visitor-cap', detail: { used, budget: limits.runsPerDay, runsToday: used, resetsAt: f.resetsAt } };
  }
  if (!viewer.byoKey && !budgetAllows({ usedCents: f.usedCents, reservedCents: f.reservedCents, worstCaseCents: f.worstCaseCents, dailyCents: f.dailyBudgetCents })) {
    return { ok: false, blocked: 'budget', detail: { used: Math.round(f.usedCents) / 100, budget: f.dailyBudgetCents / 100, runsToday: f.runsToday, resetsAt: f.resetsAt } };
  }
  return { ok: true };
}
