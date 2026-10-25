import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv, parseArgs } from 'node:util';
import { validateEnv } from '@dse/schema/env';
import { models } from '@dse/pipeline/models/config';

type Row = { check: string; result: 'pass' | 'warn' | 'fail'; detail: string };

const { values } = parseArgs({
  options: { production: { type: 'boolean', default: false }, env: { type: 'string' } },
  allowPositionals: false,
});

function print(rows: Row[]): number {
  const w = Math.max(...rows.map((r) => r.check.length), 5);
  console.log(`\n${'Check'.padEnd(w)}  Result  Detail`);
  console.log(`${'-'.repeat(w)}  ------  ------`);
  for (const r of rows) console.log(`${r.check.padEnd(w)}  ${r.result.padEnd(6)}  ${r.detail}`);
  const fails = rows.filter((r) => r.result === 'fail').length;
  const warns = rows.filter((r) => r.result === 'warn').length;
  console.log(`\n${fails ? `${fails} failing` : 'All checks pass'}${warns ? ` · ${warns} warning${warns > 1 ? 's' : ''}` : ''}`);
  return fails ? 1 : 0;
}

function envRows(source: Record<string, string | undefined>): Row[] {
  const issues = validateEnv(source);
  if (!issues.length) return [{ check: 'env', result: 'pass', detail: 'every variable present with the right shape' }];
  return issues.map((i) => ({ check: `env ${i.key}`, result: 'fail', detail: i.problem }));
}

function portOf(u: string): string {
  try {
    const p = new URL(u.replace(/^postgres(ql)?:/, 'http:'));
    return p.port || '5432';
  } catch {
    return '';
  }
}

function production(): number {
  const file = resolve(process.cwd(), values.env ?? '.env.production.local');
  if (!existsSync(file)) {
    return print([{ check: 'env file', result: 'fail', detail: `${file} not found` }]);
  }
  const src = parseEnv(readFileSync(file, 'utf8')) as Record<string, string | undefined>;
  const rows: Row[] = [{ check: 'env file', result: 'pass', detail: file }, ...envRows(src)];
  const allow = src.DSE_ALLOW_PRIVATE_HOSTS ?? '';
  rows.push(
    allow.trim()
      ? { check: 'private hosts', result: 'fail', detail: 'DSE_ALLOW_PRIVATE_HOSTS must be empty in production' }
      : { check: 'private hosts', result: 'pass', detail: 'no private-host allowance' },
  );
  rows.push(
    src.BILLING_ENABLED === 'false'
      ? { check: 'billing flag', result: 'pass', detail: 'BILLING_ENABLED=false' }
      : { check: 'billing flag', result: 'fail', detail: 'BILLING_ENABLED must be false in v1' },
  );
  rows.push(
    src.DSE_MODEL_MODE === 'live'
      ? { check: 'model mode', result: 'pass', detail: 'live' }
      : { check: 'model mode', result: 'fail', detail: 'DSE_MODEL_MODE must be live in production' },
  );
  const dbPort = portOf(src.DATABASE_URL ?? '');
  rows.push(
    dbPort === '5432'
      ? { check: 'database url', result: 'pass', detail: 'session form (5432) for the worker and migrations · Vercel gets the transaction pooler string (6543)' }
      : dbPort === '6543'
        ? { check: 'database url', result: 'fail', detail: 'this file is the worker and migration env: use the session string (5432); the pooler string (6543) goes to Vercel only' }
        : { check: 'database url', result: 'fail', detail: 'cannot read the port' },
  );
  rows.push(
    (src.REDIS_URL ?? '').startsWith('rediss://')
      ? { check: 'redis tls', result: 'pass', detail: 'rediss://' }
      : { check: 'redis tls', result: 'warn', detail: 'REDIS_URL is not TLS (rediss://)' },
  );
  for (const key of ['NEXT_PUBLIC_APP_URL', 'STORAGE_PUBLIC_BASE_URL', 'STORAGE_ENDPOINT'] as const) {
    const v = src[key] ?? '';
    rows.push(
      v.startsWith('https://')
        ? { check: `https ${key}`, result: 'pass', detail: v }
        : { check: `https ${key}`, result: 'fail', detail: 'must be https in production' },
    );
  }
  const app = src.NEXT_PUBLIC_APP_URL ?? '';
  rows.push(
    (src.DSE_USER_AGENT ?? '').includes(`(+${app}/how-it-works)`)
      ? { check: 'user agent', result: 'pass', detail: 'names the app URL' }
      : { check: 'user agent', result: 'fail', detail: `must end with (+${app}/how-it-works)` },
  );
  rows.push(
    /localhost|127\.0\.0\.1/.test(`${src.DATABASE_URL}${src.REDIS_URL}${src.STORAGE_ENDPOINT}${app}`)
      ? { check: 'no local hosts', result: 'fail', detail: 'a production value points at localhost' }
      : { check: 'no local hosts', result: 'pass', detail: 'no localhost values' },
  );
  return print(rows);
}

