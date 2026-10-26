import type { RunDocumentPartial, RunEvent, RunStatus, Stage } from '@dse/schema';
import { fill, frameworkHintLabels } from '@dse/schema/labels';
import { runPage as copy } from '../copy/strings';
import { count, dots, duration, runDate } from './format';

// The run page's view of a document and its events (docs/design/pages.md, Stage to rail to region).
// Pure: the server render, the poller and the tests all call it.

export type RingKey = 'pages' | 'palette' | 'type' | 'spacing' | 'components' | 'checks' | 'drift';
export type RingState = 'pending' | 'running' | 'done';
export type Ring = { key: RingKey; state: RingState; label: string };

export type RegionKey = 'pages' | 'palette' | 'type' | 'spacing' | 'components' | 'checks' | 'drift' | 'exports';

export const terminal = (s: RunStatus) => s === 'complete' || s === 'blocked' || s === 'failed' || s === 'cancelled';

type Progress = {
  candidates?: number;
  captured: number;
  total: number;
  captureDone: boolean;
  seen: Set<string>;
};

const stageOrder: Stage[] = ['queue', 'discover', 'select', 'capture', 'tokens', 'components', 'previews', 'checks', 'drift', 'exports', 'done'];

function progress(doc: RunDocumentPartial, events: RunEvent[]): Progress {
  const seen = new Set<string>();
  let candidates: number | undefined;
  let captured = 0;
  let total = doc.pages?.length ?? 0;
  let last: Stage = 'queue';
  for (const e of events) {
    seen.add(e.stage);
    if (e.substage) seen.add(e.substage);
    if (stageOrder.indexOf(e.stage) > stageOrder.indexOf(last)) last = e.stage;
    const d = e.data as Record<string, unknown> | null | undefined;
    if (e.stage === 'discover' && typeof d?.candidates === 'number') candidates = d.candidates;
    if (e.stage === 'capture' && typeof d?.captured === 'number' && typeof d?.total === 'number') {
      captured = d.captured;
      total = d.total;
    }
  }
  const capturedPages = doc.pages?.filter((p) => p.status === 'captured').length ?? 0;
  captured = Math.max(captured, capturedPages);
  const captureDone = stageOrder.indexOf(last) > stageOrder.indexOf('capture') || events.some((e) => e.stage === 'capture' && /pages captured|login wall/.test(e.message));
  return { candidates, captured, total, captureDone, seen };
}

/** Which regions have landed: their data is in the document and their stage has closed. */
export function landed(doc: RunDocumentPartial, events: RunEvent[], status: RunStatus): Record<RegionKey, boolean> {
  const p = progress(doc, events);
  const done = status === 'complete' || (status === 'blocked' && Boolean(doc.components));
  return {
    pages: Boolean(doc.pages?.length),
    palette: Boolean(doc.tokens?.colors),
    type: Boolean(doc.tokens?.type),
    spacing: Boolean(doc.tokens?.space),
    components: Boolean(doc.components) && (p.seen.has('previews') || done),
    checks: Boolean(doc.checks),
    drift: Boolean(doc.drift),
    exports: done || (p.seen.has('exports') && Boolean(doc.exports)),
  };
}

