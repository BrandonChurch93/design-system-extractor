'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { ShowcaseCategory, type ShowcaseEntry } from '@dse/schema';
import { home } from '../../copy/strings';
import { duration, revealFrameVariants, reducedVariants } from '../../lib/motion';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { useEntered } from '../../lib/motion/use-entered';
import { ChipGroup } from '../ChipGroup';
import { ShowcaseCard } from './ShowcaseCard';
import styles from './Showcase.module.css';

type Filter = 'all' | ShowcaseCategory;

/** The heading row, the category chips and the grid (docs/design/pages.md, Home). */
export function Showcase({ entries }: { entries: ShowcaseEntry[] }) {
  const reduced = usePrefersReducedMotion();
  const gridRef = useRef<HTMLUListElement>(null);
  const entered = useEntered(gridRef, 'self');
  const [filter, setFilter] = useState<Filter>('all');
  const [changed, setChanged] = useState(false);
  const sorted = useMemo(() => [...entries].sort((a, b) => a.order - b.order), [entries]);
  const options = [
    { value: 'all' as Filter, label: home.categories.all },
    ...ShowcaseCategory.options.filter((c) => sorted.some((e) => e.category === c)).map((c) => ({ value: c as Filter, label: home.categories[c] })),
  ];
  const shown = filter === 'all' ? sorted : sorted.filter((e) => e.category === filter);
  const frame = reduced ? reducedVariants() : revealFrameVariants();

  return (
    <section id="showcase" className={styles.section} aria-labelledby="showcase-title">
      <div className={styles.headRow}>
        <h2 id="showcase-title" className={styles.title}>
          {home.showcase.heading}
        </h2>
        <p className={styles.caption}>{home.showcase.caption}</p>
      </div>
      <ChipGroup
        options={options}
        value={filter}
        onChange={(v) => {
          setChanged(true);
          setFilter(v);
        }}
        label={home.showcase.heading}
        className={styles.chips}
      />
      <motion.ul ref={gridRef} className={styles.grid} layout={!reduced}>
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((e, i) => (
            <motion.li
              key={e.runId}
              layout={!reduced}
              className={styles.item}
              variants={frame}
              custom={i}
              initial="hidden"
              data-move="reveal"
              animate={changed || entered ? 'shown' : 'hidden'}
              exit="exit"
              // Exits run first: an entering card waits for the leaving ones.
              transition={changed && !reduced ? { delay: duration.base } : undefined}
            >
              <ShowcaseCard entry={e} reveal={!reduced} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </section>
  );
}
