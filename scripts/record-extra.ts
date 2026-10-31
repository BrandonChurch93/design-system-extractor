// Records model answers for sites outside the five eval fixtures (`messy-after` for the seed, the
// login wall for the queue tests), so they replay like the rest. New files are listed in
// fixtures/recordings/extra.json, which `pnpm evals --prune-recordings` keeps.
//
//   env DSE_MODEL_MODE=record pnpm exec node scripts/run.mjs tsx scripts/record-extra.ts messy-after walled
//
// `--keep` replays answers already recorded and records only the misses. With every site named, it
// also deletes the listed recordings that no site read.
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { allowedPrivateHosts } from '@dse/schema';
import { LocalStorage, MemoryRunContext } from '@dse/pipeline/context';
import { launchBrowser } from '@dse/pipeline/crawl/browser';
import { defaultRecordingsDir, ModelClient } from '@dse/pipeline/models/client';
import { DevSpendMeter } from '@dse/pipeline/models/meter';
import { PIPELINE_VERSION, runPipeline } from '@dse/pipeline/run';
import { BLOCKING_SITES_PORT, startBlockingSites } from './blocking-sites';
import { startFixtureServer } from './fixtures-serve';
import { startStorageServer } from './storage-serve';

const root = resolve(import.meta.dirname, '..');
const dir = defaultRecordingsDir(root);
const extraFile = join(dir, 'extra.json');
const targets: Record<string, string> = {
  'messy-after': 'http://localhost:4100/sites/messy-after/',
  walled: `http://localhost:${BLOCKING_SITES_PORT}/walled/`,
};

const files = () => new Set(readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).flatMap((d) => readdirSync(join(dir, d.name)).map((f) => `${d.name}/${f}`)));
const keep = process.argv.includes('--keep');
const names = process.argv.slice(2).filter((a) => a !== '--keep');
if (!names.length || names.some((n) => !targets[n])) {
  console.error(`usage: record-extra.ts ${Object.keys(targets).join(' | ')} …`);
  process.exit(1);
}
if (process.env.DSE_MODEL_MODE !== 'record') {
  console.error('set DSE_MODEL_MODE=record on the command line');
  process.exit(1);
}

const running = await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) }).then(() => true, () => false);
const fixtures = running ? null : await startFixtureServer(4100);
const sites = await startBlockingSites();
const store = mkdtempSync(join(tmpdir(), 'dse-record-'));
const storageServer = await startStorageServer(store, 4401);
const browser = await launchBrowser();
const before = files();
const read = new Set<string>();
for (const name of names) {
  const url = targets[name]!;
  const id = 'recordxtra';
  const models = new ModelClient({ mode: 'record', apiKey: process.env.ANTHROPIC_API_KEY, recordingsDir: dir, keep, meter: DevSpendMeter.fromEnv(root) });
  const ctx = new MemoryRunContext(
    id,
    { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)', allowPrivateHosts: allowedPrivateHosts({ DSE_ALLOW_PRIVATE_HOSTS: `localhost:4100,localhost:${BLOCKING_SITES_PORT}` }), timeoutMs: 900_000, keepIntermediate: false, byo: false },
    models,
    new LocalStorage(join(store, name), `http://localhost:4401/${name}`),
    { id, url, host: new URL(url).host, status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: PIPELINE_VERSION, viewports: ['desktop', 'mobile'] },
  );
  const outcome = await runPipeline(ctx, { browser });
  for (const f of models.used) read.add(relative(dir, f));
  console.log(`${name} · ${outcome.status} · $${ctx.cost().usd.toFixed(4)}`);
}
await browser.close();
const added = [...files()].filter((f) => !before.has(f));
let kept: string[] = [];
try {
  kept = JSON.parse(readFileSync(extraFile, 'utf8')) as string[];
} catch {
  kept = [];
}
let unread: string[] = [];
if (keep && Object.keys(targets).every((n) => names.includes(n))) {
  unread = kept.filter((f) => !read.has(f) && !added.includes(f));
  for (const f of unread) rmSync(join(dir, f), { force: true });
  kept = kept.filter((f) => !unread.includes(f));
}
writeFileSync(extraFile, `${JSON.stringify([...new Set([...kept, ...added])].sort(), null, 2)}\n`);
console.log(`recordings · ${added.length} new · ${unread.length} unread deleted · listed in fixtures/recordings/extra.json`);
fixtures?.close();
sites.close();
storageServer.close();
