// Parses stored run documents through the current schema, as every read path does.
// `pnpm runs:parse <runId>…` (or `--all` for every complete run in the local database); each line also
// says whether the document parses once upgraded (D-092). Exits 1 when an upgraded document fails.
import { RunDocumentPartial } from '@dse/schema';
import { closeDb, createDb, getRun, tables } from '@dse/pipeline/db';
import { unresolvedReferences } from '@dse/pipeline/references';
import { upgradeRunDocument } from '@dse/pipeline/upgrade';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);
const db = createDb(process.env.DATABASE_URL ?? 'postgres://dse:dse@localhost:5432/dse', { max: 2 });
try {
  const ids = args.includes('--all')
    ? (await db.select({ id: tables.runs.id }).from(tables.runs).where(eq(tables.runs.status, 'complete'))).map((r) => r.id)
    : args.filter((a) => !a.startsWith('--'));
  for (const id of ids) {
    const row = await getRun(db, id);
    if (!row) {
      console.log(`${id} · not found`);
      continue;
    }
    const doc = row.document as { pipelineVersion?: string; host?: string };
    const parsed = RunDocumentPartial.safeParse(row.document);
    const upgraded = RunDocumentPartial.safeParse(upgradeRunDocument(row.document));
    const after = upgraded.success ? 'upgraded: parses clean' : `upgraded: ${upgraded.error.issues.length} issues, first ${JSON.stringify(upgraded.error.issues[0]!.path)} · ${upgraded.error.issues[0]!.message}`;
    if (!upgraded.success) process.exitCode = 1;
    const dangling = upgraded.success ? unresolvedReferences(upgraded.data) : [];
    for (const d of dangling) console.log(`  unresolved: ${d}`);
    if (parsed.success) {
      console.log(`${id} · ${doc.host} · pipeline ${doc.pipelineVersion} · parses clean · ${after}`);
      continue;
    }
    const issues = parsed.error.issues;
    const first = issues[0]!;
    console.log(`${id} · ${doc.host} · pipeline ${doc.pipelineVersion} · ${issues.length} issues · ${after}`);
    console.log(`  first: ${JSON.stringify(first.path)} · ${first.message}`);
    const groups = new Map<string, number>();
    for (const i of issues) {
      const key = `${i.path.map((p) => (typeof p === 'number' ? '[]' : String(p))).join('.')} · ${i.code}`;
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    for (const [k, n] of [...groups].sort((a, b) => b[1] - a[1])) console.log(`  ${n} × ${k}`);
  }
} finally {
  await closeDb(db);
}
