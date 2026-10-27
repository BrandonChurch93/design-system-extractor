import type { MotionPattern, RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../copy/strings';
import { count } from './format';

// The Motion section's words for a pattern (docs/design/copy.md, Run page, Motion). Pure.

const M = runPage.motion;
const ms = (n: number) => fill(M.ms, { ms: count(Math.round(n)) });

export function triggerPhrase(p: Pick<MotionPattern, 'kind' | 'trigger' | 'durationMs'>): string {
  if (p.kind === 'loop') return fill(M.triggers.loop, { duration: ms(p.durationMs) });
  if (p.kind === 'scrolled-header') return fill(M.triggers.scrolledHeader, { px: count(p.trigger.value ?? 400) });
  switch (p.trigger.type) {
    case 'in-view':
      return fill(M.triggers.inView, { pct: Math.round((p.trigger.value ?? 0) * 100) });
    case 'scroll':
      return fill(M.triggers.scroll, { range: p.trigger.value ?? 1 });
    case 'hover':
      return M.triggers.hover;
    case 'open':
      return M.triggers.open;
    default:
      return M.triggers.load;
  }
}

/** Measured durations are exact; an inline-style one is the time between its first and last sample. */
export function durationText(p: Pick<MotionPattern, 'durationMs' | 'source'>): string {
  return p.source === 'inline-style' ? fill(M.about, { ms: count(Math.round(p.durationMs)) }) : ms(p.durationMs);
}

/** The easing's token name, else its value; null when it was not recorded. */
export function easingName(doc: RunDocumentPartial, tokenId: string | undefined, value: string | null | undefined): string | null {
  const t = tokenId ? doc.tokens?.easing?.find((e) => e.id === tokenId) : undefined;
  return t?.name ?? value ?? null;
}

/** The run's most used easing: the nearest token suggested where none was recorded. */
export function suggestedEasing(doc: RunDocumentPartial): string {
  return [...(doc.tokens?.easing ?? [])].sort((a, b) => b.usage - a.usage)[0]?.name ?? 'ease';
}

/** The base duration a Replay runs over: the run's own, 300 ms when it has none (D-089). */
export function baseDuration(doc: RunDocumentPartial): number {
  return doc.tokens?.duration?.find((d) => d.role === 'base')?.ms ?? 300;
}

export function motionCounts(doc: RunDocumentPartial) {
  return { durations: doc.tokens?.duration?.length ?? 0, easings: doc.tokens?.easing?.length ?? 0, keyframes: doc.tokens?.keyframes?.length ?? 0, patterns: doc.motion?.patterns.length ?? 0 };
}
