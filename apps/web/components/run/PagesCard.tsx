'use client';
import type { Page } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { Card } from '../Card';
import { Skeleton } from '../Skeleton';
import { CardHead } from './Section';
import { PageList } from './PageList';
import styles from './PagesCard.module.css';

/** The selected pages with their reasons, filling in as discovery and capture run. */
export function PagesCard({ pages }: { pages?: Page[] }) {
  return (
    <Card className={styles.card}>
      <CardHead level={2} title={runPage.rail.pending.pages} meta={pages ? fill(runPage.meta.pages, { pages: count(pages.length) }) : undefined} />
      {pages ? (
        <>
          <PageList pages={pages} marks />
          <p className={styles.footer}>{runPage.pageListFooter}</p>
        </>
      ) : (
        <div className={styles.skeleton} aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} height={14} width={`${60 + ((i * 13) % 35)}%`} on="surface" />
          ))}
        </div>
      )}
    </Card>
  );
}
