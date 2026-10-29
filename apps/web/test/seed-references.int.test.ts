import { describe, expect, it } from 'vitest';
import { like } from 'drizzle-orm';
import { closeDb, createDb, tables } from '@dse/pipeline/db';
import { unresolvedReferences } from '@dse/pipeline/references';
import { upgradeRunDocument } from '@dse/pipeline/upgrade';
import { RunDocumentPartial } from '@dse/schema';

// Every reference in every seeded document resolves, the sparse and frozen ones included (D-105).

describe('seed documents', () => {
  it('resolve every componentId, patternIds entry, token, page and failing id', async () => {
    const db = createDb(process.env.DATABASE_URL!);
    try {
      const rows = await db.select({ id: tables.runs.id, document: tables.runs.document }).from(tables.runs).where(like(tables.runs.id, 'seed%'));
      expect(rows.length, 'run pnpm db:seed:fixtures first').toBeGreaterThan(10);
      const bad = rows.flatMap((r) => unresolvedReferences(RunDocumentPartial.parse(upgradeRunDocument(r.document))).map((x) => `${r.id} · ${x}`));
      expect(bad).toEqual([]);
    } finally {
      await closeDb(db);
    }
  });
});
