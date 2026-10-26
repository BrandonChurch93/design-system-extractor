import { resolveViewer } from '../../../../../lib/entitlements';
import { json } from '../../../../../lib/server/http';
import { cancelRun } from '../../../../../lib/server/runs';
import { services } from '../../../../../lib/server/services';

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const svc = services();
  const result = await cancelRun(svc, resolveViewer(request, svc.encryptionKey), id);
  return json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
}
