import type { Browser, BrowserContext } from 'playwright';
import type { BlockedDetail, BlockedReason, RunDocumentPartial, Stage, Stats } from '@dse/schema';
import type { RunContext } from './context';
import { adoptContext, createRunContext, type RunBrowserContext } from './crawl/browser';
import { Throttle } from './crawl/throttle';
import { BlockedError, CancelledError, ModelAuthError, TimeoutError } from './errors';
import { ReplayMissError } from './models/client';
import { capture, type CaptureOutput } from './stages/capture';
import { discover, type DiscoverResult } from './stages/discover';
import { select } from './stages/select';
import { tokens } from './stages/tokens';
import { components } from './stages/components';
import { previews } from './stages/previews';
import { checks } from './stages/checks';
import { drift } from './stages/drift';
import { exportsStage } from './stages/exports';

export const PIPELINE_VERSION = '1.0.0';

/** Stages in canonical order; `queue` and `done` are event stages with no module. */
export const stageOrder: Stage[] = ['queue', 'discover', 'select', 'capture', 'tokens', 'components', 'previews', 'checks', 'drift', 'exports', 'done'];

export type RunOutcome =
  | { status: 'complete'; stats?: Stats }
  | { status: 'blocked'; reason: BlockedReason; detail: BlockedDetail }
  | { status: 'failed'; detail: string }
  | { status: 'cancelled' };

export type RunDeps = {
  browser: Browser;
  /** A context to crawl in instead of a new one: the CLI's `--cdp` path. */
  context?: BrowserContext;
  /** Stop after this stage (evals' --through, tests). */
  through?: Stage;
  sleep?: (ms: number) => Promise<void>;
  /** Called once the capture stage has finished, with its intermediate output (evals inspect it). */
  onCapture?: (out: CaptureOutput) => void;
  onDiscover?: (out: DiscoverResult) => void;
};

const reached = (stage: Stage, through: Stage | undefined) => !through || stageOrder.indexOf(stage) <= stageOrder.indexOf(through);

/**
 * Runs the pipeline for one run. The only place errors become run statuses
 * (docs/specs/architecture.md, Conventions).
 */
export async function runPipeline(ctx: RunContext, deps: RunDeps): Promise<RunOutcome> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  let rc: RunBrowserContext | null = null;
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ctx.config.timeoutMs);
  });
  const checkCancel = async () => {
    if (await ctx.cancelled()) throw new CancelledError();
  };

  const body = async (): Promise<RunOutcome> => {
    await ctx.emit({ stage: 'queue', message: 'picked up by the crawler', patch: { status: 'running', startedAt } });
    const opts = { userAgent: ctx.config.userAgent, allowPrivateHosts: ctx.config.allowPrivateHosts };
    rc = deps.context ? adoptContext(deps.context, opts) : await createRunContext(deps.browser, opts);
    const throttle = new Throttle(800, 2, Date.now, deps.sleep);

    const discovered = await discover(ctx, { browser: rc, throttle, sleep: deps.sleep });
    deps.onDiscover?.(discovered);
    await ctx.emit({
      stage: 'discover',
      message: `${discovered.candidates.length} page candidates`,
      patch: { frameworkHint: discovered.frameworkHint, darkThemeDetected: discovered.darkThemeDetected },
    });
    await discovered.startPage.close().catch(() => {});
    if (!reached('select', deps.through)) return { status: 'complete' };
    await checkCancel();

    const selected = await select(ctx, discovered);
    if (!reached('capture', deps.through)) return { status: 'complete' };
    await checkCancel();

    const captured = await capture(ctx, { browser: rc, throttle, pages: selected.pages, frameworkHint: discovered.frameworkHint });
    deps.onCapture?.(captured);
    // A login wall still yields a complete one-page document, then ends blocked (docs/specs/crawler.md).
    const ending: RunOutcome = captured.loginWall
      ? { status: 'blocked', reason: 'login', detail: { redirectedTo: captured.loginWall.redirectedTo } }
      : { status: 'complete' };
    if (captured.loginWall) {
      const only = captured.pages[0]!;
      const doc = (ctx as { document?: RunDocumentPartial }).document;
      const page = doc?.pages?.find((p) => p.id === only.page.id);
      await ctx.emit({ stage: 'capture', level: 'warn', message: `login wall · continuing with ${only.page.path} alone`, patch: page ? { pages: [page] } : undefined });
    }
    if (!reached('tokens', deps.through)) return ending;
    await checkCancel();

    const extracted = await tokens(ctx, captured);
    if (!reached('components', deps.through)) return ending;
    await checkCancel();

    const detected = await components(ctx, captured, extracted);
    if (!reached('previews', deps.through)) return ending;
    await checkCancel();

    const previewed = await previews(ctx, captured, detected.components, detected.sources, deps.browser);
    if (!reached('checks', deps.through)) return ending;
    await checkCancel();

    const checked = await checks(ctx, previewed, detected.sources, extracted);
    if (!reached('drift', deps.through)) return ending;
    await checkCancel();

    await drift(ctx, captured, extracted, checked.components, detected.sources, new URL(ctx.config.url).host);
    if (!reached('exports', deps.through)) return ending;
    await checkCancel();

    await exportsStage(ctx);

    return ending;
  };

  let outcome: RunOutcome;
  try {
    outcome = await Promise.race([body(), timeout]);
  } catch (e) {
    outcome = classify(e);
    if (outcome.status === 'failed') ctx.log.error({ err: (e as Error).message, stack: (e as Error).stack?.split('\n').slice(0, 6).join(' | ') }, 'run failed');
  } finally {
    clearTimeout(timer);
    await (rc as RunBrowserContext | null)?.close().catch(() => {});
  }

  const finished = Date.now();
  const cost = ctx.cost();
  const patch: Partial<RunDocumentPartial> = { finishedAt: new Date(finished).toISOString(), durationMs: finished - started, cost };
  if (outcome.status === 'complete') {
    await ctx.emit({ stage: 'done', message: `complete · ${Math.round((finished - started) / 1000)} s · $${cost.usd.toFixed(4)}`, patch: { ...patch, status: 'complete' } });
  } else if (outcome.status === 'blocked') {
    await ctx.emit({ stage: 'done', level: 'warn', message: `blocked · ${outcome.reason}`, patch: { ...patch, status: 'blocked', blockedReason: outcome.reason, blockedDetail: outcome.detail } });
  } else if (outcome.status === 'cancelled') {
    await ctx.emit({ stage: 'done', level: 'warn', message: 'cancelled', patch: { ...patch, status: 'cancelled' } });
  } else {
    await ctx.emit({ stage: 'done', level: 'error', message: outcome.detail, patch: { ...patch, status: 'failed', failedDetail: outcome.detail } });
  }
  return outcome;
}

export function classify(e: unknown): RunOutcome {
  if (e instanceof BlockedError) return { status: 'blocked', reason: e.reason, detail: e.detail };
  if (e instanceof CancelledError) return { status: 'cancelled' };
  if (e instanceof TimeoutError) return { status: 'failed', detail: e.message };
  if (e instanceof ModelAuthError) return { status: 'failed', detail: e.message };
  if (e instanceof ReplayMissError) throw e;
  return { status: 'failed', detail: 'The crawler stopped unexpectedly.' };
}
