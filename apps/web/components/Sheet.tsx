'use client';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { duration, ease, REDUCED_DURATION } from '../lib/motion';
import { usePrefersReducedMotion } from '../lib/motion/reduced';
import { focusables, trapTab } from '../lib/focus';
import styles from './Sheet.module.css';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** The dialog's name. */
  label: string;
  /** The grab handle's label. */
  handleLabel: string;
  /** 92% for the component sheet; otherwise content height, at most 80%. */
  height?: 'tall' | 'content';
  children: ReactNode;
};

/** A bottom panel for phones and large popovers, with a scrim that never blurs. */
export function Sheet({ open, onClose, label, handleLabel, height = 'content', children }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const root = panel.current;
      if (!root) return;
      (focusables(root)[0] ?? root).focus();
    }, 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      returnTo.current?.focus?.();
    };
  }, [open]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  }

  const transition = reduced ? { duration: REDUCED_DURATION } : { duration: duration.slow, ease: ease.standard };
  const exitTransition = reduced ? { duration: REDUCED_DURATION } : { duration: duration.slow, ease: ease.exit };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className={styles.layer} key="sheet">
          <motion.div
            className={styles.scrim}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition }}
            exit={{ opacity: 0, transition: exitTransition }}
            aria-hidden="true"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={`${styles.sheet} ${height === 'tall' ? styles.tall : styles.content}`}
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1, transition } : { y: 0, transition }}
            exit={reduced ? { opacity: 0, transition: exitTransition } : { y: '100%', transition: exitTransition }}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragListener={false}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
              } else if (panel.current) trapTab(e, panel.current);
            }}
          >
            <SheetHandle label={handleLabel} onClose={onClose} onDragEnd={onDragEnd} reduced={reduced} />
            <div className={styles.body} tabIndex={0}>
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function SheetHandle({ label, onClose, onDragEnd, reduced }: { label: string; onClose: () => void; onDragEnd: (e: unknown, info: PanInfo) => void; reduced: boolean }) {
  return (
    <motion.button
      type="button"
      className={styles.handleHit}
      aria-label={label}
      onClick={onClose}
      onPanEnd={reduced ? undefined : onDragEnd}
    >
      <span className={styles.handle} />
    </motion.button>
  );
}
