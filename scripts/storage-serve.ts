// Serves a LocalStorage folder over HTTP, so previews load from a URL as they do from the storage
// origin in production (docs/specs/preview-fidelity.md). Used by evals and tests.
import { createReadStream, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { resolve, sep } from 'node:path';
import { contentTypeFor } from '@dse/pipeline/storage/keys';

export function startStorageServer(root: string, port: number): Promise<Server> {
  const base = resolve(root);
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    const file = resolve(base, `.${path}`);
    if (!file.startsWith(base + sep)) return void res.writeHead(403).end();
    try {
      if (!statSync(file).isFile()) throw new Error('not a file');
      res.writeHead(200, { 'content-type': contentTypeFor(file), 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}
