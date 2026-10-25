import { defineConfig, devices } from '@playwright/test';

// Design QA, visual regression and axe against a production build served on 3100.
const port = Number(process.env.QA_PORT ?? 3100);

export default defineConfig({
  testDir: 'tests/qa',
  outputDir: 'test-results/qa',
  snapshotPathTemplate: 'apps/web/test/goldens/{arg}{ext}',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  timeout: 120_000,
  reporter: [['list']],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001, threshold: 0.2 } },
  // Sandboxed preview frames are cross-origin; without site isolation they render in-process,
  // so full-page captures include them.
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
    env: { QA_PORT: String(port) },
  },
  projects: [
    { name: 'design', testMatch: /design\.spec\.ts/ },
    { name: 'visual', testMatch: /visual\.spec\.ts/ },
    { name: 'axe', testMatch: /axe\.spec\.ts/ },
  ],
});
