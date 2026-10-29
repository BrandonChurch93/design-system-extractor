'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Preview } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../copy/strings';
import { fitPreview, type Fit } from '../lib/preview-fit';
import { CodeBlock } from './CodeBlock';
import { PreviewFrame } from './PreviewFrame';
import styles from './FitPreview.module.css';

/** Where a local run has no image server, the caption that stands in for a crop or preview (/open). */
export const PreviewPlaceholder = createContext<string | undefined>(undefined);

/** The scale written as copy says: two decimals at most, trailing zeros dropped (`0.8`, `0.65`). */
export const scaleText = (scale: number) => String(Math.floor(scale * 100) / 100);

type Props = {
  preview: Preview;
  base?: string;
  title: string;
  padding?: number;
  htmlKey?: string;
  /** A state's crop in place of the default one. */
  cropKey?: string;
  showCaptured?: boolean;
  lazy?: boolean;
  /** The color painted behind the preview (D-094); the parent's ground when absent. */
  ground?: string;
  showScale?: boolean;
  /** Changes to load the frame again (a replayed state). */
  reload?: number;
  /**
   * `fit` scales down to fit (a state tile, a drift pair); `card` fits no lower than 0.6×, past which it
   * is anchored and cut with a fade (D-107); `actual` is 1:1, scrolling sideways when wider (the drawer).
   */
  fit?: 'fit' | 'card' | 'actual';
  /** The component's markup, shown when no crop could be cut (D-108). */
  code?: string;
};

/**
 * A component preview on its ground. The live preview is a sandboxed frame at the size the render check
 * measured; a captured one is its crop; one with no crop is its code.
 */
export function FitPreview({ preview, base, title, padding = 16, htmlKey, cropKey, showCaptured = true, lazy, ground, showScale = true, reload, fit = 'fit', code }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const placeholder = useContext(PreviewPlaceholder);
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || fit === 'actual') return;
    const ro = new ResizeObserver(([e]) => e && setRoom({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);
  const P = runPage.preview;
  const w = Math.max(1, Math.ceil(preview.width));
  const h = Math.max(1, Math.ceil(preview.height));
  const placed: Fit = fit === 'actual' || !room ? { scale: 1, anchored: false, clipRight: false, clipBottom: false } : fit === 'card' ? fitPreview({ w, h }, room, padding) : { scale: Math.min(1, (room.w - padding * 2) / w, (room.h - padding * 2) / h), anchored: false, clipRight: false, clipBottom: false };
  const { scale } = placed;
  const noCrop = preview.capturedReason === 'no-crop' && !cropKey;
  const key = preview.mode === 'live' ? (htmlKey ?? preview.htmlKey) : (cropKey ?? preview.cropKey);
  const src = base && key && !noCrop ? `${base.replace(/\/$/, '')}/${key}` : undefined;
  const paint = ground ?? 'var(--dse-surface-tint)';
  const cut = placed.clipRight || placed.clipBottom;
  const caption = noCrop
    ? P.noCrop
    : preview.capturedReason === 'hidden-until-focus' && !cropKey
      ? P.hiddenUntilFocus
      : src && showScale && room && scale < 0.995
        ? fill(cut ? P.scaleCut : P.scale, { scale: scaleText(scale) })
        : null;
  return (
    <div
      ref={box}
      className={`${styles.ground} ${fit === 'actual' ? styles.actual : ''} ${placed.anchored ? styles.anchored : ''}`}
      style={ground ? { background: ground } : undefined}
      data-ground={ground}
      data-scale={fit === 'card' ? scaleText(scale) : undefined}
      data-cut={cut || undefined}
    >
      {src ? (
        <div className={styles.scaled} style={{ width: w * scale, height: h * scale }}>
          <div data-fit style={{ width: w, height: h, transform: scale === 1 ? undefined : `scale(${scale})`, transformOrigin: 'top left' }}>
            <PreviewFrame key={`${src}|${reload ?? 0}`} mode={preview.mode === 'live' ? 'live' : 'captured'} src={src} title={title} width={w} height={h} lazy={lazy} />
          </div>
        </div>
      ) : noCrop && code ? (
        <CodeBlock code={code} label={title} copyable={false} className={styles.code} />
      ) : placeholder ? (
        <p className={styles.placeholder}>{placeholder}</p>
      ) : null}
      {placed.clipRight ? <span className={styles.fadeRight} style={{ background: `linear-gradient(to right, transparent, ${paint})` }} aria-hidden="true" /> : null}
      {placed.clipBottom ? <span className={styles.fadeBottom} style={{ background: `linear-gradient(to bottom, transparent, ${paint})` }} aria-hidden="true" /> : null}
      {preview.mode === 'captured' && showCaptured && !noCrop ? <span className={styles.captured}>{runPage.captured}</span> : null}
      {caption ? <span className={styles.scale}>{caption}</span> : null}
    </div>
  );
}
