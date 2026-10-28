import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ShowcaseContent } from '@dse/schema';
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

describe('the showcase script, its other paths', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dse-showcase-flags-'));
  const fixture = (n: number) => ({ url: `https://site${n}.example/`, host: `site${n}.example`, name: `Site ${n}`, category: 'SaaS', order: n, why: 'test' });
  writeFileSync(
    join(dir, 'roster.json'),
    JSON.stringify({
      roster: [{ ...fixture(1), url: 'https://blocked.example/', host: 'blocked.example' }, ...[2, 3, 4, 5, 6, 7].map(fixture)],
      alternates: [{ url: 'https://alt.example/', host: 'alt.example', name: 'Alt', category: 'SaaS' }],
    }),
  );
  const base = { DSE_SHOWCASE_ROSTER: join(dir, 'roster.json'), DSE_SHOWCASE_REPORT: join(dir, 'report.md'), DSE_SHOWCASE_CONTENT: join(dir, 'showcase.json') };
  const content = () => ShowcaseContent.parse(JSON.parse(readFileSync(join(dir, 'showcase.json'), 'utf8')));

  it('--alternates prints the alternates, and runs nothing', async () => {
    const r = await showcase(['--alternates'], base);
    expect(r.status, r.out).toBe(0);
    expect(r.out).toContain('| Site | Category |\n| --- | --- |\n| alt.example | SaaS |');
  });

  it('--remote runs every site through the admin API with the token, replaces a blocked one, uploads the content, and --only replaces one entry', async () => {
    const clean = JSON.parse(readFileSync(resolve(root, 'packages/pipeline/test/fixtures/runs/clean.json'), 'utf8'));
    const seen: { method: string; path: string; auth?: string; body?: unknown }[] = [];
    let n = 0;
    let sparse = false;
    const sites = new Map<string, string>();
    const api = createServer((req, res) => {
      let raw = '';
      req.on('data', (c: Buffer) => (raw += c.toString()));
      req.on('end', () => {
        const body = raw ? JSON.parse(raw) : undefined;
        seen.push({ method: req.method!, path: req.url!, auth: req.headers.authorization, body });
        const send = (o: unknown) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(o));
        if (req.url === '/api/admin/showcase/run') {
          const url = (body as { url: string }).url;
          if (url.includes('blocked')) return send({ blocked: 'bot', detail: {} });
          const id = `stubrun${String(++n).padStart(3, '0')}`;
          sites.set(id, url);
          return send({ id });
        }
        if (req.url?.startsWith('/api/runs/')) {
          const id = req.url.split('/').pop()!;
          const url = sites.get(id)!;
          if (!url) return res.writeHead(404).end();
          return send({ id, status: 'complete', isShowcase: true, document: { ...clean, id, url, host: new URL(url).host, ...(sparse ? { sparse: true } : {}) }, events: [] });
        }
        if (req.url === '/api/admin/showcase/content') return send({ stored: 'showcase/showcase.json', entries: (body as { entries: unknown[] }).entries.length, removed: 0 });
        res.writeHead(404).end();
      });
    });
    await new Promise<void>((ok) => api.listen(0, ok));
    const appUrl = `http://localhost:${(api.address() as AddressInfo).port}`;
    try {
      const env = { ...base, NEXT_PUBLIC_APP_URL: appUrl, DSE_ADMIN_TOKEN: 'admin-token-for-tests-0123456789abcdef' };
      const r = await showcase(['--remote'], env);
      expect(r.status, r.out).toBe(0);
      expect(seen.every((s) => !s.path.startsWith('/api/admin') || s.auth === 'Bearer admin-token-for-tests-0123456789abcdef')).toBe(true);
      expect(seen.filter((s) => s.path === '/api/admin/showcase/run').map((s) => (s.body as { url: string }).url)).toEqual(['https://blocked.example/', 'https://alt.example/', ...[2, 3, 4, 5, 6, 7].map((k) => `https://site${k}.example/`)]);
      const uploaded = seen.find((s) => s.path === '/api/admin/showcase/content')!.body as { entries: { host: string; url: string }[] };
      expect(uploaded.entries.map((e) => e.host)).toEqual(['alt.example', 'site2.example', 'site3.example', 'site4.example', 'site5.example', 'site6.example']);
      expect(uploaded.entries[0]!.url).toBe(`${appUrl}/r/stubrun001`);
      expect(content().entries).toHaveLength(6);
      expect(readFileSync(join(dir, 'report.md'), 'utf8')).toMatch(/\| 1 \| blocked\.example \| blocked · bot · replaced by alt\.example \|/);

      // --only runs one roster site and replaces its entry, keeping the rest.
      const before = content().entries;
      expect((await showcase(['--remote', '--only', 'site3.example'], env)).status).toBe(0);
      const after = content().entries;
      expect(after.find((e) => e.host === 'site3.example')!.runId).not.toBe(before.find((e) => e.host === 'site3.example')!.runId);
      expect(after.filter((e) => e.host !== 'site3.example')).toEqual(before.filter((e) => e.host !== 'site3.example'));

      // --refresh-links rewrites every link for a new domain without running anything.
      const runs = seen.filter((s) => s.path === '/api/admin/showcase/run').length;
      const moved = await showcase(['--refresh-links'], { ...base, NEXT_PUBLIC_APP_URL: 'https://dse.example' });
      expect(moved.status, moved.out).toBe(0);
      expect(content().appUrl).toBe('https://dse.example');
      expect(content().entries.every((e) => e.url.startsWith('https://dse.example/r/'))).toBe(true);
      expect(seen.filter((s) => s.path === '/api/admin/showcase/run').length).toBe(runs);

      // --add promotes an existing run without running anything; --list shows it; --remove takes it down (D-091).
      sites.set('ownerrun00', 'https://www.ownsite.example/');
      const penv = { ...env, STORAGE_PUBLIC_BASE_URL: appUrl };
      const refused = await showcase(['--remote', '--add', 'ownerrun00'], penv);
      expect(refused.status).toBe(1);
      expect(refused.out).toContain('www.ownsite.example is not in the roster or the alternates. Give --category <name>');
      const added = await showcase(['--remote', '--add', 'ownerrun00', '--category', 'Personal', '--name', 'Own site'], penv);
      expect(added.status, added.out).toBe(0);
      expect(added.out).toContain('7 entries leave an orphan at 3 or 2 columns. Add 5 more or remove 1.');
      expect(content().entries[0]).toMatchObject({ runId: 'ownerrun00', order: 1, name: 'Own site', category: 'Personal', promoted: true });
      expect(content().entries.map((e) => e.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(seen.filter((s) => s.path === '/api/admin/showcase/run').length).toBe(runs);
      const listed = await showcase(['--remote', '--list'], penv);
      expect(listed.out).toContain('| 1 | www.ownsite.example | Own site | Personal | ownerrun00 | promoted |');
      expect((await showcase(['--remote', '--remove', 'ownerrun00'], penv)).status).toBe(0);
      expect(content().entries.map((e) => e.runId)).not.toContain('ownerrun00');
      sparse = true;
      const sparseRun = await showcase(['--remote', '--add', 'ownerrun00', '--category', 'Personal'], penv);
      expect(sparseRun.status).toBe(1);
      expect(sparseRun.out).toContain('ownerrun00 is sparse (');
    } finally {
      api.close();
    }
  }, 300_000);
});

