import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as tables from './tables';

export type Db = PostgresJsDatabase<typeof tables> & { $client: postgres.Sql };

/** Supabase's transaction pooler listens on 6543 and cannot use prepared statements. */
export function isPoolerUrl(url: string): boolean {
  try {
    return new URL(url.replace(/^postgres(ql)?:/, 'http:')).port === '6543';
  } catch {
    return false;
  }
}

export function createDb(url: string, opts: { max?: number } = {}): Db {
  const client = postgres(url, {
    prepare: !isPoolerUrl(url),
    max: opts.max ?? 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
  return drizzle(client, { schema: tables }) as Db;
}

export async function closeDb(db: Db): Promise<void> {
  await db.$client.end({ timeout: 5 });
}

/** The test database: the same server, database `dse_test` (docs/specs/architecture.md). */
export function testDatabaseUrl(url: string = process.env.DATABASE_URL ?? 'postgres://dse:dse@localhost:5432/dse'): string {
  const u = new URL(url.replace(/^postgres(ql)?:/, 'http:'));
  u.pathname = '/dse_test';
  return u.toString().replace(/^http:/, 'postgres:');
}
