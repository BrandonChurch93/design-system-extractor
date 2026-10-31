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
  // Every reader gets the full head: link previews in chat apps and audits read the run's title and description.
  htmlLimitedBots: /.*/,
  // The repository's agent rules live in CLAUDE.md; Next would otherwise write AGENTS.md here.
  agentRules: false,
  // QA builds the flag-on app into a folder of its own (scripts/qa-server.mjs).
  distDir: process.env.DSE_NEXT_DIST || '.next',
  outputFileTracingRoot: repoRoot,
  transpilePackages: ['@dse/schema', '@dse/pipeline'],
  // Font file names carry their content hash, so a browser may keep them for good.
  headers: async () => [{ source: '/fonts/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }],
  env: {
    // Derived, never set by hand (docs/specs/v2-seams.md).
    NEXT_PUBLIC_BILLING_ENABLED: process.env.BILLING_ENABLED === 'true' ? 'true' : 'false',
  },
};

export default config;
