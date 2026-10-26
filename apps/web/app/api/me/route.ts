import { planLimits, type MeResponse } from '@dse/schema';
import { resolveViewer } from '../../../lib/entitlements';
import { json } from '../../../lib/server/http';
import { services } from '../../../lib/server/services';

/** The free allowance for this visitor. The key is never sent here; only the browser knows it has one. */
export async function GET(request: Request): Promise<Response> {
  const svc = services();
  const viewer = resolveViewer(request, svc.encryptionKey);
  const runsPerDay = planLimits(viewer.plan, svc.env).runsPerDay;
  const body: MeResponse = {
    runsLeft: await svc.counters.runsLeft(viewer.visitorId, viewer.ipHash, runsPerDay),
    runsPerDay,
    resetsAt: svc.counters.resetsAt().toISOString(),
  };
  return json(body, { headers: { 'cache-control': 'no-store' } });
}
