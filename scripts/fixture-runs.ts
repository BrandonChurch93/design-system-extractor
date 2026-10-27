// Refreshes the two committed run documents the export, MCP, CLI and catalog tests read from the
// last `pnpm evals` run, with the fixed id and times the goldens expect.
// `pnpm fixtures:runs` after `pnpm evals`; then `env DSE_UPDATE_GOLDENS=1 pnpm test:unit packages/pipeline/test/exports.test.ts`.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunDocumentPartial } from '@dse/schema';

const root = resolve(import.meta.dirname, '..');
const fixed = { createdAt: '2026-10-12T15:00:00.000Z', startedAt: '2026-10-12T15:00:01.000Z', finishedAt: '2026-10-12T15:02:41.000Z', durationMs: 160_000 };

for (const name of ['clean', 'messy'] as const) {
  const doc = RunDocumentPartial.parse(JSON.parse(readFileSync(resolve(root, '.dse/evals', name, 'run.json'), 'utf8')));
  const out = { ...doc, id: `eval${name}0`, ...fixed };
  writeFileSync(resolve(root, 'packages/pipeline/test/fixtures/runs', `${name}.json`), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`fixtures:runs · ${name} · ${doc.components?.length ?? 0} components · ${doc.motion?.patterns.length ?? 0} patterns`);
}
