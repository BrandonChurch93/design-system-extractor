// pnpm soak (docs/plan.md P14): ten fixture runs through one worker, as a visitor would send them,
// against the test database, Redis database 15 and the test bucket. After each run: the worker's
// memory and the browser's open contexts and pages. Writes .dse/soak.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pino } from 'pino';
import { allowedPrivateHosts, RunDocumentComplete } from '@dse/schema';
import { closeDb, createDb, resetDatabase, tables, testDatabaseUrl } from '@dse/pipeline/db';
import { defaultRecordingsDir } from '@dse/pipeline/models/client';
import { capsFromEnv, createQueue, createRedis, RunCounters, testRedisUrl } from '@dse/pipeline/queue';
import { S3Storage, testS3Config } from '@dse/pipeline/storage';
import { eq } from 'drizzle-orm';
import { BrowserPool, RESTART_RSS_BYTES } from '../apps/worker/src/browser';
import { createRunWorker } from '../apps/worker/src/worker';
import { admitRun } from '../apps/web/lib/server/runs';
import type { Services } from '../apps/web/lib/server/services';
import { startFixtureServer } from './fixtures-serve';

const RUNS = 10;
const FIXTURES = ['clean', 'messy', 'tailwind', 'css-in-js', 'library'];
/** Heap still held after a full collection may grow by this much from the second run to the last. */
const HEAP_GROWTH_BYTES = 64 * 1024 ** 2;

const root = resolve(import.meta.dirname, '..');
const gc = (globalThis as { gc?: () => void }).gc;
if (!gc) throw new Error('run through pnpm soak (node --expose-gc)');
const env: Record<string, string | undefined> = { ...process.env, NODE_ENV: 'test' };
const fixtures = await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) }).then(() => null, () => startFixtureServer(4100));

await resetDatabase(testDatabaseUrl());
const db = createDb(testDatabaseUrl());
const redis = createRedis(testRedisUrl());
await redis.flushdb();
const queue = createQueue(redis);
const counters = new RunCounters(redis, capsFromEnv(env));
const storage = new S3Storage(testS3Config());
const encryptionKey = Buffer.alloc(32, 7).toString('base64');
const allowPrivateHosts = allowedPrivateHosts(env);
const svc: Services = { db, redis, queue, counters, storage, env, encryptionKey, adminToken: '', appUrl: 'http://localhost:3000', allowPrivateHosts, production: false };
const browsers = new BrowserPool();
const worker = createRunWorker({
  db,
  connection: createRedis(testRedisUrl()),
  counters,
  storage,
  browsers,
  log: pino({ level: 'error' }),
  config: {
    encryptionKey,
    modelMode: 'replay',
    recordingsDir: defaultRecordingsDir(root),
    strictReplay: true,
    userAgent: 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)',
    appUrl: svc.appUrl,
    timeoutMs: Number(env.DSE_RUN_TIMEOUT_MS ?? 360_000),
    showcaseTimeoutMs: 900_000,
    allowPrivateHosts,
    keepIntermediate: false,
  },
});

type Sample = { run: number; fixture: string; status: string; seconds: number; rssMb: number; heapMb: number; contexts: number; pages: number };
const samples: Sample[] = [];
const mb = (n: number) => Math.round((n / 1024 ** 2) * 10) / 10;
const failures: string[] = [];

for (let i = 0; i < RUNS; i++) {
  const fixture = FIXTURES[i % FIXTURES.length]!;
  // A visitor per run, so the soak measures the worker, not the caps.
  const viewer = { visitorId: `soakvisitor${String(i).padStart(5, '0')}`, userId: null, plan: 'free' as const, byoKey: false, ipHash: `soak${i}`, cookieMissing: false };
  const started = Date.now();
  const result = await admitRun(svc, { body: { url: `http://localhost:4100/sites/${fixture}/` }, viewer });
  if (result.kind !== 'created') throw new Error(`${fixture}: not enqueued (${JSON.stringify(result)})`);
  let status = 'queued';
  while (status === 'queued' || status === 'running') {
    await new Promise((r) => setTimeout(r, 500));
    const [row] = await db.select({ status: tables.runs.status }).from(tables.runs).where(eq(tables.runs.id, result.body.id));
    status = row?.status ?? 'missing';
  }
  if (status === 'complete') {
    const [row] = await db.select({ document: tables.runs.document }).from(tables.runs).where(eq(tables.runs.id, result.body.id));
    if (!RunDocumentComplete.safeParse(row!.document).success) failures.push(`run ${i + 1} (${fixture}): the document does not validate`);
  }
  // The worker finishes its bookkeeping after the row turns terminal.
  await new Promise((r) => setTimeout(r, 1000));
  gc();
  const m = process.memoryUsage();
  const sample = { run: i + 1, fixture, status, seconds: Math.round((Date.now() - started) / 1000), rssMb: mb(m.rss), heapMb: mb(m.heapUsed), ...browsers.open };
  samples.push(sample);
  console.log(`soak · ${sample.run} of ${RUNS} · ${fixture} · ${status} · ${sample.seconds} s · rss ${sample.rssMb} MB · heap ${sample.heapMb} MB · contexts ${sample.contexts} · pages ${sample.pages}`);
  if (status !== 'complete') failures.push(`run ${i + 1} (${fixture}) ended ${status}`);
  if (sample.contexts || sample.pages) failures.push(`run ${i + 1} (${fixture}) left ${sample.contexts} contexts and ${sample.pages} pages open`);
  if (m.rss > RESTART_RSS_BYTES) failures.push(`run ${i + 1} (${fixture}) passed the restart threshold: ${sample.rssMb} MB`);
}

const growth = (samples.at(-1)!.heapMb - samples[1]!.heapMb) * 1024 ** 2;
if (growth > HEAP_GROWTH_BYTES) failures.push(`heap grew ${mb(growth)} MB from run 2 to run ${RUNS}`);

await worker.close();
await browsers.close();
await queue.close();
redis.disconnect();
await closeDb(db);
fixtures?.close();

const report = { at: new Date().toISOString(), runs: RUNS, maxRssMb: Math.max(...samples.map((s) => s.rssMb)), heapGrowthMb: mb(growth), restartThresholdMb: mb(RESTART_RSS_BYTES), samples, failures };
mkdirSync(resolve(root, '.dse'), { recursive: true });
writeFileSync(resolve(root, '.dse/soak.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\nsoak ${failures.length ? 'failed' : 'passed'} · max rss ${report.maxRssMb} MB of ${report.restartThresholdMb} · heap growth ${report.heapGrowthMb} MB · .dse/soak.json`);
for (const f of failures) console.log(`  ${f}`);
process.exit(failures.length ? 1 : 0);
