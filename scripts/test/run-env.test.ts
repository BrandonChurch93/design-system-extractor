import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const runner = resolve(import.meta.dirname, '../run.mjs');
const print = ['-e', 'console.log(JSON.stringify({ mode: process.env.DSE_MODEL_MODE, keys: process.env.DSE_ENV_FILE_KEYS }))'];

function run(args: string[], env: Record<string, string>) {
  const r = spawnSync(process.execPath, [runner, ...args], { env: { PATH: process.env.PATH ?? '', ...env }, encoding: 'utf8' });
  return JSON.parse(r.stdout.trim().split('\n').pop()!) as { mode?: string; keys?: string };
}

describe('scripts/run.mjs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dse-env-'));
  const file = join(dir, 'env');
  writeFileSync(file, 'DSE_MODEL_MODE=live\n');

  it('marks values read from the env file, also through a nested run', () => {
    expect(run([process.execPath, ...print], { DOTENV_FILE: file }).keys).toBe('DSE_MODEL_MODE');
    expect(run([process.execPath, runner, process.execPath, ...print], { DOTENV_FILE: file }).keys).toBe('DSE_MODEL_MODE');
  });

  it('leaves a value given on the command line unmarked', () => {
    const out = run([process.execPath, runner, process.execPath, ...print], { DOTENV_FILE: file, DSE_MODEL_MODE: 'record' });
    expect(out).toEqual({ mode: 'record', keys: '' });
  });
});
