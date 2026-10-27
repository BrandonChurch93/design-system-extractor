import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The build's spend meter on /catalog (docs/specs/model-calls.md, The build-time spend cap;
// caps-and-budget.md, Events and visibility): read locally from .dse/dev-spend.json, never on Vercel.

vi.mock('server-only', () => ({}));
const root = vi.hoisted(() => ({ dir: '' }));
vi.mock('../lib/repo-root', () => ({ repoRoot: () => root.dir }));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('the dev spend meter', () => {
  it('reads what the build has spent against the cap, zero before any spend, and nothing on Vercel', async () => {
    const { readDevSpend } = await import('../lib/dev-spend');
    root.dir = mkdtempSync(join(tmpdir(), 'dse-spend-'));
    vi.stubEnv('DSE_DEV_SPEND_CAP_USD', '20');
    expect(readDevSpend()).toEqual({ usedUsd: 0, capUsd: 20 });
    mkdirSync(join(root.dir, '.dse'));
    writeFileSync(join(root.dir, '.dse', 'dev-spend.json'), JSON.stringify({ usedUsd: 0.31, calls: 571 }));
    expect(readDevSpend()).toEqual({ usedUsd: 0.31, capUsd: 20 });
    vi.stubEnv('VERCEL', '1');
    expect(readDevSpend()).toBeNull();
  });
});
