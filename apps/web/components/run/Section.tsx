'use client';
import type { ReactNode } from 'react';
import { Enter } from '../motion/Enter';
import styles from './Section.module.css';

/** A run page section: the h2 wipes in, the caption sits right (docs/design/pages.md). */
export function Section({ id, title, caption, children, label }: { id: string; title: string; caption?: ReactNode; children: ReactNode; /** A name of its own where another region on the page has the title (the catalog). */ label?: string }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={label ? undefined : `${id}-title`} aria-label={label}>
      <div className={styles.head}>
        <Enter as="h2" move="wipe" id={`${id}-title`} className={styles.title}>
          {title}
        </Enter>
        {caption ? <p className={styles.caption}>{caption}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** A card heading row inside a section: h3 left, a meta line right. */
export function CardHead({ title, meta, id, level = 3 }: { title: string; meta?: ReactNode; id?: string; level?: 2 | 3 }) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <div className={styles.cardHead}>
      <H id={id} className={styles.cardTitle}>
        {title}
      </H>
      {meta ? <p className={styles.cardMeta}>{meta}</p> : null}
    </div>
  );
}
