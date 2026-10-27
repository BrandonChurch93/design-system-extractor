import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Browser } from 'playwright';
import { describe, expect, it } from 'vitest';
import type { Component } from '@dse/schema';
import { capCandidates, type ElementCandidate } from '../src/capture/candidates';
import { stateOf } from '../src/components/variants';
import { LocalStorage, MemoryRunContext } from '../src/context';
import { ModelClient } from '../src/models/client';
import { PREVIEW_LANES, previews } from '../src/stages/previews';
import type { CaptureOutput } from '../src/stages/capture';
import { snap } from './helpers/snap';

// docs/specs/capture-and-states.md (Per page, States) and preview-fidelity.md (three render checks).

describe('the per-page candidate cap', () => {
  it('keeps 400 candidates, every interactive one, then the largest by area', () => {
    const cand = (i: number, interactive: boolean): ElementCandidate => ({ dse: `e${i}`, interactive, area: interactive ? 10 : i * 100 }) as unknown as ElementCandidate;
    const list = [...Array.from({ length: 450 }, (_, i) => cand(i, false)), ...Array.from({ length: 20 }, (_, i) => cand(1000 + i, true))];
    const kept = capCandidates(list);
    expect(kept).toHaveLength(400);
    expect(kept.filter((c) => c.interactive)).toHaveLength(20);
    const smallestKept = Math.min(...kept.filter((c) => !c.interactive).map((c) => c.area));
    expect(smallestKept).toBe((450 - 380) * 100);
  });
});

describe('states read from the element', () => {
  it('reads disabled, error, checked and selected (current too) in that order', () => {
    const s = snap([
      { tag: 'body' },
      { tag: 'input', parent: 0, aria: { 'aria-invalid': 'true' } },
      { tag: 'button', parent: 0, role: 'switch', aria: { 'aria-checked': 'true' } },
      { tag: 'button', parent: 0, role: 'tab', aria: { 'aria-selected': 'true' } },
      { tag: 'a', parent: 0, aria: { 'aria-current': 'page' } },
      { tag: 'a', parent: 0, aria: { 'aria-current': 'false' } },
      { tag: 'button', parent: 0, aria: { 'aria-disabled': 'true', 'aria-invalid': 'true' } },
    ]);
    expect(s.elements.slice(1).map(stateOf)).toEqual(['error', 'checked', 'selected', 'selected', null, 'disabled']);
  });
});

describe('render checks', () => {
  it('run in three lanes at once, each its own page', async () => {
    let opened = 0;
    const browser = { newContext: async () => (opened++, { route: async () => {}, newPage: async () => ({}), close: async () => {} }) } as unknown as Browser;
    const dir = mkdtempSync(join(tmpdir(), 'dse-lanes-'));
    const ctx = new MemoryRunContext('lanetest01', { url: 'https://t.app/', include: [], pageCap: 12, viewports: ['desktop'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: [], timeoutMs: 60_000, keepIntermediate: false, byo: false }, new ModelClient({ mode: 'replay', recordingsDir: dir }), new LocalStorage(dir, 'https://store.example/dse'), { id: 'lanetest01', url: 'https://t.app/', host: 't.app', status: 'running', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop'], tokens: { colors: [], type: [], space: [], radius: [], shadow: [], breakpoints: [], fontFamilies: [] } } as never);
    const comps = Array.from({ length: 7 }, (_, i) => ({ id: `comp${i}`, preview: { mode: 'captured', cropKey: 'x.png', width: 0, height: 0 }, variants: [], states: [] }) as unknown as Component);
    // The lanes open before any component is checked; these stubs are not full components, so the stage's patch is refused.
    await previews(ctx, { pages: [] } as unknown as CaptureOutput, comps, new Map() as never, browser).catch(() => undefined);
    expect(PREVIEW_LANES).toBe(3);
    expect(opened).toBe(3);
  });
});
