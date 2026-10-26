import type { Browser } from 'playwright';
import { launchBrowser } from '@dse/pipeline/crawl/browser';

export const RESTART_EVERY_RUNS = 25;
export const RESTART_RSS_BYTES = 1.5 * 1024 ** 3;

/**
 * One Chromium for the worker, restarted every 25 runs or when the worker's memory passes 1.5 GB
 * (docs/specs/caps-and-budget.md, Memory). Each run gets its own context inside it.
 */
export class BrowserPool {
  private browser: Browser | null = null;
  private runs = 0;

  constructor(
    private readonly launch: () => Promise<Browser> = () => launchBrowser(),
    private readonly rss: () => number = () => process.memoryUsage().rss,
  ) {}

  async get(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await this.launch();
      this.runs = 0;
    }
    return this.browser;
  }

  /** Called after every run; returns true when the browser was restarted. */
  async afterRun(): Promise<boolean> {
    this.runs++;
    if (this.runs < RESTART_EVERY_RUNS && this.rss() <= RESTART_RSS_BYTES) return false;
    await this.close();
    return true;
  }

  get runsSinceLaunch(): number {
    return this.runs;
  }

  async close(): Promise<void> {
    const b = this.browser;
    this.browser = null;
    this.runs = 0;
    await b?.close().catch(() => {});
  }
}
