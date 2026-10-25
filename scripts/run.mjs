#!/usr/bin/env node
// Loads the env file (DOTENV_FILE, else .env.local at the repository root) without
// overriding variables already set, then runs the given command.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = process.env.DOTENV_FILE ? resolve(process.cwd(), process.env.DOTENV_FILE) : resolve(root, '.env.local');
if (existsSync(file)) {
  const parsed = parseEnv(readFileSync(file, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
} else if (process.env.DOTENV_FILE) {
  console.error(`Env file not found: ${file}`);
  process.exit(1);
}
process.env.DSE_ENV_LOADED = '1';

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error('Usage: node scripts/run.mjs <command> [...args]');
  process.exit(2);
}
const child = spawn(cmd, args, { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
