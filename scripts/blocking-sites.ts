// Sites that refuse the crawler, for tests and recordings: a bot challenge on `/bot/`, a login wall
// on `/walled/`. Bodies are the recorded ones the pipeline's blocked-state tests use.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { resolve } from 'node:path';

export const BLOCKING_SITES_PORT = 4198;

const recorded = (f: string) => readFileSync(resolve(import.meta.dirname, '../packages/pipeline/test/fixtures/blocked', f), 'utf8');

export function startBlockingSites(port = BLOCKING_SITES_PORT): Promise<Server> {
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', `http://localhost:${port}`).pathname;
    if (path === '/robots.txt') return void res.writeHead(200, { 'content-type': 'text/plain' }).end('User-agent: *\nAllow: /\n');
    if (path.startsWith('/bot')) return void res.writeHead(403, { 'content-type': 'text/html' }).end(recorded('cloudflare-403.html'));
    if (path === '/walled/login') return void res.writeHead(200, { 'content-type': 'text/html' }).end(recorded('login.html').replaceAll('href="/', 'href="/walled/'));
    if (path.startsWith('/walled')) return void res.writeHead(302, { location: `/walled/login?next=${encodeURIComponent(path)}` }).end();
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}
