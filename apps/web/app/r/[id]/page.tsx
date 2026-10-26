import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/meta';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { fill } from '@dse/schema/labels';
import { SiteNav } from '../../../components/SiteNav';
import { RunView } from '../../../components/run/RunView';
import { global, meta } from '../../../copy/strings';
import { count } from '../../../lib/format';
import { clientDocument } from '../../../lib/panel-doc';
import { runPayload } from '../../../lib/server/runs';
import { services } from '../../../lib/server/services';
import { stateRoute } from '../../../lib/submit-run';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const run = await runPayload(services().db, id);
  if (!run) return { robots: { index: false } };
  const d = run.document;
  // Counts exist once the run is complete; until then the page says what the product does (D-065).
  const description = run.status === 'complete' ? fill(meta.run.description, { colors: count(d.tokens?.colors?.length ?? 0), typeStyles: count(d.tokens?.type?.length ?? 0), components: count(d.components?.length ?? 0), host: d.host ?? '' }) : global.description;
  return pageMeta({ title: fill(meta.run.title, { host: d.host ?? '' }), description, image: `/api/runs/${run.id}/og`, index: run.isShowcase });
}

export default async function RunPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const svc = services();
  const run = await runPayload(svc.db, id);
  if (!run) notFound();
  const partial = sp.partial === '1';
  if (run.status === 'blocked' && !(run.document.blockedReason === 'login' && partial)) redirect(`/state/${stateRoute[run.document.blockedReason ?? 'unreachable']}?run=${run.id}`);
  return (
    <>
      <SiteNav />
      <Suspense>
        <RunView initial={{ ...run, document: clientDocument(run.document) }} storageBase={svc.env.STORAGE_PUBLIC_BASE_URL} appUrl={svc.appUrl} contactEmail={svc.env.DSE_CONTACT_EMAIL} partial={partial} />
      </Suspense>
    </>
  );
}
