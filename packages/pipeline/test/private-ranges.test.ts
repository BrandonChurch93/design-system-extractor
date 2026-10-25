import { describe, expect, it } from 'vitest';
import { checkTarget, createRequestGuard, isPrivateAddress, validateUrlShape, type Resolver } from '../src/net/private-ranges';

describe('security · private address ranges', () => {
  const privateV4 = [
    '0.0.0.0',
    '10.0.0.1',
    '10.255.255.255',
    '100.64.0.1',
    '100.127.255.254',
    '127.0.0.1',
    '127.12.34.56',
    '169.254.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.8',
    '192.0.2.1',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.251',
    '239.255.255.250',
    '255.255.255.255',
  ];
  const publicV4 = ['1.1.1.1', '8.8.8.8', '93.184.216.34', '100.63.255.255', '100.128.0.1', '172.15.255.255', '172.32.0.1', '192.169.0.1', '11.0.0.1', '126.255.255.255'];
  const privateV6 = [
    '::',
    '::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
    '::ffff:169.254.169.254',
    '::ffff:7f00:1',
    '64:ff9b::a9fe:a9fe',
    '64:ff9b::10.1.2.3',
    'fc00::1',
    'fd00:ec2::254',
    'fdff:ffff::1',
    'fe80::1',
    'fe80::1%en0',
    'febf::1',
    'fec0::1',
    'ff02::1',
    '2001:db8::1',
    '100::1',
  ];
  const publicV6 = ['2606:4700:4700::1111', '2001:4860:4860::8888', '2a00:1450:4001:80b::200e', '::ffff:8.8.8.8', '64:ff9b::808:808'];

  it('rejects every private, loopback, link-local, carrier NAT, multicast and metadata IPv4 address', () => {
    for (const ip of privateV4) expect(isPrivateAddress(ip), ip).toBe(true);
  });

  it('accepts public IPv4 addresses at the edges of those ranges', () => {
    for (const ip of publicV4) expect(isPrivateAddress(ip), ip).toBe(false);
  });

  it('rejects private IPv6, including mapped and NAT64 forms of private IPv4', () => {
    for (const ip of privateV6) expect(isPrivateAddress(ip), ip).toBe(true);
  });

  it('accepts public IPv6, including mapped and NAT64 forms of public IPv4', () => {
    for (const ip of publicV6) expect(isPrivateAddress(ip), ip).toBe(false);
  });

  it('treats anything that is not an IP as unsafe', () => {
    expect(isPrivateAddress('example.com')).toBe(true);
  });
});

describe('security · URL validation', () => {
  const cases: [string, 'ok' | 'invalid-url' | 'private-address'][] = [
    ['https://tidewater.app/', 'ok'],
    ['http://tidewater.app/docs?x=1', 'ok'],
    ['https://tidewater.app:443/', 'ok'],
    ['ftp://tidewater.app/', 'invalid-url'],
    ['javascript:alert(1)', 'invalid-url'],
    ['tidewater.app', 'invalid-url'],
    ['https://user:pass@tidewater.app/', 'invalid-url'],
    ['https://tidewater/', 'invalid-url'],
    ['https://-bad-.com/', 'invalid-url'],
    [`https://tidewater.app/${'a'.repeat(2100)}`, 'invalid-url'],
    ['http://localhost/', 'private-address'],
    ['http://app.localhost/', 'private-address'],
    ['http://printer.local/', 'private-address'],
    ['http://db.internal/', 'private-address'],
    ['http://metadata.google.internal/', 'private-address'],
    ['http://127.0.0.1/', 'private-address'],
    ['http://[::1]/', 'private-address'],
    ['http://169.254.169.254/latest/meta-data/', 'private-address'],
    ['http://[fd00:ec2::254]/', 'private-address'],
    ['https://tidewater.app:8443/', 'private-address'],
    ['http://8.8.8.8/', 'ok'],
  ];

  it('classifies each URL by shape alone', () => {
    for (const [url, want] of cases) {
      const r = validateUrlShape(url);
      expect(r.ok ? 'ok' : r.reason, url).toBe(want);
    }
  });

  it('lets through only the exact host and port in the allowance', () => {
    const allow = ['localhost:4100', 'localhost:4300'];
    expect(validateUrlShape('http://localhost:4100/sites/clean/', allow).ok).toBe(true);
    expect(validateUrlShape('http://localhost:4300/', allow).ok).toBe(true);
    expect(validateUrlShape('http://localhost:4101/', allow).ok).toBe(false);
    expect(validateUrlShape('http://localhost/', allow).ok).toBe(false);
    expect(validateUrlShape('http://127.0.0.1:4100/', allow).ok).toBe(false);
  });
});

describe('security · DNS resolution and rebinding', () => {
  const table: Record<string, string[]> = {
    'public.example.com': ['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946'],
    'sneaky.example.com': ['93.184.216.34', '10.0.0.5'],
    'v6only.example.com': ['fd12::1'],
    'mapped.example.com': ['::ffff:192.168.0.10'],
  };
  const resolver: Resolver = async (h) => {
    const r = table[h];
    if (!r) throw new Error('ENOTFOUND');
    return r;
  };

  it('accepts a host whose every address is public', async () => {
    const r = await checkTarget('https://public.example.com/', { resolver });
    expect(r.ok).toBe(true);
  });

  it('refuses a host if any of its addresses is private', async () => {
    for (const host of ['sneaky.example.com', 'v6only.example.com', 'mapped.example.com']) {
      const r = await checkTarget(`https://${host}/`, { resolver });
      expect(r.ok ? 'ok' : r.reason, host).toBe('private-address');
    }
  });

  it('reports an unresolvable host as an invalid address', async () => {
    const r = await checkTarget('https://nowhere.example.com/', { resolver });
    expect(r).toMatchObject({ ok: false, reason: 'invalid-url' });
  });

  it('catches a public name that resolves privately on a later lookup', async () => {
    let calls = 0;
    const rebinding: Resolver = async () => (++calls === 1 ? ['93.184.216.34'] : ['127.0.0.1']);
    const guard = createRequestGuard({ resolver: rebinding, ttlMs: 0 });
    expect(await guard('https://rebind.example.com/')).toBe(true);
    expect(await guard('https://rebind.example.com/next')).toBe(false);
  });

  it('blocks the browser from reaching private addresses and odd schemes', async () => {
    const guard = createRequestGuard({ resolver, allow: ['localhost:4100'] });
    expect(await guard('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(await guard('http://[::1]:3000/')).toBe(false);
    expect(await guard('file:///etc/passwd')).toBe(false);
    expect(await guard('data:image/png;base64,iVBOR')).toBe(true);
    expect(await guard('http://localhost:4100/fonts/inter/inter.css')).toBe(true);
    expect(await guard('https://public.example.com/app.css')).toBe(true);
  });
});
