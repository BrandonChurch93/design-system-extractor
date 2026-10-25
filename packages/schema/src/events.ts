import { z } from 'zod';
import { EventLevel, Stage, Substage } from './enums';
import { RunId } from './ids';

/** One row of `run_events`; the live log shows `message` as written. */
export const RunEvent = z.object({
  id: z.number().int().positive(),
  runId: RunId,
  ts: z.string().datetime({ offset: true }),
  stage: Stage,
  substage: Substage.nullable().optional(),
  level: EventLevel,
  message: z.string().min(1),
  data: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type RunEvent = z.infer<typeof RunEvent>;
