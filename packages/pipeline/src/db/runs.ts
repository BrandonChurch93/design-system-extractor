import { and, asc, count, eq, gt, inArray, isNotNull, lt, or, sql } from 'drizzle-orm';
import { RunDocumentPartial, type EventLevel, type Page, type RunDocumentPatch, type RunStatus, type Stage, type Substage, type Viewer } from '@dse/schema';
import type { Db } from './client';
import { deepMerge } from './deep-merge';
import { runEvents, runPages, runs, type NewRunRow, type RunEventRow, type RunRow } from './tables';

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
    await tx.update(runs).set({ document: doc, ...columnsOf(doc) }).where(eq(runs.id, runId));
    return doc;
  });
}

/** The columns that mirror the document, so queries never read the JSON. */
function columnsOf(doc: RunDocumentPartial): Partial<NewRunRow> {
  return {
    status: doc.status,
    blockedReason: doc.blockedReason ?? null,
    blockedDetail: doc.blockedDetail ?? null,
    startedAt: doc.startedAt ?? null,
    finishedAt: doc.finishedAt ?? null,
    durationMs: doc.durationMs ?? null,
    stats: doc.stats ?? null,
    cost: doc.cost ?? null,
    frameworkHint: doc.frameworkHint ?? null,
  };
}

export const terminalStatuses: RunStatus[] = ['complete', 'blocked', 'failed', 'cancelled'];
export const isTerminal = (s: RunStatus) => terminalStatuses.includes(s);

export async function insertRun(db: Db, values: NewRunRow): Promise<RunRow> {
  const [row] = await db.insert(runs).values(values).returning();
  if (!row) throw new Error('run insert returned nothing');
  return row;
}

export async function getRun(db: Db, runId: string): Promise<RunRow | null> {
  const [row] = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);
  return row ?? null;
}

/**
 * The status gate (docs/specs/caps-and-budget.md, Job retry): a worker may take a run only while it
 * is queued, or running after a crash; never a frozen QA document, never a finished run.
 */
export async function claimRun(db: Db, runId: string): Promise<RunRow | null> {
  const [row] = await db
    .update(runs)
    .set({ status: 'running' })
    .where(and(eq(runs.id, runId), inArray(runs.status, ['queued', 'running']), eq(runs.qaFrozen, false)))
    .returning();
  return row ?? null;
}

/** A retried run starts from the beginning: the first document, no pages, no log. */
export async function resetRun(db: Db, runId: string, document: RunDocumentPartial): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(runEvents).where(eq(runEvents.runId, runId));
    await tx.delete(runPages).where(eq(runPages.runId, runId));
    await tx.update(runs).set({ document, ...columnsOf(document) }).where(eq(runs.id, runId));
  });
}

/**
 * Ends a run that has not ended, with one patch; returns null when it already had. Used outside
 * the pipeline: cancelling a queued run, and the worker's crash handler.
 */
export async function finishOpenRun(db: Db, runId: string, patch: RunDocumentPatch): Promise<RunDocumentPartial | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select({ document: runs.document, status: runs.status }).from(runs).where(eq(runs.id, runId)).for('update');
    if (!row || isTerminal(row.status)) return null;
    const doc = RunDocumentPartial.parse(deepMerge(row.document as Record<string, unknown>, patch as Record<string, unknown>));
    await tx.update(runs).set({ document: doc, ...columnsOf(doc) }).where(eq(runs.id, runId));
    return doc;
  });
}

/** Keeps `run_pages` in step with the document's page list. */
export async function syncPages(db: Db, runId: string, pages: Page[]): Promise<void> {
  if (!pages.length) return;
  const rows = pages.map((p, i) => ({
    id: p.id,
    runId,
    url: p.url,
    path: p.path,
    reason: p.reason,
    templateGroup: p.templateGroup ?? null,
    templateSize: p.templateSize ?? null,
    selected: true,
    order: i,
    status: p.status,
    nodeCount: p.nodeCount,
    captureDesktopKey: p.captures.desktop?.screenshotKey ?? null,
    captureMobileKey: p.captures.mobile?.screenshotKey ?? null,
    title: p.title,
    h1: p.h1,
  }));
  await db
    .insert(runPages)
    .values(rows)
    .onConflictDoUpdate({
      target: [runPages.runId, runPages.id],
      set: {
        status: sql`excluded.status`,
        order: sql`excluded.order`,
        nodeCount: sql`excluded.node_count`,
        captureDesktopKey: sql`excluded.capture_desktop_key`,
        captureMobileKey: sql`excluded.capture_mobile_key`,
        title: sql`excluded.title`,
        h1: sql`excluded.h1`,
      },
    });
}

const waiting = and(eq(runs.status, 'queued'), eq(runs.qaFrozen, false));

/** Runs waiting for the worker. Frozen QA documents never count. */
export async function queueDepth(db: Db): Promise<number> {
  const [r] = await db.select({ n: count() }).from(runs).where(waiting);
  return Number(r?.n ?? 0);
}

/** Queued runs the worker takes before this one: higher priority, or equal and older. */
export async function queuePosition(db: Db, run: Pick<RunRow, 'id' | 'priority' | 'createdAt'>): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(runs)
    .where(and(waiting, sql`${runs.id} <> ${run.id}`, or(gt(runs.priority, run.priority), and(eq(runs.priority, run.priority), lt(runs.createdAt, run.createdAt)))));
  return Number(r?.n ?? 0);
}

/** Runs whose retention has passed (showcase runs have none). */
export async function expiredRunIds(db: Db, now: Date = new Date()): Promise<string[]> {
  const rows = await db
    .select({ id: runs.id })
    .from(runs)
    .where(and(isNotNull(runs.retentionUntil), lt(runs.retentionUntil, now.toISOString()), eq(runs.isShowcase, false)));
  return rows.map((r) => r.id);
}

export async function deleteRun(db: Db, runId: string): Promise<void> {
  await db.delete(runs).where(eq(runs.id, runId));
}

const DAY_MS = 86_400_000;

/** Removes a run from the showcase and hides it (D-034); it expires in 90 days. */
export async function unpublishRun(db: Db, runId: string, now: Date = new Date()): Promise<boolean> {
  const r = await db
    .update(runs)
    .set({ isShowcase: false, unpublished: true, retentionUntil: new Date(now.getTime() + 90 * DAY_MS).toISOString() })
    .where(eq(runs.id, runId))
    .returning({ id: runs.id });
  return r.length > 0;
}

/** Lists a run in the showcase (null retention) or takes it out (90 days from now). */
export async function setShowcase(db: Db, runId: string, on: boolean, now: Date = new Date()): Promise<void> {
  await db
    .update(runs)
    .set({ isShowcase: on, retentionUntil: on ? null : new Date(now.getTime() + 90 * DAY_MS).toISOString() })
    .where(eq(runs.id, runId));
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
