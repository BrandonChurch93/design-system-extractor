// The two rules behind `pnpm qa:copy` (docs/specs/architecture.md).
export const EM_DASH = String.fromCharCode(0x2014);

export const emDashRoots = ['apps', 'packages', 'scripts', 'docs', 'prompts', 'README.md', 'STATUS.md', 'CHANGELOG.md', '.env.example'];
export const excludedDirs = new Set(['node_modules', '.next', '.next-billing', 'dist', 'coverage', '.turbo', 'test-results', 'playwright-report']);
export const excludedPrefixes = ['reference/', 'fixtures/sites/'];

export const forbiddenWordGlobs = [
  /^apps\/web\/copy\/strings\.ts$/,
  /^apps\/web\/app\//,
  /^apps\/web\/components\//,
  /^packages\/schema\/src\/labels\.ts$/,
  /^packages\/pipeline\/src\/exports\//,
  /^packages\/pipeline\/src\/models\/prompts\//,
  /^docs\/design\/copy\.md$/,
];

export const FORBIDDEN = /\b(accessible|compliant|a11y)\b/i;
export const ALLOW_MARKER = 'qa-copy-allow';

export type CopyViolation = { file: string; line: number; rule: 'em-dash' | 'forbidden-word'; text: string };

export function wordsApply(relPath: string): boolean {
  return forbiddenWordGlobs.some((g) => g.test(relPath));
}

export function scanText(relPath: string, text: string): CopyViolation[] {
  const out: CopyViolation[] = [];
  const checkWords = wordsApply(relPath);
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (line.includes(EM_DASH)) out.push({ file: relPath, line: i + 1, rule: 'em-dash', text: line.trim().slice(0, 160) });
    if (checkWords && !line.includes(ALLOW_MARKER) && FORBIDDEN.test(line)) {
      out.push({ file: relPath, line: i + 1, rule: 'forbidden-word', text: line.trim().slice(0, 160) });
    }
  });
  return out;
}