/** The seven rings of the StageRail with their labels from copy. */
export function rail(doc: RunDocumentPartial, events: RunEvent[], status: RunStatus): Ring[] {
  const p = progress(doc, events);
  const r = landed(doc, events, status);
  const L = copy.rail;
  const all = status === 'complete';
  const pages: Ring =
    p.captureDone || all
      ? { key: 'pages', state: 'done', label: fill(L.done.pages, { n: count(p.total || doc.pages?.length || 0) }) }
      : p.seen.has('capture')
        ? { key: 'pages', state: 'running', label: fill(L.running.pagesCapturing, { n: p.captured, total: p.total }) }
        : p.seen.has('discover') || p.seen.has('select')
          ? { key: 'pages', state: 'running', label: fill(L.running.pagesFound, { n: count(doc.pages?.length ?? p.candidates ?? 0) }) }
          : status === 'running'
            ? { key: 'pages', state: 'running', label: L.pending.pages }
            : { key: 'pages', state: 'pending', label: L.pending.pages };
  const palette: Ring = r.palette
    ? { key: 'palette', state: 'done', label: fill(L.done.palette, { n: count(doc.tokens!.colors!.length) }) }
    : pages.state === 'done' && !terminal(status)
      ? { key: 'palette', state: 'running', label: L.running.palette }
      : { key: 'palette', state: 'pending', label: L.pending.palette };
  const type: Ring = r.type
    ? { key: 'type', state: 'done', label: fill(L.done.type, { n: count(doc.tokens!.type!.length) }) }
    : palette.state === 'done' && !terminal(status)
      ? { key: 'type', state: 'running', label: fill(L.running.type, { n: p.captured, total: p.total }) }
      : { key: 'type', state: 'pending', label: L.pending.type };
  const spacing: Ring = r.spacing
    ? { key: 'spacing', state: 'done', label: fill(L.done.spacing, { n: count(doc.tokens!.space!.filter((s) => s.onGrid).length) }) }
    : type.state === 'done' && !terminal(status)
      ? { key: 'spacing', state: 'running', label: L.running.spacing }
      : { key: 'spacing', state: 'pending', label: L.pending.spacing };
  const components: Ring = r.components
    ? { key: 'components', state: 'done', label: fill(L.done.components, { n: count(doc.components!.length) }) }
    : spacing.state === 'done' && !terminal(status)
      ? { key: 'components', state: 'running', label: p.seen.has('components') ? L.running.componentsNaming : L.running.componentsClustering }
      : { key: 'components', state: 'pending', label: L.pending.components };
  const checks: Ring = r.checks
    ? { key: 'checks', state: 'done', label: fill(L.done.checks, { passed: count(doc.checks!.summary.passed), applicable: count(doc.checks!.summary.applicable) }) }
    : components.state === 'done' && !terminal(status)
      ? { key: 'checks', state: 'running', label: L.running.checks }
      : { key: 'checks', state: 'pending', label: L.pending.checks };
  const drift: Ring = r.drift
    ? { key: 'drift', state: 'done', label: doc.drift!.findingCount ? fill(L.done.drift, { n: count(doc.drift!.findingCount) }) : L.done.driftNone }
    : checks.state === 'done' && !terminal(status)
      ? { key: 'drift', state: 'running', label: L.running.drift }
      : { key: 'drift', state: 'pending', label: L.pending.drift };
  return [pages, palette, type, spacing, components, checks, drift];
}

/** The complete face's meta line. */
export function completeMeta(doc: RunDocumentPartial): string {
  const pages = doc.pages?.length ?? 0;
  const line = fill(copy.meta.complete, {
    pages: count(pages),
    viewports: doc.viewports?.length ?? 2,
    date: runDate(doc.finishedAt ?? doc.createdAt ?? new Date(0).toISOString()),
    duration: duration(doc.durationMs ?? 0),
  });
  return doc.frameworkHint ? dots([line, fill(copy.meta.framework, { framework: frameworkHintLabels[doc.frameworkHint] })]) : line;
}

/** The in-progress meta line: queued, crawling, or the stage phrase after crawling. */
export function progressMeta(doc: RunDocumentPartial, events: RunEvent[], status: RunStatus, now: number, queuePosition?: number): string {
  if (status === 'queued') {
    const ahead = queuePosition ?? 0;
    if (ahead > 1) return fill(copy.meta.queued, { ahead: count(ahead) });
    return dots([copy.meta.waiting, ahead === 1 ? copy.meta.queuedOne : copy.meta.queuedNext]);
  }
  const p = progress(doc, events);
  const elapsed = duration(now - Date.parse(doc.startedAt ?? doc.createdAt ?? new Date(now).toISOString()));
  if (!p.captureDone) return fill(copy.meta.crawling, { n: p.captured, total: p.total || doc.pages?.length || 0, elapsed });
  const r = landed(doc, events, status);
  const phrase = !r.spacing
    ? copy.meta.phrases.tokens
    : !p.seen.has('components')
      ? copy.meta.phrases.components
      : !r.components
        ? copy.meta.phrases.previews
        : !r.checks
          ? copy.meta.phrases.checks
          : !r.drift
            ? copy.meta.phrases.drift
            : copy.meta.phrases.exports;
  return copy.meta.after.replace('{pages}', count(p.total)).replace('{elapsed}', elapsed).replace('{stage phrase}', phrase);
}

export type Breadcrumb = { label: string; href?: string }[];

/** Showcase / host, Recent runs / host, host alone, or Local run (docs/design/pages.md). */
export function breadcrumb(host: string, opts: { isShowcase: boolean; inRecent: boolean; local?: boolean }): Breadcrumb {
  if (opts.local) return [{ label: 'Local run' }];
  if (opts.isShowcase) return [{ label: 'Showcase', href: '/' }, { label: host }];
  if (opts.inRecent) return [{ label: 'Recent runs', href: '/recent' }, { label: host }];
  return [{ label: host }];
}
