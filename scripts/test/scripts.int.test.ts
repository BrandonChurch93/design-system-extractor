import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunDocumentPartial } from '@dse/schema';
import { startFixtureServer } from '../fixtures-serve';

// The root scripts that run the pipeline (docs/specs/architecture.md, Scripts).

const root = resolve(import.meta.dirname, '../..');
// Asynchronous: the fixture server may live in this process and must keep answering.
function node(args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((done) => {
    const child = spawn(process.execPath, ['scripts/run.mjs', 'node', '--import', 'tsx', ...args], { cwd: root, env: { ...process.env, DSE_MODEL_MODE: 'replay' } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b: Buffer) => (stdout += b.toString()));
    child.stderr.on('data', (b: Buffer) => (stderr += b.toString()));
    child.on('close', (status) => done({ status, stdout, stderr }));
  });
}

let fixtures: { close(): void } | null = null;
beforeAll(async () => {
  // pipeline:run crawls what it is given; the fixture sites must be up.
  fixtures = await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) }).then(() => null, () => startFixtureServer(4100));
});
afterAll(() => fixtures?.close());

describe('the root scripts', () => {
  it('pnpm pipeline:run runs one URL through a stage to a JSON file, with no queue', async () => {
    const out = join(mkdtempSync(join(tmpdir(), 'dse-pipeline-run-')), 'run.json');
    const r = await node(['scripts/pipeline-run.ts', 'http://localhost:4100/sites/clean/', '--through', 'select', '--out', out, '--quiet']);
    expect(r.status, r.stderr).toBe(0);
    const doc = RunDocumentPartial.parse(JSON.parse(readFileSync(out, 'utf8')));
    expect(doc.pages?.length).toBeGreaterThan(1);
    expect(doc.tokens).toBeUndefined();
  }, 300_000);

  it('pnpm evals --fallback takes every fallback, scores through a stage, and leaves results.json alone', async () => {
    const before = readFileSync(resolve(root, 'fixtures/results.json'), 'utf8');
    const r = await node(['scripts/evals.ts', '--fallback', '--only', 'library', '--through', 'tokens']);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toMatch(/evals · mode fallback · through tokens/);
    expect(r.stdout).toMatch(/library\s+tokens\s+P 1\.000/);
    expect(r.stdout).toContain('fallback run, results.json unchanged');
    expect(readFileSync(resolve(root, 'fixtures/results.json'), 'utf8')).toBe(before);
  }, 300_000);
});
