import type { Component, Drift, Tokens } from '@dse/schema';
import type { RunContext } from '../context';
import { evidenceRows, findAll, findingCount } from '../drift/findings';
import { writeNarrative } from '../drift/narrative';
import { propose } from '../drift/proposal';
import { factsOf, headlineAndSupport, numbersOf } from '../drift/report';
import type { CaptureOutput } from './capture';
import type { ComponentSources } from './components';

// Stage `drift` (docs/specs/drift.md): findings, the proposed set, numbers and headline from
// templates, evidence, then the narrative and the design-system.md intro.

export async function drift(ctx: RunContext, capture: CaptureOutput, tokens: Tokens, comps: Component[], sources: ComponentSources, host: string): Promise<Drift> {
  const captured = capture.pages.filter((p) => p.status === 'captured');
  const paths = new Map(captured.map((p) => [p.page.id, p.page.path]));
  const reps = new Map([...sources].map(([id, s]) => [id, s.variants]));
  const f = findAll(tokens, comps, reps, paths);
  const { proposal, grays } = propose(tokens, f);
  const facts = factsOf(tokens, comps, f, grays, proposal.spacing.length, proposal.type.length, captured.length);
  const numbers = numbersOf(facts);
  const { headline, supporting } = headlineAndSupport(tokens, numbers, facts);

  const stats = { colors: tokens.colors.length, typeStyles: tokens.type.length, spacingSteps: tokens.space.filter((s) => s.onGrid).length, components: comps.length, pages: captured.length };
  const modelFacts = {
    host,
    ...stats,
    headline: headline.sentence,
    supporting,
    numbers: numbers.map((n) => ({ kind: n.kind, before: n.before, after: n.after, caption: n.caption })),
    findings: { nearDuplicateColors: f.colors.length, offGrid: facts.spacing.values, variantCollapses: f.collapses.length, typeNearDuplicates: f.type.length },
    proposal: { grays: grays.after, spacingSteps: proposal.spacing.length, typeStyles: proposal.type.length, contrastKept: proposal.contrastKept },
  };
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Boise' });
  const written = await writeNarrative(ctx, modelFacts, { headline, supporting }, { host, date, ...stats });

  const result: Drift = {
    headline,
    supporting,
    numbers,
    proposal,
    variantCollapses: f.collapses.map((c) => ({ componentId: c.componentId, keep: c.keep, merge: c.merge, delta: c.delta })),
    evidence: evidenceRows(f),
    findingCount: findingCount(f),
    narrative: written.narrative,
  };
  const summary = numbers.length ? numbers.map((n) => `${n.before} ${n.kind === 'spacing' ? 'spacing' : n.kind} → ${n.after}`).join(' · ') : 'nothing to collapse';
  await ctx.emit({ stage: 'drift', message: `${summary} · ${proposal.contrastKept ? 'contrast kept' : 'contrast not kept'}`, data: { findings: result.findingCount } });
  await ctx.emit({
    stage: 'drift',
    message: written.narrativeBy === 'model' ? 'narrative by model' : `narrative by ${written.narrativeBy}`,
    data: { intro: written.introBy },
    patch: { drift: result, exports: { designSystemIntro: written.intro } },
  });
  return result;
}
