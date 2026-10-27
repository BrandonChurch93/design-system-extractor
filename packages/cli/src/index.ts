import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { chromium, type Browser, type BrowserContext } from 'playwright';
import { ExportFormat, ExportSet, RunDocumentPartial, newRunId, type RunConfig } from '@dse/schema';
import { MemoryRunContext } from '@dse/pipeline/context';
import { launchBrowser } from '@dse/pipeline/crawl/browser';
import { allZip, generateExport } from '@dse/pipeline/exports';
import { ModelClient } from '@dse/pipeline/models/client';
import { PIPELINE_VERSION, runPipeline } from '@dse/pipeline/run';
import { FolderStorage, serveFolder } from './folder';

// The dse command (docs/specs/exports-and-mcp.md, The CLI): extract, export, serve.

export const VERSION = '1.1.0';
export const SERVE_PORT = 4300;
const USER_AGENT = 'DesignSystemExtractorBot/1.0 (+https://design-system-extractor.vercel.app/how-it-works)';
const TEXT_FORMATS = ['tokens.css', 'tokens.json', 'tailwind.tokens.js', 'tokens.w3c.json', 'motion.css', 'motion.json', 'design-system.md', 'prompt.md'] as const;

export type Io = { out: (s: string) => void; err: (s: string) => void; env: NodeJS.ProcessEnv; interactive: boolean };
const defaultIo: Io = { out: (s) => process.stdout.write(s), err: (s) => process.stderr.write(s), env: process.env, interactive: Boolean(process.stdin.isTTY) };

const usage = `dse ${VERSION}

  dse extract <url> [--pages 12] [--out ./dse-run] [--cdp <url>] [--include <url>]… [--set proposed|raw]
  dse export <run.json> --format <format> [--set proposed|raw] [--out <file>]
  dse serve <dir> [--port 4300]

Formats: ${ExportFormat.options.join(', ')}
`;

/** Playwright's Chromium, installed on first use after asking. */
async function ensureBrowser(io: Io): Promise<Browser> {
  try {
    return await launchBrowser();
  } catch (e) {
    if (!/Executable doesn't exist|install/i.test((e as Error).message)) throw e;
  }
  const version = (createRequire(import.meta.url)('playwright/package.json') as { version: string }).version;
  if (!io.interactive) throw new Error(`Chromium for Playwright is not installed. Run: npx playwright@${version} install chromium`);
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = (await rl.question('dse needs Playwright’s Chromium (about 150 MB). Install it now? [Y/n] ')).trim().toLowerCase();
  rl.close();
  if (answer === 'n' || answer === 'no') throw new Error('Chromium is needed to crawl. Nothing was run.');
  const r = spawnSync('npx', ['-y', `playwright@${version}`, 'install', 'chromium'], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Installing Chromium failed.');
  return launchBrowser();
}

function hostPort(u: URL): string {
  return `${u.hostname}:${u.port || (u.protocol === 'https:' ? '443' : '80')}`.toLowerCase();
}

function table(rows: [string, string | number][]): string {
  const w = Math.max(...rows.map(([k]) => k.length));
  return `${rows.map(([k, v]) => `  ${k.padEnd(w)}  ${v}`).join('\n')}\n`;
}

export async function extract(argv: string[], io: Io = defaultIo): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { pages: { type: 'string', default: '12' }, out: { type: 'string', default: './dse-run' }, cdp: { type: 'string' }, include: { type: 'string', multiple: true, default: [] }, set: { type: 'string', default: 'proposed' } },
  });
  const raw = positionals[0];
  if (!raw) throw new Error(usage);
  const url = new URL(raw);
  if (!/^https?:$/.test(url.protocol)) throw new Error('Give an http or https address.');
  const set = ExportSet.parse(values.set);
  const outDir = resolve(values.out!);
  rmSync(outDir, { recursive: true, force: true });
  const storage = new FolderStorage(outDir);
  // Previews are checked from a URL, as the app loads them: the folder is served while the run lasts.
  const server = await serveFolder(outDir, 0);
  storage.setBase(`http://127.0.0.1:${(server.address() as { port: number }).port}`);

  let browser: Browser;
  let context: BrowserContext | undefined;
  if (values.cdp) {
    browser = await chromium.connectOverCDP(values.cdp);
    context = browser.contexts()[0] ?? (await browser.newContext());
  } else browser = await ensureBrowser(io);

  const id = newRunId();
  const include = values.include!.map((u) => new URL(u, url).toString());
  // The machine is the visitor's own: the address it asked for is allowed even when it is private.
  const config: RunConfig = {
    url: url.toString(),
    include,
    pageCap: Math.max(1, Number(values.pages) || 12),
    viewports: ['desktop', 'mobile'],
    userAgent: USER_AGENT,
    allowPrivateHosts: [...new Set([hostPort(url), ...include.map((u) => hostPort(new URL(u)))])],
    timeoutMs: 15 * 60_000,
    keepIntermediate: false,
    byo: false,
    runUrl: outDir,
  };
  const models = new ModelClient({ mode: 'live', apiKey: io.env.ANTHROPIC_API_KEY, recordingsDir: join(tmpdir(), 'dse-recordings') });
  const ctx = new MemoryRunContext(id, config, models, storage, { id, url: config.url, host: url.host, status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: PIPELINE_VERSION, viewports: config.viewports }, undefined, (e) => io.err(`${e.message}\n`));
  if (!io.env.ANTHROPIC_API_KEY) io.err('No ANTHROPIC_API_KEY: names and the narrative come from templates.\n');
  try {
    const outcome = await runPipeline(ctx, { browser, context });
    const doc = ctx.document;
    writeFileSync(join(outDir, 'run.json'), `${JSON.stringify(doc, null, 2)}\n`);
    if (outcome.status === 'complete' || (outcome.status === 'blocked' && doc.components)) {
      mkdirSync(join(outDir, 'exports'), { recursive: true });
      for (const f of TEXT_FORMATS) writeFileSync(join(outDir, 'exports', f), generateExport(doc, f, { set, runUrl: outDir }).body);
      writeFileSync(join(outDir, 'exports', 'all.zip'), await allZip(doc, { set, runUrl: outDir }, (k) => storage.get(k)));
    }
    rmSync(join(outDir, '.intermediate'), { recursive: true, force: true });
    if (outcome.status !== 'complete') {
      io.out(`${outcome.status}${'reason' in outcome ? ` · ${outcome.reason}` : ''}${'detail' in outcome && typeof outcome.detail === 'string' ? ` · ${outcome.detail}` : ''}\n`);
      return outcome.status === 'blocked' ? 2 : 1;
    }
    const applicable = doc.checks?.summary.applicable ?? 0;
    io.out(
      table([
        ['Colors', doc.tokens?.colors?.length ?? 0],
        ['Type styles', doc.tokens?.type?.length ?? 0],
        ['Spacing steps', doc.tokens?.space?.filter((s) => s.onGrid).length ?? 0],
        ['Components', doc.components?.length ?? 0],
        ['Checks passed', `${doc.checks?.summary.passed ?? 0} of ${applicable}`],
      ]),
    );
    io.out(`\n${doc.drift?.headline.sentence ?? ''}\n\n${outDir}\n`);
    return 0;
  } finally {
    if (context) await browser.close().catch(() => {});
    else await browser.close();
    server.close();
  }
}

