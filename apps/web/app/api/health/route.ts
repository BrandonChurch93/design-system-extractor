import type { HealthResponse } from '@dse/schema';
import { queueDepth } from '@dse/pipeline/db';
import { json } from '../../../lib/server/http';
import { services } from '../../../lib/server/services';

const ALIVE_UNDER_S = 45;

export async function GET(): Promise<Response> {
  const svc = services();
  try {
    const [age, depth, remaining] = await Promise.all([svc.counters.heartbeatAge(), queueDepth(svc.db), svc.counters.remainingUsd()]);
    const body: HealthResponse = {
      ok: true,
      worker: { alive: age !== null && age < ALIVE_UNDER_S, queueDepth: depth },
      budget: { remaining, resetsAt: svc.counters.resetsAt().toISOString() },
    };
    return json(body, { headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    console.error(JSON.stringify({ route: 'GET /api/health', error: (e as Error).message }));
    const body: HealthResponse = { ok: false, worker: { alive: false, queueDepth: 0 }, budget: { remaining: 0, resetsAt: svc.counters.resetsAt().toISOString() } };
    return json(body, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
