import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { z } from 'zod';

export const QUEUE_NAME = 'dse';
export const RUN_JOB = 'run';
export const RETENTION_JOB = 'retention';

/** What a run job carries: the run id, the sealed key of a BYO run, and the counters to refund. */
export const RunJobData = z.object({
  runId: z.string().regex(/^[0-9a-z]{10}$/),
  byoKeyCiphertext: z.string().optional(),
  counted: z.object({ visitorKey: z.string(), ipKey: z.string() }).optional(),
});
export type RunJobData = z.infer<typeof RunJobData>;

/**
 * BullMQ takes the lowest number first; the app's priorities run the other way (0 free, 5 pro,
 * 7 team, 10 showcase, docs/specs/v2-seams.md). Every job gets an explicit BullMQ priority so
 * one ordering covers them all.
 */
export function bullPriority(priority: number): number {
  return Math.max(1, 100 - Math.round(priority));
}

export function createQueue(connection: Redis): Queue {
  return new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: { removeOnComplete: { age: 86_400, count: 500 }, removeOnFail: { age: 7 * 86_400, count: 500 } },
  });
}

export async function enqueueRun(queue: Queue, data: RunJobData, priority: number): Promise<void> {
  await queue.add(RUN_JOB, RunJobData.parse(data), { jobId: data.runId, priority: bullPriority(priority), attempts: 2 });
}

/** Takes a queued run's job off the queue; false when a worker already holds it. */
export async function removeQueuedRun(queue: Queue, runId: string): Promise<boolean> {
  const job = await queue.getJob(runId);
  if (!job) return true;
  const state = await job.getState();
  if (state === 'active' || state === 'completed' || state === 'failed') return false;
  await job.remove();
  return true;
}
