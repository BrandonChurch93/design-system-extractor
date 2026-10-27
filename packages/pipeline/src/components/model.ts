import { z } from 'zod';
import { ComponentType, componentTypeLabels } from '@dse/schema';
import { overBudget } from '../budget';
import type { RunContext } from '../context';
import type { ContentBlock } from '../models/client';
import { prompts } from '../models/prompts/index.generated';
import type { Guess } from './classify';
import { representative, styleDifference } from './cluster';
import type { Item } from './items';

// The two component model calls (docs/specs/model-calls.md): naming and typing in batches of 8,
// then collisions between same-named clusters. Every failure keeps the rule answer.

export const BATCH_SIZE = 8;
export const COMPONENT_TIMEOUT_MS = 20_000;
export const COLLISION_TIMEOUT_MS = 10_000;
export const IMAGE_BELOW_CONFIDENCE = 0.9;

export type Draft = { id: string; items: Item[]; guess: Guess; variantNames: string[]; crop?: Buffer };
export type Naming = { type: ComponentType; name: string; isComponent: boolean; by: 'model' | 'model (retry)' | 'fallback' };

const ItemAnswer = z.object({ id: z.string(), type: ComponentType, name: z.string(), isComponent: z.boolean(), variantHint: z.string().nullable() });
const NamingAnswer = z.object({ items: z.array(ItemAnswer) });
const CollisionAnswer = z.object({ pairs: z.array(z.object({ id: z.string(), same: z.boolean() })) });

const forbidden = /\b(accessible|compliant|a11y)\b/i; // qa-copy-allow
/** One to three words, sentence case, no dashes, none of the forbidden words. */
export function validName(name: string): boolean {
  const words = name.trim().split(/\s+/);
  return words.length >= 1 && words.length <= 3 && name.length <= 40 && /^[A-Z0-9]/.test(name) && !/[‒-―-]/.test(name) && !forbidden.test(name) && /^[\p{L}\p{N} ]+$/u.test(name);
}

function describe(d: Draft): string {
  const it = representative(d.items);
  const pages = [...new Set(d.items.map((i) => i.page.path))];
  const f = it.fp;
  return [
    `${d.id} guess ${d.guess.type} ${d.guess.confidence}`,
    `${it.el.tag}${f.role ? ` role ${f.role}` : ''}`,
    f.classTokens.length ? `classes ${f.classTokens.join(' ')}` : 'no class names',
    f.structure ? `inside ${f.structure}` : 'no children',
    `text "${it.el.text.slice(0, 80)}"`,
    `${d.items.length} instances on ${pages.length} page${pages.length > 1 ? 's' : ''} (${pages.slice(0, 4).join(', ')})`,
    `variants ${d.variantNames.join(', ')}`,
    d.crop && d.guess.confidence < IMAGE_BELOW_CONFIDENCE ? 'picture below' : 'no picture',
  ].join(', ');
}

/** The deterministic name is the type label; a name that repeats takes its context later, never a number (D-084). */
export function fallbackNames(drafts: { guess: Guess }[]): string[] {
  return drafts.map((d) => componentTypeLabels[d.guess.type]);
}

/** Naming calls in flight at once; answers are applied by batch, so the order never changes a name (D-066). */
export const NAMING_IN_FLIGHT = 4;

