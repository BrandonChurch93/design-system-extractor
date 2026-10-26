// Seeds the six fixture runs through the local queue, the three frozen in-progress documents, and
// the local showcase content (docs/evals.md, Deterministic seeds; docs/specs/showcase.md, Local seed).
// Fixed ids, dates and costs come from fixtures/seed.json, so goldens and QA screenshots never move.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import { pino } from 'pino';
import { z } from 'zod';
import { Cost, RunDocumentPartial, ShowcaseCategory, ShowcaseContent, Stage, type RunDocumentPatch } from '@dse/schema';
import type { EmitInput } from '@dse/pipeline/context';
import { applyPatch, closeDb, listEvents, runMigrations, setShowcase, tables } from '@dse/pipeline/db';
import { defaultRecordingsDir } from '@dse/pipeline/models/client';
import { BrowserPool } from '../apps/worker/src/browser';
import { createRunWorker } from '../apps/worker/src/worker';
import { paletteOf } from '../apps/web/lib/palette';
import { admitRun } from '../apps/web/lib/server/runs';
import { servicesFromEnv } from '../apps/web/lib/server/services';
import { startFixtureServer } from './fixtures-serve';

const root = resolve(import.meta.dirname, '..');
const seedFile = resolve(root, 'fixtures/seed.json');
const contentFile = resolve(root, 'apps/web/content/showcase.json');

const SeedRun = z.object({
  fixture: z.string(),
  id: z.string().regex(/^[0-9a-z]{10}$/),
  name: z.string(),
  category: ShowcaseCategory,
  order: z.number().int().positive(),
  createdAt: z.string(),
  startedAt: z.string(),
  durationMs: z.number().int().positive(),
  cost: Cost.optional(),
});
const SeedFile = z.object({
  generatedAt: z.string(),
  appUrl: z.string().url(),
  runs: z.array(SeedRun).length(6),
  progress: z.array(z.object({ id: z.string().regex(/^[0-9a-z]{10}$/), fixture: z.literal('clean'), through: Stage, createdAt: z.string(), startedAt: z.string() })).length(3),
});

const seed = SeedFile.parse(JSON.parse(readFileSync(seedFile, 'utf8')));
const env = process.env;
const svc = servicesFromEnv(env);
const log = pino({ level: 'error' });
const at = (iso: string, ms: number) => new Date(Date.parse(iso) + ms).toISOString();
const allIds = [...seed.runs.map((r) => r.id), ...seed.progress.map((p) => p.id)];

if (env.NODE_ENV === 'production') throw new Error('the fixture seed is for development and test databases only');

// --if-missing (verify:all): leave a complete seed alone.
if (process.argv.includes('--if-missing')) {
  const rows = await svc.db.select({ id: tables.runs.id, status: tables.runs.status, isShowcase: tables.runs.isShowcase, qaFrozen: tables.runs.qaFrozen }).from(tables.runs).where(inArray(tables.runs.id, allIds)).catch(() => []);
  const content = ShowcaseContent.safeParse(JSON.parse(readFileSync(contentFile, 'utf8')));
  const present =
    seed.runs.every((r) => rows.some((x) => x.id === r.id && x.status === 'complete' && x.isShowcase)) &&
    seed.progress.every((p) => rows.some((x) => x.id === p.id && x.status === 'running' && x.qaFrozen)) &&
    content.success &&
    content.data.entries.length === seed.runs.length;
  if (present) {
    console.log('seed · present, nothing to do');
    svc.redis.disconnect();
    await svc.queue.close();
    await closeDb(svc.db);
    process.exit(0);
  }
}
const age = await svc.counters.heartbeatAge();
if (age !== null && age < 45) {
  console.error('A worker is running (pnpm dev). Stop it first: the seed runs its own worker in replay mode.');
  process.exit(1);
}

await runMigrations(env.DATABASE_URL!);
const running = await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) }).then(
  () => true,
  () => false,
);
const fixtures = running ? null : await startFixtureServer(4100);

// A clean slate for the seed ids: rows (events and pages cascade), files, finished jobs.
await svc.db.delete(tables.runs).where(inArray(tables.runs.id, allIds));
for (const id of allIds) {
  await svc.storage.deletePrefix(`runs/${id}/`);
  await (await svc.queue.getJob(id))?.remove();
}

// Every emit of the clean run, with the document after it, for the frozen in-progress documents.
const cleanId = seed.runs.find((r) => r.fixture === 'clean')!.id;
const cleanEmits: { stage: Stage; doc: RunDocumentPartial }[] = [];
const observe = (runId: string) => (runId === cleanId ? (input: EmitInput, doc: RunDocumentPartial) => void cleanEmits.push({ stage: input.stage, doc }) : undefined);

const viewer = { visitorId: 'seedfixtures0000', userId: null, plan: 'free' as const, byoKey: false, ipHash: 'seedfixtures', cookieMissing: false };
for (const r of seed.runs) {
  const result = await admitRun(svc, { body: { url: `http://localhost:4100/sites/${r.fixture}/` }, viewer, showcase: true, id: r.id, now: new Date(r.createdAt) });
  if (result.kind !== 'created') throw new Error(`${r.fixture}: not enqueued (${JSON.stringify(result)})`);
}

const browsers = new BrowserPool();
const workerConnection = svc.redis.duplicate();
const worker = createRunWorker({
  db: svc.db,
  connection: workerConnection,
  counters: svc.counters,
  storage: svc.storage,
  browsers,
  log,
  observe,
  config: {
    encryptionKey: svc.encryptionKey,
    modelMode: 'replay',
    recordingsDir: defaultRecordingsDir(root),
    strictReplay: true,
    userAgent: env.DSE_USER_AGENT ?? 'DesignSystemExtractorBot/1.0 (+http://localhost:3000/how-it-works)',
    appUrl: seed.appUrl,
    timeoutMs: 900_000,
    allowPrivateHosts: svc.allowPrivateHosts,
    keepIntermediate: false,
  },
});

