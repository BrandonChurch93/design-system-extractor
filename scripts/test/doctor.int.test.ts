import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// `pnpm run doctor` connects to each service and reports in one table (docs/specs/architecture.md,
// Environments). The model row needs the live API and a key, so it is left to the table itself.

const root = resolve(import.meta.dirname, '../..');

describe('doctor against the local services', () => {
  it('connects to Postgres with both databases, Redis and storage with public read, and reports each in its row', () => {
    const r = spawnSync(process.execPath, ['scripts/run.mjs', 'node', '--import', 'tsx', 'scripts/doctor.ts'], { cwd: root, encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '' }, timeout: 60_000 });
    const row = (name: string) => r.stdout.split('\n').find((l) => l.startsWith(`${name} `)) ?? '';
    expect(row('postgres')).toMatch(/pass\s+connected · server \S+ · databases dse and dse_test/);
    expect(row('redis')).toMatch(/pass\s+connected · PONG/);
    expect(row('storage')).toMatch(/pass\s+connected · buckets .* · public read works/);
    // The empty key fails the env shape and the model row, so the table ends failed.
    expect(row('anthropic')).toMatch(/fail/);
    expect(r.status).not.toBe(0);
  }, 90_000);
});
