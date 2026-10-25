#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';

const up = spawnSync('docker', ['compose', 'up', '-d', '--wait'], { stdio: 'inherit' });
if (up.status !== 0) {
  console.error('docker compose up failed; is Docker Desktop running?');
  process.exit(up.status ?? 1);
}
const child = spawn('pnpm', ['--parallel', '--filter', 'web', '--filter', 'worker', 'dev'], { stdio: 'inherit', env: process.env });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code) => process.exit(code ?? 0));
