import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { closeDb, createDb } from './client';

export const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

export async function runMigrations(url: string): Promise<void> {
  const db = createDb(url, { max: 1 });
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await closeDb(db);
  }
}

/** Drops every table, type and the migration journal, then applies the migrations again. */
export async function resetDatabase(url: string): Promise<void> {
  const db = createDb(url, { max: 1 });
  try {
    await db.execute(sql`drop schema if exists drizzle cascade`);
    await db.execute(sql`drop schema if exists public cascade`);
    await db.execute(sql`create schema public`);
  } finally {
    await closeDb(db);
  }
  await runMigrations(url);
}
