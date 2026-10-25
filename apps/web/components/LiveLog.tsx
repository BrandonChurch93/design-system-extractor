'use client';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { runPage } from '../copy/strings';
import { drawVariants, variantsFor } from '../lib/motion';
import { usePrefersReducedMotion } from '../lib/motion/reduced';
import styles from './LiveLog.module.css';

export type LogLine = { id: number | string; ts: string; text: string; level?: 'info' | 'warn' | 'error' };

function clock(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
}

/** The run's events as the reader sees them. Autoscrolls only when already at the bottom. */
export function LiveLog({ lines, defaultCollapsed = false, animateNew = true, label = runPage.liveLog.label }: { lines: LogLine[]; defaultCollapsed?: boolean; animateNew?: boolean; label?: string }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const body = useRef<HTMLOListElement>(null);
  const atBottom = useRef(true);
  const [initialIds] = useState(() => new Set(lines.map((l) => l.id)));
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = body.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [lines.length, collapsed]);

  const shown = collapsed ? lines.slice(-1) : lines;
  return (
    <section className={styles.log} data-inverse="" aria-label={label}>
      <div className={styles.head}>
        <span className={styles.title}>{runPage.liveLog.label}</span>
        <button type="button" className={styles.toggle} aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)}>
          <span>{collapsed ? runPage.liveLog.expand : runPage.liveLog.collapse}</span>
          <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className={collapsed ? '' : styles.flip} />
        </button>
      </div>
      <ol
        ref={body}
        className={styles.lines}
        tabIndex={0}
        aria-live="polite"
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
        }}
      >
        {shown.map((l) => {
          const fresh = animateNew && !initialIds.has(l.id);
          return (
            <motion.li
              key={l.id}
              className={styles.line}
              data-level={l.level ?? 'info'}
              variants={reduced ? variantsFor('wipe', true) : drawVariants()}
              initial={fresh ? 'hidden' : false}
              animate="shown"
            >
              <time className={styles.ts} dateTime={l.ts}>
                {clock(l.ts)}
              </time>
              <span className={styles.text}>{l.text}</span>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
