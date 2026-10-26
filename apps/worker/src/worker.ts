import { UnrecoverableError, Worker, type Job, type WorkerOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import type { Logger } from 'pino';
import { RunDocumentPartial, SHOWCASE_PRIORITY, stageLabels, type RunConfig } from '@dse/schema';
import type { EmitInput } from '@dse/pipeline/context';
import { appendEvent, claimRun, finishOpenRun, resetRun, type Db } from '@dse/pipeline/db';
import { DbRunContext } from '@dse/pipeline/db/context';
import { ModelClient, ReplayMissError, type ModelClientOptions, type ModelMode } from '@dse/pipeline/models/client';
import type { BudgetMeter } from '@dse/pipeline/models/meter';
import { CompositeMeter, decryptSecret, keys, QUEUE_NAME, RedisBudgetMeter, RETENTION_JOB, RunJobData, type RunCounters } from '@dse/pipeline/queue';
import { runPipeline, type RunDeps, type RunOutcome } from '@dse/pipeline/run';
import type { Storage } from '@dse/pipeline/storage';
import type { BrowserPool } from './browser';
import { runRetention } from './retention';

/** copy.md, worker-side failure details. */
export const STOPPED_DETAIL = 'The crawler stopped unexpectedly.';

export type WorkerConfig = {
  encryptionKey: string;
  modelMode: ModelMode;
  apiKey?: string;
  recordingsDir: string;
  /** A replay miss fails the run instead of falling back (tests and the seed). */
  strictReplay: boolean;
  userAgent: string;
  appUrl: string;
  timeoutMs: number;
  allowPrivateHosts: string[];
  keepIntermediate: boolean;
  /** The build-time spend cap; absent in production. */
  devMeter?: BudgetMeter;
  /** Test seam: answers model calls in place of the API (a key the API rejects, for one). */
  modelTransport?: ModelClientOptions['transport'];
};

export type WorkerDeps = {
  db: Db;
  /** The BullMQ connection; BullMQ duplicates it for its blocking reads. */
  connection: Redis;
  counters: RunCounters;
  storage: Storage;
  browsers: BrowserPool;
  log: Logger;
  config: WorkerConfig;
  /** Test seam: replaces the pipeline. */
  pipeline?: (ctx: DbRunContext, deps: RunDeps) => Promise<RunOutcome>;
  /** The seed watches one run's patches to build the frozen in-progress documents. */
  observe?: (runId: string) => ((input: EmitInput, doc: RunDocumentPartial) => void) | undefined;
  options?: Partial<WorkerOptions>;
};

/** The document a run starts from: its identity, queued. A retried run goes back to it. */
function initialDocument(stored: unknown): RunDocumentPartial {
  const d = RunDocumentPartial.parse(stored);
  return RunDocumentPartial.parse({ id: d.id, url: d.url, host: d.host, status: 'queued', createdAt: d.createdAt, pipelineVersion: d.pipelineVersion, viewports: d.viewports });
}

export function createRunWorker(deps: WorkerDeps): Worker {
  const { db, counters, config } = deps;
  const pipeline = deps.pipeline ?? runPipeline;

  /** Gives back what a run that did not complete took: the visitor's count, its budget reservation. */
  async function settle(runId: string, data: RunJobData, status: RunOutcome['status']): Promise<void> {
    if (status !== 'complete' && data.counted) await counters.refund(runId, data.counted);
    await counters.release(runId);
    await counters.redis.del(keys.cancel(runId));
  }

  async function processRun(job: Job): Promise<void> {
    const data = RunJobData.parse(job.data);
    const log = deps.log.child({ runId: data.runId });
    const row = await claimRun(db, data.runId);
    if (!row) {
      log.info('skipped · the run is not open');
      return;
    }
    if ((job.attemptsStarted ?? 1) > 1) {
      await resetRun(db, row.id, initialDocument(row.document));
      log.warn({ attempt: job.attemptsStarted }, 'restarting from the beginning after an unexpected stop');
    }

    const byo = Boolean(data.byoKeyCiphertext);
    let apiKey: string | undefined = config.apiKey;
    if (data.byoKeyCiphertext) {
      try {
        apiKey = decryptSecret(data.byoKeyCiphertext, config.encryptionKey);
      } catch {
        throw new UnrecoverableError('the sealed key could not be opened');
      }
    }
    // A visitor's key and showcase runs spend nothing from the public budget (D-005, showcase.md).
    const meters: BudgetMeter[] = [];
    if (config.devMeter) meters.push(config.devMeter);
    if (!byo && !row.isShowcase && row.priority < SHOWCASE_PRIORITY) meters.push(new RedisBudgetMeter(counters));
    const models = new ModelClient({ mode: config.modelMode, apiKey, recordingsDir: config.recordingsDir, strictReplay: config.strictReplay, meter: new CompositeMeter(meters), transport: config.modelTransport });
    apiKey = undefined;

    const runConfig: RunConfig = {
      url: row.url,
      include: row.includeUrls,
      pageCap: row.pageCap,
      viewports: row.viewports as RunConfig['viewports'],
      userAgent: config.userAgent,
      allowPrivateHosts: config.allowPrivateHosts,
      timeoutMs: config.timeoutMs,
      keepIntermediate: config.keepIntermediate,
      byo,
      runUrl: `${config.appUrl}/r/${row.id}`,
    };
    const ctx = new DbRunContext({
      db,
      runId: row.id,
      config: runConfig,
      models,
      files: deps.storage,
      initial: initialDocument(row.document),
      log,
      cancelled: () => counters.cancelRequested(row.id),
      observer: deps.observe?.(row.id),
    });

    let outcome: RunOutcome;
    try {
      const browser = await deps.browsers.get();
      outcome = await pipeline(ctx, { browser });
    } catch (e) {
      if (e instanceof ReplayMissError) throw new UnrecoverableError(e.message);
      throw e;
    } finally {
      if (await deps.browsers.afterRun()) log.info('browser restarted');
    }
    await settle(row.id, data, outcome.status);
    log.info({ status: outcome.status, usd: ctx.cost().usd }, 'run finished');
  }

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name === RETENTION_JOB) {
        await runRetention(db, deps.storage, deps.log);
        return;
      }
      await processRun(job);
    },
    { connection: deps.connection, concurrency: 1, drainDelay: 30, maxStalledCount: 1, maxStartedAttempts: 2, ...deps.options },
  );

  // A crash on the second start, a stall past the limit, or an error the processor threw: the run
  // ends failed and gives back what it took (docs/specs/caps-and-budget.md, Job retry).
  worker.on('failed', (job, err) => {
    void (async () => {
      if (!job || job.name === RETENTION_JOB) return;
      if ((await job.getState()) !== 'failed') return;
      const parsed = RunJobData.safeParse(job.data);
      if (!parsed.success) return;
      const runId = parsed.data.runId;
      deps.log.error({ runId, err: err.message }, 'run job failed');
      const finished = await finishOpenRun(db, runId, { status: 'failed', failedDetail: STOPPED_DETAIL, finishedAt: new Date().toISOString() });
      if (finished) await appendEvent(db, runId, { stage: 'done', level: 'error', message: `${stageLabels.done} · ${STOPPED_DETAIL}` });
      await settle(runId, parsed.data, 'failed');
    })().catch((e: Error) => deps.log.error({ err: e.message }, 'failed-run handler'));
  });
  worker.on('error', (e) => deps.log.error({ err: e.message }, 'worker error'));
  return worker;
}
