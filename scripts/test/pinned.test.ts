import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// P14: every dependency is pinned to an exact version, so a fresh install builds what was tested.

const root = resolve(import.meta.dirname, '../..');
const manifests = ['package.json', 'apps/web/package.json', 'apps/worker/package.json', 'packages/schema/package.json', 'packages/pipeline/package.json', 'packages/mcp/package.json', 'packages/cli/package.json'];
const exact = /^(\d+\.\d+\.\d+(-[\w.]+)?|workspace:[*^])$/;

describe('dependency pinning', () => {
  it.each(manifests)('%s names exact versions only', (file) => {
    const pkg = JSON.parse(readFileSync(resolve(root, file), 'utf8')) as Record<string, Record<string, string> | undefined>;
    const loose = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'].flatMap((field) =>
      Object.entries(pkg[field] ?? {})
        .filter(([, v]) => !exact.test(v))
        .map(([name, v]) => `${field} ${name}@${v}`),
    );
    expect(loose).toEqual([]);
  });
});
