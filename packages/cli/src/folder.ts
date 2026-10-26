import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { Storage } from '@dse/pipeline/storage/storage';
import { contentTypeFor } from '@dse/pipeline/storage/keys';

// A run folder: run.json, exports/, screenshots/, components/ (docs/specs/exports-and-mcp.md). Storage
// keys map onto that layout, and the same mapping serves the folder over HTTP.

/** Where a storage key lives inside a run folder. */
export function localPath(key: string): string {
  const k = key.replace(/^\/+/, '');
  let m = /^runs\/[^/]+\/pages\/([^/]+)\/([a-z]+)\.png$/.exec(k);
  if (m) return `screenshots/${m[1]}-${m[2]}.png`;
  m = /^runs\/[^/]+\/pages\/([^/]+)\/([a-z]+)\.(snapshot|css)\.json\.gz$/.exec(k);
  if (m) return `.intermediate/${m[1]}-${m[2]}.${m[3]}.json.gz`;
  m = /^runs\/[^/]+\/(components|fonts)\/(.+)$/.exec(k);
  if (m) return `${m[1]}/${m[2]}`;
  m = /^runs\/[^/]+\/(.+)$/.exec(k);
  if (m) return `files/${m[1]}`;
  return `files/${k}`;
}

export class FolderStorage implements Storage {
  constructor(
    readonly root: string,
    private base = '',
  ) {
    mkdirSync(root, { recursive: true });
  }

  setBase(base: string) {
    this.base = base.replace(/\/$/, '');
  }

  private file(key: string): string {
    const f = resolve(this.root, localPath(key));
    if (!f.startsWith(resolve(this.root) + sep)) throw new Error(`key escapes the folder: ${key}`);
    return f;
  }

  async put(key: string, body: Buffer | Uint8Array | string): Promise<void> {
    const f = this.file(key);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, body);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return readFileSync(this.file(key));
    } catch {
      return null;
    }
  }

  /** Keys stay the document's keys; the server maps them back to files. */
  publicUrl(key: string): string {
    return `${this.base}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async delete(key: string): Promise<void> {
    rmSync(this.file(key), { force: true });
  }

  async list(prefix: string): Promise<string[]> {
    void prefix;
    return [];
  }

  async deletePrefix(prefix: string): Promise<number> {
    void prefix;
    rmSync(join(this.root, '.intermediate'), { recursive: true, force: true });
    return 0;
  }
}

/**
 * Serves a run folder: a document key (`runs/{id}/components/…`) is mapped to its file, any other path
 * is read from the folder as it is. CORS is open so `/open` can load crops and previews.
 */
export function serveFolder(root: string, port: number, host = '127.0.0.1'): Promise<Server> {
  const base = resolve(root);
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname).replace(/^\/+/, '');
    const rel = path.startsWith('runs/') ? localPath(path) : path || 'run.json';
    const file = resolve(base, rel);
    const headers = { 'access-control-allow-origin': '*', 'cache-control': 'no-store' };
    if (!file.startsWith(base + sep) || !existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404, headers).end();
    let type = 'application/octet-stream';
    try {
      type = contentTypeFor(file);
    } catch {
      // unknown extensions are served as bytes
    }
    res.writeHead(200, { ...headers, 'content-type': type });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(port, host, () => ok(server));
  });
}

export const relativeTo = (from: string, to: string) => relative(from, to) || '.';
