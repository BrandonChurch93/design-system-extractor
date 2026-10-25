import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type MeterDecision = { ok: true } | { ok: false; reason: string };

/** Spend control for live model calls. The file half (dev cap) is here; the Redis half is in P10. */
export interface BudgetMeter {
  /** May a live call be made now? */
  allowLive(): Promise<MeterDecision>;
  /** Records the cost of a call that was made. */
  add(usd: number, purpose: string): Promise<void>;
}

type DevSpendFile = { usedUsd: number; calls: number; updatedAt: string; byPurpose: Record<string, number> };

/**
 * The build-time cap (D-011, D-025): live calls stop at cap minus reserve, persisted in
 * `.dse/dev-spend.json` so it survives restarts. `useReserve` (set only for the final live eval)
 * lets spending continue to the full cap. Ignored in production, where only the daily budget applies.
 */
export class DevSpendMeter implements BudgetMeter {
  constructor(
    private readonly file: string,
    private readonly capUsd: number,
    private readonly reserveUsd: number,
    private readonly useReserve = false,
  ) {}

  static fromEnv(repoRoot: string, env: Record<string, string | undefined> = process.env): DevSpendMeter {
    return new DevSpendMeter(
      join(repoRoot, '.dse', 'dev-spend.json'),
      Number(env.DSE_DEV_SPEND_CAP_USD ?? 20),
      Number(env.DSE_DEV_SPEND_RESERVE_USD ?? 4),
      env.DSE_DEV_SPEND_USE_RESERVE === '1',
    );
  }

  read(): DevSpendFile {
    try {
      const raw = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<DevSpendFile>;
      return { usedUsd: Number(raw.usedUsd ?? 0), calls: Number(raw.calls ?? 0), updatedAt: raw.updatedAt ?? '', byPurpose: raw.byPurpose ?? {} };
    } catch {
      return { usedUsd: 0, calls: 0, updatedAt: '', byPurpose: {} };
    }
  }

  limit(): number {
    return this.useReserve ? this.capUsd : this.capUsd - this.reserveUsd;
  }

  async allowLive(): Promise<MeterDecision> {
    const used = this.read().usedUsd;
    if (used >= this.limit()) {
      return { ok: false, reason: `build spend $${used.toFixed(2)} reached ${this.useReserve ? 'the cap' : 'the cap minus the reserve'} ($${this.limit().toFixed(2)})` };
    }
    return { ok: true };
  }

  async add(usd: number, purpose: string): Promise<void> {
    const cur = this.read();
    const next: DevSpendFile = {
      usedUsd: Math.round((cur.usedUsd + usd) * 1e6) / 1e6,
      calls: cur.calls + 1,
      updatedAt: new Date().toISOString(),
      byPurpose: { ...cur.byPurpose, [purpose]: Math.round(((cur.byPurpose[purpose] ?? 0) + usd) * 1e6) / 1e6 },
    };
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(next, null, 2));
    renameSync(tmp, this.file);
  }
}

/** No limits: production before the Redis half exists, and BYO runs. */
export const openMeter: BudgetMeter = { allowLive: async () => ({ ok: true }), add: async () => {} };
