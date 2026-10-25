import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generatedFile, renderPromptsModule } from '../prompts-build';

describe('prompts', () => {
  it('the generated module matches the .md files (run pnpm prompts:build)', () => {
    expect(readFileSync(generatedFile, 'utf8')).toBe(renderPromptsModule());
  });
});
