'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { componentsPassing, type Component, type RunEvent, type RunResponse } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { global, runPage, statePages } from '../../copy/strings';
import { count, cost as formatCost } from '../../lib/format';
import { isRecent, updateRecent } from '../../lib/browser-store';
import { paletteOf } from '../../lib/palette';
import { breadcrumb, completeMeta, landed as landedOf, progressMeta, rail, terminal } from '../../lib/run-view';
import { stateRoute } from '../../lib/state-route';
import { Button } from '../Button';
import { Footer } from '../Footer';
import { LiveLog, type LogLine } from '../LiveLog';
import { SectionNav } from '../SectionNav';
import { StateCard } from '../StateCard';
import { ChecksSection } from './ChecksSection';
import { ComponentsSection } from './ComponentsSection';
import { DriftHeadline } from './DriftHeadline';
import { DriftSection } from './DriftSection';
import { MotionSection } from './MotionSection';
import { ExportsSection, type ExportSource } from './ExportsSection';
import { PagesCard } from './PagesCard';
import { PaletteRow } from './PaletteRow';
import { RunHeader } from './RunHeader';
import { StageRail } from './StageRail';
import { StatStrip, runStats } from './StatStrip';
import { TokensSection } from './TokensSection';
import { storedBefore } from '../../lib/version';
import { PreviewInert } from '../FitPreview';
import styles from './RunView.module.css';

export const POLL_MS = 1500;
const sections = [
  { id: 'tokens', label: runPage.sectionNav.tokens },
  { id: 'motion', label: runPage.sectionNav.motion },
  { id: 'components', label: runPage.sectionNav.components },
  { id: 'checks', label: runPage.sectionNav.checks },
  { id: 'drift', label: runPage.sectionNav.drift },
  { id: 'exports', label: runPage.sectionNav.exports },
];

type Props = {
  initial: RunResponse;
  storageBase?: string;
  appUrl: string;
  contactEmail?: string;
  /** `?partial=1`: a login wall's one page shown complete (docs/design/pages.md). */
  partial?: boolean;
  /** A run.json opened in the browser (/open): no server, no polling. */
  local?: boolean;
  onOpenComponent?: (id: string) => void;
};

function LiveMeta({ run }: { run: RunResponse }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span data-qa-mask="elapsed">{progressMeta(run.document, run.events, run.status, now, run.queuePosition)}</span>;
}

const logLines = (events: RunEvent[]): LogLine[] => events.map((e) => ({ id: e.id, ts: e.ts, text: e.message, level: e.level }));

/** The run page, both faces: the in-progress page filling stage by stage, and the complete page. */
/** A template with its run id set in mono (docs/design/copy.md, rule 11). */
/** The footer's live-rate line (copy.md, D-095). */
export function liveRate(comps: Pick<Component, 'preview'>[]): string {
  const live = comps.filter((c) => c.preview.mode === 'live').length;
  return fill(runPage.liveRate, { live: count(live), total: count(comps.length), captured: count(comps.length - live) });
}

function withRunId(template: string, id: string) {
  const [before, after = ''] = template.split('{id}');
  // One inline element: a body that lays out its children as rows keeps the sentence on one line.
  return (
    <span>
      {before}
      <span className={styles.runId}>{id}</span>
      {after}
    </span>
  );
}