async function timed<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let t: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${what} timed out after ${ms / 1000} s`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

async function local(): Promise<number> {
  const env = process.env;
  const rows: Row[] = envRows(env);

  try {
    const { default: postgres } = await import('postgres');
    const sql = postgres(env.DATABASE_URL!, { max: 1, connect_timeout: 5, onnotice: () => {} });
    const [row] = await timed(sql<{ v: string }[]>`select current_setting('server_version') as v`, 8000, 'postgres');
    const v = row?.v ?? '?';
    const dbs = await sql<{ datname: string }[]>`select datname from pg_database where datname in ('dse','dse_test')`;
    await sql.end();
    const names = dbs.map((d) => d.datname).sort();
    rows.push(
      names.length === 2
        ? { check: 'postgres', result: 'pass', detail: `connected · server ${v} · databases dse and dse_test` }
        : { check: 'postgres', result: 'fail', detail: `connected, but databases found: ${names.join(', ') || 'none'}` },
    );
  } catch (e) {
    rows.push({ check: 'postgres', result: 'fail', detail: (e as Error).message });
  }

  try {
    const { Redis } = await import('ioredis');
    const redis = new Redis(env.REDIS_URL!, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 5000 });
    await timed(redis.connect(), 8000, 'redis');
    const pong = await redis.ping();
    const info = await redis.info('server');
    await redis.quit();
    const ver = /redis_version:(\S+)/.exec(info)?.[1] ?? '?';
    rows.push({ check: 'redis', result: pong === 'PONG' ? 'pass' : 'fail', detail: `connected · ${pong} · server ${ver}` });
  } catch (e) {
    rows.push({ check: 'redis', result: 'fail', detail: (e as Error).message });
  }

  try {
    const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION,
      forcePathStyle: true,
      credentials: { accessKeyId: env.STORAGE_ACCESS_KEY!, secretAccessKey: env.STORAGE_SECRET_KEY! },
    });
    const buckets = [env.STORAGE_BUCKET!, ...(env.STORAGE_BUCKET === 'dse' ? ['dse-test'] : [])];
    for (const b of buckets) await timed(s3.send(new HeadBucketCommand({ Bucket: b })), 8000, `bucket ${b}`);
    const key = `doctor/probe-${Date.now()}.txt`;
    await s3.send(new PutObjectCommand({ Bucket: env.STORAGE_BUCKET!, Key: key, Body: 'ok', ContentType: 'text/plain; charset=utf-8' }));
    const res = await fetch(`${env.STORAGE_PUBLIC_BASE_URL}/${key}`);
    const body = await res.text();
    await s3.send(new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET!, Key: key }));
    rows.push(
      res.ok && body === 'ok'
        ? { check: 'storage', result: 'pass', detail: `connected · buckets ${buckets.join(' and ')} · public read works` }
        : { check: 'storage', result: 'fail', detail: `public read returned ${res.status}` },
    );
  } catch (e) {
    rows.push({ check: 'storage', result: 'fail', detail: (e as Error).message });
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 10_000 });
    const found: string[] = [];
    for (const id of [models.small, models.large]) {
      const m = await client.models.retrieve(id);
      found.push(m.id);
    }
    rows.push({ check: 'anthropic', result: 'pass', detail: `key accepted · models ${found.join(' and ')} available` });
  } catch (e) {
    rows.push({ check: 'anthropic', result: 'fail', detail: (e as Error).message.split('\n')[0] ?? 'error' });
  }

  try {
    const res = await fetch('http://localhost:4100/sites/', { signal: AbortSignal.timeout(2000) });
    rows.push({ check: 'fixture server', result: 'pass', detail: `localhost:4100 answered ${res.status}` });
  } catch {
    rows.push({ check: 'fixture server', result: 'warn', detail: 'not running (start with pnpm fixtures:serve when needed)' });
  }

  return print(rows);
}

process.exitCode = values.production ? production() : await local();
