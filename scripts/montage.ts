// Dev helper: screenshots side by side for review. tsx scripts/montage.ts <out.png> <height> <top> <a.png> <b.png> ...
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const [out, hs, ys, ...files] = process.argv.slice(2);
if (!out || !hs || !ys) throw new Error('usage: montage.ts <out.png> <height> <top> <a.png> ...');
const H = Number(hs), Y = Number(ys);
const imgs = files.map((f) => PNG.sync.read(readFileSync(f)));
const W = imgs.reduce((s, i) => s + i.width + 10, 0);
const dst = new PNG({ width: W, height: H });
dst.data.fill(128);
let x = 0;
for (const i of imgs) {
  const h = Math.max(0, Math.min(H, i.height - Y));
  if (h) PNG.bitblt(i, dst, 0, Y, i.width, h, x, 0);
  x += i.width + 10;
}
writeFileSync(out, PNG.sync.write(dst));
