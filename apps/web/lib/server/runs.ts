import { sql } from 'drizzle-orm';
import { CreateRunBody, newRunId, RunDocumentPartial, RunEvent, SHOWCASE_PRIORITY, stageLabels, type BlockedResult, type CreateRunCreated, type RunResponse } from '@dse/schema';
import { appendEvent, finishOpenRun, getRunForViewer, insertRun, isTerminal, listEvents, queueDepth, queuePosition, tables, type Db } from '@dse/pipeline/db';
import { checkTarget, validateUrlShape } from '@dse/pipeline/net/private-ranges';
import { encryptSecret, enqueueRun, RunJobData, type Counted } from '@dse/pipeline/queue';
import { PIPELINE_VERSION } from '@dse/pipeline/version';
import { upgradeRunDocument } from '@dse/pipeline/upgrade';
import { check, limitsFor, type ResolvedViewer } from '../entitlements';
import type { Services } from './services';

const DAY_MS = 86_400_000;

export type AdmitInput = {
  body: unknown;
  viewer: ResolvedViewer;
  /** The visitor's key, only when the header had the right shape. Sealed here and dropped. */
  byoKey?: string;
  /** The owner's showcase path: priority 10, no visitor cap, no budget, no rate limit. */
  showcase?: boolean;
  /** Fixed ids for the fixture seed. */
  id?: string;
  now?: Date;
};

export type AdmitResult =
  | { kind: 'invalid' }
  | { kind: 'rate-limited'; retryAfterS: number }
  | { kind: 'blocked'; body: BlockedResult }
  | { kind: 'created'; body: CreateRunCreated };

const sameSite = (a: URL, b: URL) => a.host.replace(/^www\./, '') === b.host.replace(/^www\./, '');

/** The pre-check of `POST /api/runs`, in its order, then the run row and the job (docs/specs/caps-and-budget.md). */
export async function admitRun(svc: Services, input: AdmitInput): Promise<AdmitResult> {
  const { viewer } = input;
  const now = input.now ?? new Date();
  const limits = limitsFor(viewer, svc.env);
  const runsLeft = async () => (viewer.byoKey || input.showcase ? null : svc.counters.runsLeft(viewer.visitorId, viewer.ipHash, limits.runsPerDay));
  const blocked = async (reason: BlockedResult['blocked'], detail: BlockedResult['detail']): Promise<AdmitResult> => ({ kind: 'blocked', body: { blocked: reason, detail, runsLeft: await runsLeft() } });

  // 1. Schema.
  const parsed = CreateRunBody.safeParse(input.body);
  if (!parsed.success) return { kind: 'invalid' };

  // 2. Rate limit.
  if (!input.showcase) {
    const wait = await svc.counters.rateLimit(viewer.ipHash, now.getTime());
    if (wait > 0) return { kind: 'rate-limited', retryAfterS: Math.max(1, Math.ceil(wait / 1000)) };
  }

  // 3. URL, and the added pages: same site, within the include cap.
  const shape = validateUrlShape(parsed.data.url, svc.allowPrivateHosts);
  if (!shape.ok) return blocked(shape.reason, { reason: shape.detail });
  const url = shape.url;
  url.hash = '';
  const include: string[] = [];
  for (const raw of parsed.data.include ?? []) {
    const inc = validateUrlShape(raw, svc.allowPrivateHosts);
    if (!inc.ok) return blocked(inc.reason, { reason: inc.detail });
    if (!sameSite(inc.url, url)) return blocked('invalid-url', { reason: 'an added page is on another site' });
    inc.url.hash = '';
    include.push(inc.url.toString());
  }
  const includeCheck = check(viewer, { type: 'include-urls', count: include.length }, svc.env);
  if (!includeCheck.ok) return blocked(includeCheck.blocked, includeCheck.detail);

  // 4. Private address: every A and AAAA record of the host.
  const target = await checkTarget(url.toString(), { allow: svc.allowPrivateHosts, resolver: svc.resolver });
  if (!target.ok) return blocked(target.reason, { reason: target.detail });

  // 5 to 7. Queue depth, visitor cap, budget.
  const day = svc.counters.day(now);
  const [depth, counts, budget, runsToday] = await Promise.all([queueDepth(svc.db), svc.counters.counts(viewer.visitorId, viewer.ipHash, day), svc.counters.budget(day), svc.counters.runsToday(day)]);
  const caps = svc.counters.caps;
  const decision = check(
    viewer,
    {
      type: 'create-run',
      facts: {
        queueDepth: depth,
        visitorRuns: counts.visitor,
        ipRuns: counts.ip,
        ipRunsPerDay: caps.ipRunsPerDay,
        usedCents: budget.usedCents,
        reservedCents: budget.reservedCents,
        worstCaseCents: caps.worstCaseRunUsd * 100,
        dailyBudgetCents: caps.dailyBudgetUsd * 100,
        runsToday,
        resetsAt: svc.counters.resetsAt(now).toISOString(),
        showcase: input.showcase,
      },
    },
    svc.env,
  );
  if (!decision.ok) return blocked(decision.blocked, decision.detail);

  // The run.
  const id = input.id ?? newRunId();
  const createdAt = now.toISOString();
  const host = url.host.replace(/^www\./, '');
  const priority = input.showcase ? SHOWCASE_PRIORITY : limits.priority;
  const document = RunDocumentPartial.parse({ id, url: url.toString(), host, status: 'queued', createdAt, pipelineVersion: PIPELINE_VERSION, viewports: limits.viewports });
  await insertRun(svc.db, {
    id,
    url: url.toString(),
    host,
    status: 'queued',
    visitorId: viewer.visitorId,
    byoKey: viewer.byoKey,
    priority,
    pageCap: limits.pageCap,
    includeUrls: include,
    viewports: limits.viewports,
    pipelineVersion: PIPELINE_VERSION,
    document,
    createdAt,
    retentionUntil: input.showcase || limits.retentionDays === null ? null : new Date(now.getTime() + limits.retentionDays * DAY_MS).toISOString(),
  });
  await svc.db
    .insert(tables.visitors)
    .values({ id: viewer.visitorId, firstSeen: createdAt, lastSeen: createdAt, runsTotal: 1 })
    .onConflictDoUpdate({ target: tables.visitors.id, set: { lastSeen: createdAt, runsTotal: sql`${tables.visitors.runsTotal} + 1` } });

  let counted: Counted | undefined;
  if (!input.showcase) {
    if (!viewer.byoKey) {
      counted = await svc.counters.count(viewer.visitorId, viewer.ipHash, day);
      await svc.counters.reserve(id, day);
    }
    await svc.counters.countRunToday(day);
  }
  try {
    const data: RunJobData = { runId: id, ...(input.byoKey ? { byoKeyCiphertext: encryptSecret(input.byoKey, svc.encryptionKey) } : {}), ...(counted ? { counted } : {}) };
    await enqueueRun(svc.queue, data, priority);
  } catch (e) {
    // Each step is tried on its own, so a Redis that is still down cannot keep the row open (D-074).
    const undo = await Promise.allSettled([
      finishOpenRun(svc.db, id, { status: 'failed', failedDetail: 'The crawler stopped unexpectedly.', finishedAt: new Date().toISOString() }),
      counted ? svc.counters.refund(id, counted) : Promise.resolve(false),
      svc.counters.release(id),
    ]);
    for (const u of undo) if (u.status === 'rejected') console.error(JSON.stringify({ route: 'POST /api/runs', runId: id, undo: (u.reason as Error).message }));
    throw e;
  }
  return { kind: 'created', body: { id, runsLeft: await runsLeft() } };
}

