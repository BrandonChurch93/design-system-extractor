import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunDocumentPartial } from '@dse/schema';
import { startFixtureServer } from '../../../scripts/fixtures-serve';
import { exportCommand, extract, main, serveCommand, type Io } from '../src/index';

// The CLI end to end on the clean fixture (docs/specs/exports-and-mcp.md, Tests).

const url = 'http://localhost:4100/sites/clean/';
let fixtures: Awaited<ReturnType<typeof startFixtureServer>> | null = null;
const io = () => {
  const out: string[] = [];
  const err: string[] = [];
  const it: Io = { out: (s) => out.push(s), err: (s) => err.push(s), env: { PATH: process.env.PATH ?? '' }, interactive: false };
  return { io: it, out, err };
};

beforeAll(async () => {
  try {
    await fetch('http://localhost:4100/robots.txt', { signal: AbortSignal.timeout(1000) });
  } catch {
    fixtures = await startFixtureServer(4100);
  }
}, 30_000);
afterAll(() => fixtures?.close());

describe('dse extract', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'dse-cli-')), 'run');
  let printed: string[];
  beforeAll(async () => {
    const t = io();
    expect(await extract([url, '--out', dir], t.io)).toBe(0);
    printed = t.out;
  }, 600_000);

  it('writes run.json, every export, screenshots and component files', () => {
    const doc = RunDocumentPartial.parse(JSON.parse(readFileSync(join(dir, 'run.json'), 'utf8')));
    expect(doc.status).toBe('complete');
    expect(doc.components!.length).toBeGreaterThan(20);
    expect(readdirSync(join(dir, 'exports')).sort()).toEqual(['all.zip', 'design-system.md', 'motion.css', 'motion.json', 'prompt.md', 'tailwind.tokens.js', 'tokens.css', 'tokens.json', 'tokens.w3c.json']);
    expect(readdirSync(join(dir, 'screenshots')).length).toBe(18);
    expect(existsSync(join(dir, 'components'))).toBe(true);
    expect(existsSync(join(dir, '.intermediate'))).toBe(false);
    expect(readFileSync(join(dir, 'exports/prompt.md'), 'utf8').trim().endsWith(`Source: ${dir}`)).toBe(true);
  });

  it('prints the stat strip and the drift headline', () => {
    const text = printed.join('');
    expect(text).toMatch(/Colors\s+9/);
    expect(text).toMatch(/Checks passed\s+\d+ of \d+/);
    expect(text).toContain('Nothing to collapse. 9 colors, 11 spacing steps, all on the grid.');
  });

  it('regenerates one export from the run file, byte for byte', async () => {
    const t = io();
    expect(await exportCommand([join(dir, 'run.json'), '--format', 'tokens.css'], t.io)).toBe(0);
    expect(t.out.join('')).toBe(readFileSync(join(dir, 'exports/tokens.css'), 'utf8'));
    expect(await main(['export', join(dir, 'run.json'), '--format', 'nope'], t.io)).toBe(1);
  });

  it('serves the folder for /open and records local.base', async () => {
    const t = io();
    const server: Server = await serveCommand([dir, '--port', '4311'], t.io);
    try {
      const doc = JSON.parse(readFileSync(join(dir, 'run.json'), 'utf8'));
      expect(doc.local).toEqual({ base: 'http://localhost:4311' });
      const comp = doc.components[0];
      const res = await fetch(`http://localhost:4311/${comp.preview.cropKey}`);
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe('*');
      expect(res.headers.get('content-type')).toBe('image/png');
      expect((await fetch('http://localhost:4311/run.json')).status).toBe(200);
      expect((await fetch('http://localhost:4311/../../etc/passwd')).status).toBe(404);
    } finally {
      server.close();
    }
  });
});

describe('dse extract --cdp', () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await chromium.launch({ args: ['--remote-debugging-port=9333'] });
  });
  afterAll(async () => browser?.close());

  it('crawls in new tabs of a running browser and leaves the browser open', async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'dse-cdp-')), 'run');
    const t = io();
    expect(await extract([url, '--out', dir, '--cdp', 'http://127.0.0.1:9333', '--pages', '3'], t.io)).toBe(0);
    const doc = RunDocumentPartial.parse(JSON.parse(readFileSync(join(dir, 'run.json'), 'utf8')));
    expect(doc.status).toBe('complete');
    expect(doc.pages).toHaveLength(3);
    expect(browser.isConnected()).toBe(true);
  }, 600_000);
});

describe('the published packages', () => {
  it.each(['cli', 'mcp'])('%s packs only its build, README and license', (pkg) => {
    const cwd = resolve(import.meta.dirname, '../..', pkg);
    execFileSync('pnpm', ['run', 'build'], { cwd, stdio: 'pipe' });
    const [packed] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd }).toString()) as { files: { path: string }[]; name: string }[];
    expect(packed!.files.map((f) => f.path).sort()).toEqual(['LICENSE', 'README.md', 'dist/bin.js', 'package.json']);
    const manifest = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
    expect(Object.keys(manifest.dependencies)).not.toContain('@dse/pipeline');
    expect(JSON.stringify(manifest.dependencies)).not.toContain('workspace:');
  }, 120_000);
});
