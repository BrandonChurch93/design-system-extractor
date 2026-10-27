'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import type { Component, ComponentGroup, RunDocumentPartial } from '@dse/schema';
import { componentGroupLabels, fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { orderedComponents, tokenIndex } from '../../lib/doc';
import { afterExits, revealFrameVariants, reducedVariants } from '../../lib/motion';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { useEntered } from '../../lib/motion/use-entered';
import { Button } from '../Button';
import { ChevronDown } from 'lucide-react';
import { ChipGroup, ToggleChip } from '../ChipGroup';
import { PHONE, useMedia } from '../../lib/use-media';
import { RegionSkeleton } from './RegionSkeleton';
import { ComponentCard, cardTokens } from './ComponentCard';
import { Section } from './Section';
import styles from './ComponentsSection.module.css';

const C = runPage.components;
export const groupOrder = Object.keys(componentGroupLabels) as ComponentGroup[];
const FIRST = 6;
/** Above this many components the page-specific tier starts hidden (D-085). */
const CORE_ONLY_ABOVE = 24;

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

type TierProps = { list: Component[]; reduced: boolean; changed: boolean; base?: string; hrefFor: (id: string) => string; opened?: string; onOpen?: (id: string) => void; names: ReturnType<typeof tokenIndex>; onChanged: () => void };

/** One grid of six with "Show all". */
function TierGrid({ list, reduced, changed, base, hrefFor, opened, onOpen, names, onChanged }: TierProps) {
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, FIRST);
  const frame = reduced ? reducedVariants() : changed ? afterExits(revealFrameVariants()) : revealFrameVariants();
  return (
    <>
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
      {list.length > FIRST && !all ? (
        <Button
          variant="ghost"
          className={styles.showAll}
          onClick={() => {
            onChanged();
            setAll(true);
          }}
        >
          {fill(C.showAll, { n: count(list.length) })}
        </Button>
      ) : null}
    </>
  );
}

/** The filter, then the core and page-specific grids of six with "Show all", every card a link to its panel. */
export function ComponentsSection({ doc, landed, base, hrefFor, opened, onOpen }: Props) {
  const reduced = usePrefersReducedMotion();
  const phone = useMedia(PHONE);
  const [group, setGroup] = useState<'all' | ComponentGroup>('all');
  const list = orderedComponents(doc, groupOrder);
  const [coreOnly, setCoreOnly] = useState(list.length > CORE_ONLY_ABOVE);
  const [pageOpen, setPageOpen] = useState(false);
  const [changed, setChanged] = useState(false);
  const names = tokenIndex(doc);
  const counts = groupOrder.map((g) => [g, list.filter((c) => c.group === g).length] as const).filter(([, n]) => n > 0);
  const filtered = group === 'all' ? list : list.filter((c) => c.group === group);
  const core = filtered.filter((c) => c.tier !== 'page');
  const page = filtered.filter((c) => c.tier === 'page');
  const tiered = list.some((c) => c.tier === 'page') && list.some((c) => c.tier !== 'page');
  const grid = { reduced, changed, base, hrefFor, opened, onOpen, names, onChanged: () => setChanged(true) };
  const pageId = 'components-page-tier';

  return (
    <Section id="components" title={C.heading} caption={landed ? fill(C.caption, { n: count(list.length) }) : undefined}>
      {landed ? (
        <>
          <div className={styles.filter}>
            <ChipGroup
              label={C.heading}
              value={group}
              onChange={(v) => {
                setChanged(true);
                setGroup(v);
              }}
              options={[{ value: 'all' as const, label: fill(C.chipAll, { n: count(list.length) }) }, ...counts.map(([g, n]) => ({ value: g, label: fill(C.chip, { group: componentGroupLabels[g], n: count(n) }) }))]}
            />
            {tiered ? (
              <ToggleChip
                label={C.coreOnly}
                pressed={coreOnly}
                onChange={(v) => {
                  setChanged(true);
                  setCoreOnly(v);
                }}
              />
            ) : null}
          </div>
          {!tiered ? (
            <TierGrid key={group} list={filtered} {...grid} />
          ) : (
            <>
              {core.length ? (
                <div className={styles.tier}>
                  <h3 className={styles.tierTitle}>{C.core}</h3>
                  <TierGrid key={`core-${group}`} list={core} {...grid} />
                </div>
              ) : null}
              {!coreOnly && page.length ? (
                <div className={styles.tier}>
                  {phone ? (
                    <h3 className={styles.tierTitle}>
                      <button type="button" className={styles.disclosure} aria-expanded={pageOpen} aria-controls={pageId} onClick={() => setPageOpen((o) => !o)}>
                        {C.page}
                        <ChevronDown size={20} strokeWidth={1.75} aria-hidden="true" className={styles.chevron} />
                      </button>
                    </h3>
                  ) : (
                    <h3 className={styles.tierTitle}>{C.page}</h3>
                  )}
                  {!phone || pageOpen ? (
                    <div id={pageId} className={styles.tierBody}>
                      <TierGrid key={`page-${group}`} list={page} {...grid} />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </>
      ) : (
        <RegionSkeleton region="components" />
      )}
    </Section>
  );
}