/** `GET /api/runs/{id}`: the row as the poller reads it, or null for a run that is not there. */
/** A stored document the upgrade could not bring to the current shape. */
export class UnreadableRunError extends Error {
  constructor(
    readonly runId: string,
    readonly host: string,
    readonly createdAt: string,
    readonly issues: number,
  ) {
    super(`run ${runId} could not be read: ${issues} schema issues after upgrade`);
  }
}

export async function runPayload(db: Db, runId: string): Promise<RunResponse | null> {
  if (!/^[0-9a-z]{10}$/.test(runId)) return null;
  const row = await getRunForViewer(db, runId, null);
  if (!row) return null;
  const events = (await listEvents(db, runId)).map((e) =>
    RunEvent.parse({ id: e.id, runId: e.runId, ts: new Date(e.ts).toISOString(), stage: e.stage, substage: e.substage, level: e.level, message: e.message, data: e.data }),
  );
  // Stored documents keep the shape of the build that wrote them (D-092).
  const parsed = RunDocumentPartial.safeParse(upgradeRunDocument(row.document));
  if (!parsed.success) throw new UnreadableRunError(row.id, row.host, row.createdAt, parsed.error.issues.length);
  const body: RunResponse = { id: row.id, status: row.status, isShowcase: row.isShowcase, document: parsed.data, events };
  if (row.status === 'queued') body.queuePosition = await queuePosition(db, row);
  return body;
}

export type CancelResult = { status: 200 | 403 | 404 | 409; body: { id?: string; status?: string; error?: string } };

/**
 * Cancels from the browser that created the run. A queued run leaves the queue and ends here; a
 * running one gets the flag the worker reads between pages, and ends there.
 */
export async function cancelRun(svc: Services, viewer: ResolvedViewer, runId: string): Promise<CancelResult> {
  const row = /^[0-9a-z]{10}$/.test(runId) ? await getRunForViewer(svc.db, runId, viewer) : null;
  if (!row) return { status: 404, body: { error: 'No run with that link.' } };
  if (row.visitorId !== viewer.visitorId) return { status: 403, body: { error: 'Only the browser that started a run can cancel it.' } };
  if (isTerminal(row.status)) return { status: 409, body: { id: row.id, status: row.status } };
  await svc.counters.requestCancel(row.id);
  if (row.status === 'queued') {
    const job = await svc.queue.getJob(row.id);
    const state = job ? await job.getState() : 'missing';
    if (state !== 'active') {
      await job?.remove().catch(() => {});
      const done = await finishOpenRun(svc.db, row.id, { status: 'cancelled', finishedAt: new Date().toISOString() });
      if (done) await appendEvent(svc.db, row.id, { stage: 'done', level: 'warn', message: `${stageLabels.done} · cancelled` });
      const parsed = RunJobData.safeParse(job?.data);
      if (parsed.success && parsed.data.counted) await svc.counters.refund(row.id, parsed.data.counted);
      await svc.counters.release(row.id);
      return { status: 200, body: { id: row.id, status: 'cancelled' } };
    }
  }
  return { status: 200, body: { id: row.id, status: 'cancelling' } };
}
