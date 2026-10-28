import { ShowcaseContent, type RunDocumentPartial, type RunStatus, type ShowcaseEntry } from '@dse/schema';
import { paletteOf } from '../../apps/web/lib/palette';
import { alternates, roster, type Site } from './roster';

// The decisions of `pnpm showcase` (docs/specs/showcase.md), kept apart from the network so they are tested.

export type Finished = { status: RunStatus; doc: RunDocumentPartial };

/** Why a finished run cannot be a showcase card, or null when it can. */
export function unusable(r: Finished): string | null {
  if (r.status === 'blocked') return `blocked · ${r.doc.blockedReason ?? 'unknown'}`;
  if (r.status !== 'complete') return r.status;
  if (r.doc.sparse) return 'sparse';
  if (!r.doc.stats) return 'no stats';
  return null;
}

/** The first alternate not yet tried, from the same category when one is left (the chip set stays complete). */
export function nextAlternate(category: Site['category'], tried: Set<string>): Site | null {
  const left = alternates.filter((a) => !tried.has(a.host));
  return left.find((a) => a.category === category) ?? left[0] ?? null;
}

/** The grids never orphan: keep the largest multiple of six, earliest in roster order. */
export function toMultipleOfSix(entries: ShowcaseEntry[]): ShowcaseEntry[] {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  return sorted.slice(0, sorted.length - (sorted.length % 6));
}

export function entryFor(site: Site, order: number, runId: string, doc: RunDocumentPartial, appUrl: string): ShowcaseEntry {
  return { runId, url: `${appUrl}/r/${runId}`, host: doc.host ?? site.host, name: site.name, category: site.category, order, stats: doc.stats!, palette: paletteOf(doc) };
}

/** `--refresh-links`: every share link rewritten for a new app URL, nothing run. */
export function refreshLinks(content: ShowcaseContent, appUrl: string): ShowcaseContent {
  return ShowcaseContent.parse({ ...content, appUrl, entries: content.entries.map((e) => ({ ...e, url: `${appUrl}/r/${e.runId}` })) });
}

/** `--only`: one entry replaced (by order) or added, the rest kept. */
export function withEntry(content: ShowcaseContent, entry: ShowcaseEntry, generatedAt: string): ShowcaseContent {
  const entries = [...content.entries.filter((e) => e.order !== entry.order && e.host !== entry.host), entry].sort((a, b) => a.order - b.order);
  return ShowcaseContent.parse({ ...content, generatedAt, entries });
}

// Promoting a run (docs/specs/showcase.md, D-091).

/** Why a run cannot be added, in the words the script prints, or null when it can. */
export function refusal(runId: string, status: RunStatus, doc: RunDocumentPartial): string | null {
  if (status !== 'complete') return `${runId} is ${status}, not complete. Only a complete run can be added.`;
  if (doc.sparse) return `${runId} is sparse (${doc.components?.length ?? 0} components). A sparse run is not added to the showcase.`;
  if (!doc.stats) return `${runId} has no stats. Only a complete run can be added.`;
  return null;
}

const bare = (host: string) => host.replace(/^www\./, '').toLowerCase();

/** The roster's or alternates' site for a host, which supplies its name and category. */
export function knownSite(host: string): Site | undefined {
  return [...roster, ...alternates].find((s) => bare(s.host) === bare(host));
}

/** The new entry first with order 1, the rest renumbered; an entry for the same run or the same site is replaced. */
export function promote(content: ShowcaseContent, entry: ShowcaseEntry, generatedAt: string): { content: ShowcaseContent; replaced?: ShowcaseEntry } {
  const replaced = content.entries.find((e) => e.runId === entry.runId || bare(e.host) === bare(entry.host));
  const rest = content.entries.filter((e) => e !== replaced).sort((a, b) => a.order - b.order);
  const entries = [{ ...entry, order: 1, promoted: true }, ...rest.map((e, i) => ({ ...e, order: i + 2 }))];
  return { content: ShowcaseContent.parse({ ...content, generatedAt, entries }), replaced };
}

/** The entry for a run taken out and the rest renumbered, or null when the run is not listed. */
export function demote(content: ShowcaseContent, runId: string, generatedAt: string): ShowcaseContent | null {
  if (!content.entries.some((e) => e.runId === runId)) return null;
  const entries = content.entries.filter((e) => e.runId !== runId).sort((a, b) => a.order - b.order).map((e, i) => ({ ...e, order: i + 1 }));
  return ShowcaseContent.parse({ ...content, generatedAt, entries });
}

/** The orphan rule (3 and 2 columns): a warning when the count is not a multiple of six. */
export function orphanWarning(n: number): string | null {
  const r = n % 6;
  return r === 0 ? null : `${n} entries leave an orphan at 3 or 2 columns. Add ${6 - r} more or remove ${r}.`;
}

export function listing(content: ShowcaseContent): string {
  const rows = [...content.entries].sort((a, b) => a.order - b.order).map((e) => `| ${e.order} | ${e.host} | ${e.name} | ${e.category} | ${e.runId} | ${e.promoted ? 'promoted' : 'roster'} |`);
  return `| Order | Site | Name | Category | Run | Source |\n| --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}`;
}
