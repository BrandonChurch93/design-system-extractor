#!/usr/bin/env node
// Serves a production build of the web app for QA on QA_PORT (3100). Rebuilds when any source
// file is newer than the last build, so goldens and axe always run against current code.
// QA_BILLING=on builds with BILLING_ENABLED=true into .next-billing, for the flagged surfaces (P12).
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const web = join(root, 'apps/web');
const billing = process.env.QA_BILLING === 'on';
const dist = billing ? '.next-billing' : '.next';
const env = billing ? { ...process.env, BILLING_ENABLED: 'true', DSE_NEXT_DIST: dist } : process.env;
const buildId = join(web, dist, 'BUILD_ID');
const skip = new Set(['node_modules', '.next', '.next-billing', 'dist', 'test', 'goldens']);

function newest(dir) {
  let t = 0;
  for (const name of readdirSync(dir)) {
    if (skip.has(name) || name.startsWith('.')) continue;
    const p = join(dir, name);
    const st = statSync(p);
    t = Math.max(t, st.isDirectory() ? newest(p) : st.mtimeMs);
  }
  return t;
}

const sources = [web, join(root, 'packages/schema/src'), join(root, 'packages/pipeline/src')];
const stale = !existsSync(buildId) || sources.some((d) => newest(d) > statSync(buildId).mtimeMs);
if (stale) {
  console.log(`qa-server · building the web app${billing ? ' with BILLING_ENABLED' : ''}`);
  // Next points these at the build folder it writes; the committed copies name .next.
  // Their times are kept too, or the restore would make the other build look stale.
  const kept = billing ? ['next-env.d.ts', 'tsconfig.json'].map((f) => ({ path: join(web, f), text: readFileSync(join(web, f), 'utf8'), st: statSync(join(web, f)) })) : [];
  const r = spawnSync('pnpm', ['--filter', 'web', 'build'], { stdio: 'inherit', cwd: root, env });
  for (const k of kept) {
    writeFileSync(k.path, k.text);
    utimesSync(k.path, k.st.atime, k.st.mtime);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const port = process.env.QA_PORT ?? '3100';
const child = spawn('pnpm', ['--filter', 'web', 'exec', 'next', 'start', '--port', port], { stdio: 'inherit', cwd: root, env });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code) => process.exit(code ?? 0));
