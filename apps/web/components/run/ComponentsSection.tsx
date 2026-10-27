'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import type { ComponentGroup, RunDocumentPartial } from '@dse/schema';
import { componentGroupLabels, fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { orderedComponents, tokenIndex } from '../../lib/doc';
import { afterExits, revealFrameVariants, reducedVariants } from '../../lib/motion';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { useEntered } from '../../lib/motion/use-entered';
import { Button } from '../Button';
import { ChipGroup } from '../ChipGroup';
import { RegionSkeleton } from './RegionSkeleton';
import { ComponentCard, cardTokens } from './ComponentCard';
import { Section } from './Section';
import styles from './ComponentsSection.module.css';

const C = runPage.components;
export const groupOrder = Object.keys(componentGroupLabels) as ComponentGroup[];
const FIRST = 6;

type Props = {
  doc: RunDocumentPartial;
  landed: boolean;
  base?: string;
  hrefFor: (componentId: string) => string;
  opened?: string;
  onOpen?: (componentId: string) => void;
};

/** The grid; its items enter once it is in view, or at once after a filter change. */
function Grid({ reduced, children }: { reduced: boolean; children: (entered: boolean) => React.ReactNode }) {
  // The grid observes itself, so it starts watching when it mounts: a run in progress lands it late.
  const ref = useRef<HTMLUListElement>(null);
  const entered = useEntered(ref, 'self');
  return (
    <motion.ul ref={ref} className={styles.grid} layout={!reduced}>
      <AnimatePresence mode="popLayout">{children(entered)}</AnimatePresence>
    </motion.ul>
  );
}

/** The filter, the grid of six with "Show all", every card a link to its panel. */
export function ComponentsSection({ doc, landed, base, hrefFor, opened, onOpen }: Props) {
  const reduced = usePrefersReducedMotion();
  const [group, setGroup] = useState<'all' | ComponentGroup>('all');
  const [all, setAll] = useState(false);
  const [changed, setChanged] = useState(false);
  const list = orderedComponents(doc, groupOrder);
  const names = tokenIndex(doc);
  const counts = groupOrder.map((g) => [g, list.filter((c) => c.group === g).length] as const).filter(([, n]) => n > 0);
  const filtered = group === 'all' ? list : list.filter((c) => c.group === group);
  const shown = all ? filtered : filtered.slice(0, FIRST);
  const frame = reduced ? reducedVariants() : changed ? afterExits(revealFrameVariants()) : revealFrameVariants();

  return (
    <Section id="components" title={C.heading} caption={landed ? fill(C.caption, { n: count(list.length) }) : undefined}>
      {landed ? (
        <>
          <ChipGroup
            label={C.heading}
            value={group}
            onChange={(v) => {
              setChanged(true);
              setGroup(v);
            }}
            options={[{ value: 'all' as const, label: fill(C.chipAll, { n: count(list.length) }) }, ...counts.map(([g, n]) => ({ value: g, label: fill(C.chip, { group: componentGroupLabels[g], n: count(n) }) }))]}
          />
          <Grid reduced={reduced}>
            {(entered) =>
              shown.map((c, i) => (
              <motion.li
                key={c.id}
                layout={!reduced}
                className={styles.item}
                data-move="reveal"
                variants={frame}
                custom={i >= FIRST ? i - FIRST : i}
                initial="hidden"
                animate={changed || entered ? 'shown' : 'hidden'}
                exit="exit"
              >
                <ComponentCard component={c} href={hrefFor(c.id)} base={base} tokens={cardTokens(c, names)} opened={opened === c.id} reveal={!reduced} onOpen={onOpen ? () => onOpen(c.id) : undefined} />
              </motion.li>
              ))
            }
          </Grid>
          {filtered.length > FIRST && !all ? (
            <Button
              variant="ghost"
              className={styles.showAll}
              onClick={() => {
                setChanged(true);
                setAll(true);
              }}
            >
              {fill(C.showAll, { n: count(filtered.length) })}
            </Button>
          ) : null}
        </>
      ) : (
        <RegionSkeleton region="components" />
      )}
    </Section>
  );
}
