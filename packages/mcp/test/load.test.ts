import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APP_URL, loadRun } from '../src/index';

// Where the MCP server reads a run from, and that it writes nothing (docs/specs/exports-and-mcp.md).

const runFile = resolve(import.meta.dirname, '../../pipeline/test/fixtures/runs/messy.json');
const document = JSON.parse(readFileSync(runFile, 'utf8')) as { id: string };

function stubFetch(): string[] {
  const asked: string[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
    asked.push(url);
    return new Response(JSON.stringify({ document }), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  return asked;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the run the MCP server serves', () => {
  it('fetches --run from the production app by default, once', async () => {
    const asked = stubFetch();
    const { doc, runUrl } = await loadRun(['--run', document.id], {});
    expect(DEFAULT_APP_URL).toBe('https://design-system-extractor.vercel.app');
    expect(asked).toEqual([`${DEFAULT_APP_URL}/api/runs/${document.id}`]);
    expect(runUrl).toBe(`${DEFAULT_APP_URL}/r/${document.id}`);
    expect(doc.id).toBe(document.id);
  });

  it('takes the app URL from DSE_APP_URL, and from --app-url over it', async () => {
    const asked = stubFetch();
    expect((await loadRun(['--run', document.id], { DSE_APP_URL: 'https://staging.example/' })).runUrl).toBe(`https://staging.example/r/${document.id}`);
    await loadRun(['--run', document.id, '--app-url', 'http://localhost:3000'], { DSE_APP_URL: 'https://staging.example' });
    expect(asked).toEqual([`https://staging.example/api/runs/${document.id}`, `http://localhost:3000/api/runs/${document.id}`]);
  });

  it('never writes to disk: its only file access is reading --file', () => {
    const dir = resolve(import.meta.dirname, '../src');
    const fsImports: string[] = [];
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), 'utf8');
      for (const m of src.matchAll(/import\s+(.+?)\s+from\s+'(?:node:)?fs(?:\/promises)?'/g)) fsImports.push(`${f}: ${m[1]}`);
      expect(src, f).not.toMatch(/\b(writeFile|appendFile|mkdir|createWriteStream|rmSync|unlink|rename)\w*\(/);
    }
    expect(fsImports).toEqual(['index.ts: { readFile }']);
  });
});
