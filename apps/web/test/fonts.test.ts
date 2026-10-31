import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fontPreloads } from '../app/fonts';

// The app's two families are self-hosted and pinned (D-112): a build must not fetch whatever Google
// Fonts serves that day, or a fresh clone renders glyphs the goldens were not made with.

const web = resolve(import.meta.dirname, '..');
const dir = resolve(web, 'public/fonts');
const css = readFileSync(resolve(web, 'styles/fonts.css'), 'utf8');
const files = readdirSync(dir);
const urls = [...css.matchAll(/url\('\/fonts\/([^']+)'\)/g)].map((m) => m[1]!);

function sources(d: string): string[] {
  return readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.next') || e.name === 'test') return [];
    const p = resolve(d, e.name);
    return e.isDirectory() ? sources(p) : /\.(ts|tsx|css)$/.test(e.name) ? [p] : [];
  });
}

describe('fonts', () => {
  it('serves every face from a committed file and commits no file nothing uses, with both licenses', () => {
    const woff2 = files.filter((f) => f.endsWith('.woff2'));
    expect(new Set(urls)).toEqual(new Set(woff2));
    expect(woff2).toHaveLength(10);
    expect(files).toEqual(expect.arrayContaining(['ofl-plus-jakarta-sans.txt', 'ofl-jetbrains-mono.txt']));
    for (const href of fontPreloads) expect(woff2).toContain(href.replace('/fonts/', ''));
  });

  it('never loads a family from Google Fonts', () => {
    for (const file of sources(web)) expect(readFileSync(file, 'utf8'), file).not.toMatch(/next\/font\/google|fonts\.googleapis\.com/);
  });
});
