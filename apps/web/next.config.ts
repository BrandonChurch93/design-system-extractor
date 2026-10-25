import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import { loadRootEnv } from './lib/load-root-env';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
loadRootEnv(repoRoot);

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // The repository's agent rules live in CLAUDE.md; Next would otherwise write AGENTS.md here.
  agentRules: false,
  outputFileTracingRoot: repoRoot,
  transpilePackages: ['@dse/schema', '@dse/pipeline'],
  env: {
    // Derived, never set by hand (docs/specs/v2-seams.md).
    NEXT_PUBLIC_BILLING_ENABLED: process.env.BILLING_ENABLED === 'true' ? 'true' : 'false',
  },
};

export default config;
