import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, type Page } from '@playwright/test';

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

type AxeViolation = { id: string; impact: string | null; nodes: { target: string[]; failureSummary?: string }[] };

// axe-core runs in the top document only. Catalog frames are checked as routes of their own, and a
// sandbox="" preview frame cannot run scripts, so @axe-core/playwright's per-frame injection would
// hang on it. The iframe elements themselves (their titles) are still checked.
export async function axeCheck(page: Page, exclude: string[] = []) {
  await page.evaluate(axeSource);
  const violations = await page.evaluate(
    async ({ tags, exclude }) => {
      const axe = (window as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<{ violations: unknown[] }> } }).axe;
      const ctx = { include: [document], exclude: exclude.map((e) => [e]) };
      const r = await axe.run(ctx, { iframes: false, runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
      return r.violations;
    },
    { tags, exclude },
  ) as AxeViolation[];
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) · ${v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')} ${n.failureSummary?.split('\n')[1] ?? ''}`).join(' | ')}`,
  );
  expect(summary, summary.join('\n')).toEqual([]);
}
