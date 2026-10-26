import type { Metadata } from 'next';
import { pageMeta } from '../../lib/meta';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { fill } from '@dse/schema/labels';
import { SiteNav } from '../../components/SiteNav';
import { CompareView } from '../../components/compare/CompareView';
import { meta } from '../../copy/strings';
import { clientDocument } from '../../lib/panel-doc';
import { runPayload } from '../../lib/server/runs';
import { services } from '../../lib/server/services';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(id: unknown) {
  if (typeof id !== 'string') return null;
  const run = await runPayload(services().db, id);
  return run && run.status === 'complete' ? clientDocument(run.document) : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const [a, b] = await Promise.all([load(sp.a), load(sp.b)]);
  const title = a && b && a.host !== b.host ? fill(meta.compare.titleTwo, { hostA: a.host ?? '', hostB: b.host ?? '' }) : fill(meta.compare.titleOne, { hostA: a?.host ?? '' });
  return pageMeta({ title, description: meta.compare.description, index: false });
}

export default async function ComparePage({ searchParams }: Props) {
  const sp = await searchParams;
  const [a, b] = await Promise.all([load(sp.a), load(sp.b)]);
  if (!a) notFound();
  const svc = services();
  const share = `${svc.appUrl}/compare?a=${a.id}${b ? `&b=${b.id}` : ''}`;
  return (
    <>
      <SiteNav />
      <Suspense>
        <CompareView a={a} b={b ?? undefined} shareUrl={share} />
      </Suspense>
    </>
  );
}
