'use client';
import type { Page } from '@dse/schema';
import { fill, pageReasonLabels } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count, dots } from '../../lib/format';
import { Popover, type PopoverTriggerProps } from '../Popover';
import styles from './PageList.module.css';

export function reasonLine(p: Page): string {
  const template = p.templateGroup && p.templateSize && p.templateSize > 1 ? fill(pageReasonLabels.template, { group: p.templateGroup, n: count(p.templateSize) }) : null;
  return dots([p.reason === 'template' ? null : pageReasonLabels[p.reason], template]);
}

/** Every crawled page with the reason it was chosen. */
export function PageList({ pages, marks }: { pages: Page[]; marks?: boolean }) {
  return (
    <ul className={styles.list}>
      {pages.map((p) => (
        <li key={p.id} className={styles.row} data-status={marks ? p.status : undefined}>
          <span className={styles.path}>{p.path}</span>
          <span className={styles.reason}>{reasonLine(p)}</span>
        </li>
      ))}
    </ul>
  );
}

export function PageListPopover({ pages, trigger }: { pages: Page[]; trigger: (p: PopoverTriggerProps) => React.ReactNode }) {
  return (
    <Popover label={fill(runPage.meta.pages, { pages: count(pages.length) })} width={480} trigger={trigger}>
      <PageList pages={pages} />
      <p className={styles.footer}>{runPage.pageListFooter}</p>
    </Popover>
  );
}