export async function exportCommand(argv: string[], io: Io = defaultIo): Promise<number> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { format: { type: 'string' }, set: { type: 'string', default: 'proposed' }, out: { type: 'string' }, component: { type: 'string' } } });
  const file = positionals[0];
  if (!file || !values.format) throw new Error(usage);
  const format = ExportFormat.parse(values.format);
  const set = ExportSet.parse(values.set);
  const doc = RunDocumentPartial.parse(JSON.parse(readFileSync(file, 'utf8')));
  const runUrl = resolve(dirname(file));
  if (format === 'all.zip') {
    const folder = new FolderStorage(dirname(resolve(file)));
    const bytes = await allZip(doc, { set, runUrl }, (k) => folder.get(k));
    writeFileSync(values.out ?? 'all.zip', bytes);
    return 0;
  }
  const body = generateExport(doc, format, { set, runUrl, componentId: values.component }).body;
  if (values.out) writeFileSync(values.out, body);
  else io.out(body);
  return 0;
}

/** Serves a run folder for `/open` and records where in `run.json` (`local.base`). */
export async function serveCommand(argv: string[], io: Io = defaultIo): Promise<Server> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { port: { type: 'string', default: String(SERVE_PORT) } } });
  const dir = resolve(positionals[0] ?? '.');
  const port = Number(values.port);
  const runFile = join(dir, 'run.json');
  const doc = RunDocumentPartial.parse(JSON.parse(readFileSync(runFile, 'utf8')));
  const base = `http://localhost:${port}`;
  writeFileSync(runFile, `${JSON.stringify({ ...doc, local: { base } }, null, 2)}\n`);
  const server = await serveFolder(dir, port, 'localhost');
  io.out(`Serving ${dir} on ${base}\nOpen the run at /open on the web app and choose ${runFile}.\n`);
  return server;
}

export async function main(argv: string[], io: Io = defaultIo): Promise<number> {
  const [command, ...rest] = argv;
  try {
    if (command === 'extract') return await extract(rest, io);
    if (command === 'export') return await exportCommand(rest, io);
    if (command === 'serve') {
      await serveCommand(rest, io);
      return await new Promise<number>(() => {});
    }
    if (command === '--version' || command === '-v') {
      io.out(`${VERSION}\n`);
      return 0;
    }
    io.out(usage);
    return command ? 1 : 0;
  } catch (e) {
    io.err(`${(e as Error).message}\n`);
    return 1;
  }
}
