import { ShowcaseContent, type RunDocumentPartial, type RunStatus, type ShowcaseEntry } from '@dse/schema';
import { paletteOf } from '../../apps/web/lib/palette';
import { alternates, type Site } from './roster';

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
