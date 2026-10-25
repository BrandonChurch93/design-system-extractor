// The private-address resolver and validator (docs/specs/caps-and-budget.md). Shared by the API's
// pre-check and the crawler, which repeats it before every navigation, on every redirect, and for
// every request the browser makes, so DNS rebinding cannot reach a private address.
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export type GuardResult =
  | { ok: true; url: URL; addresses: string[] }
  | { ok: false; reason: 'invalid-url' | 'private-address'; detail: string };

export type Resolver = (host: string) => Promise<string[]>;

export const systemResolver: Resolver = async (host) => (await lookup(host, { all: true, verbatim: true })).map((a) => a.address);

// IPv4 CIDR blocks that are never public.
const v4Blocks: [string, number][] = [
  ['0.0.0.0', 8], // this network, unspecified
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local, including 169.254.169.254
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24], // documentation
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved and broadcast
];

function v4ToInt(ip: string): number {
  return ip.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
}

export function isPrivateV4(ip: string): boolean {
  const n = v4ToInt(ip);
  return v4Blocks.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (v4ToInt(base) & mask);
  });
}

/** Expands an IPv6 address to eight 16-bit groups; an embedded IPv4 tail becomes two groups. */
export function expandV6(ip: string): number[] {
  let s = ip.toLowerCase().split('%')[0]!;
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (v4) {
    const n = v4ToInt(v4[1]!);
    s = s.slice(0, -v4[1]!.length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const [head, tail] = s.split('::') as [string, string | undefined];
  const h = head ? head.split(':') : [];
  const t = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const fill = tail !== undefined ? 8 - h.length - t.length : 0;
  const groups = [...h, ...Array(Math.max(0, fill)).fill('0'), ...t].map((g) => parseInt(g || '0', 16));
  if (groups.length !== 8 || groups.some((g) => Number.isNaN(g) || g < 0 || g > 0xffff)) throw new Error(`not an IPv6 address: ${ip}`);
  return groups;
}

export function isPrivateV6(ip: string): boolean {
  const g = expandV6(ip);
  const allZero = (from: number, to: number) => g.slice(from, to).every((x) => x === 0);
  const embeddedV4 = () => `${g[6]! >> 8}.${g[6]! & 0xff}.${g[7]! >> 8}.${g[7]! & 0xff}`;
  if (allZero(0, 8)) return true; // ::
  if (allZero(0, 7) && g[7] === 1) return true; // ::1
  if (allZero(0, 5) && g[5] === 0xffff) return isPrivateV4(embeddedV4()); // ::ffff:a.b.c.d
  if (allZero(0, 6)) return isPrivateV4(embeddedV4()); // deprecated ::a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b) return isPrivateV4(embeddedV4()); // NAT64 64:ff9b::/96
  if ((g[0]! & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local, including fd00:ec2::254
  if ((g[0]! & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0]! & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((g[0]! & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g[0] === 0x2001 && g[1] === 0xdb8) return true; // documentation
  if (g[0] === 0x100 && allZero(1, 4)) return true; // discard-only 100::/64
  return false;
}

export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateV4(ip);
  if (v === 6) return isPrivateV6(ip);
  return true;
}

const blockedHostnames = [/^localhost$/, /\.localhost$/, /\.local$/, /\.internal$/, /\.home\.arpa$/, /^metadata\.google\.internal$/];

function hostPort(url: URL): string {
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  return `${url.hostname.toLowerCase()}:${port}`;
}

/** Shape rules that need no DNS: scheme, length, credentials, port, hostname form. */
export function validateUrlShape(raw: string, allow: string[] = []): { ok: true; url: URL } | { ok: false; reason: 'invalid-url' | 'private-address'; detail: string } {
  if (raw.length > 2048) return { ok: false, reason: 'invalid-url', detail: 'longer than 2,048 characters' };
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: 'invalid-url', detail: 'not a URL' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, reason: 'invalid-url', detail: 'only http and https' };
  if (url.username || url.password) return { ok: false, reason: 'invalid-url', detail: 'credentials in the URL' };
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return { ok: false, reason: 'invalid-url', detail: 'no host' };
  const allowed = allow.includes(hostPort(url));
  if (allowed) return { ok: true, url };
  const port = url.port ? Number(url.port) : null;
  if (port !== null && port !== 80 && port !== 443) return { ok: false, reason: 'private-address', detail: `port ${port}` };
  if (isIP(host)) {
    return isPrivateAddress(host) ? { ok: false, reason: 'private-address', detail: `address ${host}` } : { ok: true, url };
  }
  if (blockedHostnames.some((r) => r.test(host))) return { ok: false, reason: 'private-address', detail: `host ${host}` };
  if (!host.includes('.') || host.endsWith('.')) return { ok: false, reason: 'invalid-url', detail: 'host has no domain' };
  if (!/^[a-z0-9.-]+$/.test(host) || host.split('.').some((l) => !l || l.length > 63 || l.startsWith('-') || l.endsWith('-'))) {
    return { ok: false, reason: 'invalid-url', detail: 'host is not a valid name' };
  }
  return { ok: true, url };
}

/**
 * The full check: shape, then every A and AAAA address of the host. Any private address fails,
 * so a name that resolves to both a public and a private address is refused.
 */
export async function checkTarget(raw: string, opts: { resolver?: Resolver; allow?: string[] } = {}): Promise<GuardResult> {
  const shape = validateUrlShape(raw, opts.allow ?? []);
  if (!shape.ok) return shape;
  const url = shape.url;
  if ((opts.allow ?? []).includes(hostPort(url))) return { ok: true, url, addresses: [] };
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) return { ok: true, url, addresses: [host] };
  let addresses: string[];
  try {
    addresses = await (opts.resolver ?? systemResolver)(host);
  } catch {
    return { ok: false, reason: 'invalid-url', detail: 'the host did not resolve' };
  }
  if (!addresses.length) return { ok: false, reason: 'invalid-url', detail: 'the host did not resolve' };
  const bad = addresses.find((a) => isPrivateAddress(a));
  if (bad) return { ok: false, reason: 'private-address', detail: `resolves to ${bad}` };
  return { ok: true, url, addresses };
}

/**
 * A per-run guard for the browser's requests: every host is resolved and checked, and resolved
 * again after `ttlMs`, so a host that rebinds to a private address mid-run is caught.
 */
export function createRequestGuard(opts: { resolver?: Resolver; allow?: string[]; ttlMs?: number } = {}) {
  const cache = new Map<string, { ok: boolean; at: number }>();
  const ttl = opts.ttlMs ?? 30_000;
  return async (raw: string): Promise<boolean> => {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return false;
    }
    if (url.protocol === 'data:' || url.protocol === 'blob:') return true;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const key = hostPort(url);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < ttl) return hit.ok;
    const r = await checkTarget(url.toString(), opts);
    cache.set(key, { ok: r.ok, at: Date.now() });
    return r.ok;
  };
}
