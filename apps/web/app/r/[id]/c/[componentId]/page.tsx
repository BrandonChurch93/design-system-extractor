import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fill } from '@dse/schema/labels';
import { Button } from '../../../../../components/Button';
import { PageShell } from '../../../../../components/PageShell';
import { ComponentDetail } from '../../../../../components/panel/ComponentDetail';
import { global, meta, runPage } from '../../../../../copy/strings';
import { panelDocument } from '../../../../../lib/panel-doc';
import { runPayload } from '../../../../../lib/server/runs';
import { services } from '../../../../../lib/server/services';
import styles from './component.module.css';

type Props = { params: Promise<{ id: string; componentId: string }> };

async function load(id: string, componentId: string) {
  const run = await runPayload(services().db, id);
  if (!run || (run.status !== 'complete' && run.status !== 'blocked')) return null;
  const doc = panelDocument(run.document, componentId);
  return doc ? { run, doc, component: doc.components![0]! } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, componentId } = await params;
  const found = await load(id, componentId);
  if (!found) return { robots: { index: false } };
  const host = found.doc.host ?? '';
  return {
    title: fill(meta.component.title, { name: found.component.name, host }),
    description: fill(meta.component.description, { name: found.component.name, host }),
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: `/api/runs/${id}/og`, width: 1200, height: 630 }] },
  };
}

/** A component with a share link of its own: the panel's content as a page (D-007). */
export default async function ComponentPage({ params }: Props) {
  const { id, componentId } = await params;
  const found = await load(id, componentId);
  if (!found) notFound();
  const svc = services();
  const host = found.doc.host ?? '';
  return (
    <PageShell>
      <div className={styles.page}>
        <header className={styles.header} data-testid="chrome">
          <nav aria-label={global.breadcrumbLabel}>
            <ol className={styles.crumbs}>
              <li>
                <Link href={`/r/${id}`}>{host}</Link>
              </li>
              <li>
                <Link href={`/r/${id}#components`}>{runPage.components.heading}</Link>
              </li>
              <li>
                <span aria-current="page">{found.component.name}</span>
              </li>
            </ol>
          </nav>
          <h1 className={styles.title}>{found.component.name}</h1>
        </header>
        <ComponentDetail headingLevel={2} doc={found.doc} component={found.component} base={svc.env.STORAGE_PUBLIC_BASE_URL} runUrl={`${svc.appUrl}/r/${id}`} />
        <Button variant="ghost" href={`/r/${id}#components`} className={styles.back}>
          {global.backToComponents}
        </Button>
      </div>
    </PageShell>
  );
}
