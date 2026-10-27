// Fixture authoring aid (v1.1): drafts the expected.json fields a run shows, beside what the file
// already says, for the author to check by hand against the fixture source before writing it.
// `pnpm exec tsx scripts/expected-draft.ts <fixture> <run.json>` prints the draft; it never writes.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunDocumentPartial, type ExpectedFixture } from '@dse/schema';
import { matchComponents } from './evals/metrics';

const [, , fixture, runFile] = process.argv;
if (!fixture || !runFile) throw new Error('usage: tsx scripts/expected-draft.ts <fixture> <run.json>');
const expected = JSON.parse(readFileSync(resolve(import.meta.dirname, `../fixtures/sites/${fixture}/expected.json`), 'utf8')) as ExpectedFixture;
const doc = RunDocumentPartial.parse(JSON.parse(readFileSync(runFile, 'utf8')));
const t = doc.tokens ?? {};
const { pairs, misses, extras } = matchComponents(expected, doc);
const valueOf = new Map((t.colors ?? []).map((c) => [c.id, c.value]));

const draft = {
  colors: (t.colors ?? []).map((c) => ({ value: c.value, group: c.group, minUsage: Math.floor(c.usage * 0.6) })),
  type: (t.type ?? []).map((x) => ({ role: x.role, size: x.size, weight: x.weight, name: x.name })),
  breakpoints: (t.breakpoints ?? []).map((b) => b.value),
  motion: {
    durations: (t.duration ?? []).map((d) => ({ ms: d.ms, name: d.name })),
    easings: (t.easing ?? []).map((e) => ({ value: e.value, name: e.name })),
    keyframes: (t.keyframes ?? []).map((k) => k.name),
    patterns: (doc.motion?.patterns ?? []).map((p) => ({ kind: p.kind, trigger: p.trigger.type, start: p.start, end: p.end, durationMs: p.durationMs, easing: p.easing, ...(p.stagger ? { stagger: p.stagger } : {}), observed: p.observed, viewport: p.viewport })),
  },
  siteVariables: {
    named: Object.fromEntries(
      [...(t.colors ?? []), ...(t.overlays ?? []), ...(t.type ?? []), ...(t.shadow ?? []), ...(t.duration ?? []), ...(t.easing ?? [])].filter((x) => x.siteName).map((x) => [x.siteName!, x.name]).concat([...(t.space ?? []), ...(t.radius ?? [])].filter((x) => x.siteName).map((x) => [x.siteName!, x.siteName!.replace(/^--(space|spacing|radius)-/, '')])),
    ),
    hashed: (t.siteVariables ?? []).filter((v) => v.hashed).map((v) => v.name),
  },
  overlays: (t.overlays ?? []).map((o) => ({ name: o.name, base: o.base === 'white' || o.base === 'black' ? o.base : valueOf.get(o.base), alpha: o.alpha })),
  tiers: Object.fromEntries(pairs.map(({ e, p }) => [e.name, p.tier])),
  variants: pairs.map(({ e, p }) => `${e.name} (${p.name}): ${p.variants.map((v) => v.name).join(', ')}`),
  hover: pairs.flatMap(({ e, p }) => {
    const h = p.states.find((s) => s.state === 'hover');
    return h?.delta.length ? [`${e.name}: ${h.delta.map((d) => `${d.property}${d.transition ? ` ${d.transition.durationMs} ms` : ''}`).join(', ')}`] : [];
  }),
  unmatched: { misses, extras },
};
console.log(JSON.stringify(draft, null, 2));
