import { resetDatabase } from '@dse/pipeline/db/migrate';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const target = new URL(url.replace(/^postgres(ql)?:/, 'http:'));
if (process.env.NODE_ENV === 'production' || !/^(localhost|127\.0\.0\.1)$/.test(target.hostname)) {
  throw new Error(`db:reset only runs against a local database, not ${target.hostname}`);
}
await resetDatabase(url);
console.log(`db:reset · ${target.pathname.slice(1)} dropped and migrated`);
