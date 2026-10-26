import { unpublishRun } from '@dse/pipeline/db';
import { error, isAdmin, json } from '../../../../../../lib/server/http';
import { services } from '../../../../../../lib/server/services';

/** Removes a run from the showcase and hides its link (D-034). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const svc = services();
  if (!isAdmin(request, svc.adminToken)) return error(401, 'Not authorized.');
  const { id } = await ctx.params;
  if (!(await unpublishRun(svc.db, id))) return error(404, 'No run with that id.');
  return json({ id, unpublished: true });
}
