import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** The repository root: the nearest ancestor holding pnpm-workspace.yaml. */
export function repoRoot(from: string = process.cwd()): string | null {
  let dir = resolve(/* turbopackIgnore: true */ from);
  for (;;) {
    if (existsSync(join(/* turbopackIgnore: true */ dir, 'pnpm-workspace.yaml'))) return dir;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}
