import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// docs/specs/v2-seams.md: one place reads identity, one function reads a run (D-076).

const web = resolve(import.meta.dirname, '..');
const sources = execFileSync('git', ['ls-files', 'app', 'lib', 'components'], { cwd: web, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(ts|tsx)$/.test(f));
const read = (f: string) => readFileSync(resolve(web, f), 'utf8');

describe('the v2 seams', () => {
  it('reads a request identity only in resolveViewer, and a session only through the auth adapter', () => {
    expect(sources.length).toBeGreaterThan(100);
    const cookieReads = sources.filter((f) => /get\('cookie'\)|\bcookies\(\)/.test(read(f)));
    expect(cookieReads).toEqual(['lib/entitlements.ts']);
    const sessionReads = sources.filter((f) => /\.getSession\(/.test(read(f)));
    expect(sessionReads).toEqual(['lib/server/session.ts']);
  });

  it('reads runs only through getRunForViewer, never the table or getRun directly', () => {
    const direct = sources.filter((f) => /\bgetRun\b(?!ForViewer)|from\((tables\.)?runs\)/.test(read(f)));
    expect(direct).toEqual([]);
    expect(sources.filter((f) => /getRunForViewer\(/.test(read(f)))).toEqual(['lib/server/runs.ts']);
  });
});

describe('server and client modules', () => {
  it('never import a value from a lib module marked use client into server code', () => {
    const client = new Set(sources.filter((f) => f.startsWith('lib/') && /^['"]use client['"]/.test(read(f))).map((f) => f.replace(/\.tsx?$/, '')));
    const server = sources.filter((f) => f.startsWith('app/') && !/^['"]use client['"]/.test(read(f)));
    const bad: string[] = [];
    for (const f of server) {
      for (const m of read(f).matchAll(/^import (?!type )[^;]*from '([^']+)'/gm)) {
        const target = m[1]!.startsWith('.') ? resolve(web, f, '..', m[1]!).slice(web.length + 1) : '';
        if (client.has(target)) bad.push(`${f} imports ${m[1]}`);
      }
    }
    expect(client.size).toBeGreaterThan(0);
    expect(bad).toEqual([]);
  });
});

