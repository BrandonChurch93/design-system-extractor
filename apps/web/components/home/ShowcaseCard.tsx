'use client';
import { motion } from 'motion/react';
import type { ShowcaseEntry } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { home } from '../../copy/strings';
import { count } from '../../lib/format';
import { revealContentVariants } from '../../lib/motion';
import { Card } from '../Card';
import { PaletteStrip } from '../PaletteStrip';
import { Tag } from '../Tag';
import styles from './ShowcaseCard.module.css';

/** A showcase run: its palette strip, name, host, stats and category (docs/design/components.md). */
export function ShowcaseCard({ entry, forceState, reveal }: { entry: ShowcaseEntry; forceState?: 'hover' | 'focus'; reveal?: boolean }) {
  const s = entry.stats;
  return (
    <Card href={`/r/${entry.runId}`} flush className={styles.card} forceState={forceState}>
      <PaletteStrip bands={entry.palette} height={64} />
      <motion.span className={styles.body} variants={reveal ? revealContentVariants() : undefined}>
        <span className={styles.head}>
          <span className={styles.name}>{entry.name}</span>
          <span className={styles.host}>{entry.host}</span>
        </span>
        <span className={styles.stats}>{fill(home.cardStats, { colors: count(s.colors), typeStyles: count(s.typeStyles), components: count(s.components) })}</span>
        <span className={styles.foot}>
          <Tag>{home.categories[entry.category]}</Tag>
          <span className={styles.checks}>{fill(home.cardChecks, { passed: count(s.checksPassed), applicable: count(s.checksApplicable) })}</span>
        </span>
      </motion.span>
    </Card>
  );
}
