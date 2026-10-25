import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './repo-root';

export type DevSpend = { usedUsd: number; capUsd: number };

/** The build-time spend meter (docs/specs/model-calls.md). Local only: never on Vercel. */
export function readDevSpend(): DevSpend | null {
  if (process.env.VERCEL === '1') return null;
  const root = repoRoot();
  if (!root) return null;
  const capUsd = Number(process.env.DSE_DEV_SPEND_CAP_USD ?? 20) || 20;
  try {
    const raw = JSON.parse(readFileSync(join(/* turbopackIgnore: true */ root, '.dse', 'dev-spend.json'), 'utf8')) as { usedUsd?: number };
    return { usedUsd: Number(raw.usedUsd ?? 0), capUsd };
  } catch {
    return { usedUsd: 0, capUsd };
  }
}
