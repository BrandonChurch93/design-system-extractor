import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Deletes every recording no call read, except those `extra.json` lists (the seed's and the queue
 * tests' sites, which evals never visit). Returns how many were deleted.
 */
export function pruneRecordings(dir: string, used: Set<string>): number {
  let extra = new Set<string>();
  try {
    extra = new Set((JSON.parse(readFileSync(join(dir, 'extra.json'), 'utf8')) as string[]).map((f) => join(dir, f)));
  } catch {
    extra = new Set();
  }
  let pruned = 0;
  for (const purpose of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    for (const f of readdirSync(join(dir, purpose))) {
      const file = join(dir, purpose, f);
      if (used.has(file) || extra.has(file)) continue;
      rmSync(file);
      pruned++;
    }
  }
  return pruned;
}
