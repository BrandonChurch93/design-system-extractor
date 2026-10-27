import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApiRedis } from '../../packages/pipeline/src/queue/redis';

// P14: every network call the product makes is bounded (docs/plan.md, Hardening; D-074).

const root = resolve(import.meta.dirname, '../..');
const sources = execFileSync('git', ['ls-files', 'apps/web/app', 'apps/web/components', 'apps/web/lib', 'apps/worker/src', 'packages'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(ts|tsx)$/.test(f) && (!f.startsWith('packages/') || f.split('/')[2] === 'src'));

/** The text of each `fetch(` call, up to its closing parenthesis. */
function fetchCalls(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(?<![\w.])(fetch|undiciFetch)\(/g)) {
    let depth = 0;
    let i = m.index! + m[0].length - 1;
    for (; i < text.length; i++) {
      if (text[i] === '(') depth++;
      if (text[i] === ')' && --depth === 0) break;
    }
    out.push(text.slice(m.index, i + 1));
  }
  return out;
}

describe('network timeouts', () => {
  it('bounds every fetch in the app, the worker and the packages', () => {
    const calls = sources.map((f) => ({ f, calls: fetchCalls(readFileSync(resolve(root, f), 'utf8')) }));
    expect(calls.reduce((n, c) => n + c.calls.length, 0)).toBeGreaterThanOrEqual(10);
    const unbounded = calls.flatMap(({ f, calls: found }) =>
      found
        .filter((call) => !/AbortSignal\.timeout|signal:/.test(call))
        .map((call) => `${f}: ${call.split('\n')[0]}`),
    );
    expect(unbounded).toEqual([]);
  });

  it("bounds the web app's Redis commands and connection", () => {
    const r = createApiRedis('redis://localhost:6399', { lazyConnect: true });
    expect(r.options).toMatchObject({ maxRetriesPerRequest: 1, connectTimeout: 5_000, commandTimeout: 5_000 });
    r.disconnect();
  });
});