export function RunView({ initial, storageBase, appUrl, contactEmail, partial, local, onOpenComponent }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [run, setRun] = useState(initial);
  const [showLog, setShowLog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const etag = useRef<string | null>(null);
  const doc = run.document;
  const id = run.id;
  const shareUrl = `${appUrl}/r/${id}`;
  const done = terminal(run.status);
  const loginPartial = run.status === 'blocked' && doc.blockedReason === 'login' && (partial || local);
  const regions = useMemo(() => landedOf(doc, run.events, run.status), [doc, run.events, run.status]);
  const rings = useMemo(() => rail(doc, run.events, run.status), [doc, run.events, run.status]);

  // Read after hydration: the server cannot know this browser's list.
  const inRecent = useSyncExternalStore(
    () => () => {},
    () => !local && isRecent(id),
    () => false,
  );

  const finish = useCallback(
    (next: RunResponse) => {
      if (next.status === 'blocked' && !(next.document.blockedReason === 'login' && partial)) {
        router.replace(`/state/${stateRoute[next.document.blockedReason ?? 'unreachable']}?run=${next.id}`);
        return;
      }
      updateRecent(next.id, { status: next.status, stats: next.document.stats ?? null, palette: paletteOf(next.document), blockedReason: next.document.blockedReason });
    },
    [partial, router],
  );

  useEffect(() => {
    if (local || done) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/runs/${id}`, { cache: 'no-store', headers: etag.current ? { 'if-none-match': etag.current } : {}, signal: AbortSignal.timeout(10_000) });
        if (stop || res.status === 304 || !res.ok) return;
        etag.current = res.headers.get('etag');
        const next = (await res.json()) as RunResponse;
        if (stop) return;
        setRun(next);
        if (terminal(next.status)) finish(next);
        else updateRecent(next.id, { status: next.status });
      } catch {
        // A missed poll is retried on the next tick.
      }
    };
    const t = setInterval(tick, POLL_MS);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [id, done, local, finish]);

  async function cancel() {
    setCancelling(true);
    try {
      await fetch(`/api/runs/${id}/cancel`, { method: 'POST', signal: AbortSignal.timeout(10_000) }).catch(() => null);
    } finally {
      setCancelling(false);
    }
  }

  const crumbs = breadcrumb(doc.host ?? '', { isShowcase: run.isShowcase, inRecent, local });
  const ended = run.status === 'failed' || run.status === 'cancelled';
  const mode = ended ? 'ended' : done || local || loginPartial ? 'complete' : 'progress';
  const meta = mode === 'progress' ? <LiveMeta run={run} /> : completeMeta(doc);
  const stats = runStats({
    colors: regions.palette ? doc.tokens?.colors?.length : undefined,
    typeStyles: regions.type ? doc.tokens?.type?.length : undefined,
    spacingSteps: regions.spacing ? doc.tokens?.space?.filter((s) => s.onGrid).length : undefined,
    components: regions.components ? doc.components?.length : undefined,
    checksPassed: regions.checks ? doc.checks?.summary.passed : undefined,
    checksApplicable: regions.checks ? doc.checks?.summary.applicable : undefined,
    componentsPassing: regions.checks && doc.components ? componentsPassing(doc.components) : undefined,
  });
  const source: ExportSource = local ? { kind: 'local', storageBase } : { kind: 'api', runId: id };
  const hrefFor = useCallback((cid: string) => `/r/${id}?c=${cid}`, [id]);

  const footer = ended ? undefined : mode === 'progress' ? (
    <>
      <p>{runPage.footer.leave}</p>
      <p>{fill(runPage.footer.shareReady, { url: shareUrl })}</p>
    </>
  ) : local ? undefined : (
    <>
      <p>
        {withRunId(runPage.footer.cost.replace('{cost}', formatCost(doc.cost?.usd ?? 0)).replace(` · ${runPage.footer.howItWorks}`, ' · '), id)}
        <Link href="/how-it-works" className={styles.footerLink}>
          {runPage.footer.howItWorks}
        </Link>
      </p>
      <p>{fill(runPage.footer.share, { url: shareUrl })}</p>
      {doc.components?.length ? <p data-testid="live-rate">{liveRate(doc.components)}</p> : null}
      <p>
        {contactEmail ? (
          <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Run ${id}`)}`} className={styles.footerLink}>
            {runPage.footer.report}
          </a>
        ) : null}
        {' · '}
        <button type="button" className={styles.footerButton} aria-expanded={showLog} onClick={() => setShowLog((s) => !s)}>
          {runPage.footer.showLog}
        </button>
      </p>
    </>
  );

  return (
    <PreviewInert.Provider value={storedBefore(doc, '1.3.0')}>
      <main id="main" className={styles.main} data-run-status={run.status}>
        <RunHeader
          host={doc.host ?? ''}
          crumbs={crumbs}
          mode={mode}
          meta={meta}
          pages={doc.pages ?? []}
          runId={local ? undefined : id}
          url={local ? undefined : doc.url}
          shareUrl={local ? undefined : shareUrl}
          noCompare={loginPartial}
          onCancel={mode === 'progress' ? cancel : undefined}
          cancelling={cancelling}
        />
        {ended ? (
          <div className={styles.ended}>
            <StateCard
              level={2}
              title={run.status === 'failed' ? runPage.failed.title : runPage.cancelled.title}
              body={withRunId(run.status === 'failed' ? runPage.failed.body : runPage.cancelled.body, id)}
              detail={run.status === 'failed' && doc.failedDetail ? <p className={styles.detail}>{doc.failedDetail}</p> : undefined}
              primary={
                <Button variant="primary" href={`/?url=${encodeURIComponent(doc.url ?? '')}`}>
                  {runPage.buttons.runAgain}
                </Button>
              }
              secondary={
                <Button variant="ghost" href="/">
                  {statePages.browseShowcase}
                </Button>
              }
            />
          </div>
        ) : (
          <div className={styles.page}>
            {mode === 'progress' ? (
              <>
                <StageRail rings={rings} />
                <PagesCard pages={regions.pages ? doc.pages : undefined} />
              </>
            ) : null}
            <div className={styles.top}>
              <StatStrip cells={stats} />
              {loginPartial ? <p className={styles.caption}>{fill(runPage.loginWall, { n: doc.components?.length ?? 0 })}</p> : done && doc.sparse ? <p className={styles.caption}>{runPage.sparse}</p> : null}
              <PaletteRow doc={doc} />
              <DriftHeadline drift={regions.drift ? doc.drift : undefined} />
            </div>
            <SectionNav items={sections} label={global.sectionsLabel} />
            <div className={styles.sections}>
              <TokensSection doc={regions.palette ? doc : { ...doc, tokens: undefined }} />
              <MotionSection doc={doc} landed={regions.motion} hrefFor={hrefFor} onOpen={onOpenComponent} />
              <ComponentsSection doc={doc} landed={regions.components} base={storageBase} hrefFor={hrefFor} opened={params.get('c') ?? undefined} onOpen={onOpenComponent} />
              <ChecksSection doc={regions.checks ? doc : { ...doc, checks: undefined }} />
              <DriftSection doc={regions.drift ? doc : { ...doc, drift: undefined }} base={storageBase} />
              <ExportsSection doc={doc} landed={regions.exports || Boolean(loginPartial)} runUrl={local ? 'run.json' : shareUrl} source={source} />
            </div>
            {mode === 'progress' || showLog ? <LiveLog lines={logLines(run.events)} /> : null}
          </div>
        )}
      </main>
      <Footer context={footer} />
    </PreviewInert.Provider>
  );
}
