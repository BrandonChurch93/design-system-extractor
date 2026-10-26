'use client';
import type { Drift } from '@dse/schema';
import { runPage } from '../../copy/strings';
import { Button } from '../Button';
import { Skeleton } from '../Skeleton';
import { Enter } from '../motion/Enter';
import styles from './DriftHeadline.module.css';

/** The headline finding on the inverse ground, with the next two as a supporting line. */
export function DriftHeadline({ drift }: { drift?: Drift }) {
  if (!drift) return <Skeleton height={124} radius="lg" className={styles.skeleton} />;
  return (
    <section className={styles.card} data-inverse aria-label={runPage.drift.heading}>
      <div className={styles.text}>
        <Enter as="p" move="wipe" className={styles.sentence}>
          {drift.headline.sentence}
        </Enter>
        {drift.supporting.length ? <p className={styles.supporting}>{drift.supporting.join(' ')}</p> : null}
      </div>
      <Button variant="inverse" href="#drift" className={styles.button}>
        {runPage.driftButton}
      </Button>
    </section>
  );
}
