import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    expect(p['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(p['font-src']).toEqual(["'self'"]);
    expect(JSON.stringify(p)).not.toContain(LOCAL_SERVE_ORIGIN);
  });

  it('is the policy docs/specs/preview-fidelity.md writes out, directive for directive', () => {
    const spec = readFileSync(resolve(import.meta.dirname, '../../../docs/specs/preview-fidelity.md'), 'utf8');
    const written = /per-request nonce: `([^`]+)`/.exec(spec)![1]!;
    const storage = 'https://xyz.supabase.co';
    expect(buildCsp({ nonce: 'abc123', storage: `${storage}/storage/v1/object/public/dse` })).toBe(written.replace('{nonce}', 'abc123').replaceAll('{storage}', storage));
  });

  it('adds the local serve origin on /open only', () => {
    const p = policy(buildCsp({ nonce: 'n', storage: 'http://localhost:9000/dse', openRoute: true }));
    expect(p['frame-src']).toEqual(["'self'", 'http://localhost:9000', LOCAL_SERVE_ORIGIN]);
    expect(p['img-src']).toEqual(["'self'", 'data:', 'http://localhost:9000', LOCAL_SERVE_ORIGIN]);
  });

  it('allows eval only in development, where React needs it for error stacks', () => {
    expect(policy(buildCsp({ nonce: 'n', storage: 'http://localhost:9000/dse', dev: true }))['script-src']).toEqual(["'self'", "'nonce-n'", "'unsafe-eval'"]);
    expect(policy(buildCsp({ nonce: 'n', storage: 'http://localhost:9000/dse' }))['script-src']).not.toContain("'unsafe-eval'");
  });
});
