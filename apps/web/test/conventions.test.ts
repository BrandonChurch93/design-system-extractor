import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// docs/specs/architecture.md, Conventions: CSS Modules named after the component, components in
// PascalCase and everything else in kebab-case, and a web app that logs only API errors.

const web = resolve(import.meta.dirname, '..');

function walk(dir: string): string[] {
  return readdirSync(resolve(web, dir), { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return [];
    const p = dir ? `${dir}/${e.name}` : e.name;
    return e.isDirectory() ? walk(p) : [p];
  });
}
const all = walk('').sort();
const source = all.filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith('test/') && !f.endsWith('.d.ts'));

const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const pascal = /^[A-Z][A-Za-z0-9]*$/;
// Next.js route segments: dynamic, catch-all, route groups and parallel-route slots.
const routeSegment = /^(\[(\.\.\.)?[a-zA-Z]+\]|\([a-z0-9-]+\)|@[a-z0-9-]+)$/;

describe('conventions', () => {
  it('names every CSS Module under components after the component beside it', () => {
    const modules = all.filter((f) => f.startsWith('components/') && f.endsWith('.module.css'));
    expect(modules.length).toBeGreaterThan(50);
    // Shared by a family of components and named after it (docs/specs/architecture.md, Conventions; D-077).
    const shared = ['components/catalog/Catalog.module.css', 'components/how/HowItWorks.module.css', 'components/v2/v2.module.css'];
    const orphans = modules.filter((f) => !shared.includes(f) && !existsSync(resolve(web, dirname(f), `${basename(f, '.module.css')}.tsx`)));
    expect(orphans).toEqual([]);
  });

  it('names component files in PascalCase after what they export, and everything else in kebab-case', () => {
    const bad: string[] = [];
    for (const f of all) {
      const parts = f.split('/');
      const file = parts.pop()!;
      for (const d of parts) if (!kebab.test(d) && !routeSegment.test(d)) bad.push(`${f}: directory ${d}`);
      // The SIL Open Font License travels under its own name beside the fonts it covers.
      if (f === 'assets/og/OFL.txt') continue;
      const [stem] = file.split('.') as [string];
      if (pascal.test(stem)) {
        if (!f.startsWith('components/') || !/\.(tsx|module\.css)$/.test(file)) bad.push(`${f}: PascalCase outside components`);
        else if (file.endsWith('.tsx') && !new RegExp(`export (async )?(function|const) ${stem}`).test(readFileSync(resolve(web, f), 'utf8'))) bad.push(`${f}: exports no ${stem}*`);
      } else if (!file.split('.').every((p) => kebab.test(p))) bad.push(`${f}: not kebab-case`);
    }
    expect(all.length).toBeGreaterThan(150);
    expect(bad).toEqual([]);
  });

  it('logs only API errors: console.error in API routes and server code, nothing anywhere else', () => {
    const calls = source.flatMap((f) =>
      readFileSync(resolve(web, f), 'utf8')
        .split('\n')
        .flatMap((l, i) => [...l.matchAll(/\bconsole\.(\w+)/g)].map((m) => ({ at: `${f}:${i + 1}`, f, method: m[1]! }))),
    );
    expect(calls.length).toBeGreaterThan(0);
    const outside = calls.filter((c) => !(c.method === 'error' && (c.f.startsWith('app/api/') || c.f.startsWith('lib/server/'))));
    expect(outside.map((c) => `${c.at} console.${c.method}`)).toEqual([]);
    expect(source.filter((f) => /from 'pino'/.test(readFileSync(resolve(web, f), 'utf8')))).toEqual([]);
  });
});
