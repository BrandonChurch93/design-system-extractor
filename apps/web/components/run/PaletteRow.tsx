'use client';
import { useId } from 'react';
import type { RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { Skeleton } from '../Skeleton';
import { Swatch } from '../Swatch';
import { Enter } from '../motion/Enter';
import { TokenPopover, tokenInfo } from './TokenPopover';
import styles from './PaletteRow.module.css';

/** "Palette" and the eight most used colors as xl swatches that extend in a stagger. */
export function PaletteRow({ doc }: { doc: RunDocumentPartial }) {
  const labelId = useId();
  const colors = [...(doc.tokens?.colors ?? [])].sort((a, b) => b.usage - a.usage).slice(0, 8);
  return (
    <section className={styles.row} aria-labelledby={doc.tokens?.colors ? labelId : undefined}>
      <p id={labelId} className={styles.label}>
        {runPage.palette.label}
      </p>
      <ul className={styles.swatches}>
        {doc.tokens?.colors
          ? colors.map((c, i) => {
              const info = tokenInfo(doc, c.id)!;
              return (
                <Enter as="li" key={c.id} move="extend" index={i} className={styles.item}>
                  <TokenPopover info={info} trigger={(t) => <Swatch value={c.value} size="xl" caption={fill(runPage.palette.caption, { name: c.name, uses: count(c.usage) })} {...t} />} />
                </Enter>
              );
            })
          : Array.from({ length: 8 }, (_, i) => (
              <li key={i} className={styles.item} aria-hidden="true">
                <Skeleton height={96} radius="md" />
                <Skeleton height={12} width="60%" />
                <Skeleton height={12} width="80%" />
              </li>
            ))}
      </ul>
    </section>
  );
}
