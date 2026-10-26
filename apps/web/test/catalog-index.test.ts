import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { demoIndex } from '../components/catalog/demo-index';

describe('catalog index', () => {
  it('lists every demo in demos.tsx and page-demos.tsx, in order', () => {
    const src = ['demos.tsx', 'page-demos.tsx'].map((f) => readFileSync(resolve(import.meta.dirname, '../components/catalog', f), 'utf8')).join('\n');
    const slugs = [...src.matchAll(/slug: '([a-z-]+)'/g)].map((m) => m[1]);
    expect(demoIndex.map((d) => d.slug)).toEqual(slugs);
  });
});
