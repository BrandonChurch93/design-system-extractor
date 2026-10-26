import { defineConfig } from 'vitest/config';

const shared = ['packages/*/test/**', 'apps/*/test/**', 'scripts/test/**'];

// Route handlers render JSX (the OG image); the app's tsconfig keeps JSX for Next, so tests compile it here.
const oxc = { jsx: { runtime: 'automatic' as const } };

export default defineConfig({
  test: {
    projects: [
      {
        oxc,
        test: {
          name: 'unit',
          include: shared.map((g) => `${g}/*.test.ts`),
          exclude: ['**/*.int.test.ts', '**/node_modules/**', 'apps/web/test/e2e/**'],
          environment: 'node',
          env: { DSE_MODEL_MODE: 'replay', NODE_ENV: 'test' },
          testTimeout: 30_000,
        },
      },
      {
        oxc,
        test: {
          name: 'integration',
          include: shared.map((g) => `${g}/*.int.test.ts`),
          exclude: ['**/node_modules/**'],
          environment: 'node',
          env: { DSE_MODEL_MODE: 'replay', NODE_ENV: 'test' },
          testTimeout: 180_000,
          hookTimeout: 180_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
