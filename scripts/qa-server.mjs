#!/usr/bin/env node
// Serves a production build of the web app for QA on QA_PORT (3100). Rebuilds when any source
// file is newer than the last build, so goldens and axe always run against current code.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const web = join(root, 'apps/web');
const buildId = join(web, '.next/BUILD_ID');
const skip = new Set(['node_modules', '.next', 'dist', 'test', 'goldens']);

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
  console.log('qa-server · building the web app');
  const r = spawnSync('pnpm', ['--filter', 'web', 'build'], { stdio: 'inherit', cwd: root, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const port = process.env.QA_PORT ?? '3100';
const child = spawn('pnpm', ['--filter', 'web', 'exec', 'next', 'start', '--port', port], { stdio: 'inherit', cwd: root, env: process.env });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code) => process.exit(code ?? 0));
