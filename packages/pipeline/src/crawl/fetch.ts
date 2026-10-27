import { lookup as dnsLookup } from 'node:dns';
import { Agent, fetch as undiciFetch, type Response } from 'undici';
import { isPrivateAddress, validateUrlShape } from '../net/private-ranges';
import { classifyNetworkError, type NetworkFailure } from './blocked';
import type { Throttle } from './throttle';

export type FetchOk = { ok: true; status: number; url: string; contentType: string; body: Buffer; redirects: string[]; allowOrigin?: string };
export type FetchFail = { ok: false; error: 'private-address' | 'invalid-url' | 'network' | 'too-many-redirects'; detail: string; network?: NetworkFailure };
export type FetchResult = FetchOk | FetchFail;

export type FetchOptions = {
  userAgent: string;
  allow: string[];
  throttle?: Throttle;
  timeoutMs?: number;
  maxBytes?: number;
  /** Sent as `Origin`, so a server that grants cross-origin use says so in `allowOrigin`. */
  origin?: string;
  /** Backoff before each retry on network errors; never on an HTTP status. */
  retryDelays?: number[];
  sleep?: (ms: number) => Promise<void>;
};

/** A connection-time DNS lookup that refuses private addresses, so a check cannot be raced. */
function safeLookup(allowedHosts: Set<string>) {
  return (hostname: string, options: object, callback: (err: NodeJS.ErrnoException | null, address: string | { address: string; family: number }[], family?: number) => void) => {
    dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err, []);
      const list = addresses as unknown as { address: string; family: number }[];
      if (!allowedHosts.has(hostname.toLowerCase())) {
        const bad = list.find((a) => isPrivateAddress(a.address));
        if (bad) {
          const e = new Error(`resolves to private address ${bad.address}`) as NodeJS.ErrnoException;
          e.code = 'EPRIVATE';
          return callback(e, []);
        }
      }
      if ((options as { all?: boolean }).all) callback(null, list);
      else callback(null, list[0]!.address, list[0]!.family);
    });
  };
}

const agents = new Map<string, Agent>();
function agentFor(allow: string[]): Agent {
  const key = allow.join(',');
  let a = agents.get(key);
  if (!a) {
    const hosts = new Set(allow.map((h) => h.split(':')[0]!.toLowerCase()));
    a = new Agent({ connect: { lookup: safeLookup(hosts) as never, timeout: 10_000 }, headersTimeout: 20_000, bodyTimeout: 20_000 });
    agents.set(key, a);
  }
  return a;
}

/**
 * Fetches a URL as the crawler: honest user agent, politeness, at most 5 redirects with every
 * hop re-validated, retries with backoff on network errors only, and a size cap.
 */
export async function guardedFetch(raw: string, opts: FetchOptions): Promise<FetchResult> {
  const delays = opts.retryDelays ?? [1000, 3000, 8000];
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  let lastError: FetchFail | null = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    if (attempt > 0) await sleep(delays[attempt - 1]!);
    const r = await fetchOnce(raw, opts);
    if (r.ok || r.error !== 'network') return r;
    lastError = r;
  }
  return lastError!;
}

async function fetchOnce(raw: string, opts: FetchOptions): Promise<FetchResult> {
  const redirects: string[] = [];
  let current = raw;
  for (let hop = 0; hop <= 5; hop++) {
    const shape = validateUrlShape(current, opts.allow);
    if (!shape.ok) return { ok: false, error: shape.reason, detail: shape.detail };
    const url = shape.url;
    const doFetch = () =>
      undiciFetch(url, {
        redirect: 'manual',
        headers: { 'user-agent': opts.userAgent, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', ...(opts.origin ? { origin: opts.origin } : {}) },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
        dispatcher: agentFor(opts.allow),
      });
    let res: Response;
    try {
      res = opts.throttle ? await opts.throttle.run(url.host, doFetch) : await doFetch();
    } catch (e) {
      const err = e as Error & { cause?: { code?: string; message?: string } };
      const msg = `${err.message} ${err.cause?.code ?? ''} ${err.cause?.message ?? ''}`;
      if (/EPRIVATE|private address/.test(msg)) return { ok: false, error: 'private-address', detail: err.cause?.message ?? 'private address' };
      return { ok: false, error: 'network', detail: msg.trim().slice(0, 200), network: classifyNetworkError(msg) };
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      redirects.push(url.toString());
      current = new URL(res.headers.get('location')!, url).toString();
      await res.body?.cancel();
      continue;
    }
    const max = opts.maxBytes ?? 5_000_000;
    const chunks: Buffer[] = [];
    let size = 0;
    if (res.body) {
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        size += chunk.byteLength;
        if (size > max) break;
        chunks.push(Buffer.from(chunk));
      }
    }
    const allowOrigin = res.headers.get('access-control-allow-origin') ?? undefined;
    return { ok: true, status: res.status, url: url.toString(), contentType: res.headers.get('content-type') ?? '', body: Buffer.concat(chunks), redirects, ...(allowOrigin ? { allowOrigin } : {}) };
  }
  return { ok: false, error: 'too-many-redirects', detail: 'more than 5 redirects' };
}
