import type { FrameworkHint, PageReason } from '@dse/schema';
import { findCandidates } from '../../src/capture/candidates';
import type { Snapshot } from '../../src/capture/snapshot';
import type { CaptureOutput } from '../../src/stages/capture';

// A capture built from crafted snapshots, enough for the components stage's pure parts.

export type FakePage = { path: string; reason?: PageReason; desktop?: Snapshot; mobile?: Snapshot };

export function fakeCapture(pages: FakePage[], frameworkHint?: FrameworkHint): CaptureOutput {
  return {
    frameworkHint,
    pages: pages.map((p, order) => ({
      page: { id: `page${String(order).padStart(4, '0')}`, url: `https://t.app${p.path}`, path: p.path, reason: p.reason ?? (order === 0 ? 'home' : 'nav'), source: 'header', depth: 1, preScore: 0, finalScore: 0, mandatory: order === 0, fetchFailed: false, title: '', h1: '', order },
      status: 'captured',
      finalUrl: `https://t.app${p.path}`,
      looksLikeLogin: false,
      title: '',
      h1: '',
      nodeCount: 0,
      viewports: Object.fromEntries(
        (['desktop', 'mobile'] as const)
          .filter((v) => p[v])
          .map((v) => [v, { viewport: v, snapshot: p[v]!, candidates: findCandidates(p[v]!, v), selectors: Object.fromEntries(p[v]!.elements.map((e) => [e.d, `${e.tag}:nth(${e.index})`])), matched: {}, states: {}, stateCaptured: new Set<string>(), tabOrder: [], motionMain: {}, motionReduced: {}, sheets: { media: [], fonts: [], hasReducedMotionRule: false, crossOrigin: [] }, opens: [], screenshot: { key: 'x.png', width: 1440, height: 900, cut: false, png: Buffer.alloc(0) }, submitAttempts: 0, submittedMarkers: 0, dialogs: [] }]),
      ),
    })),
  } as unknown as CaptureOutput;
}
