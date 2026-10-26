import { describe, expect, it } from 'vitest';
import { buildCsp, LOCAL_SERVE_ORIGIN } from '../lib/csp';

const policy = (csp: string) => Object.fromEntries(csp.split('; ').map((d) => [d.split(' ')[0], d.split(' ').slice(1)]));

describe('security · the app CSP', () => {
  it('allows scripts only by nonce and frames only from the app and the storage origin', () => {
    const p = policy(buildCsp({ nonce: 'abc123', storage: 'https://xyz.supabase.co/storage/v1/object/public/dse' }));
    expect(p['script-src']).toEqual(["'self'", "'nonce-abc123'"]);
    expect(p['frame-src']).toEqual(["'self'", 'https://xyz.supabase.co']);
    expect(p['img-src']).toEqual(["'self'", 'data:', 'https://xyz.supabase.co']);
    expect(p['connect-src']).toEqual(["'self'", 'https://xyz.supabase.co']);
    expect(p['default-src']).toEqual(["'self'"]);
    expect(p['frame-ancestors']).toEqual(["'self'"]);
    expect(p['base-uri']).toEqual(["'self'"]);
    expect(p['form-action']).toEqual(["'self'"]);
    expect(JSON.stringify(p)).not.toContain(LOCAL_SERVE_ORIGIN);
  });

  it('adds the local serve origin on /open only', () => {
    const p = policy(buildCsp({ nonce: 'n', storage: 'http://localhost:9000/dse', openRoute: true }));
    expect(p['frame-src']).toEqual(["'self'", 'http://localhost:9000', LOCAL_SERVE_ORIGIN]);
    expect(p['img-src']).toEqual(["'self'", 'data:', 'http://localhost:9000', LOCAL_SERVE_ORIGIN]);
  });
});
