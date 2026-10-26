import { ExportFormat, ExportSet } from '@dse/schema';
import { isTerminal } from '@dse/pipeline/db';
import { allZip, generateExport } from '@dse/pipeline/exports';
import { error, NO_STORE, TERMINAL_CACHE } from '../../../../../../lib/server/http';
import { runPayload } from '../../../../../../lib/server/runs';
import { services } from '../../../../../../lib/server/services';

type Format = Exclude<ExportFormat, 'all.zip' | 'component-prompt.md'>;
const plain = ExportFormat.options.filter((f): f is Format => f !== 'all.zip' && f !== 'component-prompt.md');

export async function GET(request: Request, ctx: { params: Promise<{ id: string; format: string[] }> }): Promise<Response> {
  const { id, format } = await ctx.params;
  const set = ExportSet.safeParse(new URL(request.url).searchParams.get('set') ?? 'proposed');
  if (!set.success) return error(400, 'set is proposed or raw.');
  const svc = services();
  const run = await runPayload(svc.db, id);
  if (!run) return error(404, 'No run with that link.', { 'cache-control': NO_STORE });
  const doc = run.document;
  // Exports exist once a run has its tokens and components: complete, or a login wall's one page.
  if (!doc.tokens?.colors || !doc.components || !(run.status === 'complete' || run.status === 'blocked')) return error(409, 'This run has no exports yet.', { 'cache-control': NO_STORE });
  const opts = { set: set.data, runUrl: `${svc.appUrl}/r/${run.id}` };
  const headers = (type: string, filename: string) => ({ 'content-type': type, 'content-disposition': `attachment; filename="${filename}"`, 'cache-control': isTerminal(run.status) ? TERMINAL_CACHE : NO_STORE });
  const path = format.join('/');
  if (path === 'all.zip') {
    const bytes = await allZip(doc, opts, (k) => svc.storage.get(k));
    return new Response(Buffer.from(bytes), { headers: headers('application/zip', `${doc.host?.replace(/[^a-z0-9.-]/gi, '-') ?? 'run'}-${set.data}.zip`) });
  }
  const component = /^component\/([0-9a-z]{8})\/prompt\.md$/.exec(path);
  if (component) {
    if (!doc.components.some((c) => c.id === component[1])) return error(404, 'No component with that id.', { 'cache-control': NO_STORE });
    const file = generateExport(doc, 'component-prompt.md', { ...opts, componentId: component[1] });
    return new Response(file.body, { headers: headers(file.contentType, file.filename) });
  }
  const f = plain.find((x) => x === path);
  if (!f) return error(404, 'No export with that name.', { 'cache-control': NO_STORE });
  const file = generateExport(doc, f, opts);
  return new Response(file.body, { headers: headers(file.contentType, file.filename) });
}
