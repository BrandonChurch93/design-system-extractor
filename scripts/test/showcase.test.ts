import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RunDocumentPartial, ShowcaseCategory, ShowcaseContent, type ShowcaseEntry } from '@dse/schema';
import { demote, entryFor, knownSite, nextAlternate, orphanWarning, promote, refreshLinks, refusal, toMultipleOfSix, unusable, withEntry } from '../showcase/plan';
import { alternates, roster } from '../showcase/roster';

// The showcase script's decisions (docs/specs/showcase.md, D-063).

const spec = readFileSync(resolve(import.meta.dirname, '../../docs/specs/showcase.md'), 'utf8');
const doc = (over: Partial<RunDocumentPartial> = {}) =>
  RunDocumentPartial.parse({
    id: 'abcdefghij',
    url: 'https://stripe.com/',
    host: 'stripe.com',
    status: 'complete',
    createdAt: '2026-10-26T00:00:00.000Z',
    pipelineVersion: '1.0.0',
    viewports: ['desktop', 'mobile'],
    stats: { colors: 31, typeStyles: 14, spacingSteps: 12, components: 40, checksPassed: 120, checksApplicable: 130 },
    ...over,
  });
const entry = (order: number, host = `site${order}.com`): ShowcaseEntry => ({ runId: `run${String(order).padStart(7, '0')}`, url: `https://a.app/r/run${order}`, host, name: host, category: 'SaaS', order, stats: doc().stats!, palette: [] });

