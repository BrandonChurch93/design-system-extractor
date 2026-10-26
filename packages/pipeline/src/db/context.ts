import { RunDocumentPartial, stageLabels, type Cost, type CostCall, type RunConfig } from '@dse/schema';
import { CostLedger, silentLogger, type EmitInput, type Logger, type RunContext } from '../context';
import type { ModelClient } from '../models/client';
import type { Storage } from '../storage/storage';
import type { Db } from './client';
import { appendEvent, applyPatch, syncPages } from './runs';

export type DbRunContextOptions = {
  db: Db;
  runId: string;
  config: RunConfig;
  models: ModelClient;
  files: Storage;
  initial: RunDocumentPartial;
  log?: Logger;
  /** The worker's cancel flag (a Redis key), read between pages. */
  cancelled: () => Promise<boolean>;
  /** Sees every emit after it is stored: the seed keeps the patches that build frozen documents. */
  observer?: (input: EmitInput, doc: RunDocumentPartial) => void;
};

/**
 * The worker's context (docs/specs/architecture.md): every patch is merged into the run row's
 * document, then the event is appended, so a poll that sees a log line also sees its data.
 */
export class DbRunContext implements RunContext {
  readonly runId: string;
  readonly config: RunConfig;
  readonly models: ModelClient;
  readonly files: Storage;
  readonly log: Logger;
  private doc: RunDocumentPartial;
  private readonly ledger = new CostLedger();

  constructor(private readonly opts: DbRunContextOptions) {
    this.runId = opts.runId;
    this.config = opts.config;
    this.models = opts.models;
    this.files = opts.files;
    this.log = opts.log ?? silentLogger;
    this.doc = RunDocumentPartial.parse(opts.initial);
  }

  current(): RunDocumentPartial {
    return this.doc;
  }

  async emit(input: EmitInput): Promise<void> {
    const { stage, substage, level = 'info', message, data, patch } = input;
    if (patch) {
      this.doc = await applyPatch(this.opts.db, this.runId, patch);
      if (patch.pages && this.doc.pages) await syncPages(this.opts.db, this.runId, this.doc.pages);
    }
    const line = `${stageLabels[stage]} · ${message}`;
    await appendEvent(this.opts.db, this.runId, { stage, substage: substage ?? null, level, message: line, data: data ?? null });
    this.log[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info']({ stage, substage }, line);
    this.opts.observer?.(input, this.doc);
  }

  cancelled(): Promise<boolean> {
    return this.opts.cancelled();
  }

  recordCost(calls: CostCall[]): void {
    this.ledger.add(calls);
  }

  cost(): Cost {
    return this.ledger.total();
  }
}
