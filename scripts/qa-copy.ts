import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { emDashRoots, excludedDirs, excludedPrefixes, scanText, type CopyViolation } from './lib/copy-rules';

const root = resolve(import.meta.dirname, '..');
const textExt = /\.(ts|tsx|js|mjs|cjs|jsx|json|md|mdx|css|html|txt|yml|yaml|sql|example|sh)$|(^|\/)(Dockerfile|README|LICENSE)$/;

function walk(abs: string, out: string[]): void {
  const rel = relative(root, abs);
  if (excludedPrefixes.some((p) => `${rel}/`.startsWith(p) || rel.startsWith(p))) return;
  const st = statSync(abs);
  if (st.isDirectory()) {
    for (const name of readdirSync(abs)) {
      if (excludedDirs.has(name)) continue;
      walk(join(abs, name), out);
    }
  } else if (textExt.test(rel) || rel === '.env.example') {
    out.push(abs);
  }
}

const files: string[] = [];
for (const r of emDashRoots) {
  try {
    walk(resolve(root, r), files);
  } catch {
    // a root that does not exist yet has nothing to check
  }
}

const violations: CopyViolation[] = [];
for (const abs of files) violations.push(...scanText(relative(root, abs), readFileSync(abs, 'utf8')));

if (violations.length) {
  for (const v of violations) console.log(`${v.file}:${v.line} · ${v.rule} · ${v.text}`);
  console.log(`\nqa:copy · ${violations.length} violation${violations.length > 1 ? 's' : ''} in ${files.length} files`);
  process.exitCode = 1;
} else {
  console.log(`qa:copy · ${files.length} files · no em dashes · no forbidden words`);
}
