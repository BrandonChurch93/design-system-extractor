// pnpm evals [--through <stage>]: runs the five eval fixtures through the pipeline in replay mode
// and scores them against expected.json (docs/evals.md). Writes fixtures/results.json.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { allowedPrivateHosts, ExpectedFixture, Stage } from '@dse/schema';
import { LocalStorage, MemoryRunContext } from '@dse/pipeline/context';
import { launchBrowser } from '@dse/pipeline/crawl/browser';
import { defaultRecordingsDir, ModelClient, type ModelMode } from '@dse/pipeline/models/client';
import { DevSpendMeter } from '@dse/pipeline/models/meter';
import { PIPELINE_VERSION, runPipeline, stageOrder } from '@dse/pipeline/run';
import { evalFixtures, floors, type EvalFixture } from './evals/fixtures';
import { scoreChecks, scoreComponents, scoreDrift, scoreLiveRate, scoreSelection, scoreTokens, type FixtureResult, type Metric } from './evals/metrics';
import { deltaE, parseCssColor } from '@dse/pipeline/color/parse';
import { startFixtureServer } from './fixtures-serve';
import { startStorageServer } from './storage-serve';
import { pruneRecordings } from './evals/prune';

const { values } = parseArgs({ options: { through: { type: 'string' }, only: { type: 'string' }, print: { type: 'boolean', default: false }, 'prune-recordings': { type: 'boolean', default: false }, fallback: { type: 'boolean', default: false } } });
const through = values.through ? Stage.parse(values.through) : undefined;
const reached = (s: Stage) => !through || stageOrder.indexOf(s) <= stageOrder.indexOf(through);
const root = resolve(import.meta.dirname, '..');

// Replay unless DSE_MODEL_MODE was given on the command line; .env.local never switches evals to live.
const fromFile = new Set((process.env.DSE_ENV_FILE_KEYS ?? '').split(','));
const mode: ModelMode = process.env.DSE_MODEL_MODE && !fromFile.has('DSE_MODEL_MODE') ? (process.env.DSE_MODEL_MODE as ModelMode) : 'replay';

let server: Awaited<ReturnType<typeof startFixtureServer>> | null = null;
try {
  const res = await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1500) });
  if (!res.ok) throw new Error('not ours');
} catch {
  server = await startFixtureServer(4100);
}

const evalsDir = resolve(root, '.dse/evals');
mkdirSync(evalsDir, { recursive: true });
const storagePort = 4400;
const storageServer = await startStorageServer(evalsDir, storagePort);
const browser = await launchBrowser();
const results: FixtureResult[] = [];
const usedRecordings = new Set<string>();
const only = values.only ? (values.only.split(',') as EvalFixture[]) : [...evalFixtures];
let failed = false;

for (const name of only) {
  const expected = ExpectedFixture.parse(JSON.parse(readFileSync(resolve(root, `fixtures/sites/${name}/expected.json`), 'utf8')));
  const runId = `eval${name.replace(/[^a-z]/g, '').slice(0, 6).padEnd(6, '0')}`;
  const outDir = resolve(root, '.dse/evals', name);
  rmSync(outDir, { recursive: true, force: true });
  // --fallback: every model call fails, so each step takes its deterministic fallback.
  const models = values.fallback
    ? new ModelClient({ mode: 'live', recordingsDir: defaultRecordingsDir(root), transport: async () => Promise.reject(new Error('model disabled')) })
    : new ModelClient({ mode, apiKey: process.env.ANTHROPIC_API_KEY, recordingsDir: defaultRecordingsDir(root), meter: DevSpendMeter.fromEnv(root), strictReplay: mode === 'replay' });
  const url = `http://localhost:4100/sites/${name}/`;
  const ctx = new MemoryRunContext(
    runId,
    { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: process.env.DSE_USER_AGENT ?? 'DesignSystemExtractorBot/1.0', allowPrivateHosts: allowedPrivateHosts(), timeoutMs: 600_000, keepIntermediate: true, byo: false },
    models,
    new LocalStorage(outDir, `http://localhost:${storagePort}/${name}`),
    { id: runId, url, host: 'localhost:4100', status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: PIPELINE_VERSION, viewports: ['desktop', 'mobile'] },
    { info: () => {}, warn: () => {}, error: (o, m) => console.error(m, o) },
  );
  const started = Date.now();
  const outcome = await runPipeline(ctx, { browser, through: through ?? 'done' });
  for (const f of models.used) usedRecordings.add(f);
  const metrics: Record<string, Metric> = {};
  const doc = ctx.document;
  if (outcome.status !== 'complete') {
    console.error(`${name}: run ended ${outcome.status}${'detail' in outcome ? ` · ${JSON.stringify(outcome.detail)}` : ''}`);
    failed = true;
  }
  if (reached('select')) metrics.selection = scoreSelection(expected, doc);
  if (reached('tokens')) metrics.tokens = scoreTokens(expected, doc, (a, b) => deltaE(parseCssColor(a)!, parseCssColor(b)!));
  if (reached('components')) Object.assign(metrics, scoreComponents(expected, doc));
  if (reached('previews')) metrics.liveRate = scoreLiveRate(expected, doc);
  if (reached('checks')) metrics.checks = scoreChecks(expected, doc);
  if (reached('drift')) metrics.drift = scoreDrift(expected, doc);
  if (values.print) console.log(name, (doc.pages ?? []).map((p) => `${p.path} ${p.reason}`), JSON.stringify(metrics.tokens?.value ?? null), JSON.stringify(ctx.events.filter((e) => e.stage === 'components').map((e) => [e.message, e.data])));
  results.push({ name, seconds: Math.round((Date.now() - started) / 1000), metrics });
  writeFileSync(resolve(outDir, 'run.json'), JSON.stringify(doc, null, 2));
  writeFileSync(resolve(outDir, 'events.json'), JSON.stringify(ctx.events, null, 2));
}
await browser.close();
server?.close();
storageServer.close();

