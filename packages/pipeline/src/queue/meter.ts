import type { BudgetMeter, MeterDecision } from '../models/meter';
import type { RunCounters } from './counters';

/** The Redis half of `BudgetMeter`: every call's cost goes into today's spend (docs/specs/model-calls.md). */
export class RedisBudgetMeter implements BudgetMeter {
  constructor(private readonly counters: RunCounters) {}

  async allowLive(): Promise<MeterDecision> {
    return { ok: true };
  }

  async add(usd: number): Promise<void> {
    await this.counters.addSpend(usd);
  }
}

/** Every meter must allow a call, and every meter records it. */
export class CompositeMeter implements BudgetMeter {
  constructor(private readonly meters: BudgetMeter[]) {}

  async allowLive(): Promise<MeterDecision> {
    for (const m of this.meters) {
      const d = await m.allowLive();
      if (!d.ok) return d;
    }
    return { ok: true };
  }

  async add(usd: number, purpose: string): Promise<void> {
    for (const m of this.meters) await m.add(usd, purpose);
  }
}
