import { describe, expect, it } from 'vitest';
import type { RunDocumentPartial, RunEvent } from '@dse/schema';
import { cost, count, duration, logOffset, numberWord, ratio, runDate } from '../lib/format';
import { breadcrumb, completeMeta, landed, progressMeta, rail } from '../lib/run-view';
import { normalizeUrl } from '../lib/submit-run';

const base: RunDocumentPartial = { id: 'abcdefghij', url: 'https://tidewater.app/', host: 'tidewater.app', status: 'running', createdAt: '2026-10-12T16:00:00.000Z', startedAt: '2026-10-12T16:00:00.000Z', pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'] };
let n = 0;
const ev = (stage: RunEvent['stage'], extra: Partial<RunEvent> = {}): RunEvent => ({ id: ++n, runId: 'abcdefghij', ts: '2026-10-12T16:00:01.000Z', stage, level: 'info', message: `${stage} · x`, ...extra });

describe('format', () => {
  it('writes numbers, durations, costs, dates and ratios as the copy rules do', () => {
    expect([numberWord(0), numberWord(6), numberWord(14)]).toEqual(['zero', 'six', '14']);
    expect(count(1044)).toBe('1,044');
    expect([duration(41_000), duration(161_000), duration(3_840_000)]).toEqual(['41 s', '2 min 41 s', '1 h 4 min']);
    expect([cost(0.41), cost(0.0066), cost(0)]).toEqual(['$0.41', '$0.01', '$0.00']);
    expect(runDate('2026-10-12T23:59:00.000Z')).toBe('Oct 12 2026');
    expect(ratio(4.18)).toBe('4.1:1');
    expect(logOffset('2026-10-12T16:01:12.400Z', '2026-10-12T16:00:00.000Z')).toBe('01:12.4');
  });

  it('reads a bare domain as https and refuses other schemes', () => {
    expect(normalizeUrl('stripe.com')).toEqual({ url: 'https://stripe.com/' });
    expect(normalizeUrl(' https://linear.app/docs ')).toEqual({ url: 'https://linear.app/docs' });
    expect(normalizeUrl('ftp://x.com')).toEqual({ error: 'notHttp' });
    expect(normalizeUrl('not a url')).toEqual({ error: 'notUrl' });
  });
});

describe('the stage rail', () => {
  it('runs Pages through discovery and capture, then fills each ring as its stage closes', () => {
    const discover = [ev('queue'), ev('discover', { data: { candidates: 14 } })];
    expect(rail(base, discover, 'running')[0]).toEqual({ key: 'pages', state: 'running', label: 'Pages · 14 found' });
    const capturing = [...discover, ev('select'), ev('capture', { data: { total: 12, captured: 7 } })];
    expect(rail({ ...base, pages: [] }, capturing, 'running')[0]).toMatchObject({ state: 'running', label: 'Pages · capturing 7 of 12' });
    const tokens = { colors: Array(9).fill({}), type: undefined } as unknown as RunDocumentPartial['tokens'];
    const afterPalette = [...capturing, ev('capture', { message: 'capture · 12 of 12 pages captured' }), ev('tokens', { substage: 'tokens:palette' })];
    const rings = rail({ ...base, tokens }, afterPalette, 'running');
    expect(rings.slice(0, 3).map((r) => [r.state, r.label])).toEqual([
      ['done', 'Pages · 12'],
      ['done', 'Palette · 9 colors'],
      ['running', 'Type · reading 7 of 12'],
    ]);
    expect(rings.slice(3).every((r) => r.state === 'pending')).toBe(true);
  });

  it('lands Components only once previews close, naming in between', () => {
    const doc = { ...base, tokens: { colors: [], type: [], space: [] }, components: [] } as unknown as RunDocumentPartial;
    const evs = [ev('capture', { message: 'capture · 9 of 9 pages captured' }), ev('tokens'), ev('components')];
    expect(rail(doc, evs, 'running')[4]).toMatchObject({ state: 'running', label: 'Components · naming' });
    expect(landed(doc, evs, 'running').components).toBe(false);
    expect(landed(doc, [...evs, ev('previews')], 'running').components).toBe(true);
  });
});

describe('meta lines and breadcrumbs', () => {
  it('reads the queue position as the copy words it', () => {
    expect(progressMeta(base, [], 'queued', Date.parse(base.createdAt!), 0)).toBe('Waiting for a crawler · next in line');
    expect(progressMeta(base, [], 'queued', 0, 1)).toBe('Waiting for a crawler · 1 run ahead of you');
    expect(progressMeta(base, [], 'queued', 0, 4)).toBe('Waiting for a crawler · 4 runs ahead of you');
  });

  it('writes the complete line with the framework only when one was detected', () => {
    const doc = { ...base, status: 'complete', pages: Array(12).fill({}), finishedAt: '2026-10-12T16:02:41.000Z', durationMs: 161_000 } as unknown as RunDocumentPartial;
    expect(completeMeta(doc)).toBe('12 pages · 2 viewports · crawled Oct 12 2026 · 2 min 41 s');
    expect(completeMeta({ ...doc, frameworkHint: 'tailwind' })).toBe('12 pages · 2 viewports · crawled Oct 12 2026 · 2 min 41 s · Tailwind detected');
    expect(completeMeta({ ...doc, pages: [{}] } as unknown as RunDocumentPartial)).toBe('1 page · 2 viewports · crawled Oct 12 2026 · 2 min 41 s');
  });

  it('picks the breadcrumb by showcase, then this browser’s list, then the host alone', () => {
    expect(breadcrumb('a.com', { isShowcase: true, inRecent: true }).map((c) => c.label)).toEqual(['Showcase', 'a.com']);
    expect(breadcrumb('a.com', { isShowcase: false, inRecent: true })[0]).toEqual({ label: 'Recent runs', href: '/recent' });
    expect(breadcrumb('a.com', { isShowcase: false, inRecent: false })).toEqual([{ label: 'a.com' }]);
    expect(breadcrumb('a.com', { isShowcase: false, inRecent: false, local: true })).toEqual([{ label: 'Local run' }]);
  });
});
