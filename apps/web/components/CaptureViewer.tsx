'use client';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { global } from '../copy/strings';
import { duration, ease, REDUCED_DURATION } from '../lib/motion';
import { usePrefersReducedMotion } from '../lib/motion/reduced';
import { trapTab } from '../lib/focus';
import { PHONE, useMedia } from '../lib/use-media';
import { Sheet } from './Sheet';
import styles from './CaptureViewer.module.css';

type CaptureViewerProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  path: string;
  viewport: number;
  /** The capture's CSS size and the box to outline, in CSS px. */
  width: number;
  height: number;
  box: { x: number; y: number; w: number; h: number };
};

/** One page capture at its viewport width, scrolled to a component, which is outlined. */
export function CaptureViewer({ open, onClose, src, path, viewport, width, height, box }: CaptureViewerProps) {
  const alt = `${path} at ${viewport} px`;
  const phone = useMedia(PHONE);
  const content = <CaptureBody src={src} alt={alt} width={width} height={height} box={box} open={open} />;
  if (phone) {
    return (
      <Sheet open={open} onClose={onClose} label={alt} handleLabel={global.icons.close} height="tall">
        {content}
      </Sheet>
    );
  }
  return <Lightbox open={open} onClose={onClose} label={alt}>{content}</Lightbox>;
}

/** The capture with its outline, at rest (the catalog shows it without the lightbox). */
export function CaptureFigure({ src, alt, width, height, box }: { src: string; alt: string; width: number; height: number; box: CaptureViewerProps['box'] }) {
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div className={styles.page} style={{ aspectRatio: `${width} / ${height}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a full-page capture at its CSS size */}
      <img src={src} alt={alt} width={width} height={height} className={styles.image} />
      <span className={styles.outline} style={{ left: pct(box.x, width), top: pct(box.y, height), width: pct(box.w, width), height: pct(box.h, height) }} aria-hidden="true" />
    </div>
  );
}

function CaptureBody({ src, alt, width, height, box, open }: { src: string; alt: string; width: number; height: number; box: CaptureViewerProps['box']; open: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (!open || !el) return;
    const scale = el.clientWidth / width || 1;
    el.scrollTop = Math.max(0, box.y * scale - el.clientHeight / 2 + (box.h * scale) / 2);
  }, [open, width, box]);
  return (
    <div ref={scroller} className={styles.scroller} tabIndex={0} aria-label={alt}>
      <CaptureFigure src={src} alt={alt} width={width} height={height} box={box} />
    </div>
  );
}

function Lightbox({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!open) return;
    const returnTo = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('button')?.focus(), 0);
    return () => {
      clearTimeout(t);
      returnTo?.focus?.();
    };
  }, [open]);
  if (typeof document === 'undefined') return null;
  const t = reduced ? { duration: REDUCED_DURATION } : { duration: duration.slow, ease: ease.standard };
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="lightbox"
          className={styles.layer}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          ref={panel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: t }}
          exit={{ opacity: 0, transition: reduced ? { duration: REDUCED_DURATION } : { duration: duration.base, ease: ease.exit } }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            else if (panel.current) trapTab(e, panel.current);
          }}
        >
          <div className={styles.bar}>
            <span className={styles.caption}>{label}</span>
            <button type="button" className={styles.close} aria-label={global.icons.close} onClick={onClose}>
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          <motion.div className={styles.stage} initial={reduced ? false : { y: 16 }} animate={{ y: 0, transition: t }}>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
