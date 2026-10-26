// Authoring aid: renders a fixture run's stored previews next to their captured crops for review.
// pnpm exec tsx scripts/previews-inspect.ts <fixture> <outDir> [name filter]   (after pnpm evals --through previews)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { RunDocumentPartial } from '@dse/schema';
import { launchBrowser } from '@dse/pipeline/crawl/browser';
import { diffPercent, openRenderSession, renderPreview } from '@dse/pipeline/previews/render';
import { cropShot } from '@dse/pipeline/components/crop';
import { keys } from '@dse/pipeline/storage/keys';
import { PNG } from 'pngjs';
import { startStorageServer } from './storage-serve';

const [fixture = 'clean', out = '.dse/inspect', filter = ''] = process.argv.slice(2);
const root = resolve(import.meta.dirname, '../.dse/evals');
const doc = JSON.parse(readFileSync(join(root, fixture, 'run.json'), 'utf8')) as RunDocumentPartial;
const server = await startStorageServer(root, 4401);
const base = `http://localhost:4401/${fixture}`;
const browser = await launchBrowser();
const session = await openRenderSession(browser, base);
mkdirSync(out, { recursive: true });
for (const c of doc.components ?? []) {
  if (filter && !c.name.toLowerCase().includes(filter.toLowerCase())) continue;
  const slug = c.name.toLowerCase().replace(/\W+/g, '-');
  console.log(c.name, c.preview.mode, c.preview.capturedReason ?? '', c.preview.diffPct ?? '');
  const crop = readFileSync(join(root, fixture, c.preview.cropKey));
  writeFileSync(join(out, `${slug}.captured.png`), crop);
  if (c.preview.htmlKey) {
    const shot = await renderPreview(session, `${base}/${c.preview.htmlKey}`, { w: c.provenance.firstSeen.bbox.w, h: c.provenance.firstSeen.bbox.h });
    if (shot) writeFileSync(join(out, `${slug}.render.png`), shot);
    const f = c.provenance.firstSeen;
    const page = doc.pages?.find((p) => p.id === f.pageId);
    const shotKey = keys.pageScreenshot(doc.id!, f.pageId, f.viewport);
    const full = readFileSync(join(root, fixture, shotKey));
    const ref = cropShot({ png: full, width: page?.captures[f.viewport]?.width ?? 1440, height: page?.captures[f.viewport]?.height ?? 900 }, f.bbox);
    if (ref) writeFileSync(join(out, `${slug}.reference.png`), ref);
    if (shot && ref) {
      const a = PNG.sync.read(shot);
      const b = PNG.sync.read(ref);
      console.log('  render', a.width, a.height, 'reference', b.width, b.height, 'diff', diffPercent(shot, ref));
    }
  }
}
console.log('refused', session.refused);
await session.close();
await browser.close();
server.close();
