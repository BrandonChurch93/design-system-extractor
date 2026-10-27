import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// docs/traceability.md (docs/plan.md P15, Definition of Done 3): every section of every spec and
// design document has a row, every row names code and tests, and every path it names exists.

const root = resolve(import.meta.dirname, '../..');
const trace = readFileSync(resolve(root, 'docs/traceability.md'), 'utf8');
const documents = ['docs/specs', 'docs/design'].flatMap((d) =>
  readdirSync(resolve(root, d))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `${d}/${f}`),
);

/** The rows under a document's block, keyed by their Section cell. */
function rowsOf(doc: string): Map<string, { code: string; tests: string }> {
  const start = trace.indexOf(`## \`${doc}\``);
  if (start < 0) return new Map();
  const end = trace.indexOf('\n## ', start + 1);
  const block = trace.slice(start, end < 0 ? undefined : end);
  const rows = new Map<string, { code: string; tests: string }>();
  for (const line of block.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 5 || cells[1] === 'Section' || /^-+$/.test(cells[1]!)) continue;
    rows.set(cells[1]!, { code: cells[2]!, tests: cells[3]! });
  }
  return rows;
}

/** `##` and `###` headings, the latter as "Parent › Child", outside code fences. */
function sectionsOf(doc: string): string[] {
  const out: string[] = [];
  let parent = '';
  let fenced = false;
  for (const line of readFileSync(resolve(root, doc), 'utf8').split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    if (fenced) continue;
    const h2 = /^## (.+)$/.exec(line);
    const h3 = /^### (.+)$/.exec(line);
    if (h2) out.push((parent = h2[1]!.trim()));
    else if (h3) out.push(`${parent} › ${h3[1]!.trim()}`);
  }
  return out;
}

describe('docs/traceability.md', () => {
  it.each(documents)('maps every section of %s to code and tests', (doc) => {
    const rows = rowsOf(doc);
    const missing = sectionsOf(doc).filter((s) => !rows.has(s.replace(/\|/g, '\\|')));
    expect(missing).toEqual([]);
    const empty = [...rows].filter(([, r]) => !r.code || !r.tests).map(([s]) => s);
    expect(empty).toEqual([]);
  });

  it('names only paths that exist', () => {
    const paths = [...trace.matchAll(/`([\w.@-]+\/[\w./@[\]-]+)`/g)].map((m) => m[1]!).filter((p) => !p.includes('*'));
    expect(paths.length).toBeGreaterThan(100);
    expect(paths.filter((p) => !existsSync(resolve(root, p)))).toEqual([]);
  });

  it('lists no open gaps', () => {
    const gaps = trace.slice(trace.indexOf('## Gaps'));
    expect(gaps.split('\n').filter((l) => l.startsWith('- ') && !/· closed/.test(l))).toEqual([]);
  });
});
