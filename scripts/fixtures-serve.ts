// Serves fixtures/ on port 4100 (docs/evals.md): sites under /sites/{name}/, fonts under /fonts/,
// robots.txt and a sitemap index at the host root (the crawler reads both at the root).
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../fixtures');
const sites = resolve(root, 'sites');
const port = Number(process.env.FIXTURES_PORT ?? 4100);
const origin = `http://localhost:${port}`;
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

function siteNames(): string[] {
  return readdirSync(sites).filter((n) => statSync(join(sites, n)).isDirectory());
}

function send(res: ServerResponse, status: number, type: string, body: string | Buffer) {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', origin);
  const path = normalize(decodeURIComponent(url.pathname));
  if (path === '/robots.txt') {
    return send(res, 200, types['.txt']!, `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  }
  if (path === '/sitemap.xml') {
    const entries = siteNames()
      .filter((n) => existsSync(join(sites, n, 'sitemap.xml')))
      .map((n) => `  <sitemap><loc>${origin}/sites/${n}/sitemap.xml</loc></sitemap>`)
      .join('\n');
    return send(res, 200, types['.xml']!, `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`);
  }
  let file = join(root, path);
  if (!file.startsWith(root)) return send(res, 400, types['.txt']!, 'Bad request');
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  else if (!existsSync(file) && !extname(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (existsSync(file)) {
    const ext = file.endsWith('.json.gz') ? '.gz' : extname(file);
    return send(res, 200, types[ext] ?? 'application/octet-stream', readFileSync(file));
  }
  const site = /^\/sites\/([^/]+)\//.exec(path)?.[1];
  const notFound = site ? join(sites, site, '404.html') : null;
  if (notFound && existsSync(notFound)) return send(res, 404, types['.html']!, readFileSync(notFound));
  return send(res, 404, types['.txt']!, 'Not found');
}

export function startFixtureServer(p = port) {
  const server = createServer(handle);
  return new Promise<typeof server>((ok) => server.listen(p, () => ok(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await startFixtureServer();
  console.log(`fixtures · ${origin}/sites/`);
}
