// Renders a run's stored previews beside their reference crops, for review and for the live-rate
// investigation (docs/specs/preview-fidelity.md, Why previews fall back, measured).
// pnpm exec tsx scripts/previews-inspect.ts <fixture | run folder> <outDir> [--captured] [name filter]
// A fixture reads `.dse/evals/{fixture}` (after pnpm evals --through previews); a run folder is one
// `pnpm pipeline:run` wrote (`.dse/runs/{id}`). The out folder gets PNGs and an index.html sheet.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { RunDocumentPartial } from '@dse/schema';
import { launchBrowser } from '@dse/pipeline/crawl/browser';
import { diffPercent, openRenderSession, renderPreview } from '@dse/pipeline/previews/render';
import { cropShot } from '@dse/pipeline/components/crop';
import { keys } from '@dse/pipeline/storage/keys';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { startStorageServer } from './storage-serve';

const args = process.argv.slice(2);
const capturedOnly = args.includes('--captured');
const [target = 'clean', out = '.dse/inspect', filter = ''] = args.filter((a) => !a.startsWith('--'));
const runDir = existsSync(join(target, 'run.json')) ? resolve(target) : null;
const root = runDir ? resolve(runDir, '..') : resolve(import.meta.dirname, '../.dse/evals');
const folder = runDir ? runDir.split('/').pop()! : target;
const doc = JSON.parse(readFileSync(join(root, folder, 'run.json'), 'utf8')) as RunDocumentPartial;
const server = await startStorageServer(root, 4401);
const base = `http://localhost:4401/${folder}`;
const browser = await launchBrowser();
const session = await openRenderSession(browser, base);
mkdirSync(out, { recursive: true });
const rows: string[] = [];
const img = (f: string) => (existsSync(join(out, f)) ? `<img src="${f}">` : '');
for (const c of doc.components ?? []) {
  if (filter && !c.name.toLowerCase().includes(filter.toLowerCase())) continue;
  if (capturedOnly && c.preview.mode === 'live') continue;
  const slug = `${c.id}-${c.name.toLowerCase().replace(/\W+/g, '-')}`.slice(0, 60);
  let diff = '';
  const cropPath = join(root, folder, c.preview.cropKey);
  if (existsSync(cropPath)) writeFileSync(join(out, `${slug}.captured.png`), readFileSync(cropPath));
  if (c.preview.htmlKey) {
    const f = c.provenance.firstSeen;
    const shot = await renderPreview(session, `${base}/${c.preview.htmlKey}`, { w: f.bbox.w, h: f.bbox.h });
    if (shot) writeFileSync(join(out, `${slug}.render.png`), shot);
    const page = doc.pages?.find((p) => p.id === f.pageId);
    const shotKey = keys.pageScreenshot(doc.id!, f.pageId, f.viewport);
    const fullPath = join(root, folder, shotKey);
    const ref = existsSync(fullPath) ? cropShot({ png: readFileSync(fullPath), width: page?.captures[f.viewport]?.width ?? 1440, height: page?.captures[f.viewport]?.height ?? 900 }, f.bbox) : null;
    if (ref) writeFileSync(join(out, `${slug}.reference.png`), ref);
    if (shot && ref) {
      const a = PNG.sync.read(shot);
      const b = PNG.sync.read(ref);
      const w = Math.min(a.width, b.width);
      const h = Math.min(a.height, b.height);
      const clip = (p: PNG) => {
        const o = new PNG({ width: w, height: h });
        PNG.bitblt(p, o, 0, 0, w, h, 0, 0);
        return o;
      };
      const d = new PNG({ width: w, height: h });
      pixelmatch(clip(a).data, clip(b).data, d.data, w, h, { threshold: 0.1, includeAA: false });
      writeFileSync(join(out, `${slug}.diff.png`), PNG.sync.write(d));
      diff = `${diffPercent(shot, ref).toFixed(1)} % · render ${a.width}×${a.height} · reference ${b.width}×${b.height}`;
    }
  }
  console.log([c.id, c.name, c.tier, c.preview.mode, c.preview.capturedReason ?? '', c.preview.diffPct ?? '', diff].join(' · '));
  rows.push(
    `<tr><td><b>${c.name}</b><br>${c.id} · ${c.type} · ${c.tier}<br>${c.preview.mode} ${c.preview.capturedReason ?? ''} ${c.preview.diffPct ?? ''}<br>${diff}<br><code>${c.provenance.firstSeen.selector.replace(/</g, '&lt;')}</code></td><td>${img(`${slug}.reference.png`) || img(`${slug}.captured.png`)}</td><td>${img(`${slug}.render.png`)}</td><td>${img(`${slug}.diff.png`)}</td></tr>`,
  );
}
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html><meta charset="utf-8"><style>body{font:12px system-ui;background:#888}td{vertical-align:top;padding:6px;background:#fff}img{max-width:420px;zoom:.5}</style><table><tr><th>Component</th><th>Reference</th><th>Render</th><th>Diff</th></tr>${rows.join('')}</table>`,
);
console.log('refused', session.refused);
await session.close();
await browser.close();
server.close();
