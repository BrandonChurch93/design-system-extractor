import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/meta';
import { notFound } from 'next/navigation';
import { byoLimitsFrom, planLimits } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { PageShell } from '../../../components/PageShell';
import { StateView, type LoginSummary, type StateReason } from '../../../components/state/StateView';
import { home, meta } from '../../../copy/strings';
import { count } from '../../../lib/format';
import { paletteOf } from '../../../lib/palette';
import { runPayload } from '../../../lib/server/runs';
import { services } from '../../../lib/server/services';
import { hoursUntil } from '@dse/pipeline/queue/keys';
import styles from '../../state.module.css';

const reasons: StateReason[] = ['budget', 'busy', 'visitor-cap', 'bot', 'robots', 'login', 'unreachable', 'invalid'];
const titles: Record<StateReason, string> = {
  budget: meta.states.runsPaused,
  busy: meta.states.runsPaused,
  'visitor-cap': meta.states.runLimit,
  bot: meta.states.couldNotCrawl,
  robots: meta.states.couldNotCrawl,
  unreachable: meta.states.couldNotCrawl,
  invalid: meta.states.couldNotCrawl,
  login: meta.states.loginWall,
};

type Props = { params: Promise<{ reason: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reason } = await params;
  const r = reasons.find((x) => x === reason);
  return pageMeta({ title: r ? titles[r] : meta.notFound.title, description: meta.states.description, index: false });
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** A blocked run's page; the detail comes from the run (`?run=`) or this tab's sessionStorage. */
export default async function StatePage({ params, searchParams }: Props) {
  const [{ reason }, sp] = await Promise.all([params, searchParams]);
  const r = reasons.find((x) => x === reason);
  if (!r) notFound();
  const svc = services();
  const runId = typeof sp.run === 'string' ? sp.run : undefined;
  const run = runId ? await runPayload(svc.db, runId) : null;
  const doc = run?.document;
  const url = typeof sp.url === 'string' ? sp.url : (doc?.url ?? '');
  const host = doc?.host ?? hostOf(url);
  let login: LoginSummary | undefined;
  if (r === 'login' && run && doc?.tokens) {
    login = {
      runId: run.id,
      stats: fill(home.cardStats, { colors: count(doc.tokens.colors?.length ?? 0), typeStyles: count(doc.tokens.type?.length ?? 0), components: count(doc.components?.length ?? 0) }),
      palette: paletteOf(doc, 4).map((p) => p.value),
    };
  }
  return (
    <PageShell>
      <div className={styles.center}>
        <StateView
          reason={r}
          host={host}
          url={url}
          runDetail={doc?.blockedDetail}
          login={login}
          hours={hoursUntil(svc.counters.resetsAt())}
          runsPerDay={planLimits('free', svc.env).runsPerDay}
          byoPageCap={byoLimitsFrom(svc.env).pageCap}
        />
      </div>
    </PageShell>
  );
}
