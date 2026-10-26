'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { BlockedDetail, MeResponse } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { keyPopover, recent, statePages as S } from '../../copy/strings';
import { blockedDetail } from '../../lib/browser-store';
import { count, dollars, numberWord } from '../../lib/format';
import { Button } from '../Button';
import { Card } from '../Card';
import { CodeBlock } from '../CodeBlock';
import { Meter } from '../Meter';
import { StateCard } from '../StateCard';
import { useSavedKey } from '../home/KeyPopover';
import { RetryForm } from './RetryForm';
import { billingEnabled } from '../../lib/flags';
import { UpgradePrompt } from '../v2/UpgradePrompt';
import styles from './StateView.module.css';

export type StateReason = 'budget' | 'busy' | 'visitor-cap' | 'bot' | 'robots' | 'login' | 'unreachable' | 'invalid';

export type LoginSummary = { runId: string; stats: string; palette: string[] };

type Props = {
  reason: StateReason;
  host: string;
  url: string;
  /** The run's blocked detail, for worker-side blocks (`?run=`). */
  runDetail?: BlockedDetail;
  login?: LoginSummary;
  hours: number;
  runsPerDay: number;
  byoPageCap: number;
};

type Usage = { used: number; budget: number; runsToday: number; resetsAt: string };

let cached: { raw: string | null; value: BlockedDetail | null } = { raw: null, value: null };
/** A stable snapshot for useSyncExternalStore: the parsed detail changes only when the stored text does. */
function sessionDetail(): BlockedDetail | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem('dse_blocked');
  } catch {
    raw = null;
  }
  if (raw !== cached.raw) cached = { raw, value: raw ? blockedDetail() : null };
  return cached.value;
}

function useRunsLeft(): string | null {
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
      .then((me) => live && me && setLine(fill(recent.runsLeft, { runsLeft: count(me.runsLeft), runsPerDay: count(me.runsPerDay) })))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return line;
}

