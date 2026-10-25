import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { demoIndex } from '../components/catalog/demo-index';

describe('catalog index', () => {
  it('lists every demo in demos.tsx, in order', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../components/catalog/demos.tsx'), 'utf8');
    const slugs = [...src.matchAll(/slug: '([a-z-]+)'/g)].map((m) => m[1]);
    expect(demoIndex.map((d) => d.slug)).toEqual(slugs);
  });
});
