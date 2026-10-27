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
  // One design, three implementations: the values match; the names each implementation's own
  // variables give its tokens do not (D-082), nor do the live previews.
  const design = (e: ExpectedFixture) => {
    const { previews: _p, siteVariables: _s, overlays, tokens, motion, ...rest } = e;
    return {
      ...rest,
      tokens: { ...tokens, type: tokens.type.map(({ name: _n, ...x }) => x) },
      overlays: overlays.map(({ name: _n, ...o }) => o),
      motion: { ...motion, durations: motion.durations.map((d) => d.ms), easings: motion.easings.map((x) => x.value) },
    };
  };
  it('shares one expected design across clean, tailwind and css-in-js', () => {
    const [clean, tailwind, cssInJs] = (['clean', 'tailwind', 'css-in-js'] as const).map(load);
    for (const other of [tailwind!, cssInJs!]) expect(design(other)).toEqual(design(clean!));
  });
  it('plants every v1.1 naming item in clean', () => {
    const clean = load('clean');
    expect(Object.keys(clean.siteVariables.named).sort()).toEqual(['--color-text-primary', '--color-text-secondary', '--ease-out-quart', '--radius-rounded', '--shadow-stack-low', '--text-small-size']);
    expect(clean.siteVariables.hashed).toContain('--sx-1fj52yw');
    expect(clean.variantNames).toContainEqual({ component: 'Button', names: ['Ghost', 'Ghost rounded'] });
    expect(clean.fallbackNames).toContainEqual({ component: 'Footer button', name: 'Button (footer)' });
    expect(clean.tiers['Footer button']).toBe('page');
  });
});
