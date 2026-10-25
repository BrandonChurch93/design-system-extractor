import { and, asc, eq, gt } from 'drizzle-orm';
import { RunDocumentPartial, type EventLevel, type RunDocumentPatch, type Stage, type Substage, type Viewer } from '@dse/schema';
import type { Db } from './client';
import { deepMerge } from './deep-merge';
import { runEvents, runs, type RunEventRow, type RunRow } from './tables';

export class RunNotFoundError extends Error {
  constructor(id: string) {
    super(`run ${id} not found`);
    this.name = 'RunNotFoundError';
  }
}

/**
 * Deep-merges `patch` into the run's document inside one transaction (a locked
 * read-modify-write), validates the result as a partial document, and returns it.
 */
export async function applyPatch(db: Db, runId: string, patch: RunDocumentPatch): Promise<RunDocumentPartial> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select({ document: runs.document }).from(runs).where(eq(runs.id, runId)).for('update');
    if (!row) throw new RunNotFoundError(runId);
    const merged = deepMerge(row.document as Record<string, unknown>, patch as Record<string, unknown>);
    const doc = RunDocumentPartial.parse(merged);
    await tx.update(runs).set({ document: doc }).where(eq(runs.id, runId));
    return doc;
  });
}

export type NewEvent = { stage: Stage; substage?: Substage | null; level?: EventLevel; message: string; data?: Record<string, unknown> | null };

export async function appendEvent(db: Db, runId: string, event: NewEvent): Promise<RunEventRow> {
  const [row] = await db
    .insert(runEvents)
    .values({ runId, stage: event.stage, substage: event.substage ?? null, level: event.level ?? 'info', message: event.message, data: event.data ?? null })
    .returning();
  if (!row) throw new Error('event insert returned nothing');
  return row;
}

export async function listEvents(db: Db, runId: string, afterId = 0): Promise<RunEventRow[]> {
  return db.select().from(runEvents).where(and(eq(runEvents.runId, runId), gt(runEvents.id, afterId))).orderBy(asc(runEvents.id));
}

/**
 * The single read path for a run (docs/specs/v2-seams.md). In v1 every published run is
 * readable by link; v2 adds the private-run owner check here.
 */
export async function getRunForViewer(db: Db, runId: string, _viewer: Viewer | null): Promise<RunRow | null> {
  const [row] = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);
  if (!row || row.unpublished) return null;
  return row;
}
