import { z } from 'zod';
import type { DiscoverOutput, PageCandidate, Page as DocPage, SelectOutput, SelectedPage } from '@dse/schema';
import type { RunContext } from '../context';
import { prompts } from '../models/prompts/index.generated';

export const MODEL_TABLE_SIZE = 30;
export const SELECT_TIMEOUT_MS = 10_000;

const ModelAnswer = z.object({ pageIds: z.array(z.string()) });

/** Home first, visitor includes next, then final score descending (docs/specs/page-selection.md). */
export function orderPages(pages: PageCandidate[]): SelectedPage[] {
  const rank = (p: PageCandidate) => (p.reason === 'home' ? 0 : p.source === 'include' ? 1 : 2);
  return [...pages]
    .sort((a, b) => rank(a) - rank(b) || b.finalScore - a.finalScore || a.path.length - b.path.length || a.path.localeCompare(b.path))
    .map((p, order) => ({ ...p, order }));
}

/** Deterministic top-N with the same constraints the model must keep. */
export function fallbackPick(candidates: PageCandidate[], cap: number): PageCandidate[] {
  const mandatory = candidates.filter((c) => c.mandatory);
  const rest = candidates
    .filter((c) => !c.mandatory)
    .sort((a, b) => b.finalScore - a.finalScore || a.path.length - b.path.length || a.path.localeCompare(b.path));
  const groups = new Set(mandatory.map((m) => m.templateGroup).filter(Boolean));
  const out = [...mandatory];
  for (const c of rest) {
    if (out.length >= cap) break;
    if (c.templateGroup && groups.has(c.templateGroup)) continue;
    if (c.templateGroup) groups.add(c.templateGroup);
    out.push(c);
  }
  return out.slice(0, Math.max(cap, mandatory.length));
}

/** Checks a model answer against every rule; returns the reason it fails, or null. */
export function validatePick(ids: string[], table: PageCandidate[], cap: number): string | null {
  const byId = new Map(table.map((c) => [c.id, c]));
  if (new Set(ids).size !== ids.length) return 'duplicate ids';
  if (ids.length > cap) return `more than ${cap} pages`;
  if (ids.some((id) => !byId.has(id))) return 'an id not in the table';
  for (const m of table.filter((c) => c.mandatory)) if (!ids.includes(m.id)) return `missing mandatory ${m.path}`;
  const groups = ids.map((id) => byId.get(id)!.templateGroup).filter(Boolean);
  if (new Set(groups).size !== groups.length) return 'two pages from one template group';
  return null;
}

export function candidateTable(rows: PageCandidate[]): string {
  const cell = (s: string) => s.replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
  const lines = rows.map((c) =>
    [c.id, c.path, cell(c.title) || '(none)', cell(c.h1) || '(none)', c.source, c.finalScore.toFixed(1), c.templateGroup ? `${c.templateGroup} ×${c.templateSize}` : '-', c.reason].join(' | '),
  );
  return ['id | path | title | h1 | source | score | template | reason', ...lines].join('\n');
}

export async function select(ctx: RunContext, input: DiscoverOutput): Promise<SelectOutput> {
  const cap = ctx.config.pageCap;
  const candidates = input.candidates;
  let chosen: PageCandidate[];
  let by: SelectOutput['by'];
  let fallbackReason: string | undefined;

  if (input.hashRouter) {
    chosen = candidates.filter((c) => c.reason === 'home');
    by = 'all';
    await ctx.emit({ stage: 'select', message: 'hash router, home only' });
  } else if (candidates.length <= cap) {
    chosen = candidates;
    by = 'all';
  } else {
    const ranked = [...candidates].sort((a, b) => Number(b.mandatory) - Number(a.mandatory) || b.finalScore - a.finalScore || a.path.localeCompare(b.path));
    const table = ranked.slice(0, MODEL_TABLE_SIZE);
    const mandatoryIds = table.filter((c) => c.mandatory).map((c) => c.id);
    const result = await ctx.models.call({
      purpose: 'select',
      size: 'small',
      system: prompts.select,
      content: [{ type: 'text', text: `Page cap: ${cap}.\nMandatory ids: ${mandatoryIds.join(', ')}.\n\n${candidateTable(table)}` }],
      schema: ModelAnswer,
      maxTokens: 1024,
      timeoutMs: SELECT_TIMEOUT_MS,
    });
    ctx.recordCost(result.cost);
    const problem = result.ok ? validatePick(result.data.pageIds, table, cap) : `${result.reason}: ${result.detail}`;
    if (result.ok && !problem) {
      chosen = result.data.pageIds.map((id) => table.find((c) => c.id === id)!);
      by = result.by;
    } else {
      chosen = fallbackPick(candidates, cap);
      by = 'fallback';
      fallbackReason = problem ?? 'invalid';
    }
  }

  const pages = orderPages(chosen);
  const folded = candidates.filter((c) => c.templateSize && c.templateSize > 1);
  const foldedText = folded.length ? `${folded.length} template${folded.length > 1 ? 's' : ''} folded (${folded.map((c) => `${c.templateGroup} ×${c.templateSize}`).join(', ')}) · ` : '';
  const how = by === 'fallback' ? `fallback ranking picked ${pages.length}` : by === 'all' ? `${pages.length} pages chosen` : `model picked ${pages.length}`;
  const docPages: DocPage[] = pages.map((p) => ({
    id: p.id,
    url: p.url,
    path: p.path,
    reason: p.reason,
    templateGroup: p.templateGroup,
    templateSize: p.templateSize,
    title: p.title,
    h1: p.h1,
    nodeCount: 0,
    status: 'pending',
    captures: {},
  }));
  await ctx.emit({
    stage: 'select',
    message: `${foldedText}${how}`,
    data: { by, fallbackReason, pages: pages.map((p) => p.path) },
    patch: { pages: docPages },
  });
  return { pages, by, fallbackReason };
}
