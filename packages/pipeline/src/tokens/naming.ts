import { z } from 'zod';
import type { ColorToken } from '@dse/schema';
import type { RunContext } from '../context';
import { prompts } from '../models/prompts/index.generated';
import { hueWord, lightnessStep } from './constants';

// The color naming pass (docs/specs/model-calls.md): the model may rename within the rules; the
// deterministic name stands for anything it gets wrong.

export const NAMING_TIMEOUT_MS = 10_000;
export const namePattern = /^[a-z]+(-[a-z0-9]+)*$/;

const Answer = z.object({ names: z.array(z.object({ id: z.string(), name: z.string() })) });

/** The word a token's name must keep: its role, gray for neutrals, else its hue word. */
export function requiredWord(t: ColorToken): string {
  if (t.semanticRole) return t.semanticRole;
  if (t.group === 'neutral') return 'gray';
  return hueWord(t.oklch.h);
}

export function namingTable(tokens: ColorToken[], pageCount: number): string {
  const lines = tokens.map((t) =>
    [t.id, t.name, t.value, t.group, t.semanticRole ?? '-', t.group === 'neutral' ? 'gray' : hueWord(t.oklch.h), lightnessStep(t.oklch.l), `text ${t.uses.text} background ${t.uses.background} border ${t.uses.border} other ${t.uses.other}`, `${t.pages.length} of ${pageCount} pages`, t.siteName ? 'site' : '-'].join(' | '),
  );
  return ['id | name now | hex | group | role | hue | step | uses | pages | fixed', ...lines].join('\n');
}

/**
 * Applies the model's names that keep the rules: the pattern, the required word, one to three
 * parts, unique among the final names. Returns how many it kept.
 */
export function applyNames(tokens: ColorToken[], proposed: { id: string; name: string }[]): number {
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const want = new Map<string, string>();
  for (const p of proposed) {
    const t = byId.get(p.id);
    // A site-named token keeps the site's name whatever the model answers (D-082).
    if (!t || t.siteName || want.has(p.id)) continue;
    const name = p.name.trim();
    const parts = name.split('-');
    if (!namePattern.test(name) || parts.length > 3 || !parts.includes(requiredWord(t))) continue;
    want.set(p.id, name);
  }
  // A name stays unique: a proposal that collides with any other final name is dropped.
  const final = new Map(tokens.map((t) => [t.id, want.get(t.id) ?? t.name]));
  const counts = new Map<string, number>();
  for (const n of final.values()) counts.set(n, (counts.get(n) ?? 0) + 1);
  let kept = 0;
  for (const t of tokens) {
    const n = want.get(t.id);
    if (!n || counts.get(n)! > 1) continue;
    if (n !== t.name) kept++;
    t.name = n;
  }
  return kept;
}

export type NamingResult = { by: 'model' | 'model (retry)' | 'fallback'; reason?: string; renamed: number };

export async function nameColors(ctx: RunContext, tokens: ColorToken[], pageCount: number): Promise<NamingResult> {
  if (tokens.length === 0) return { by: 'fallback', reason: 'no colors', renamed: 0 };
  const result = await ctx.models.call({
    purpose: 'colors',
    size: 'small',
    system: prompts.colors,
    content: [{ type: 'text', text: namingTable(tokens, pageCount) }],
    schema: Answer,
    maxTokens: 2048,
    timeoutMs: NAMING_TIMEOUT_MS,
  });
  ctx.recordCost(result.cost);
  if (!result.ok) return { by: 'fallback', reason: result.reason, renamed: 0 };
  return { by: result.by, renamed: applyNames(tokens, result.data.names) };
}
