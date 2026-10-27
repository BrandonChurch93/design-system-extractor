import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pruneRecordings } from '../evals/prune';

// `pnpm evals --prune-recordings` (docs/specs/model-calls.md, Modes): after a full replay, the
// recordings no call read are deleted, except the ones extra.json keeps for the seed and the queue tests.

describe('pruning recordings', () => {
  it('deletes what no call read and keeps what was read and what extra.json lists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dse-prune-'));
    for (const p of ['colors', 'components']) mkdirSync(join(dir, p));
    const file = (p: string, f: string) => join(dir, p, f);
    for (const f of [file('colors', 'used.json'), file('colors', 'stale.json'), file('components', 'seed.json'), file('components', 'stale.json')]) writeFileSync(f, '{}');
    writeFileSync(join(dir, 'extra.json'), JSON.stringify(['components/seed.json']));
    expect(pruneRecordings(dir, new Set([file('colors', 'used.json')]))).toBe(2);
    expect([file('colors', 'used.json'), file('components', 'seed.json')].every((f) => existsSync(f))).toBe(true);
    expect([file('colors', 'stale.json'), file('components', 'stale.json')].some((f) => existsSync(f))).toBe(false);
    expect(existsSync(join(dir, 'extra.json'))).toBe(true);
  });
});
