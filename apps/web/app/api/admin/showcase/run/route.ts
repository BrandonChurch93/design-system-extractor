import { AdminShowcaseRunBody } from '@dse/schema';
import { resolveViewer } from '../../../../../lib/entitlements';
import { error, isAdmin, json, VALIDATION_LINE } from '../../../../../lib/server/http';
import { admitRun } from '../../../../../lib/server/runs';
import { services } from '../../../../../lib/server/services';

/** Enqueues a roster site as a showcase run: the visitor's path with priority 10 and the budget bypass. */
export async function POST(request: Request): Promise<Response> {
  const svc = services();
  if (!isAdmin(request, svc.adminToken)) return error(401, 'Not authorized.');
  const parsed = AdminShowcaseRunBody.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return error(400, VALIDATION_LINE);
  const viewer = { ...resolveViewer(request, svc.encryptionKey), byoKey: false };
  const result = await admitRun(svc, { body: { url: parsed.data.url }, viewer, showcase: true });
  if (result.kind === 'invalid' || result.kind === 'rate-limited') return error(400, VALIDATION_LINE);
  return json(result.body);
}
