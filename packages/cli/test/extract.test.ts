import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { RunDocumentPartial } from '@dse/schema';
import type { MemoryRunContext } from '@dse/pipeline/context';
import { extract, type Io } from '../src/index';

// dse extract's flags and exit codes, with the pipeline and the browser stood in
// (docs/specs/exports-and-mcp.md, The CLI).

const pipeline = vi.hoisted(() => ({ runPipeline: vi.fn() }));
vi.mock('@dse/pipeline/run', () => ({ PIPELINE_VERSION: '1.0.0', runPipeline: pipeline.runPipeline }));
vi.mock('@dse/pipeline/crawl/browser', () => ({ launchBrowser: async () => ({ close: async () => {} }) }));

const clean = RunDocumentPartial.parse(JSON.parse(readFileSync(resolve(import.meta.dirname, '../../pipeline/test/fixtures/runs/clean.json'), 'utf8')));
const io = () => {
  const out: string[] = [];
  const it: Io = { out: (s) => out.push(s), err: () => {}, env: {}, interactive: false };
  return { io: it, out };
};
const outDir = () => join(mkdtempSync(join(tmpdir(), 'dse-extract-')), 'run');

describe('dse extract', () => {
  it('exits 2 for a blocked run and writes no exports without components', async () => {
    pipeline.runPipeline.mockImplementationOnce(async () => ({ status: 'blocked', reason: 'robots', detail: { attempts: [] } }));
    const t = io();
    const dir = outDir();
    expect(await extract(['https://example.com/', '--out', dir], t.io)).toBe(2);
    expect(t.out.join('')).toBe('blocked · robots\n');
    expect(existsSync(join(dir, 'run.json'))).toBe(true);
    expect(existsSync(join(dir, 'exports'))).toBe(false);
  });

  it('exits 1 for a failed run', async () => {
    pipeline.runPipeline.mockImplementationOnce(async () => ({ status: 'failed', detail: 'The run took longer than 15 minutes.' }));
    const t = io();
    expect(await extract(['https://example.com/', '--out', outDir()], t.io)).toBe(1);
    expect(t.out.join('')).toBe('failed · The run took longer than 15 minutes.\n');
  });

  it('crawls each --include from the start URL, allows its host, and writes the exports in the --set', async () => {
    let ctx: MemoryRunContext | undefined;
    pipeline.runPipeline.mockImplementationOnce(async (c: MemoryRunContext) => {
      ctx = c;
      c.document = clean;
      return { status: 'complete' };
    });
    const t = io();
    const dir = outDir();
    expect(await extract(['https://example.com/', '--include', '/pricing', '--include', 'https://docs.example.org/start', '--set', 'raw', '--pages', '4', '--out', dir], t.io)).toBe(0);
    expect(ctx!.config).toMatchObject({ include: ['https://example.com/pricing', 'https://docs.example.org/start'], allowPrivateHosts: ['example.com:443', 'docs.example.org:443'], pageCap: 4 });
    expect(readFileSync(join(dir, 'exports', 'tokens.css'), 'utf8').split('\n')[0]).toMatch(/· raw set ·/);
    expect(t.out.join('')).toContain(`Components     ${clean.components!.length}`);
  });
});
