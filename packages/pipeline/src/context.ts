import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  RunDocumentPartial,
  type Cost,
  type CostCall,
  stageLabels,
  type EventLevel,
  type RunConfig,
  type RunDocumentPatch,
  type Stage,
  type Substage,
} from '@dse/schema';
import { deepMerge } from './db/deep-merge';
import type { ModelClient } from './models/client';
import type { PutOptions, Storage } from './storage/storage';

export type EmitInput = {
  stage: Stage;
  substage?: Substage;
  level?: EventLevel;
  /** The live-log line without its stage label; the context prefixes it. */
  message: string;
  data?: Record<string, unknown>;
  patch?: RunDocumentPatch;
};

export type Logger = {
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
};

export const silentLogger: Logger = { info: () => {}, warn: () => {}, error: () => {} };

/** Everything a stage may touch. Stages never know which implementation they have. */
export interface RunContext {
  readonly runId: string;
  readonly config: RunConfig;
  readonly models: ModelClient;
  readonly files: Storage;
  readonly log: Logger;
  emit(input: EmitInput): Promise<void>;
  cancelled(): Promise<boolean>;
  /** Adds model calls to the run's cost record. */
  recordCost(calls: CostCall[]): void;
  /** The cost so far. */
  cost(): Cost;
  /** The run document with every patch applied so far. */
  current(): RunDocumentPartial;
}

/** Accumulates cost records; shared by both contexts. */
export class CostLedger {
  private calls: CostCall[] = [];
  add(calls: CostCall[]) {
    this.calls.push(...calls);
  }
  total(): Cost {
    const sum = (f: (c: CostCall) => number) => this.calls.reduce((s, c) => s + f(c), 0);
    return {
      inputTokens: sum((c) => c.inputTokens),
      outputTokens: sum((c) => c.outputTokens),
      usd: Math.round(sum((c) => c.usd) * 1e6) / 1e6,
      calls: [...this.calls],
    };
  }
}

export type MemoryEvent = { id: number; ts: string; stage: Stage; substage: Substage | null; level: EventLevel; message: string; data: Record<string, unknown> | null };

/** Files under a local folder, for the CLI, `pnpm pipeline:run` and `pnpm evals`. */
export class LocalStorage implements Storage {
  constructor(
    readonly root: string,
    private readonly base?: string,
  ) {
    mkdirSync(root, { recursive: true });
  }

  private file(key: string): string {
    const f = resolve(this.root, key);
    if (!f.startsWith(resolve(this.root))) throw new Error(`key escapes the folder: ${key}`);
    return f;
  }

  async put(key: string, body: Buffer | Uint8Array | string, _opts?: PutOptions): Promise<void> {
    const f = this.file(key);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, body);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return readFileSync(this.file(key));
    } catch {
      return null;
    }
  }

  publicUrl(key: string): string {
    return this.base ? `${this.base.replace(/\/$/, '')}/${key}` : pathToFileURL(this.file(key)).toString();
  }

  async delete(key: string): Promise<void> {
    rmSync(this.file(key), { force: true });
  }

  async list(prefix: string): Promise<string[]> {
    const out: string[] = [];
    const walk = (dir: string) => {
      let names: string[] = [];
      try {
        names = readdirSync(dir);
      } catch {
        return;
      }
      for (const n of names) {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) walk(p);
        else out.push(relative(this.root, p).split('\\').join('/'));
      }
    };
    walk(this.root);
    return out.filter((k) => k.startsWith(prefix)).sort();
  }

  async deletePrefix(prefix: string): Promise<number> {
    const keys = await this.list(prefix);
    for (const k of keys) await this.delete(k);
    return keys.length;
  }
}

/** The run kept in memory, files in a local folder. */
export class MemoryRunContext implements RunContext {
  document: RunDocumentPartial;
  readonly events: MemoryEvent[] = [];
  private cancelFlag = false;
  private readonly ledger = new CostLedger();

  constructor(
    readonly runId: string,
    readonly config: RunConfig,
    readonly models: ModelClient,
    readonly files: Storage,
    initial: RunDocumentPartial,
    readonly log: Logger = silentLogger,
    private readonly onEvent?: (e: MemoryEvent) => void,
  ) {
    this.document = RunDocumentPartial.parse(initial);
  }

  current(): RunDocumentPartial {
    return this.document;
  }

  async emit({ stage, substage, level = 'info', message, data, patch }: EmitInput): Promise<void> {
    if (patch) this.document = RunDocumentPartial.parse(deepMerge(this.document as Record<string, unknown>, patch as Record<string, unknown>));
    const e: MemoryEvent = {
      id: this.events.length + 1,
      ts: new Date().toISOString(),
      stage,
      substage: substage ?? null,
      level,
      message: `${stageLabels[stage]} · ${message}`,
      data: data ?? null,
    };
    this.events.push(e);
    this.onEvent?.(e);
  }

  cancel() {
    this.cancelFlag = true;
  }

  async cancelled(): Promise<boolean> {
    return this.cancelFlag;
  }

  recordCost(calls: CostCall[]): void {
    this.ledger.add(calls);
  }

  cost(): Cost {
    return this.ledger.total();
  }
}
