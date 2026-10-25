// Runs the pipeline on one URL without the queue: `pnpm pipeline:run <url> [--out file] [--through stage]`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { allowedPrivateHosts, newRunId, Stage } from '@dse/schema';
import { LocalStorage, MemoryRunContext } from '@dse/pipeline/context';
import { launchBrowser } from '@dse/pipeline/crawl/browser';
import { defaultRecordingsDir, ModelClient, type ModelMode } from '@dse/pipeline/models/client';
import { DevSpendMeter } from '@dse/pipeline/models/meter';
import { PIPELINE_VERSION, runPipeline } from '@dse/pipeline/run';

const { values, positionals } = parseArgs({ allowPositionals: true, options: { out: { type: 'string' }, through: { type: 'string' }, quiet: { type: 'boolean', default: false } } });
const url = positionals[0];
if (!url) throw new Error('usage: pnpm pipeline:run <url> [--out file] [--through stage]');
const root = resolve(import.meta.dirname, '..');
const runId = newRunId();
const outDir = resolve(root, '.dse/runs', runId);
mkdirSync(outDir, { recursive: true });
const mode = (process.env.DSE_MODEL_MODE ?? 'live') as ModelMode;
const models = new ModelClient({ mode, apiKey: process.env.ANTHROPIC_API_KEY, recordingsDir: defaultRecordingsDir(root), meter: DevSpendMeter.fromEnv(root) });
const ctx = new MemoryRunContext(
  runId,
  {
    url,
    include: [],
    pageCap: Number(process.env.DSE_PAGE_CAP ?? 12),
    viewports: ['desktop', 'mobile'],
    userAgent: process.env.DSE_USER_AGENT ?? 'DesignSystemExtractorBot/1.0',
    allowPrivateHosts: allowedPrivateHosts(),
    timeoutMs: Number(process.env.DSE_RUN_TIMEOUT_MS ?? 360000),
    keepIntermediate: process.env.DSE_KEEP_INTERMEDIATE === '1',
    byo: false,
  },
  models,
  new LocalStorage(outDir),
  { id: runId, url, host: new URL(url).host, status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: PIPELINE_VERSION, viewports: ['desktop', 'mobile'] },
  { info: () => {}, warn: () => {}, error: (o, m) => console.error(m, o) },
  values.quiet ? undefined : (e) => console.log(`${e.ts.slice(11, 19)}  ${e.message}`),
);
const browser = await launchBrowser();
const through = values.through ? Stage.parse(values.through) : undefined;
const outcome = await runPipeline(ctx, { browser, through });
await browser.close();
const out = values.out ? resolve(process.cwd(), values.out) : resolve(outDir, 'run.json');
writeFileSync(out, JSON.stringify(ctx.document, null, 2));
console.log(`\n${outcome.status} · ${out}`);
