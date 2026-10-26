'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { MeResponse, RunResponse } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { recent as R } from '../../copy/strings';
import { announceRecent, noRecent, recentRuns, recentSnapshot, subscribeRecent, updateRecent } from '../../lib/browser-store';
import { count } from '../../lib/format';
import { paletteOf } from '../../lib/palette';
import { terminal } from '../../lib/run-view';
import { Button } from '../Button';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { Footer } from '../Footer';
import { KeyPopover, useSavedKey } from '../home/KeyPopover';
import { Enter } from '../motion/Enter';
import { RecentRunRow } from './RecentRunRow';
import styles from './RecentView.module.css';



/** The runs made from this browser, from localStorage; open runs are polled once on load. */
export function RecentView({ byoPageCap, now }: { byoPageCap: number; now: string }) {
  const runs = useSyncExternalStore(subscribeRecent, recentSnapshot, () => noRecent);
  const [key] = useSavedKey();
  const [me, setMe] = useState<MeResponse | null>(null);
  const today = new Date(now);

  useEffect(() => {
    let live = true;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
      .then((m) => live && setMe(m))
      .catch(() => {});
    for (const r of recentRuns().filter((x) => !terminal(x.status))) {
      fetch(`/api/runs/${r.id}`, { cache: 'no-store' })
        .then((res) => (res.ok ? (res.json() as Promise<RunResponse>) : null))
        .then((body) => {
          if (!body) return;
          updateRecent(r.id, { status: body.status, stats: body.document.stats ?? null, palette: paletteOf(body.document), blockedReason: body.document.blockedReason });
          announceRecent();
        })
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, []);

  const left = key ? R.unlimited : me ? fill(R.runsLeft, { runsLeft: count(me.runsLeft), runsPerDay: count(me.runsPerDay) }) : null;

  return (
    <>
      <main id="main" className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titles}>
            <Enter as="h1" move="wipe" className={styles.title}>
              {R.title}
            </Enter>
            <p className={styles.caption}>{R.caption}</p>
          </div>
          <div className={styles.side}>
            {left ? <p className={styles.left}>{left}</p> : null}
            <Button variant="primary" href="/">
              {R.newRun}
            </Button>
          </div>
        </header>
        {runs.length ? (
          <>
            <Card className={styles.card}>
              <ul className={styles.list} aria-label={R.title}>
                {runs.map((r) => (
                  <RecentRunRow key={r.id} run={r} now={today} />
                ))}
              </ul>
            </Card>
            <p className={styles.caption}>{R.clearing}</p>
          </>
        ) : (
          <EmptyState title={R.empty.title} body={R.empty.body} action={{ label: R.empty.action, href: '/' }} />
        )}
      </main>
      <Footer
        context={
          <>
            <p>{R.footer.nothing}</p>
            <p>
              <KeyPopover
                byoPageCap={byoPageCap}
                trigger={(t) => (
                  <button type="button" className={styles.keyButton} {...t}>
                    {R.footer.key}
                  </button>
                )}
              />
            </p>
          </>
        }
      />
    </>
  );
}
