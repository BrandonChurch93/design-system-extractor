#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';

// --wait treats the one-shot minio-init exiting as a failure, so it runs on its own.
const steps = [
  ['compose', 'up', '-d', '--wait', 'postgres', 'redis', 'minio'],
  ['compose', 'run', '--rm', 'minio-init'],
];
for (const args of steps) {
  const up = spawnSync('docker', args, { stdio: 'inherit' });
  if (up.status !== 0) {
    console.error(`docker ${args.join(' ')} failed; is Docker Desktop running?`);
    process.exit(up.status ?? 1);
  }
}
const child = spawn('pnpm', ['--parallel', '--filter', 'web', '--filter', 'worker', 'dev'], { stdio: 'inherit', env: process.env });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code) => process.exit(code ?? 0));
