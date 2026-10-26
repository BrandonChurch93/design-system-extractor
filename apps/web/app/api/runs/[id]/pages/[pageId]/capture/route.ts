import { Viewport } from '@dse/schema';
import { isTerminal } from '@dse/pipeline/db';
import { error, TERMINAL_CACHE } from '../../../../../../../lib/server/http';
import { runPayload } from '../../../../../../../lib/server/runs';
import { services } from '../../../../../../../lib/server/services';

/** The full-page capture: a redirect to the stored image, which can be larger than a function may return. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string; pageId: string }> }): Promise<Response> {
  const { id, pageId } = await ctx.params;
  const viewport = Viewport.safeParse(new URL(request.url).searchParams.get('viewport') ?? 'desktop');
  if (!viewport.success) return error(400, 'viewport is desktop or mobile.');
  const svc = services();
  const run = await runPayload(svc.db, id);
  const capture = run?.document.pages?.find((p) => p.id === pageId)?.captures[viewport.data];
  if (!run || !capture) return error(404, 'No capture for that page.', { 'cache-control': 'no-store' });
  return new Response(null, { status: 302, headers: { location: svc.storage.publicUrl(capture.screenshotKey), 'cache-control': isTerminal(run.status) ? TERMINAL_CACHE : 'no-store' } });
}
