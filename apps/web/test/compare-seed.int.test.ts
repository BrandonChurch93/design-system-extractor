import { describe, expect, it } from 'vitest';
import { closeDb, createDb, getRun } from '@dse/pipeline/db';
import { RunDocumentPartial } from '@dse/schema';
import { colorDiff, componentChanges, deltaCaptions, deltas, span } from '../lib/compare';

// The seeded before-and-after pair (docs/evals.md, messy-after): the deltas Compare must show.

describe('compare on the seeded messy and messy-after runs', () => {
  it('shows fewer grays, the new components, one collapsed variant pair and the two fixed checks', async () => {
    const db = createDb(process.env.DATABASE_URL!);
    try {
      const [a, b] = await Promise.all([getRun(db, 'seedmessy0'), getRun(db, 'seedmafter')]);
      expect(a && b, 'run pnpm db:seed:fixtures first').toBeTruthy();
      const [da, dbb] = [RunDocumentPartial.parse(a!.document), RunDocumentPartial.parse(b!.document)];
      const d = deltas(da, dbb);
      // The v1.2 dark band adds one gray (#0B0D10) and three components (D-094, docs/evals.md).
      expect(d.grays).toEqual({ before: 14, after: 10 });
      expect(d.newComponents).toBe(5);
      // Checks passed rises by the two fixes plus the new components' passes; failures fall by exactly two.
      expect(d.checksApplicable.before - d.checksPassed.before - (d.checksApplicable.after - d.checksPassed.after)).toBe(2);
      const changes = componentChanges(da, dbb);
      expect(changes.filter((c) => c.change === 'new').map((c) => c.name).sort()).toEqual(['Band button', 'Dark band', 'Feature card (night mode)', 'Step pill', 'Toast']);
      expect(changes.find((c) => c.name === 'Button')).toMatchObject({ change: 'changed', before: '7 variants', after: '6 variants' });
      expect(changes.filter((c) => c.change === 'changed' && c.checks.split(' → ')[0] !== c.checks.split(' → ')[1]).map((c) => c.name).sort()).toEqual(['Newsletter input', 'Status badge']);
      expect(deltaCaptions(d)).toMatchObject({ colors: 'Colors · 3 fewer', grays: 'Grays · 4 fewer, still 2 to go', components: 'Components · 5 new', spacing: 'Spacing steps · unchanged' });
      const colors = colorDiff(da, dbb);
      // messy-after's palette, the band's #0B0D10 and #1F1F1F text included; its translucent grays are overlays since v1.1 (D-086).
      expect(colors.unchanged.length + colors.added.length).toBe(19);
      expect(span(da.createdAt!, dbb.createdAt!)).toBe('two weeks');
      expect(span('2026-10-01T00:00:00Z', '2026-10-01T09:00:00Z')).toBe('today');
      expect(span('2026-10-01T00:00:00Z', '2026-10-02T00:00:00Z')).toBe('one day');
      expect(span('2026-01-01T00:00:00Z', '2027-03-01T00:00:00Z')).toBe('14 months');
    } finally {
      await closeDb(db);
    }
  });
});