/** Every blocked state's page (docs/design/pages.md, State routes); copy from copy.md, State pages. */
export function StateView({ reason, host, url, runDetail, login, hours, runsPerDay, byoPageCap }: Props) {
  // The pre-check's detail lives in this tab's sessionStorage; the server render has none.
  const stored = useSyncExternalStore(
    () => () => {},
    () => sessionDetail(),
    () => null,
  );
  const [, setKey] = useSavedKey();
  const runsLeft = useRunsLeft();
  const detail = runDetail ?? stored;
  const usage = detail && 'used' in detail ? (detail as Usage) : null;
  const attempts = detail && 'attempts' in detail ? detail : null;
  // The server's clock and the budget day's reset: the same moment the detail names.
  const shownHours = hours;

  const browse = (
    <Button variant="ghost" href="/">
      {S.browseShowcase}
    </Button>
  );
  const recentRuns = (
    <Button variant="ghost" href="/recent">
      {S.recentRuns}
    </Button>
  );
  const keyForm = (
    <>
      {billingEnabled() ? <UpgradePrompt /> : null}
      <div className={styles.keyForm}>
      <h2 className={styles.formHeading}>{S.budget.formHeading}</h2>
      <RetryForm initial={url} label={fill(S.budget.extract, { host })} keyMode={{ keyLabel: keyPopover.label, placeholder: keyPopover.placeholder, onKey: setKey }} />
      <p className={styles.caption}>{fill(keyPopover.caption, { byoPageCap })}</p>
      </div>
    </>
  );
  const notCounted = (
    <>
      <p>{S.bot.footer}</p>
      {runsLeft ? <p data-qa-mask="runs-left">{runsLeft}</p> : null}
    </>
  );

  switch (reason) {
    case 'budget':
      return (
        <StateCard
          eyebrow={S.budget.eyebrow}
          title={S.budget.title}
          body={<span data-qa-mask="hours">{fill(S.budget.body, { hours: count(shownHours) })}</span>}
          detail={
            usage ? (
              <div className={styles.meter}>
                <Meter value={usage.used} max={usage.budget} label={fill(S.budget.meter, { used: dollars(usage.used), budget: dollars(usage.budget) })} />
                <p className={styles.meterLine}>
                  <span>{fill(S.budget.meter, { used: dollars(usage.used), budget: dollars(usage.budget) })}</span>
                  <span>{fill(S.budget.runsToday, { n: count(usage.runsToday) })}</span>
                </p>
              </div>
            ) : undefined
          }
          primary={keyForm}
          secondary={
            <>
              {browse}
              {recentRuns}
            </>
          }
          footer={S.budget.footer}
        />
      );
    case 'busy':
      return <StateCard eyebrow={S.busy.eyebrow} title={S.busy.title} body={S.busy.body} secondary={<>{browse}{recentRuns}</>} footer={S.budget.footer} />;
    case 'visitor-cap':
      return (
        <StateCard
          eyebrow={S.visitorCap.eyebrow}
          title={fill(S.visitorCap.title, { runsPerDay: count(runsPerDay) })}
          body={<span data-qa-mask="hours">{fill(S.visitorCap.body, { runsPerDay: numberWord(runsPerDay), hours: count(shownHours) })}</span>}
          primary={keyForm}
          secondary={
            <>
              {browse}
              {recentRuns}
            </>
          }
        />
      );
    case 'bot':
      return (
        <StateCard
          eyebrow={S.bot.eyebrow}
          title={fill(S.bot.title, { host })}
          body={S.bot.body}
          detail={
            <div className={styles.stack}>
              {attempts?.attempts.length ? <CodeBlock code={attempts.attempts.map((a) => [a.url, a.status, a.marker, a.retries ? `retries ${a.retries}` : null].filter((x) => x !== null && x !== undefined).join(' · ')).join('\n')} /> : null}
              <h2 className={styles.formHeading}>{S.bot.heading}</h2>
              <ul className={styles.lines}>
                {S.bot.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          }
          primary={<RetryForm initial={url} label={S.bot.tryPage} />}
          secondary={
            <>
              {browse}
              <Button variant="ghost" href="/how-it-works#crawl">
                {S.bot.howCrawling}
              </Button>
            </>
          }
          footer={notCounted}
        />
      );
    case 'robots':
      return (
        <StateCard
          eyebrow={S.robots.eyebrow}
          title={fill(S.robots.title, { host })}
          body={S.robots.body}
          detail={attempts?.robots ? <CodeBlock code={attempts.robots} /> : undefined}
          secondary={
            <>
              {browse}
              <Button variant="ghost" href="/how-it-works#crawl">
                {S.bot.howCrawling}
              </Button>
            </>
          }
          footer={notCounted}
        />
      );
    case 'login':
      return (
        <StateCard
          eyebrow={S.login.eyebrow}
          title={fill(S.login.title, { host })}
          body={S.login.body}
          detail={
            <div className={styles.stack}>
              {login ? (
                <Card className={styles.loginCard}>
                  <div>
                    <p className={styles.cardTitle}>{S.login.card}</p>
                    <p className={styles.caption}>{login.stats}</p>
                  </div>
                  <div className={styles.minis}>
                    {login.palette.slice(0, 4).map((v) => (
                      <span key={v} className={styles.chip} style={{ background: v }} aria-hidden="true" />
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" href={`/r/${login.runId}?partial=1`}>
                    {S.login.open}
                  </Button>
                </Card>
              ) : null}
              <h2 className={styles.formHeading}>{S.login.heading}</h2>
              <ul className={styles.lines}>
                {S.login.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <CodeBlock code={fill(S.login.code, { host })} />
            </div>
          }
          primary={
            <Button variant="primary" href="/">
              {S.login.tryAnother}
            </Button>
          }
          secondary={
            <Button variant="ghost" href="/how-it-works#cli">
              {S.login.guide}
            </Button>
          }
          footer={notCounted}
        />
      );
    case 'unreachable':
      return (
        <StateCard
          eyebrow={S.unreachable.eyebrow}
          title={fill(S.unreachable.title, { host })}
          body={S.unreachable.body}
          primary={<RetryForm initial={url} label={S.unreachable.tryAgain} />}
          secondary={browse}
          footer={notCounted}
        />
      );
    case 'invalid':
      return <StateCard eyebrow={S.invalid.eyebrow} title={S.invalid.title} body={S.invalid.body} primary={<RetryForm initial={url} label={S.invalid.tryAgain} />} secondary={browse} />;
  }
}