// Score against the floors.
const rows: string[] = [];
for (const r of results) {
  const f = floors[r.name as EvalFixture];
  for (const [key, m] of Object.entries(r.metrics)) {
    // A fallback run proves the fallbacks produce valid output; its floors are the replay run's job.
    const pass = values.fallback ? !['tokens', 'components'].includes(key) || (m.value as { namesValid: boolean }).namesValid : m.pass(f);
    if (!pass) failed = true;
    rows.push(`${r.name.padEnd(10)} ${key.padEnd(12)} ${m.summary.padEnd(44)} ${pass ? 'pass' : 'FAIL'}`);
  }
}
const notMeasured = ['tokens', 'components', 'variants', 'states', 'liveRate', 'checks', 'drift'].filter((k) => !results.some((r) => k in r.metrics));
console.log(`\nevals · mode ${values.fallback ? 'fallback' : mode}${through ? ` · through ${through}` : ''}\n`);
console.log(rows.join('\n'));
if (notMeasured.length) console.log(`\nnot yet measured: ${notMeasured.join(', ')}`);

// --prune-recordings: after a full replay of every fixture, delete the recordings no call read.
if (values['prune-recordings'] && mode === 'replay' && !values.only && !failed) {
  const pruned = pruneRecordings(defaultRecordingsDir(root), usedRecordings);
  console.log(`recordings · ${usedRecordings.size} used · ${pruned} pruned`);
}
const resultsFile = resolve(root, 'fixtures/results.json');
if (values.fallback) {
  console.log(`\n${failed ? 'evals failed' : 'evals passed'} · fallback run, results.json unchanged`);
  process.exit(failed ? 1 : 0);
}
let previous: { mode?: string; through?: string; pipelineVersion?: string; fixtures?: { name: string; metrics: Record<string, unknown> }[] } = {};
try {
  previous = JSON.parse(readFileSync(resultsFile, 'utf8'));
} catch {
  previous = {};
}
const merged = evalFixtures.map((name) => {
  const now = results.find((r) => r.name === name);
  const before = previous.fixtures?.find((p) => p.name === name);
  return { name, metrics: { ...(before?.metrics ?? {}), ...Object.fromEntries(Object.entries(now?.metrics ?? {}).map(([k, m]) => [k, m.value])) } };
});
const body = { mode, through: through ?? 'done', pipelineVersion: PIPELINE_VERSION, fixtures: merged };
// The same numbers keep their date, so a gate run leaves the tree clean. The published numbers come
// from the final live run (docs/plan.md P15); a replay scores against the thresholds and keeps them.
const same = JSON.stringify(body) === JSON.stringify({ mode: previous.mode, through: previous.through, pipelineVersion: previous.pipelineVersion, fixtures: previous.fixtures });
const keepLive = mode === 'replay' && previous.mode === 'live';
if (!same && !keepLive) writeFileSync(resultsFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), ...body }, null, 2)}\n`);
console.log(`\n${failed ? 'evals failed' : 'evals passed'} · fixtures/results.json${same ? ' unchanged' : keepLive ? ' keeps the live run' : ''}`);
process.exitCode = failed ? 1 : 0;
