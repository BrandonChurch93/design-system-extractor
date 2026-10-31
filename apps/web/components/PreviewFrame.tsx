'use client';
import { useState, useSyncExternalStore, type SyntheticEvent } from 'react';
import styles from './PreviewFrame.module.css';

type PreviewFrameProps = {
  /** live: a sandboxed iframe on the storage origin; captured: the crop image. */
  mode: 'live' | 'captured';
  src: string;
  title: string;
  width: number;
  height: number;
  lazy?: boolean;
  /** A document stored before 1.3.0: the frame takes no pointer (D-112). */
  inert?: boolean;
};

/**
 * Never srcdoc (D-017): the preview document's own CSP governs it, as in the worker's check.
 * `data-loaded` marks a frame or crop that has fired `load`, which QA waits for before any shot; the
 * frame takes its `src` once mounted, so its load can never fire before the handler is there.
 */
const noop = () => () => {};

export function PreviewFrame({ mode, src, title, width, height, lazy, inert }: PreviewFrameProps) {
  const [loaded, setLoaded] = useState(false);
  // False on the server and during hydration, true after: the client's own render sets the frame's src.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  // A crop already loaded when hydration attaches its handler is read from its state.
  const crop = (el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0 && !loaded) queueMicrotask(() => setLoaded(true));
  };
  // An iframe with no src yet loads about:blank first; only the preview's own load counts.
  const marks = { 'data-preview-frame': mode, 'data-loaded': loaded || undefined, onLoad: (e: SyntheticEvent<Element>) => e.currentTarget.getAttribute('src') && setLoaded(true) };
  if (mode === 'captured') {
    // eslint-disable-next-line @next/next/no-img-element -- storage-origin crops at their CSS size
    return <img ref={crop} src={src} alt={title} width={width} height={height} className={styles.frame} loading={lazy ? 'lazy' : undefined} {...marks} />;
  }
  return (
    <iframe
      src={mounted ? src : undefined}
      title={title}
      sandbox=""
      width={width}
      height={height}
      loading={lazy ? 'lazy' : undefined}
      referrerPolicy="no-referrer"
      className={styles.frame}
      style={inert ? { pointerEvents: 'none' } : undefined}
      data-inert={inert || undefined}
      tabIndex={-1}
      {...marks}
    />
  );
}
