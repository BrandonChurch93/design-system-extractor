import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// docs/specs/architecture.md: Deployment shape and Scripts (workspace root).

const root = resolve(import.meta.dirname, '../..');
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');
const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;

describe('deployment and script wiring', () => {
  it('pins the frozen install at the root and the web build in apps/web/vercel.json', () => {
    const vercel = JSON.parse(read('apps/web/vercel.json')) as Record<string, string>;
    expect(vercel.framework).toBe('nextjs');
    expect(vercel.installCommand).toBe('cd ../.. && pnpm install --frozen-lockfile');
    expect(vercel.buildCommand).toBe('cd ../.. && pnpm --filter web build');
  });

  it('runs verify:all in the order the scripts table writes, failing fast', () => {
    const row = read('docs/specs/architecture.md')
      .split('\n')
      .find((l) => l.startsWith('| `pnpm verify:all` |'))!;
    const documented = [...row.split('|')[2]!.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
    const [runner, ...steps] = scripts['verify:all']!.split(' ').slice(3);
    expect(runner).toBe('scripts/steps.mjs');
    expect(read('scripts/steps.mjs')).toContain('if (!ok) break;');
    for (const s of steps) expect(scripts[s], s).toBeDefined();
    const resolved = steps.map((s) => (scripts[s]!.startsWith('pnpm ') ? scripts[s]! : s));
    expect(resolved).toEqual(documented);
  });
});
