// Previews by mode and captured reason, per run (docs/specs/preview-fidelity.md, Why previews fall back,
// measured; D-095). `pnpm live-rate <run.json | runId>…` prints the STATUS table; the live rate is
// counted over the checked previews, `not-checked` excluded.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { previewCounts, RunDocumentPartial, type Component } from '@dse/schema';
import { closeDb, createDb, getRun } from '@dse/pipeline/db';
import { upgradeRunDocument } from '@dse/pipeline/upgrade';

const inputs = process.argv.slice(2);
if (!inputs.length) throw new Error('usage: pnpm live-rate <run.json | runId>…');
let db: ReturnType<typeof createDb> | null = null;

async function load(input: string): Promise<RunDocumentPartial> {
  const file = resolve(process.cwd(), input);
  if (existsSync(file)) return RunDocumentPartial.parse(upgradeRunDocument(JSON.parse(readFileSync(file, 'utf8'))));
  db ??= createDb(process.env.DATABASE_URL ?? 'postgres://dse:dse@localhost:5432/dse', { max: 2 });
  const row = await getRun(db, input);
  if (!row) throw new Error(`no run file or run id: ${input}`);
  return RunDocumentPartial.parse(upgradeRunDocument(row.document));
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2) : 0;
};
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10}%` : 'n/a');

const lines = ['| Run | live | diff | css-too-large | fonts-unavailable | not-checked | total | live of checked | core live of checked | median diff |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
try {
  for (const input of inputs) {
    const doc = await load(input);
    const comps: Component[] = doc.components ?? [];
    const c = previewCounts(comps);
    const checked = comps.length - c['not-checked'];
    const core = comps.filter((x) => x.tier === 'core');
    const coreChecked = core.filter((x) => x.preview.capturedReason !== 'not-checked');
    const diffs = comps.filter((x) => x.preview.capturedReason === 'diff').map((x) => x.preview.diffPct ?? 0);
    lines.push(
      `| ${doc.host} (${doc.id}, ${doc.pipelineVersion}) | ${c.live} | ${c.diff} | ${c['css-too-large']} | ${c['fonts-unavailable']} | ${c['not-checked']} | ${comps.length} | ${c.live} of ${checked} · ${pct(c.live, checked)} | ${coreChecked.filter((x) => x.preview.mode === 'live').length} of ${coreChecked.length} · ${core.length - coreChecked.length} core not checked | ${median(diffs).toFixed(1)} % |`,
    );
  }
} finally {
  if (db) await closeDb(db);
}
console.log(lines.join('\n'));
