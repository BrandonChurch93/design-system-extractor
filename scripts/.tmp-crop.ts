import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const [a, out, x, y, w, h] = process.argv.slice(2).map((v, i) => (i < 2 ? v : +v)) as [string, string, number, number, number, number];
const src = PNG.sync.read(readFileSync(a));
const dst = new PNG({ width: w, height: h });
PNG.bitblt(src, dst, x, y, w, h, 0, 0);
writeFileSync(out, PNG.sync.write(dst));
