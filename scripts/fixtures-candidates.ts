// Fixture authoring aid: every element candidate per page and viewport, with its rules, box and states.
// pnpm exec tsx scripts/fixtures-candidates.ts <site> [desktop|mobile]
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { LocalStorage, MemoryRunContext } from '@dse/pipeline/context';
import { launchBrowser } from '@dse/pipeline/crawl/browser';
import { ModelClient } from '@dse/pipeline/models/client';
import { runPipeline } from '@dse/pipeline/run';
import type { CaptureOutput } from '@dse/pipeline/stages/capture';

const site = process.argv[2] ?? 'clean';
const only = process.argv[3];
const dir = mkdtempSync(join(tmpdir(), 'dse-cand-'));
const url = `http://localhost:4100/sites/${site}/`;
const ctx = new MemoryRunContext('candidate0', { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: ['localhost:4100'], timeoutMs: 600000, keepIntermediate: false, byo: false }, new ModelClient({ mode: 'replay', recordingsDir: resolve(import.meta.dirname, '../fixtures/recordings') }), new LocalStorage(dir), { id: 'candidate0', url, host: 'localhost:4100', status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'] });
const browser = await launchBrowser();
let cap: CaptureOutput | null = null;
await runPipeline(ctx, { browser, through: 'capture', onCapture: (c) => (cap = c) });
await browser.close();
for (const pc of (cap as unknown as CaptureOutput).pages) {
  for (const vc of Object.values(pc.viewports)) {
    if (!vc || (only && vc.viewport !== only)) continue;
    console.log(`\n== ${pc.page.path} · ${vc.viewport} · ${vc.candidates.length} candidates`);
    for (const c of vc.candidates) {
      const e = vc.snapshot.byDse.get(c.dse)!;
      const states = (vc.states[c.dse] ?? []).map((s) => s.state).join(',');
      console.log(`${e.tag}${e.cls.length ? '.' + e.cls.slice(0, 3).join('.') : ''}`.padEnd(42), c.rules.join('+').padEnd(18), `${Math.round(e.x)},${Math.round(e.y)} ${Math.round(e.w)}x${Math.round(e.h)}`.padEnd(20), c.interactive ? 'I' : ' ', `"${e.text.slice(0, 28)}"`.padEnd(32), states);
    }
    for (const o of vc.opens) {
      const t = vc.snapshot.byDse.get(o.trigger);
      const r = o.snapshot.byDse.get(o.revealed)!;
      console.log(`  open: ${t?.tag}.${t?.cls[0]} → ${r.tag}.${r.cls[0] ?? ''} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)}`);
    }
  }
}
