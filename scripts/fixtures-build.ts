// Generates the clean-family fixtures from one source and compiles the Tailwind fixture's CSS.
// Run once when a fixture changes (a decision is logged); the output is committed.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { buildAll, tailwindInputFile } from '../fixtures/src/clean-family/generate';
import { buildLibrary } from '../fixtures/src/library/generate';
import { buildMessy } from '../fixtures/src/messy/generate';

buildAll();
buildMessy(false);
buildMessy(true);
buildLibrary();
const out = resolve(import.meta.dirname, '../fixtures/sites/tailwind/styles.css');
const r = spawnSync('pnpm', ['exec', 'tailwindcss', '-i', tailwindInputFile, '-o', out], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log('fixtures:build · clean, css-in-js, tailwind, messy, messy-after and library generated; Tailwind CSS compiled');
