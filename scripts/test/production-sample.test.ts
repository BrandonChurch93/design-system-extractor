import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { afterAll, describe, expect, it } from 'vitest';
import { envKeys, validateEnv } from '@dse/schema';

// fixtures/env/production.sample (docs/plan.md P14): every variable, the right shapes, and the
// production checks of `pnpm run doctor --production` pass on it.

const root = resolve(import.meta.dirname, '../..');
const file = resolve(root, 'fixtures/env/production.sample');
const text = readFileSync(file, 'utf8');
const sample = parseEnv(text) as Record<string, string>;

describe('the production env sample', () => {
  it('names every variable of the env schema, and nothing else', () => {
    const named = [...text.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]);
    expect([...named].sort()).toEqual([...envKeys].sort());
  });

  it('has the right shape everywhere, an empty private-host allowance and billing off', () => {
    expect(validateEnv(sample)).toEqual([]);
    expect(sample.DSE_ALLOW_PRIVATE_HOSTS).toBe('');
    expect(sample.BILLING_ENABLED).toBe('false');
  });

  it('passes pnpm run doctor --production', () => {
    const out = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/doctor.ts', '--production', '--env', file], { cwd: root, encoding: 'utf8', env: { ...process.env, DSE_ENV_LOADED: '1' } });
    expect(out).toContain('All checks pass');
  }, 30_000);
});

describe('doctor --production on a changed sample', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dse-doctor-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  function doctor(name: string, key: string, value: string) {
    const line = new RegExp(`^${key}=.*$`, 'm');
    expect(text).toMatch(line);
    const env = join(dir, name);
    writeFileSync(env, text.replace(line, `${key}=${value}`));
    const r = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/doctor.ts', '--production', '--env', env], { cwd: root, encoding: 'utf8', env: { ...process.env, DSE_ENV_LOADED: '1' } });
    const row = (check: string) => r.stdout.split('\n').find((l) => l.startsWith(`${check} `))?.replace(/\s+/g, ' ');
    return { status: r.status, out: r.stdout, row };
  }

  it('fails when the private-host allowance is set', () => {
    const r = doctor('allow.env', 'DSE_ALLOW_PRIVATE_HOSTS', 'fixtures');
    expect(r.status).toBe(1);
    expect(r.row('private hosts')).toBe('private hosts fail DSE_ALLOW_PRIVATE_HOSTS must be empty in production');
    expect(r.out).not.toContain('All checks pass');
  }, 30_000);

  it('fails when DATABASE_URL is the transaction pooler string on 6543', () => {
    const r = doctor('pooler.env', 'DATABASE_URL', 'postgresql://postgres.project-ref:database-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres');
    expect(r.status).toBe(1);
    expect(r.row('database url')).toMatch(/^database url fail .*session string \(5432\)/);
  }, 30_000);

  it('warns, and still passes, when REDIS_URL is not TLS', () => {
    const r = doctor('redis.env', 'REDIS_URL', 'redis://default:upstash-password@example-name-00000.upstash.io:6379');
    expect(r.status).toBe(0);
    expect(r.row('redis tls')).toBe('redis tls warn REDIS_URL is not TLS (rediss://)');
    expect(r.out).toContain('All checks pass · 1 warning');
  }, 30_000);
});