describe('the roster', () => {
  it('is the roster table of showcase.md, in order, with its categories', () => {
    const rows = [...spec.matchAll(/^\| (\d+) \| ([a-z0-9.-]+) \| ([A-Za-z ]+) \| .+ \|$/gm)].map((m) => ({ order: Number(m[1]), host: m[2], category: m[3]!.trim() }));
    expect(rows).toHaveLength(12);
    expect(roster.map((s) => ({ order: s.order, host: s.host, category: s.category }))).toEqual(rows);
  });

  it('has the alternates of showcase.md, in order, with their categories', () => {
    const line = spec.split('\n').find((l) => l.startsWith('Alternates'))!;
    const listed = [...line.matchAll(/([a-z0-9.-]+\.[a-z]+) \(([A-Za-z ]+)\)/g)].map((m) => ({ host: m[1], category: m[2] }));
    expect(listed).toHaveLength(14);
    expect(alternates.map((a) => ({ host: a.host, category: a.category }))).toEqual(listed);
  });

  it('covers every category chip and names every site once', () => {
    expect(new Set(roster.map((s) => s.category))).toEqual(new Set(ShowcaseCategory.options));
    const names = [...roster, ...alternates].map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('the plan', () => {
  it('keeps complete runs with stats and replaces the rest', () => {
    expect(unusable({ status: 'complete', doc: doc() })).toBeNull();
    expect(unusable({ status: 'complete', doc: doc({ sparse: true }) })).toBe('sparse');
    expect(unusable({ status: 'blocked', doc: doc({ blockedReason: 'bot' }) })).toBe('blocked · bot');
    expect(unusable({ status: 'failed', doc: doc() })).toBe('failed');
  });

  it('takes an alternate from the same category first, then the next one left', () => {
    expect(nextAlternate('Finance', new Set())!.host).toBe('coinbase.com');
    expect(nextAlternate('Finance', new Set(['coinbase.com']))!.host).toBe('wise.com');
    expect(nextAlternate('Personal', new Set())!.host).toBe('github.com');
    expect(nextAlternate('SaaS', new Set(alternates.map((a) => a.host)))).toBeNull();
  });

  it('lists a multiple of six, earliest in roster order', () => {
    const eleven = [5, 1, 3, 2, 4, 6, 7, 8, 9, 10, 11].map((o) => entry(o));
    expect(toMultipleOfSix(eleven).map((e) => e.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(toMultipleOfSix(eleven.slice(0, 5))).toEqual([]);
    expect(toMultipleOfSix([...eleven, entry(12)])).toHaveLength(12);
  });

  it('builds an entry with the share link, the name and the top colors', () => {
    const d = { ...doc(), tokens: { colors: [{ value: '#FFFFFF', usage: 10 }, { value: '#0B1F3A', usage: 30 }] } } as unknown as RunDocumentPartial;
    const e = entryFor(roster[2]!, 3, 'abcdefghij', d, 'https://dse.app');
    expect(e).toMatchObject({ runId: 'abcdefghij', url: 'https://dse.app/r/abcdefghij', host: 'stripe.com', name: 'Stripe', category: 'Finance', order: 3 });
    expect(e.palette).toEqual([{ value: '#0B1F3A', share: 0.75 }, { value: '#FFFFFF', share: 0.25 }]);
  });

  it('rewrites every link for a new domain without running anything', () => {
    const c = ShowcaseContent.parse({ generatedAt: '2026-10-26T00:00:00.000Z', appUrl: 'https://old.app', entries: [entry(1), entry(2)] });
    const r = refreshLinks(c, 'https://new.app');
    expect(r.appUrl).toBe('https://new.app');
    expect(r.entries.map((e) => e.url)).toEqual(['https://new.app/r/run0000001', 'https://new.app/r/run0000002']);
    expect(r.generatedAt).toBe(c.generatedAt);
  });

  it('replaces one entry by order or host with --only and keeps the rest', () => {
    const c = ShowcaseContent.parse({ generatedAt: '2026-10-26T00:00:00.000Z', appUrl: 'https://a.app', entries: [entry(1), entry(2), entry(3)] });
    const next = withEntry(c, { ...entry(2), runId: 'replaced00' }, '2026-10-27T00:00:00.000Z');
    expect(next.entries.map((e) => e.runId)).toEqual(['run0000001', 'replaced00', 'run0000003']);
    expect(next.generatedAt).toBe('2026-10-27T00:00:00.000Z');
  });
});

describe('promoting a run (D-091)', () => {
  const content = () => ShowcaseContent.parse({ generatedAt: '2026-10-26T00:00:00.000Z', appUrl: 'https://a.app', entries: [entry(1), entry(2), entry(3)] });

  it('refuses a run that is not complete, or is sparse, in the words of showcase.md', () => {
    expect(refusal('abcdefghij', 'running', doc())).toBe('abcdefghij is running, not complete. Only a complete run can be added.');
    expect(refusal('abcdefghij', 'complete', doc({ sparse: true, components: [] }))).toBe('abcdefghij is sparse (0 components). A sparse run is not added to the showcase.');
    expect(refusal('abcdefghij', 'complete', doc())).toBeNull();
  });

  it('puts the promoted entry first with order 1, renumbers the rest, and marks it promoted', () => {
    const { content: next, replaced } = promote(content(), { ...entry(9), runId: 'promoted00' }, '2026-10-28T00:00:00.000Z');
    expect(next.entries.map((e) => [e.runId, e.order, e.promoted ?? false])).toEqual([
      ['promoted00', 1, true],
      ['run0000001', 2, false],
      ['run0000002', 3, false],
      ['run0000003', 4, false],
    ]);
    expect(replaced).toBeUndefined();
  });

  it('moves a run already listed to the top, and replaces the card of the same site', () => {
    expect(promote(content(), entry(3), '2026-10-28T00:00:00.000Z').content.entries.map((e) => e.runId)).toEqual(['run0000003', 'run0000001', 'run0000002']);
    const same = promote(content(), { ...entry(2, 'www.site2.com'), runId: 'newer00000' }, '2026-10-28T00:00:00.000Z');
    expect(same.replaced!.runId).toBe('run0000002');
    expect(same.content.entries.map((e) => e.runId)).toEqual(['newer00000', 'run0000001', 'run0000003']);
  });

  it('removes an entry and renumbers, or says it is not listed', () => {
    expect(demote(content(), 'run0000002', '2026-10-28T00:00:00.000Z')!.entries.map((e) => [e.runId, e.order])).toEqual([
      ['run0000001', 1],
      ['run0000003', 2],
    ]);
    expect(demote(content(), 'nope000000', '2026-10-28T00:00:00.000Z')).toBeNull();
  });

  it('warns when the count leaves an orphan, and names the site from the roster by host', () => {
    expect(orphanWarning(6)).toBeNull();
    expect(orphanWarning(7)).toBe('7 entries leave an orphan at 3 or 2 columns. Add 5 more or remove 1.');
    expect(knownSite('www.modernsoftworks.com')).toMatchObject({ name: 'Modern Softworks', category: 'Personal' });
    expect(knownSite('example.org')).toBeUndefined();
  });
});

