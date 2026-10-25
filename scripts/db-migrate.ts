import { runMigrations } from '@dse/pipeline/db/migrate';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const target = new URL(url.replace(/^postgres(ql)?:/, 'http:'));
await runMigrations(url);
console.log(`db:migrate · migrations applied to ${target.hostname}:${target.port || 5432}${target.pathname}`);
