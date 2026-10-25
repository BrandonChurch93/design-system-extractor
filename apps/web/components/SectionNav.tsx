'use client';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { drawVariants, variantsFor } from '../lib/motion';
import { usePrefersReducedMotion } from '../lib/motion/reduced';
import styles from './SectionNav.module.css';

export type SectionNavItem = { id: string; label: string };

/** The run page's sticky section pills. The active pill follows scroll position. */
export function SectionNav({ items, label, forceActive, forceStuck }: { items: SectionNavItem[]; label: string; forceActive?: string; forceStuck?: boolean }) {
  const [active, setActive] = useState(forceActive ?? items[0]?.id);
  const [stuck, setStuck] = useState(Boolean(forceStuck));
  const sentinel = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (forceStuck !== undefined || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e?.isIntersecting), { threshold: 0 });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [forceStuck]);

  useEffect(() => {
    if (forceActive) return;
    const sections = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : Infinity);
        const best = [...visible.entries()].filter(([, top]) => top !== Infinity).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0];
        if (best) setActive(best[0]);
      },
      { rootMargin: '-80px 0px -55% 0px', threshold: [0, 0.01] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items, forceActive]);

  return (
    <>
      <span ref={sentinel} aria-hidden="true" className={styles.sentinel} />
      <nav aria-label={label} className={`${styles.nav} ${stuck ? styles.stuck : ''}`}>
        <div className={styles.scroller}>
          <ul className={styles.list}>
            {items.map((i) => (
              <li key={i.id}>
                <a href={`#${i.id}`} className={styles.item} aria-current={active === i.id ? 'true' : undefined} onClick={() => setActive(i.id)}>
                  {i.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {stuck ? (
          <motion.span className={styles.rule} aria-hidden="true" variants={reduced ? variantsFor('draw', true) : drawVariants()} initial="hidden" animate="shown" />
        ) : null}
      </nav>
    </>
  );
}
