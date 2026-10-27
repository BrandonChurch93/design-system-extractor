import { DevSpendMeter } from '@dse/pipeline/models/meter';
import type { BudgetMeter } from '@dse/pipeline/models/meter';

/** The build's spend cap applies to development and test only; production ignores it (docs/specs/architecture.md, Environments). */
export function devMeterFor(env: Record<string, string | undefined>, root: string): BudgetMeter | undefined {
  return env.NODE_ENV === 'production' ? undefined : DevSpendMeter.fromEnv(root, env);
}
