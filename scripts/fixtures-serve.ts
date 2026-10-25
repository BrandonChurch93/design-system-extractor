// Serves fixtures/ on port 4100: sites under /sites/{name}/, fonts under /fonts/.
// The full server (real 404 pages, robots.txt, sitemaps per fixture) is completed in P3.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../fixtures');
const port = Number(process.env.FIXTURES_PORT ?? 4100);
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
  let file = join(root, path);
  if (!file.startsWith(root)) {
    res.writeHead(400).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'access-control-allow-origin': '*' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`fixtures · http://localhost:${port}/sites/`));
