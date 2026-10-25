import type { ExpectedFixture, RunDocumentPartial } from '@dse/schema';
import type { Floors } from './fixtures';

export type Metric = { value: unknown; summary: string; pass: (f: Floors) => boolean };
export type FixtureResult = { name: string; seconds: number; metrics: Record<string, Metric> };

const synthetic = /-does-not-exist$/;
const key = (p: { path: string; reason: string }) => `${synthetic.test(p.path) ? '/{missing}' : p.path} ${p.reason}`;

/** Selection exactness: the selected pages, by path and reason, equal the expected set. */
export function scoreSelection(expected: ExpectedFixture, doc: RunDocumentPartial): Metric {
  const want = new Set(expected.pages.map(key));
  const got = new Set((doc.pages ?? []).map(key));
  const missing = [...want].filter((k) => !got.has(k));
  const extra = [...got].filter((k) => !want.has(k));
  const exact = missing.length === 0 && extra.length === 0;
  return {
    value: { exact, expected: want.size, selected: got.size, missing, extra },
    summary: exact ? `exact · ${got.size} pages` : `missing ${missing.join(', ') || 'none'} · extra ${extra.join(', ') || 'none'}`,
    pass: () => exact,
  };
}
