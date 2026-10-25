import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as strings from '../copy/strings';

const copyMd = readFileSync(resolve(import.meta.dirname, '../../../docs/design/copy.md'), 'utf8');

function flatten(value: unknown, path: string, out: [string, string][]) {
  if (typeof value === 'string') out.push([path, value]);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) flatten(v, `${path}.${k}`, out);
}

describe('copy audit', () => {
  const all: [string, string][] = [];
  for (const [k, v] of Object.entries(strings)) flatten(v, k, all);

  it('has strings to audit', () => {
    expect(all.length).toBeGreaterThan(40);
  });

  it('takes every string in strings.ts verbatim from copy.md', () => {
    const missing = all.filter(([, v]) => !copyMd.includes(v)).map(([p, v]) => `${p}: ${v}`);
    expect(missing).toEqual([]);
  });

  it('has no em dash and no exclamation mark in any string', () => {
    for (const [p, v] of all) {
      expect(v.includes(String.fromCharCode(0x2014)), p).toBe(false);
      expect(v.includes('!'), p).toBe(false);
    }
  });
});
