import type { Metadata } from 'next';
import { pageMeta } from '../../lib/meta';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { Button } from '../../components/Button';
import { SiteNav } from '../../components/SiteNav';
import { StateCard } from '../../components/StateCard';
import { CompareView } from '../../components/compare/CompareView';
import { compare, meta } from '../../copy/strings';
import { runDate } from '../../lib/format';
import { clientDocument } from '../../lib/panel-doc';
import { runPayload, UnreadableRunError } from '../../lib/server/runs';
import { services } from '../../lib/server/services';
import { PageShell } from '../../components/PageShell';
import styles from '../state.module.css';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** A run Compare can show, or why it cannot (D-092): Compare never throws on a stored document. */
type Loaded = { ok: true; doc: RunDocumentPartial } | { ok: false; id: string; reason: string; host?: string };

async function load(id: unknown): Promise<Loaded | null> {
  if (typeof id !== 'string' || !id) return null;
  const u = compare.unavailable;
  try {
    const run = await runPayload(services().db, id);
    if (!run) return { ok: false, id, reason: fill(u.notFound, { id }) };
    const date = runDate(run.document.createdAt);
    if (run.status !== 'complete') return { ok: false, id, host: run.document.host, reason: fill(u.unfinished, { host: run.document.host, date }) };
    return { ok: true, doc: clientDocument(run.document) };
  } catch (e) {
    if (e instanceof UnreadableRunError) return { ok: false, id, host: e.host, reason: fill(u.unreadable, { host: e.host, date: runDate(e.createdAt) }) };
    throw e;
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const [a, b] = await Promise.all([load(sp.a), load(sp.b)]);
  const ha = a?.ok ? a.doc.host : (a?.host ?? '');
  const hb = b?.ok ? b.doc.host : b?.host;
  const title = hb && ha !== hb ? fill(meta.compare.titleTwo, { hostA: ha, hostB: hb }) : fill(meta.compare.titleOne, { hostA: ha });
  return pageMeta({ title, description: meta.compare.description, index: false });
}

export default async function ComparePage({ searchParams }: Props) {
  const sp = await searchParams;
  const [a, b] = await Promise.all([load(sp.a), load(sp.b)]);
  if (!a) notFound();
  const failed = [a, b].filter((x): x is Extract<Loaded, { ok: false }> => !!x && !x.ok);
  if (failed.length) {
    const open = [a, b].flatMap((x) => (!x ? [] : x.ok ? [{ id: x.doc.id, host: x.doc.host }] : x.host ? [{ id: x.id, host: x.host }] : []));
    return (
      <PageShell>
        <div className={styles.center}>
          <StateCard
            title={compare.unavailable.title}
            body={failed.map((f) => (
              <p key={f.id}>{f.reason}</p>
            ))}
            primary={
              open.length
                ? open.map((r) => (
                    <Button key={r.id} variant="ghost" href={`/r/${r.id}`}>
                      {fill(compare.unavailable.open, { host: r.host })}
                    </Button>
                  ))
                : undefined
            }
          />
        </div>
      </PageShell>
    );
  }
  const docA = (a as Extract<Loaded, { ok: true }>).doc;
  const docB = b?.ok ? b.doc : undefined;
  const svc = services();
  const share = `${svc.appUrl}/compare?a=${docA.id}${docB ? `&b=${docB.id}` : ''}`;
  return (
    <>
      <SiteNav />
      <Suspense>
        <CompareView a={docA} b={docB} shareUrl={share} />
      </Suspense>
    </>
  );
}
