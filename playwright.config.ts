import { defineConfig, devices } from '@playwright/test';

// End-to-end tests against the app (production build on 3100) and, from P3, the fixture sites.
const port = Number(process.env.QA_PORT ?? 3100);

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/qa-server.mjs',
    url: `http://localhost:${port}/catalog`,
    reuseExistingServer: false,
    timeout: 600_000,
    env: { QA_PORT: String(port) },
  },
});
