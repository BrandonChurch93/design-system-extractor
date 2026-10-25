// Politeness (docs/specs/crawler.md): at most 2 requests in flight per run, at least 800 ms between
// navigations to the same host (longer when robots asks, up to 5 s).

export class Throttle {
  private last = new Map<string, number>();
  private chain = new Map<string, Promise<void>>();
  private inFlight = 0;
  private waiters: (() => void)[] = [];

  constructor(
    private intervalMs = 800,
    private readonly maxInFlight = 2,
    private readonly now: () => number = Date.now,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  setInterval(ms: number) {
    this.intervalMs = ms;
  }

  /** Runs `fn` once a slot is free and the host's interval has passed since its last start. */
  async run<T>(host: string, fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      const prev = this.chain.get(host) ?? Promise.resolve();
      let release!: () => void;
      const mine = new Promise<void>((r) => (release = r));
      this.chain.set(host, prev.then(() => mine));
      await prev;
      const wait = (this.last.get(host) ?? -Infinity) + this.intervalMs - this.now();
      if (wait > 0) await this.sleep(wait);
      this.last.set(host, this.now());
      release();
      return await fn();
    } finally {
      this.releaseSlot();
    }
  }

  private async acquire() {
    if (this.inFlight < this.maxInFlight) {
      this.inFlight++;
      return;
    }
    await new Promise<void>((r) => this.waiters.push(r));
    this.inFlight++;
  }

  private releaseSlot() {
    this.inFlight--;
    this.waiters.shift()?.();
  }
}
