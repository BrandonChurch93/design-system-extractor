import { describe, expect, it } from 'vitest';
import { EM_DASH, scanText, wordsApply } from '../lib/copy-rules';

describe('qa:copy rules', () => {
  it('flags an em dash in any scanned file', () => {
    const v = scanText('docs/specs/crawler.md', `one ${EM_DASH} two`);
    expect(v).toEqual([{ file: 'docs/specs/crawler.md', line: 1, rule: 'em-dash', text: `one ${EM_DASH} two` }]);
  });

  it('checks forbidden words only in copy sources, with word boundaries, case-insensitive', () => {
    expect(scanText('apps/web/copy/strings.ts', 'Fully Accessible')).toHaveLength(1);
    expect(scanText('apps/web/components/Button.tsx', 'a11y')).toHaveLength(1);
    expect(scanText('packages/pipeline/src/exports/md.ts', 'COMPLIANT')).toHaveLength(1);
    expect(scanText('apps/web/copy/strings.ts', 'inaccessible accessibility')).toHaveLength(0);
    expect(scanText('docs/specs/checks.md', 'accessible')).toHaveLength(0);
  });

  it('skips lines carrying the allow marker', () => {
    expect(scanText('docs/design/copy.md', 'Forbidden: accessible. qa-copy-allow')).toHaveLength(0);
  });

  it('knows which paths get the word rule', () => {
    expect(wordsApply('packages/schema/src/labels.ts')).toBe(true);
    expect(wordsApply('packages/pipeline/src/models/prompts/select.md')).toBe(true);
    expect(wordsApply('packages/schema/src/enums.ts')).toBe(false);
  });
});
