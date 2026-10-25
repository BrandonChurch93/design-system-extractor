import { randomBytes } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newRunId, type RunDocumentPartial } from '@dse/schema';
import { appendEvent, applyPatch, closeDb, createDb, getRunForViewer, listEvents, resetDatabase, runMigrations, tables, testDatabaseUrl, type Db } from '../src/db';
import { S3Storage, testS3Config } from '../src/storage';

const url = testDatabaseUrl();
let db: Db;

async function tableNames(): Promise<string[]> {
  const rows = await db.execute<{ table_name: string }>(sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`);
  return rows.map((r) => r.table_name);
}

async function insertRun(overrides: Partial<typeof tables.runs.$inferInsert> = {}) {
  const id = newRunId();
  const document: RunDocumentPartial = {
    id,
    url: 'https://tidewater.app/',
    host: 'tidewater.app',
    status: 'queued',
    createdAt: new Date().toISOString(),
    pipelineVersion: '1.0.0',
    viewports: ['desktop', 'mobile'],
  };
  await db.insert(tables.runs).values({ id, url: document.url, host: document.host, visitorId: 'visitor0000000ab', pageCap: 12, pipelineVersion: '1.0.0', document, ...overrides });
  return id;
}

beforeAll(async () => {
  await resetDatabase(url);
  db = createDb(url);
});

afterAll(async () => {
  await closeDb(db);
});

describe('migrations', () => {
  it('create every table on a clean database', async () => {
    expect(await tableNames()).toEqual(['run_events', 'run_pages', 'runs', 'subscriptions', 'users', 'visitors']);
  });

  it('are idempotent', async () => {
    await runMigrations(url);
    expect(await tableNames()).toHaveLength(6);
  });

  it('reset returns the database to empty and re-applies them', async () => {
    await insertRun();
    const before = await db.select().from(tables.runs);
    expect(before.length).toBeGreaterThan(0);
    await resetDatabase(url);
    expect(await tableNames()).toHaveLength(6);
    expect(await db.select().from(tables.runs)).toHaveLength(0);
  });
});

describe('run store', () => {
  it('applies patches as a deep merge and validates the result', async () => {
    const id = await insertRun();
    await applyPatch(db, id, { status: 'running', tokens: { colors: [] } });
    const doc = await applyPatch(db, id, { tokens: { breakpoints: [640, 1024] } });
    expect(doc.status).toBe('running');
    expect(doc.tokens).toEqual({ colors: [], breakpoints: [640, 1024] });
    await expect(applyPatch(db, id, { status: 'paused' })).rejects.toThrow();
    const [row] = await db.select().from(tables.runs).where(sql`id = ${id}`);
    expect((row!.document as RunDocumentPartial).status).toBe('running');
  });

  it('serializes concurrent patches without losing either', async () => {
    const id = await insertRun();
    await Promise.all([applyPatch(db, id, { tokens: { colors: [] } }), applyPatch(db, id, { tokens: { breakpoints: [768] } }), applyPatch(db, id, { sparse: false })]);
    const row = await getRunForViewer(db, id, null);
    expect(row!.document).toMatchObject({ tokens: { colors: [], breakpoints: [768] }, sparse: false });
  });

  it('appends events in order', async () => {
    const id = await insertRun();
    await appendEvent(db, id, { stage: 'queue', message: 'queue · waiting for a crawler' });
    await appendEvent(db, id, { stage: 'tokens', substage: 'tokens:palette', message: 'tokens · colors 31 clustered from 212 raw values · ΔE threshold 2.3', data: { colors: 31 } });
    const events = await listEvents(db, id);
    expect(events.map((e) => e.stage)).toEqual(['queue', 'tokens']);
    expect(events[1]!.substage).toBe('tokens:palette');
    expect(await listEvents(db, id, events[0]!.id)).toHaveLength(1);
  });

  it('reads through getRunForViewer and hides unpublished runs', async () => {
    const id = await insertRun();
    expect((await getRunForViewer(db, id, null))?.id).toBe(id);
    await db.update(tables.runs).set({ unpublished: true }).where(sql`id = ${id}`);
    expect(await getRunForViewer(db, id, null)).toBeNull();
    expect(await getRunForViewer(db, 'zzzzzzzzzz', null)).toBeNull();
  });
});

describe('storage', () => {
  const storage = new S3Storage(testS3Config());
  const prefix = `test/${newRunId()}/`;

  afterAll(async () => {
    await storage.deletePrefix(prefix);
  });

  it('round-trips text with its content type through the public URL', async () => {
    const key = `${prefix}preview.html`;
    await storage.put(key, '<!doctype html><p>ok</p>');
    expect((await storage.get(key))?.toString()).toBe('<!doctype html><p>ok</p>');
    const res = await fetch(storage.publicUrl(key));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
  });

  it('round-trips binary with its content type', async () => {
    const key = `${prefix}crop.png`;
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), randomBytes(512)]);
    await storage.put(key, png);
    expect((await storage.get(key))?.equals(png)).toBe(true);
    const res = await fetch(storage.publicUrl(key));
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await res.arrayBuffer()).equals(png)).toBe(true);
  });

  it('lists, deletes, and returns null for a missing key', async () => {
    expect((await storage.list(prefix)).sort()).toEqual([`${prefix}crop.png`, `${prefix}preview.html`]);
    await storage.delete(`${prefix}crop.png`);
    expect(await storage.get(`${prefix}crop.png`)).toBeNull();
    expect(await storage.deletePrefix(prefix)).toBe(1);
    expect(await storage.list(prefix)).toEqual([]);
  });
});
