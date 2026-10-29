import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunDocumentComplete } from '@dse/schema';
import { describe, expect, it } from 'vitest';
import { unresolvedReferences } from '../src/references';
import { upgradeRunDocument } from '../src/upgrade';

// Every reference in every committed run document resolves once upgraded (D-105).

const dir = resolve(import.meta.dirname, 'fixtures/runs');

describe('references resolve', () => {
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    it(f, () => {
      const doc = RunDocumentComplete.parse(upgradeRunDocument(JSON.parse(readFileSync(resolve(dir, f), 'utf8'))));
      expect(unresolvedReferences(doc)).toEqual([]);
    });
  }

  it('names a dangling pattern, token, page and failing id', () => {
    const doc = RunDocumentComplete.parse(JSON.parse(readFileSync(resolve(dir, 'clean.json'), 'utf8')));
    const c = doc.components[0]!;
    doc.motion.patterns.push({ ...doc.motion.patterns[0]!, id: 'gone0000', componentId: 'nothere0' });
    c.tokensUsed.push({ tokenId: 'notoken0', property: 'color' });
    c.instances[0]!.pageId = 'nopage00';
    doc.checks.byCheck[0]!.failing.push({ componentId: 'nocomp00', name: 'x', detail: 'x' });
    expect(unresolvedReferences(doc)).toEqual([
      'motion.patterns[gone0000].componentId nothere0',
      `components[${c.id}].tokensUsed notoken0`,
      `components[${c.id}].instances[${c.instances[0]!.id}].pageId nopage00`,
      `checks.byCheck[${doc.checks.byCheck[0]!.check}].failing nocomp00`,
    ]);
  });
});
