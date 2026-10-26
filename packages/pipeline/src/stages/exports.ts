import type { RunDocumentPartial } from '@dse/schema';
import type { RunContext } from '../context';
import { designSystemMd, promptMd } from '../exports';

// Stage `exports` (docs/specs/exports-and-mcp.md): design-system.md and the prompt are assembled
// once and stored in the document; every other export is generated on request.

export async function exportsStage(ctx: RunContext): Promise<void> {
  const doc: RunDocumentPartial = ctx.current();
  const runUrl = ctx.config.runUrl ?? `run ${ctx.runId}`;
  const md = designSystemMd(doc, 'proposed');
  const prompt = promptMd(doc, 'proposed', runUrl);
  await ctx.emit({
    stage: 'exports',
    message: `design-system.md ${Math.round(md.length / 1024)} KB · prompt ${Math.round(prompt.length / 1024)} KB`,
    patch: { exports: { designSystemIntro: doc.exports?.designSystemIntro, designSystemMd: md, promptMd: prompt } },
  });
}
