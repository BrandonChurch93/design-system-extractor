import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeDb, createDb, resetDatabase, tables, testDatabaseUrl } from '@dse/pipeline/db';
import { createRedis, testRedisUrl } from '@dse/pipeline/queue';
import { testS3Config } from '@dse/pipeline/storage';
import { BLOCKING_SITES_PORT, startBlockingSites } from '../blocking-sites';
import { startFixtureServer } from '../fixtures-serve';

// `pnpm showcase --dry-run` end to end on fixture sites (docs/specs/showcase.md, The script): its own
// worker through the queue, a blocked site replaced by an alternate of the same category, the table
// and the report, and nothing listed or written.

const root = resolve(import.meta.dirname, '../..');
const contentFile = resolve(root, 'apps/web/content/showcase.json');
let fixtures: { close(): void } | null = null;
let sites: Server;

beforeAll(async () => {
  fixtures = await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) }).then(() => null, () => startFixtureServer(4100));
  sites = await startBlockingSites();
  await resetDatabase(testDatabaseUrl());
  const redis = createRedis(testRedisUrl());
  await redis.flushdb();
  redis.disconnect();
}, 120_000);

afterAll(() => {
  fixtures?.close();
  sites?.close();
});

function showcase(args: string[], env: Record<string, string>): Promise<{ status: number | null; out: string }> {
  return new Promise((done) => {
    const child = spawn(process.execPath, ['scripts/run.mjs', 'node', '--import', 'tsx', 'scripts/showcase/index.ts', ...args], { cwd: root, env: { ...process.env, ...env } });
    let out = '';
    child.stdout.on('data', (b: Buffer) => (out += b.toString()));
    child.stderr.on('data', (b: Buffer) => (out += b.toString()));
    child.on('close', (status) => done({ status, out }));
  });
}

describe('the showcase script, dry run', () => {
  it('runs the roster through its own worker, replaces a blocked site from its category, reports, and lists nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dse-showcase-'));
    const fixture = (name: string) => ({ url: `http://localhost:4100/sites/${name}/`, host: `${name}.fixture`, name: `Tidewater ${name}` });
    writeFileSync(
      join(dir, 'roster.json'),
      JSON.stringify({
        roster: [
          { ...fixture('clean'), category: 'SaaS', order: 1, why: 'clean' },
          { url: `http://localhost:${BLOCKING_SITES_PORT}/bot/`, host: 'bot.fixture', name: 'Bot', category: 'Finance', order: 2, why: 'blocks' },
        ],
        alternates: [{ ...fixture('library'), category: 'Finance' }],
      }),
    );
    const report = join(dir, 'report.md');
    const before = readFileSync(contentFile, 'utf8');
    const s3 = testS3Config();
    const r = await showcase(['--dry-run'], {
      DSE_SHOWCASE_ROSTER: join(dir, 'roster.json'),
      DSE_SHOWCASE_REPORT: report,
      DATABASE_URL: testDatabaseUrl(),
      REDIS_URL: testRedisUrl(),
      STORAGE_BUCKET: s3.bucket,
      STORAGE_PUBLIC_BASE_URL: s3.publicBaseUrl,
      DSE_MODEL_MODE: 'replay',
      DSE_ALLOW_PRIVATE_HOSTS: `localhost:4100,localhost:${BLOCKING_SITES_PORT}`,
    });
    expect(r.status, r.out).toBe(0);
    const table = readFileSync(report, 'utf8');
    expect(table).toMatch(/\| 1 \| clean\.fixture \| complete \| \d+ \| 9 \|/);
    expect(table).toMatch(/\| 2 \| bot\.fixture \| blocked · bot · replaced by library\.fixture \|/);
    expect(table).toMatch(/\| 2 \| library\.fixture \| complete \|/);
    expect(table).toMatch(/Total cost \$\d+\.\d{3}\./);
    expect(r.out).toContain('showcase · 0 entries would be listed (dry run, nothing written)');
    expect(readFileSync(contentFile, 'utf8')).toBe(before);
    const db = createDb(testDatabaseUrl());
    const rows = await db.select().from(tables.runs);
    await closeDb(db);
    expect(rows.filter((x) => x.status === 'complete')).toHaveLength(2);
    expect(rows.every((x) => !x.isShowcase)).toBe(true);
  }, 600_000);
});
