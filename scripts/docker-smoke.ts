// pnpm docker:smoke (docs/plan.md P14): builds the worker image from the repository root, runs it
// against the Docker services (test database, Redis database 15, the test bucket), sends it the
// clean fixture as a visitor would, waits for the run to complete, then stops it with SIGTERM.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { allowedPrivateHosts, RunDocumentComplete } from '@dse/schema';
import { closeDb, createDb, resetDatabase, tables, testDatabaseUrl } from '@dse/pipeline/db';
import { capsFromEnv, createQueue, createRedis, RunCounters, testRedisUrl } from '@dse/pipeline/queue';
import { S3Storage, testS3Config } from '@dse/pipeline/storage';
import { admitRun } from '../apps/web/lib/server/runs';
import type { Services } from '../apps/web/lib/server/services';
import { startFixtureServer } from './fixtures-serve';

const root = resolve(import.meta.dirname, '..');
const IMAGE = 'dse-worker:smoke';
const NAME = 'dse-worker-smoke';
// The container reaches the host's services and fixture server through Docker Desktop's host name.
const HOST = 'host.docker.internal';
const site = `http://${HOST}:4100/sites/clean/`;

const step = (s: string) => console.log(`\ndocker:smoke · ${s}`);
const docker = (args: string[]) => execFileSync('docker', args, { cwd: root, stdio: 'inherit' });

step('build');
docker(['build', '-f', 'apps/worker/Dockerfile', '-t', IMAGE, '.']);
execFileSync('docker', ['rm', '-f', NAME], { stdio: 'ignore' });

const fixtures = await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) }).then(() => null, () => startFixtureServer(4100));
await resetDatabase(testDatabaseUrl());
const db = createDb(testDatabaseUrl());
const redis = createRedis(testRedisUrl());
await redis.flushdb();
const s3 = testS3Config();
const encryptionKey = randomBytes(32).toString('base64');
const env = { ...process.env, NODE_ENV: 'test' };
const allow = [...allowedPrivateHosts(env), `${HOST}:4100`, `${HOST}:9000`];
const svc: Services = {
  db,
  redis,
  queue: createQueue(redis),
  counters: new RunCounters(redis, capsFromEnv(env)),
  storage: new S3Storage(s3),
  env,
  encryptionKey,
  adminToken: '',
  appUrl: 'http://localhost:3000',
  allowPrivateHosts: allow,
  production: false,
  resolver: async (host) => (host === HOST ? ['127.0.0.1'] : []),
};

const toContainer = (u: string) => u.replace(/(\/\/|@)(localhost|127\.0\.0\.1)(?=[:/])/, `$1${HOST}`);
const containerEnv: Record<string, string> = {
  // Production mode ignores the private-host allowance, and the services here are on the host.
  NODE_ENV: 'development',
  DATABASE_URL: toContainer(testDatabaseUrl()),
  REDIS_URL: toContainer(testRedisUrl()),
  STORAGE_ENDPOINT: toContainer(s3.endpoint),
  STORAGE_REGION: s3.region,
  STORAGE_BUCKET: s3.bucket,
  STORAGE_ACCESS_KEY: s3.accessKeyId,
  STORAGE_SECRET_KEY: s3.secretAccessKey,
  STORAGE_PUBLIC_BASE_URL: toContainer(s3.publicBaseUrl),
  DSE_MODEL_MODE: 'replay',
  DSE_JOB_ENCRYPTION_KEY: encryptionKey,
  DSE_ALLOW_PRIVATE_HOSTS: allow.join(','),
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  DSE_BUDGET_TIMEZONE: 'America/Boise',
};

step('run the image');
const child = spawn(
  'docker',
  ['run', '--rm', '--name', NAME, '--add-host', `${HOST}:host-gateway`, ...Object.entries(containerEnv).flatMap(([k, v]) => ['-e', `${k}=${v}`]), '-v', `${resolve(root, 'fixtures/recordings')}:/app/fixtures/recordings:ro`, IMAGE],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
const output: string[] = [];
child.stdout.on('data', (b: Buffer) => output.push(b.toString()));
child.stderr.on('data', (b: Buffer) => output.push(b.toString()));
const exited = new Promise<number | null>((r) => child.once('exit', r));

let failure = '';
try {
  const viewer = { visitorId: 'dockersmoke00000', userId: null, plan: 'free' as const, byoKey: false, ipHash: 'dockersmoke', cookieMissing: false };
  const result = await admitRun(svc, { body: { url: site }, viewer });
  if (result.kind !== 'created') throw new Error(`not enqueued: ${JSON.stringify(result)}`);
  const id = result.body.id;
  step(`run ${id} · ${site}`);
  const deadline = Date.now() + 600_000;
  let row: { status: string; document: unknown } | undefined;
  for (;;) {
    [row] = await db.select({ status: tables.runs.status, document: tables.runs.document }).from(tables.runs).where(eq(tables.runs.id, id));
    if (row && !['queued', 'running'].includes(row.status)) break;
    if (Date.now() > deadline) throw new Error('the run did not finish in 10 minutes');
    if (output.join('').includes('"run job failed"')) throw new Error('the worker failed the job');
    await new Promise((r) => setTimeout(r, 1000));
  }
  const doc = RunDocumentComplete.safeParse(row!.document);
  if (row!.status !== 'complete') throw new Error(`the run ended ${row!.status}`);
  if (!doc.success) throw new Error(`the document does not validate: ${doc.error.message.slice(0, 400)}`);
  const d = doc.data;
  const live = d.components.filter((c) => c.preview.mode === 'live').length;
  console.log(`complete · ${d.pages.length} pages · ${d.tokens.colors.length} colors · ${d.components.length} components · ${live} live previews · ${d.checks.summary.passed} of ${d.checks.summary.applicable} checks`);
  if (d.components.length === 0 || live === 0) throw new Error('no components or no live previews');
} catch (e) {
  failure = (e as Error).message;
} finally {
  step('stop (SIGTERM)');
  execFileSync('docker', ['stop', '-t', '30', NAME], { stdio: 'ignore' });
}
const code = await exited;
if (!failure && code !== 0) failure = `the worker exited ${code} on SIGTERM`;
if (!failure && !output.join('').includes('worker stopping')) failure = 'the worker did not log its shutdown';

await svc.queue.close();
redis.disconnect();
await closeDb(db);
fixtures?.close();
if (failure) {
  console.log(output.join('').split('\n').slice(-40).join('\n'));
  console.log(`\ndocker:smoke failed · ${failure}`);
  process.exit(1);
}
console.log('\ndocker:smoke passed');
process.exit(0);
