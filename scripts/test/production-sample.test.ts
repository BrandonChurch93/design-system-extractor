import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { describe, expect, it } from 'vitest';
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
