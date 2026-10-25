#!/usr/bin/env node
// Runs root scripts in order and stops at the first failure.
import { spawnSync } from 'node:child_process';

const steps = process.argv.slice(2);
const started = Date.now();
const results = [];
for (const step of steps) {
  const t = Date.now();
  console.log(`\n▸ pnpm ${step}`);
  const r = spawnSync('pnpm', ['run', '--silent', step], { stdio: 'inherit', env: process.env });
  const ok = r.status === 0;
  results.push({ step, ok, s: ((Date.now() - t) / 1000).toFixed(1) });
  if (!ok) break;
}
console.log('\nStep                 Result   Seconds');
for (const r of results) console.log(`${r.step.padEnd(20)} ${(r.ok ? 'pass' : 'FAIL').padEnd(8)} ${r.s}`);
const failed = results.some((r) => !r.ok) || results.length < steps.length;
console.log(`\n${failed ? 'Failed' : 'All passed'} · ${((Date.now() - started) / 1000).toFixed(1)} s`);
process.exit(failed ? 1 : 0);
