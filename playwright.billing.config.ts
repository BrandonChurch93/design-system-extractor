import { defineConfig, devices } from '@playwright/test';

// The flagged v2 surfaces in place: a production build with BILLING_ENABLED=true on 3101 (P12).
const port = Number(process.env.QA_BILLING_PORT ?? 3101);

export default defineConfig({
  testDir: 'tests/billing',
  outputDir: 'test-results/billing',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  timeout: 120_000,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${port}`,
    deviceScaleFactor: 1,
    launchOptions: { args: ['--disable-site-isolation-trials', '--disable-features=IsolateOrigins,site-per-process'] },
  },
  webServer: {
    command: 'node scripts/qa-server.mjs',
    url: `http://localhost:${port}/catalog`,
    reuseExistingServer: false,
    timeout: 600_000,
    env: { QA_PORT: String(port), QA_BILLING: 'on' },
  },
});
