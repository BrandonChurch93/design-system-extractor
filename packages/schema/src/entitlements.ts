import { z } from 'zod';
import { type PlanId, Viewport } from './enums';

export const Limits = z.object({
  runsPerDay: z.number().positive(),
  pageCap: z.number().int().positive(),
  includeCap: z.number().int().nonnegative(),
  viewports: z.array(Viewport).min(1),
  retentionDays: z.number().int().positive().nullable(),
  privateRuns: z.boolean(),
  scheduledRuns: z.boolean(),
  priority: z.number().int().nonnegative(),
  teamSeats: z.number().int().positive(),
});
export type Limits = z.infer<typeof Limits>;

export type LimitOverrides = Partial<Pick<Limits, 'runsPerDay' | 'pageCap'>>;

/**
 * The plans map (docs/specs/v2-seams.md). `free` is real in v1; `pro` and `team` are the v2
 * placeholders from docs/v2-plan.md and are never resolved for a viewer in v1. The free limits
 * that the environment configures (DSE_VISITOR_RUNS_PER_DAY, DSE_PAGE_CAP) are applied by
 * `planLimits`, so the env stays the only place a configured limit is set.
 */
export const plans: Record<PlanId, Limits> = {
  free: { runsPerDay: 2, pageCap: 12, includeCap: 5, viewports: ['desktop', 'mobile'], retentionDays: 90, privateRuns: false, scheduledRuns: false, priority: 0, teamSeats: 1 },
  pro: { runsPerDay: 30, pageCap: 40, includeCap: 5, viewports: ['desktop', 'mobile'], retentionDays: 365, privateRuns: true, scheduledRuns: true, priority: 5, teamSeats: 1 },
  team: { runsPerDay: 150, pageCap: 80, includeCap: 5, viewports: ['desktop', 'mobile'], retentionDays: null, privateRuns: true, scheduledRuns: true, priority: 7, teamSeats: 10 },
};

/** Not a plan: the limits `check` applies when a valid-looking key is present. */
export const byoLimits: Limits = { ...plans.free, runsPerDay: Infinity, pageCap: 40 };

/** Priority of showcase runs (docs/specs/v2-seams.md). */
export const SHOWCASE_PRIORITY = 10;

function envInt(source: Record<string, string | undefined>, key: string): number | undefined {
  const v = source[key];
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

/** The free plan with its env-configured limits applied; other plans as written. */
export function planLimits(plan: PlanId, source: Record<string, string | undefined> = process.env): Limits {
  if (plan !== 'free') return plans[plan];
  return {
    ...plans.free,
    runsPerDay: envInt(source, 'DSE_VISITOR_RUNS_PER_DAY') ?? plans.free.runsPerDay,
    pageCap: envInt(source, 'DSE_PAGE_CAP') ?? plans.free.pageCap,
  };
}

/** The BYO limits with the env-configured page cap applied. */
export function byoLimitsFrom(source: Record<string, string | undefined> = process.env): Limits {
  return { ...byoLimits, pageCap: envInt(source, 'DSE_BYO_PAGE_CAP') ?? byoLimits.pageCap };
}

/** The resolved identity of a request (docs/specs/v2-seams.md). `userId` is always null in v1. */
export type Viewer = { visitorId: string; userId: string | null; plan: PlanId; byoKey: boolean };
