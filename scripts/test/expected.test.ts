import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ExpectedFixture } from '@dse/schema';
import { evalFixtures } from '../evals/fixtures';

const load = (name: string) => ExpectedFixture.parse(JSON.parse(readFileSync(resolve(import.meta.dirname, `../../fixtures/sites/${name}/expected.json`), 'utf8')));

describe.each([...evalFixtures])('fixtures/sites/%s/expected.json', (name) => {
  const e = load(name);

  it('places every component on a selected page, with a unique name', () => {
    const paths = new Set(e.pages.map((p) => p.path));
    for (const c of e.components) expect(paths, `${c.name} on ${c.page}`).toContain(c.page);
    const names = e.components.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('names only listed components in its planted checks', () => {
    const names = new Set(e.components.map((c) => c.name));
    for (const p of [...e.checks.plantedFailures, ...e.checks.plantedPasses]) expect(names, p.component).toContain(p.component);
  });

  it('describes a complete fixture', () => {
    expect(e.tokens.colors.length).toBeGreaterThan(0);
    expect(e.tokens.type.length).toBeGreaterThan(0);
    expect(e.tokens.space.steps.length).toBeGreaterThan(0);
    expect(e.components.length).toBeGreaterThan(0);
    expect(e.checks.plantedFailures.length).toBeGreaterThan(0);
    expect(e.drift.expectNone).toBe(name !== 'messy');
  });
});

describe('the clean family', () => {
  it('shares one expected design across clean, tailwind and css-in-js', () => {
    const [clean, tailwind, cssInJs] = (['clean', 'tailwind', 'css-in-js'] as const).map(load);
    const { previews: _p, ...design } = clean!;
    for (const other of [tailwind!, cssInJs!]) {
      const { previews: _o, ...rest } = other;
      expect(rest).toEqual(design);
    }
  });
});
