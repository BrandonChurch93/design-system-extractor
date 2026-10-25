import { describe, expect, it } from 'vitest';
import { deepMerge, isPoolerUrl, testDatabaseUrl } from '../src/db';

describe('deepMerge', () => {
  it('merges objects recursively so a substage adds a key without touching siblings', () => {
    const doc = { id: 'r', tokens: { colors: [1, 2] } };
    expect(deepMerge(doc, { tokens: { type: [3] } })).toEqual({ id: 'r', tokens: { colors: [1, 2], type: [3] } });
  });

  it('replaces arrays and scalars instead of merging them', () => {
    expect(deepMerge({ pages: [1, 2, 3], status: 'queued' }, { pages: [4], status: 'running' })).toEqual({ pages: [4], status: 'running' });
  });

  it('skips undefined, writes null, and does not mutate the target', () => {
    const doc = { a: 1, b: { c: 2 } };
    const out = deepMerge(doc, { a: undefined, b: null });
    expect(out).toEqual({ a: 1, b: null });
    expect(doc).toEqual({ a: 1, b: { c: 2 } });
  });

  it('replaces an object with an array and an array with an object', () => {
    expect(deepMerge({ x: { a: 1 } }, { x: [1] })).toEqual({ x: [1] });
    expect(deepMerge({ x: [1] }, { x: { a: 1 } })).toEqual({ x: { a: 1 } });
  });
});

describe('database urls', () => {
  it('recognizes the transaction pooler', () => {
    expect(isPoolerUrl('postgres://u:p@aws-0.pooler.supabase.com:6543/postgres')).toBe(true);
    expect(isPoolerUrl('postgres://u:p@db.supabase.co:5432/postgres')).toBe(false);
    expect(isPoolerUrl('postgres://dse:dse@localhost/dse')).toBe(false);
  });

  it('derives the test database on the same server', () => {
    expect(testDatabaseUrl('postgres://dse:dse@localhost:5432/dse')).toBe('postgres://dse:dse@localhost:5432/dse_test');
  });
});
