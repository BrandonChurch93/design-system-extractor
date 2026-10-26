import type { Component, RunDocumentPartial, RunEvent, RunResponse } from '@dse/schema';
import clean from '../../../../packages/pipeline/test/fixtures/runs/clean.json';
import messy from '../../../../packages/pipeline/test/fixtures/runs/messy.json';

// Sample data for the catalog's page-level components: the committed fixture runs, with previews
// pointed at the catalog's own sample files so every card has something to show.

const live = { mode: 'live' as const, htmlKey: 'catalog/sample-preview.html', cropKey: 'catalog/sample-crop.png', width: 128, height: 58, diffPct: 1.2 };
const captured = { mode: 'captured' as const, capturedReason: 'diff' as const, cropKey: 'catalog/sample-crop.png', width: 128, height: 58, diffPct: 6.2 };

function sample(raw: unknown, id: string): RunDocumentPartial {
  const d = raw as RunDocumentPartial;
  const components = (d.components ?? []).map((c, i): Component => {
    const preview = i % 5 === 4 ? captured : live;
    return {
      ...c,
      preview,
      variants: c.variants.map((v) => ({ ...v, preview })),
      states: c.states.map((s) => (s.captured ? { ...s, cropKey: 'catalog/sample-crop.png' } : s)),
      provenance: { ...c.provenance, firstSeen: { ...c.provenance.firstSeen, sourceCrop: c.provenance.firstSeen.sourceCrop ? { ...c.provenance.firstSeen.sourceCrop, key: 'catalog/sample-crop.png' } : undefined } },
    };
  });
  return {
    ...d,
    id,
    host: 'tidewater.app',
    components,
    sparse: components.length < 4,
    stats: {
      colors: d.tokens?.colors?.length ?? 0,
      typeStyles: d.tokens?.type?.length ?? 0,
      spacingSteps: d.tokens?.space?.filter((s) => s.onGrid).length ?? 0,
      components: components.length,
      checksPassed: d.checks?.summary.passed ?? 0,
      checksApplicable: d.checks?.summary.applicable ?? 0,
    },
  };
}

export const sampleBase = '/';
export const messyDoc = sample(messy, 'catalogmsy');
export const cleanDoc = sample(clean, 'catalogcln');

const at = (s: number) => new Date(Date.parse('2026-10-12T16:00:00.000Z') + s * 1000).toISOString();
export const sampleEvents: RunEvent[] = [
  { id: 1, runId: 'catalogmsy', ts: at(0), stage: 'queue', level: 'info', message: 'queue · picked up by the crawler' },
  { id: 2, runId: 'catalogmsy', ts: at(3), stage: 'discover', level: 'info', message: 'crawl · 14 page candidates', data: { candidates: 14 } },
  { id: 3, runId: 'catalogmsy', ts: at(5), stage: 'select', level: 'info', message: 'select · 12 pages chosen' },
  { id: 4, runId: 'catalogmsy', ts: at(31), stage: 'capture', level: 'info', message: 'capture · /pricing · 1440 and 390 · 2 screenshots · 102 nodes', data: { total: 12, captured: 7 } },
];

/** A run as the poller would see it partway through capture: pages known, nothing measured yet. */
export const progressRun: RunResponse = {
  id: 'catalogmsy',
  status: 'running',
  isShowcase: false,
  document: { id: 'catalogmsy', url: messyDoc.url, host: 'tidewater.app', status: 'running', createdAt: at(0), startedAt: at(0), pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'], pages: messyDoc.pages?.map((p, i) => (i < 7 ? p : { ...p, status: 'pending' as const })) },
  events: sampleEvents,
};
