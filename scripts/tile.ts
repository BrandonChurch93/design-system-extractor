// Dev helper: cut a tall screenshot into tiles for review. tsx scripts/tile.ts <in.png> <outPrefix> [tileHeight]
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const [input, prefix, h = '1400'] = process.argv.slice(2);
if (!input || !prefix) throw new Error('usage: tile.ts <in.png> <outPrefix> [tileHeight]');
const src = PNG.sync.read(readFileSync(input));
const th = Number(h);
let n = 0;
for (let y = 0; y < src.height; y += th, n++) {
  const height = Math.min(th, src.height - y);
  const out = new PNG({ width: src.width, height });
  PNG.bitblt(src, out, 0, y, src.width, height, 0, 0);
  writeFileSync(`${prefix}-${String(n).padStart(2, '0')}.png`, PNG.sync.write(out));
}
console.log(`${n} tiles`);
