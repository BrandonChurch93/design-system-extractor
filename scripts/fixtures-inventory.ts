// Fixture authoring aid: every raw value the token rules collect from a fixture, with counts.
// pnpm exec tsx scripts/fixtures-inventory.ts <site>
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { LocalStorage, MemoryRunContext } from '@dse/pipeline/context';
import { colorsIn, deltaE, hexOf, rgbToOklab, oklabToOklch } from '@dse/pipeline/color/parse';
import { launchBrowser } from '@dse/pipeline/crawl/browser';
import { ModelClient } from '@dse/pipeline/models/client';
import { runPipeline } from '@dse/pipeline/run';
import type { CaptureOutput } from '@dse/pipeline/stages/capture';
import { collect } from '@dse/pipeline/tokens/collect';
import { sourcesFrom } from '@dse/pipeline/tokens/sources';

const site = process.argv[2] ?? 'clean';
const dir = mkdtempSync(join(tmpdir(), 'dse-inv-'));
const url = `http://localhost:4100/sites/${site}/`;
const ctx = new MemoryRunContext('inventory0', { url, include: [], pageCap: 12, viewports: ['desktop', 'mobile'], userAgent: 'DesignSystemExtractorBot/1.0', allowPrivateHosts: ['localhost:4100'], timeoutMs: 600000, keepIntermediate: false, byo: false }, new ModelClient({ mode: 'replay', recordingsDir: resolve(import.meta.dirname, '../fixtures/recordings') }), new LocalStorage(dir), { id: 'inventory0', url, host: 'localhost:4100', status: 'queued', createdAt: new Date().toISOString(), pipelineVersion: '1.0.0', viewports: ['desktop', 'mobile'] });
const browser = await launchBrowser();
let cap: CaptureOutput | null = null;
await runPipeline(ctx, { browser, through: 'capture', onCapture: (c) => (cap = c) });
await browser.close();
const raw = collect(sourcesFrom(cap as unknown as CaptureOutput));
const fmt = (m: Map<string, number>) => m.size;
console.log(`\n== colors (${raw.colors.size})`);
for (const c of [...raw.colors.values()].sort((a, b) => b.weight - a.weight)) {
  const o = oklabToOklch(rgbToOklab(c.rgba));
  console.log(c.hex.padEnd(10), `w${c.weight}`.padEnd(6), JSON.stringify(c.uses), `L${o.l.toFixed(3)} C${o.c.toFixed(3)} h${o.h.toFixed(0)}`, `pages ${fmt(c.pages)}`);
}
console.log(`\n== type (${raw.type.size})`);
for (const t of [...raw.type.values()].sort((a, b) => b.size - a.size || b.count - a.count)) console.log(`${t.family} ${t.size}/${t.lineHeight} ${t.weight} ls${t.letterSpacing}${t.textTransform ? ` ${t.textTransform}` : ''}`.padEnd(40), `n${t.count}`, [...t.tags.entries()].map(([k, v]) => `${k}:${v}`).join(' '), t.homeLargest ? 'HOME-LARGEST' : '', `"${t.sample.slice(0, 30)}"`);
// Clusters as token-clustering.md defines them, then the drift near-duplicate pairs (authoring check).
const clusters: { rep: (typeof raw.colors extends Map<string, infer V> ? V : never); members: string[] }[] = [];
for (const c of [...raw.colors.values()].sort((a, b) => b.weight - a.weight)) {
  const hit = clusters.find((k) => deltaE(k.rep.rgba, c.rgba) <= 2.3 && Math.abs(k.rep.rgba.a - c.rgba.a) <= 0.05);
  if (hit) hit.members.push(c.hex);
  else clusters.push({ rep: c, members: [c.hex] });
}
console.log(`\n== clusters (${clusters.length})`, clusters.filter((k) => k.members.length > 1).map((k) => k.members.join('+')).join(' · '));
for (let i = 0; i < clusters.length; i++) {
  for (let j = i + 1; j < clusters.length; j++) {
    const a = clusters[i]!.rep;
    const b = clusters[j]!.rep;
    if (Math.abs(a.rgba.a - b.rgba.a) > 0.05) continue;
    const ca = oklabToOklch(rgbToOklab(a.rgba)).c;
    const cb = oklabToOklch(rgbToOklab(b.rgba)).c;
    const d = deltaE(a.rgba, b.rgba);
    if (ca < 0.03 && cb < 0.03 && d <= 6) console.log('near neutral', a.hex, b.hex, d.toFixed(2));
    if (ca >= 0.03 && cb >= 0.03 && d <= 8) console.log('near chromatic', a.hex, b.hex, d.toFixed(2), `h${oklabToOklch(rgbToOklab(a.rgba)).h.toFixed(0)}/${oklabToOklch(rgbToOklab(b.rgba)).h.toFixed(0)}`);
  }
}
const totalSpace = [...raw.space.values()].reduce((s, v) => s + v.weight, 0);
console.log(`\n== spacing (total weight ${totalSpace})`);
for (const s of [...raw.space.values()].sort((a, b) => a.value - b.value)) console.log(`${s.value}`.padEnd(6), `w${s.weight}`.padEnd(6), `${((s.weight / totalSpace) * 100).toFixed(1)}%`.padEnd(7), JSON.stringify(s.contexts));
console.log('\n== radius'); for (const r of [...raw.radius.values()].sort((a, b) => a.value - b.value)) console.log(r.value, r.isPill ? 'pill' : '', `n${r.count}`);
console.log('\n== shadows'); for (const s of raw.shadows.values()) console.log(`n${s.count}`, `blur ${s.maxBlur}`, s.value);
console.log('\n== breakpoints'); console.log([...raw.breakpoints.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join(' '));
const where = process.argv.find((a) => a.startsWith('--where='))?.slice(8).split(',').map(Number) ?? [];
if (where.length) {
  console.log('\n== where');
  const seen = new Map<string, number>();
  for (const src of sourcesFrom(cap as unknown as CaptureOutput)) {
    for (const e of src.snapshot.elements) {
      if (!e.vis) continue;
      for (const prop of ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'row-gap', 'column-gap'] as const) {
        const v = Math.round(parseFloat(e.style[prop] ?? '0') * 2) / 2;
        if (where.includes(v)) { const k = `${v} ${prop} ${e.tag}.${e.cls.join('.')}`; seen.set(k, (seen.get(k) ?? 0) + 1); }
      }
    }
  }
  for (const [k, n] of [...seen.entries()].sort()) console.log(k, n);
}
const whereColor = process.argv.find((a) => a.startsWith('--color='))?.slice(8).split(',') ?? [];
if (whereColor.length) {
  console.log('\n== color where');
  const seen = new Map<string, number>();
  for (const src of sourcesFrom(cap as unknown as CaptureOutput)) {
    for (const e of src.snapshot.elements) {
      if (!e.vis) continue;
      for (const [prop, v] of Object.entries(e.style)) {
        for (const c of colorsIn(String(v))) {
          const hex = hexOf(c);
          if (whereColor.includes(hex)) { const k = `${hex} ${prop} ${e.tag}.${e.cls.join('.')}`; seen.set(k, (seen.get(k) ?? 0) + 1); }
        }
      }
    }
  }
  for (const [k, n] of [...seen.entries()].sort()) console.log(k, n);
}
console.log('\n== families', [...raw.families.entries()].map(([k, v]) => `${k}${v.loaded ? '' : ' (not loaded)'}`).join(', '), `· font decls ${raw.fontDecls}`);