export async function nameComponents(ctx: RunContext, drafts: Draft[]): Promise<{ namings: Naming[]; byModel: number; calls: string[] }> {
  const fallback = fallbackNames(drafts);
  const namings: Naming[] = drafts.map((d, i) => ({ type: d.guess.type, name: fallback[i]!, isComponent: true, by: 'fallback' }));
  const starts = Array.from({ length: Math.ceil(drafts.length / BATCH_SIZE) }, (_, k) => k * BATCH_SIZE);
  const calls: string[] = new Array(starts.length);
  let byModel = 0;
  const one = async (k: number) => {
    const start = starts[k]!;
    const batch = drafts.slice(start, start + BATCH_SIZE);
    if (overBudget(ctx, 'naming')) {
      calls[k] = 'by fallback (time budget)';
      return;
    }
    const content: ContentBlock[] = [{ type: 'text', text: `Items:\n${batch.map(describe).join('\n')}` }];
    for (const d of batch) {
      if (!d.crop || d.guess.confidence >= IMAGE_BELOW_CONFIDENCE) continue;
      content.push({ type: 'text', text: `Picture of ${d.id}:` });
      content.push({ type: 'image', mediaType: 'image/png', data: d.crop.toString('base64') });
    }
    const result = await ctx.models.call({ purpose: 'components', size: 'small', system: prompts.components, content, schema: NamingAnswer, maxTokens: 2048, timeoutMs: COMPONENT_TIMEOUT_MS });
    ctx.recordCost(result.cost);
    if (!result.ok) {
      calls[k] = `by fallback (${result.reason})`;
      return;
    }
    calls[k] = `by ${result.by}`;
    for (const answer of result.data.items) {
      const i = batch.findIndex((d) => d.id === answer.id);
      if (i < 0) continue;
      const d = batch[i]!;
      const unsure = d.guess.confidence < IMAGE_BELOW_CONFIDENCE;
      namings[start + i] = {
        // A confident rule keeps its type; the model types what the rules were unsure about.
        type: unsure ? answer.type : d.guess.type,
        name: validName(answer.name) ? answer.name.trim() : fallback[start + i]!,
        isComponent: unsure ? answer.isComponent : true,
        by: result.by,
      };
      byModel++;
    }
  };
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(NAMING_IN_FLIGHT, starts.length) }, async () => {
      while (next < starts.length) await one(next++);
    }),
  );
  return { namings, byModel, calls };
}

export type CollisionPair = { id: string; a: Draft; b: Draft; name: string };

function describePair(p: CollisionPair): string {
  const side = (d: Draft) => {
    const it = representative(d.items);
    return `${it.el.tag}${it.fp.role ? ` role ${it.fp.role}` : ''} with ${it.fp.classTokens.length ? `classes ${it.fp.classTokens.join(' ')}` : 'no class names'}, ${it.fp.structure ? `inside ${it.fp.structure}` : 'no children'}, text "${it.el.text.slice(0, 60)}"`;
  };
  const ra = representative(p.a.items).fp.style;
  const rb = representative(p.b.items).fp.style;
  const differ = (Object.keys(ra) as (keyof typeof ra)[]).filter((k) => JSON.stringify(ra[k]) !== JSON.stringify(rb[k]));
  return `${p.id} ${p.name}: ${side(p.a)} / ${side(p.b)}, differing ${differ.join(', ') || 'nothing in style'}`;
}

/** Same-named pairs: the model's answer, or keep separate on any failure. */
export async function resolveCollisions(ctx: RunContext, pairs: CollisionPair[]): Promise<{ same: Set<string>; by: string }> {
  if (pairs.length === 0) return { same: new Set(), by: 'none' };
  const result = await ctx.models.call({
    purpose: 'collision',
    size: 'small',
    system: prompts.collision,
    content: [{ type: 'text', text: `Pairs:\n${pairs.map(describePair).join('\n')}` }],
    schema: CollisionAnswer,
    maxTokens: 1024,
    timeoutMs: COLLISION_TIMEOUT_MS,
  });
  ctx.recordCost(result.cost);
  if (!result.ok) return { same: new Set(), by: `by fallback (${result.reason})` };
  const ids = new Set(pairs.map((p) => p.id));
  return { same: new Set(result.data.pairs.filter((p) => p.same && ids.has(p.id)).map((p) => p.id)), by: `by ${result.by}` };
}

/** Whether two same-named clusters pass the style merge on their representatives. */
export function stylesAgree(a: Draft, b: Draft): boolean {
  const ra = representative(a.items).fp;
  const rb = representative(b.items).fp;
  const d = styleDifference(ra.style, rb.style);
  return ra.tag === rb.tag && ra.role === rb.role && d.differing <= 2 && d.beyond === 0;
}