const started = Date.now();
let reported = -1;
for (;;) {
  const rows = await svc.db.select({ id: tables.runs.id, status: tables.runs.status }).from(tables.runs).where(inArray(tables.runs.id, seed.runs.map((r) => r.id)));
  const open = rows.filter((r) => r.status === 'queued' || r.status === 'running');
  if (rows.length - open.length !== reported) {
    reported = rows.length - open.length;
    console.log(`seed · ${reported} of ${rows.length} runs finished · ${Math.round((Date.now() - started) / 1000)} s`);
  }
  if (!open.length) {
    const bad = rows.filter((r) => r.status !== 'complete');
    if (bad.length) throw new Error(`runs did not complete: ${bad.map((r) => `${r.id} ${r.status}`).join(', ')}`);
    break;
  }
  await new Promise((ok) => setTimeout(ok, 2000));
}
await worker.close();
await browsers.close();
workerConnection.disconnect();

/** Event times spread evenly across the run, so the live log reads the same on every seed. */
async function fixEventTimes(runId: string, startedAt: string, durationMs: number) {
  const events = await listEvents(svc.db, runId);
  for (const [i, e] of events.entries()) {
    await svc.db.update(tables.runEvents).set({ ts: at(startedAt, Math.round(((i + 1) * durationMs) / (events.length + 1))) }).where(eq(tables.runEvents.id, e.id));
  }
}

// Fixed dates and costs; showcase listing with null retention.
let wroteCost = false;
const entries: ShowcaseContent['entries'] = [];
for (const r of seed.runs) {
  const [row] = await svc.db.select().from(tables.runs).where(eq(tables.runs.id, r.id));
  const doc = RunDocumentPartial.parse(row!.document);
  if (!r.cost) {
    r.cost = doc.cost;
    wroteCost = true;
  }
  const finishedAt = at(r.startedAt, r.durationMs);
  const patch: RunDocumentPatch = { createdAt: r.createdAt, startedAt: r.startedAt, finishedAt, durationMs: r.durationMs, cost: r.cost };
  const fixed = await applyPatch(svc.db, r.id, patch);
  await svc.db.update(tables.runs).set({ createdAt: r.createdAt }).where(eq(tables.runs.id, r.id));
  await setShowcase(svc.db, r.id, true);
  await fixEventTimes(r.id, r.startedAt, r.durationMs);
  entries.push({ runId: r.id, url: `${seed.appUrl}/r/${r.id}`, host: fixed.host!, name: r.name, category: r.category, order: r.order, stats: fixed.stats!, palette: paletteOf(fixed) });
}
if (wroteCost) {
  writeFileSync(seedFile, `${JSON.stringify(seed, null, 2)}\n`);
  console.log('seed · costs recorded in fixtures/seed.json; later seeds reuse them');
}

// The frozen in-progress documents: the clean run as it stood when each stage finished.
const cleanEvents = await listEvents(svc.db, cleanId);
const [cleanRow] = await svc.db.select().from(tables.runs).where(eq(tables.runs.id, cleanId));
for (const p of seed.progress) {
  const last = cleanEmits.map((e) => e.stage).lastIndexOf(p.through);
  if (last < 0) throw new Error(`the clean run never reached ${p.through}`);
  const doc = RunDocumentPartial.parse({ ...cleanEmits[last]!.doc, id: p.id, status: 'running', createdAt: p.createdAt, startedAt: p.startedAt });
  await svc.db.insert(tables.runs).values({
    id: p.id,
    url: cleanRow!.url,
    host: cleanRow!.host,
    status: 'running',
    visitorId: viewer.visitorId,
    priority: cleanRow!.priority,
    pageCap: cleanRow!.pageCap,
    includeUrls: [],
    viewports: cleanRow!.viewports,
    pipelineVersion: cleanRow!.pipelineVersion,
    document: doc,
    stats: null,
    frameworkHint: doc.frameworkHint ?? null,
    createdAt: p.createdAt,
    startedAt: p.startedAt,
    retentionUntil: null,
    qaFrozen: true,
  });
  const events = cleanEvents.slice(0, last + 1);
  if (events.length) {
    await svc.db.insert(tables.runEvents).values(events.map((e, i) => ({ runId: p.id, ts: at(p.startedAt, (i + 1) * 900), stage: e.stage, substage: e.substage, level: e.level, message: e.message, data: e.data })));
  }
}

const content = ShowcaseContent.parse({ generatedAt: seed.generatedAt, appUrl: seed.appUrl, entries });
writeFileSync(contentFile, `${JSON.stringify(content, null, 2)}\n`);

console.log('\nhost             run         colors  type  space  components  checks    cost');
for (const r of seed.runs) {
  const s = entries.find((e) => e.runId === r.id)!.stats;
  console.log(`${r.fixture.padEnd(16)} ${r.id}  ${String(s.colors).padStart(6)}  ${String(s.typeStyles).padStart(4)}  ${String(s.spacingSteps).padStart(5)}  ${String(s.components).padStart(10)}  ${`${s.checksPassed} of ${s.checksApplicable}`.padStart(8)}  $${(r.cost?.usd ?? 0).toFixed(4)}`);
}
console.log(`frozen · ${seed.progress.map((p) => `${p.id} after ${p.through}`).join(' · ')}`);
console.log(`showcase · ${entries.length} entries written to apps/web/content/showcase.json`);

fixtures?.close();
await svc.queue.close();
svc.redis.disconnect();
await closeDb(svc.db);
