import { componentGroupLabels } from '@dse/schema/labels';
import { ComponentPanel } from '../../../../components/panel/ComponentPanel';
import { orderedComponents } from '../../../../lib/doc';
import { panelDocument } from '../../../../lib/panel-doc';
import { runPayload } from '../../../../lib/server/runs';
import { services } from '../../../../lib/server/services';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The panel slot: the component named by `?c=`, or nothing (docs/design/pages.md). */
export default async function Panel({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const cid = typeof sp.c === 'string' ? sp.c : undefined;
  if (!cid) return null;
  const svc = services();
  const run = await runPayload(svc.db, id);
  const doc = run ? panelDocument(run.document, cid) : null;
  const component = doc?.components?.[0];
  if (!run || !doc || !component) return null;
  const neighbors = orderedComponents(run.document, Object.keys(componentGroupLabels)).map((c) => ({ id: c.id, group: c.group }));
  return <ComponentPanel key={id} runId={id} doc={doc} component={component} neighbors={neighbors} base={svc.env.STORAGE_PUBLIC_BASE_URL} runUrl={`${svc.appUrl}/r/${id}`} />;
}
