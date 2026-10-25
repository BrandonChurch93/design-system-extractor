import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

// Root scripts load the repository's .env.local; `pnpm --filter web …` and Vercel do not,
// so next.config loads it here without overriding anything already set.
export function loadRootEnv(repoRoot: string): void {
  if (process.env.DSE_ENV_LOADED === '1') return;
  const file = process.env.DOTENV_FILE ? resolve(repoRoot, process.env.DOTENV_FILE) : resolve(repoRoot, '.env.local');
  if (!existsSync(file)) return;
  const parsed = parseEnv(readFileSync(file, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  process.env.DSE_ENV_LOADED = '1';
}
