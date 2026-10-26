import { z } from 'zod';
import type { Drift } from '@dse/schema';
import type { RunContext } from '../context';
import { prompts } from '../models/prompts/index.generated';

// The narrative-and-intro call (docs/specs/drift.md): Sonnet phrases the computed facts; a validator
// rejects any field that invents a number or breaks the voice, and the template stands in.

export const NARRATIVE_TIMEOUT_MS = 30_000;

const Answer = z.object({ narrative: z.string(), designSystemIntro: z.string() });

const forbidden = /\b(accessible|compliant|a11y)\b/i; // qa-copy-allow
const scolding = /\b(sloppy|messy|inconsistent|poor|bad|fail\w*)\b/i;
const dashes = /[‒-―]/;

/** Every number in the facts, as written there, for the validator. */
export function factNumbers(facts: unknown): Set<string> {
  const out = new Set<string>();
  for (const m of JSON.stringify(facts).matchAll(/\d+(?:\.\d+)?/g)) {
    out.add(m[0]);
    out.add(String(Number(m[0])));
  }
  return out;
}

const sentences = (text: string) => text.split(/(?<=[.?])\s+(?=[A-Z0-9"'(])/).filter((s) => s.trim());

/** Why a field is rejected, or null when it may be used. */
export function rejectReason(text: string, numbers: Set<string>, sentenceRange: [number, number]): string | null {
  const t = text.trim();
  if (!t) return 'empty';
  if (dashes.test(t)) return 'a dash';
  if (forbidden.test(t)) return 'a forbidden word';
  if (scolding.test(t)) return 'a scolding word';
  if (/!/.test(t)) return 'an exclamation mark';
  for (const m of t.matchAll(/\d+(?:\.\d+)?/g)) if (!numbers.has(m[0]) && !numbers.has(String(Number(m[0])))) return `an invented number ${m[0]}`;
  const n = sentences(t).length;
  if (n < sentenceRange[0] || n > sentenceRange[1]) return `${n} sentences`;
  return null;
}

export type IntroFacts = { host: string; date: string; colors: number; typeStyles: number; spacingSteps: number; components: number; pages: number };

/** The template fallbacks in docs/specs/model-calls.md. */
export function fallbackNarrative(drift: Pick<Drift, 'headline' | 'supporting'>): string {
  return [drift.headline.sentence, ...drift.supporting.slice(0, 2), 'The proposed set keeps every passing contrast ratio.'].join(' ');
}

export function fallbackIntro(f: IntroFacts): string {
  return `This design system was extracted from ${f.host} on ${f.date}: ${f.colors} colors, ${f.typeStyles} type styles, ${f.spacingSteps} spacing steps and ${f.components} components across ${f.pages} pages.`;
}

export type NarrativeResult = { narrative: string; intro: string; narrativeBy: string; introBy: string };

export async function writeNarrative(ctx: RunContext, facts: Record<string, unknown>, drift: Pick<Drift, 'headline' | 'supporting'>, intro: IntroFacts): Promise<NarrativeResult> {
  const fallback = { narrative: fallbackNarrative(drift), intro: fallbackIntro(intro) };
  const result = await ctx.models.call({
    purpose: 'narrative',
    size: 'large',
    system: prompts.narrative,
    content: [{ type: 'text', text: JSON.stringify(facts) }],
    schema: Answer,
    maxTokens: 4096,
    timeoutMs: NARRATIVE_TIMEOUT_MS,
  });
  ctx.recordCost(result.cost);
  if (!result.ok) return { ...fallback, narrativeBy: `template (${result.reason})`, introBy: `template (${result.reason})` };
  const numbers = factNumbers(facts);
  const n = rejectReason(result.data.narrative, numbers, [4, 6]);
  const i = rejectReason(result.data.designSystemIntro, numbers, [2, 2]);
  return {
    narrative: n ? fallback.narrative : result.data.narrative.trim(),
    intro: i ? fallback.intro : result.data.designSystemIntro.trim(),
    narrativeBy: n ? `template (${n})` : `model`,
    introBy: i ? `template (${i})` : `model`,
  };
}
