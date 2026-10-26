'use client';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Page } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { global, runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import type { Breadcrumb } from '../../lib/run-view';
import { submitRun } from '../../lib/submit-run';
import { Button } from '../Button';
import { useToast } from '../Toast';
import { Enter } from '../motion/Enter';
import { PageListPopover } from './PageList';
import { SharePopover } from './SharePopover';
import styles from './RunHeader.module.css';

export type HeaderMode = 'complete' | 'progress' | 'ended' | 'local';

type Props = {
  host: string;
  crumbs: Breadcrumb;
  mode: HeaderMode;
  meta: React.ReactNode;
  pages: Page[];
  runId?: string;
  url?: string;
  shareUrl?: string;
  /** A login wall's one-page run has no Compare (docs/design/pages.md). */
  noCompare?: boolean;
  onCancel?: () => void;
  cancelling?: boolean;
  /** The catalog shows a header inside its own page, under its own h1. */
  headingLevel?: 1 | 2;
};

/** Breadcrumb or eyebrow, the host as the title, the meta line and the actions. */
export function RunHeader({ host, crumbs, mode, meta, pages, runId, url, shareUrl, noCompare, onCancel, cancelling, headingLevel = 1 }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [again, setAgain] = useState(false);
  const pagesLabel = fill(runPage.meta.pages, { pages: count(pages.length) });
  const showPagesButton = mode !== 'progress' && pages.length > 0 && typeof meta === 'string' && meta.startsWith(pagesLabel);

  async function runAgain() {
    if (!url) return;
    setAgain(true);
    const out = await submitRun(url, []);
    if ('go' in out) router.push(out.go);
    else {
      toast.show(out.error);
      setAgain(false);
    }
  }

  return (
    <header className={styles.header} data-testid="chrome">
      <div className={styles.identity}>
        {mode === 'progress' ? (
          <p className={styles.eyebrow}>{runPage.eyebrow}</p>
        ) : (
          <nav aria-label={global.breadcrumbLabel} className={styles.crumbs}>
            <ol>
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`}>
                  {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <Enter as={headingLevel === 1 ? 'h1' : 'h2'} move="wipe" className={styles.title}>
          {host}
        </Enter>
        <p className={styles.meta}>
          {showPagesButton ? (
            <>
              <PageListPopover
                pages={pages}
                trigger={(t) => (
                  <button type="button" className={styles.pages} {...t}>
                    {pagesLabel}
                  </button>
                )}
              />
              {(meta as string).slice(pagesLabel.length)}
            </>
          ) : (
            meta
          )}
        </p>
      </div>
      <div className={styles.actions}>
        {mode === 'progress' ? (
          onCancel ? (
            <Button variant="ghost" onClick={onCancel} disabled={cancelling}>
              {runPage.buttons.cancel}
            </Button>
          ) : null
        ) : mode === 'complete' ? (
          <>
            {shareUrl ? <SharePopover url={shareUrl} host={host} /> : null}
            {url ? (
              <Button variant="ghost" icon={RefreshCw} onClick={runAgain} disabled={again}>
                {runPage.buttons.runAgain}
              </Button>
            ) : null}
            {runId && !noCompare ? (
              <Button variant="ghost" href={`/compare?a=${runId}`}>
                {runPage.buttons.compare}
              </Button>
            ) : null}
            <Button variant="primary" href="#exports" className={styles.export}>
              {runPage.buttons.export}
            </Button>
          </>
        ) : null}
      </div>
    </header>
  );
}
