'use client';
import { motion } from 'motion/react';
import { duration, ease } from '../../lib/motion';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import type { Ring } from '../../lib/run-view';
import styles from './StageRail.module.css';

function RingMark({ state }: { state: Ring['state'] }) {
  const reduced = usePrefersReducedMotion();
  if (state === 'done') {
    return (
      <motion.svg
        key="done"
        className={styles.ring}
        viewBox="0 0 20 20"
        aria-hidden="true"
        initial={reduced ? { opacity: 0 } : { scale: 0.6 }}
        animate={reduced ? { opacity: 1 } : { scale: 1 }}
        transition={{ duration: reduced ? 0.2 : duration.fast, ease: ease.standard }}
      >
        <circle cx="10" cy="10" r="10" className={styles.fill} />
        <motion.path
          d="M5.5 10.2 8.6 13.2 14.5 7"
          className={styles.tick}
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: duration.base, ease: ease.standard, delay: reduced ? 0 : duration.fast }}
        />
      </motion.svg>
    );
  }
  return (
    <svg className={styles.ring} viewBox="0 0 20 20" aria-hidden="true" data-state={state}>
      <circle cx="10" cy="10" r="9.25" className={state === 'running' ? styles.running : styles.pending} />
    </svg>
  );
}

/** Seven rings with live labels; a hairline draws between rings as stages complete. */
export function StageRail({ rings }: { rings: Ring[] }) {
  return (
    <ol className={styles.rail}>
      {rings.map((r, i) => (
        <li key={r.key} className={styles.stage} data-state={r.state}>
          {i > 0 ? (
            <span className={styles.connector} aria-hidden="true">
              <motion.span className={styles.connectorFill} initial={false} animate={{ scaleX: r.state === 'pending' ? 0 : 1 }} transition={{ duration: duration.base, ease: ease.standard }} />
            </span>
          ) : null}
          <RingMark state={r.state} />
          <span className={styles.label}>{r.label}</span>
        </li>
      ))}
    </ol>
  );
}
