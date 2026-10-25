import { defineConfig } from 'vitest/config';

const shared = ['packages/*/test/**', 'apps/*/test/**', 'scripts/test/**'];

export default defineConfig({
  test: {
    projects: [
      {
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
