import './zod-config';
import { z } from 'zod';
import { BlockedReason, RunStatus } from './enums';
import { RunEvent } from './events';
import { RunId } from './ids';
import { BlockedDetail, RunDocumentPartial } from './run-document';

/** `POST /api/runs` body. The BYO key travels in the `x-byo-key` header, never here. */
export const CreateRunBody = z
  .object({
    url: z.string().min(1).max(2048),
    include: z.array(z.string().min(1).max(2048)).max(5).optional(),
  })
  .strict();
export type CreateRunBody = z.infer<typeof CreateRunBody>;

export const CreateRunCreated = z.object({ id: RunId, runsLeft: z.number().nonnegative().nullable() });
export type CreateRunCreated = z.infer<typeof CreateRunCreated>;

/** A blocked run is a result, not an error. `runsLeft` is null when a key lifts the limit. */
export const BlockedResult = z.object({
  blocked: BlockedReason,
  detail: BlockedDetail,
  runsLeft: z.number().nonnegative().nullable(),
});
export type BlockedResult = z.infer<typeof BlockedResult>;

export const CreateRunResponse = z.union([CreateRunCreated, BlockedResult]);
export type CreateRunResponse = z.infer<typeof CreateRunResponse>;

/** `GET /api/runs/{id}`. */
export const RunResponse = z.object({
  id: RunId,
  status: RunStatus,
  isShowcase: z.boolean(),
  queuePosition: z.number().int().nonnegative().optional(),
  document: RunDocumentPartial,
  events: z.array(RunEvent),
});
export type RunResponse = z.infer<typeof RunResponse>;

/** `GET /api/me`. `runsPerDay` is the configured limit for the free plan. */
export const MeResponse = z.object({
  runsLeft: z.number().int().nonnegative(),
  runsPerDay: z.number().int().positive(),
  resetsAt: z.string().datetime({ offset: true }),
});
export type MeResponse = z.infer<typeof MeResponse>;

/** `GET /api/health`. */
export const HealthResponse = z.object({
  ok: z.boolean(),
  worker: z.object({ alive: z.boolean(), queueDepth: z.number().int().nonnegative() }),
  budget: z.object({ remaining: z.number(), resetsAt: z.string().datetime({ offset: true }) }),
});
export type HealthResponse = z.infer<typeof HealthResponse>;

export const ApiError = z.object({ error: z.string() });
export type ApiError = z.infer<typeof ApiError>;

/** `POST /api/admin/showcase/run`. */
export const AdminShowcaseRunBody = z.object({ url: z.string().url() }).strict();
export type AdminShowcaseRunBody = z.infer<typeof AdminShowcaseRunBody>;
