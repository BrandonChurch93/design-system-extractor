import { isTerminal } from '@dse/pipeline/db';
import { error, NO_STORE, TERMINAL_CACHE, withEtag } from '../../../../lib/server/http';
import { runPayload } from '../../../../lib/server/runs';
import { services } from '../../../../lib/server/services';

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const body = await runPayload(services().db, id);
  if (!body) return error(404, 'No run with that link.', { 'cache-control': NO_STORE });
  return withEtag(request, body, isTerminal(body.status) ? TERMINAL_CACHE : NO_STORE);
}
