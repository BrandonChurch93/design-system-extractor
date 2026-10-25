import { defineConfig, devices } from '@playwright/test';

// End-to-end tests against the fixture sites and the app.
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
});
