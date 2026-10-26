// Lighthouse on Home and a complete run page against the production build (docs/quality-bar.md):
// performance 90 or higher, accessibility, best practices and SEO 100. Desktop preset; reports in qa/lighthouse.
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktop from 'lighthouse/core/config/desktop-config.js';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.QA_PORT ?? 3100);
const base = `http://localhost:${port}`;
const pages = [
  { name: 'home', path: '/' },
  { name: 'run', path: '/r/seedclean0' },
];
const floors: Record<string, number> = { performance: 0.9, accessibility: 1, 'best-practices': 1, seo: 1 };

async function up(): Promise<boolean> {
  try {
    return (await fetch(`${base}/catalog`, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
}

let server: ChildProcess | null = null;
if (!(await up())) {
  server = spawn('node', ['scripts/qa-server.mjs'], { cwd: root, stdio: 'inherit', env: { ...process.env, QA_PORT: String(port) } });
  const until = Date.now() + 600_000;
  while (!(await up())) {
    if (Date.now() > until) throw new Error('the QA server did not start');
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const out = resolve(root, 'qa/lighthouse');
mkdirSync(out, { recursive: true });
const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-first-run'] });
let failed = false;
try {
  for (const p of pages) {
    // A warm-up load so the first measured request is not the server's first render.
    await fetch(`${base}${p.path}`);
    const result = await lighthouse(`${base}${p.path}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: Object.keys(floors) }, desktop);
    if (!result) throw new Error(`no result for ${p.path}`);
    writeFileSync(resolve(out, `${p.name}.json`), typeof result.report === 'string' ? result.report : JSON.stringify(result.report));
    const cats = result.lhr.categories;
    const line = Object.keys(floors).map((k) => {
      const score = cats[k]?.score ?? 0;
      const ok = score >= floors[k]!;
      if (!ok) failed = true;
      return `${k} ${Math.round(score * 100)}${ok ? '' : ' (below)'}`;
    });
    console.log(`lighthouse · ${p.name.padEnd(5)} · ${line.join(' · ')}`);
    for (const k of Object.keys(floors)) {
      if ((cats[k]?.score ?? 0) >= floors[k]!) continue;
      for (const ref of cats[k]?.auditRefs ?? []) {
        const a = result.lhr.audits[ref.id];
        if (a && a.score !== null && a.score < 1 && ref.weight > 0) console.log(`  ${k} · ${a.id} · ${a.title} · ${a.displayValue ?? a.score}`);
      }
    }
  }
} finally {
  await chrome.kill();
  server?.kill('SIGTERM');
}
process.exit(failed ? 1 : 0);
