import { defineConfig, devices } from '@playwright/test';

// Design QA, visual regression and axe. Pages and states come from tests/qa/pages.ts.
export default defineConfig({
  testDir: 'tests/qa',
  outputDir: 'test-results/qa',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'] },
  projects: [
    { name: 'design', testMatch: /design\.spec\.ts/ },
    { name: 'visual', testMatch: /visual\.spec\.ts/ },
    { name: 'axe', testMatch: /axe\.spec\.ts/ },
  ],
});
