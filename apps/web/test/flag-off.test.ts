import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockAuthAdapter } from '../lib/auth/adapter';
import { MockBillingAdapter } from '../lib/billing/adapter';
import { resolveViewer } from '../lib/entitlements';
import { billingEnabled } from '../lib/flags';

// The flag-off test, configuration half (docs/specs/v2-seams.md, D-060). The rendered half,
// every page and state in a browser, is tests/e2e/flag-off.spec.ts.

const root = resolve(import.meta.dirname, '../../..');

async function nextEnv(billing: string | undefined) {
  vi.resetModules();
  vi.stubEnv('BILLING_ENABLED', billing as string);
  const config = (await import('../next.config')).default;
  return config.env?.NEXT_PUBLIC_BILLING_ENABLED;
}

function packageJsons(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) packageJsons(p, out);
    else if (name === 'package.json') out.push(p);
  }
  return out;
}

afterEach(() => vi.unstubAllEnvs());

describe('BILLING_ENABLED off', () => {
  it('derives the public flag from the server flag at build time, false unless exactly true', async () => {
    expect(await nextEnv('true')).toBe('true');
    expect(await nextEnv('false')).toBe('false');
    expect(await nextEnv('')).toBe('false');
    expect(await nextEnv('TRUE')).toBe('false');
  });

  it('is never set by hand: the public flag appears only in next.config and the flag module', () => {
    const env = readFileSync(join(root, '.env.example'), 'utf8');
    expect(env).not.toMatch(/^NEXT_PUBLIC_BILLING_ENABLED=/m);
    expect(env).toMatch(/^BILLING_ENABLED=false$/m);
    const web = resolve(import.meta.dirname, '..');
    const readers: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name.startsWith('.') || name === 'test') continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx|mjs)$/.test(name) && readFileSync(p, 'utf8').includes('NEXT_PUBLIC_BILLING_ENABLED')) readers.push(p.slice(web.length + 1));
      }
    };
    walk(web);
    expect(readers.sort()).toEqual(['lib/flags.ts', 'next.config.ts']);
  });

  it('reads off in the app when the public flag is not true', () => {
    vi.stubEnv('NEXT_PUBLIC_BILLING_ENABLED', 'false');
    expect(billingEnabled()).toBe(false);
    vi.stubEnv('NEXT_PUBLIC_BILLING_ENABLED', 'true');
    expect(billingEnabled()).toBe(true);
  });

  it('resolves every viewer as a free visitor with no user', () => {
    const v = resolveViewer(new Request('http://x/', { headers: { cookie: 'dse_v=abc', 'x-forwarded-for': '1.2.3.4' } }), Buffer.alloc(32, 7).toString('base64'));
    expect(v.userId).toBeNull();
    expect(v.plan).toBe('free');
  });

  it('ships mocks: no session, sign-in only says it is off, checkout and portal go nowhere', async () => {
    const a = new MockAuthAdapter();
    expect(await a.getSession()).toBeNull();
    expect(await a.signInWithEmail()).toEqual({ ok: false, notice: 'Sign-in is not enabled yet.' });
    expect(await a.signInWithGitHub()).toEqual({ ok: false, notice: 'Sign-in is not enabled yet.' });
    const b = new MockBillingAdapter();
    expect(await b.createCheckout()).toBe('#');
    expect(await b.createPortal()).toBe('#');
    expect(await b.getSubscription()).toBeNull();
    expect(await b.handleWebhook()).toEqual([]);
  });

  it('has no auth or payment dependency in any package.json', () => {
    const banned = /^(stripe|@stripe\/|@supabase\/|next-auth|@auth\/|@clerk\/|lucia|@lucia-auth\/|@paddle\/|@lemonsqueezy\/|braintree|@paypal\/|firebase|@auth0\/|passport)/;
    const files = packageJsons(root);
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const pkg = JSON.parse(readFileSync(f, 'utf8'));
      const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies });
      expect(deps.filter((d) => banned.test(d)), f).toEqual([]);
    }
  });

  it('answers /account/billing with a 404', async () => {
    vi.stubEnv('NEXT_PUBLIC_BILLING_ENABLED', 'false');
    const page = (await import('../app/account/billing/page')).default;
    await expect(page()).rejects.toMatchObject({ digest: expect.stringMatching(/404/) });
  });
});
