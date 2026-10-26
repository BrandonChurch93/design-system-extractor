'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Preview } from '@dse/schema';
import { runPage } from '../copy/strings';
import { PreviewFrame } from './PreviewFrame';
import styles from './FitPreview.module.css';

/** Where a local run has no image server, the caption that stands in for a crop or preview (/open). */
export const PreviewPlaceholder = createContext<string | undefined>(undefined);

/**
 * A component preview at 1:1, scaled down (never up) to fit its ground. The live preview is a
 * sandboxed frame at the size the render check measured; a captured one is its crop.
 */
export function FitPreview({ preview, base, title, padding = 16, htmlKey, showCaptured = true, lazy }: { preview: Preview; base?: string; title: string; padding?: number; htmlKey?: string; showCaptured?: boolean; lazy?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const placeholder = useContext(PreviewPlaceholder);
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setRoom({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const w = Math.max(1, Math.ceil(preview.width));
  const h = Math.max(1, Math.ceil(preview.height));
  const scale = room ? Math.min(1, (room.w - padding * 2) / w, (room.h - padding * 2) / h) : 1;
  const key = preview.mode === 'live' ? (htmlKey ?? preview.htmlKey) : preview.cropKey;
  const src = base && key ? `${base.replace(/\/$/, '')}/${key}` : undefined;
  return (
    <div ref={box} className={styles.ground}>
      {src ? (
        <div className={styles.scaled} style={{ width: w * scale, height: h * scale }}>
          <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <PreviewFrame mode={preview.mode === 'live' ? 'live' : 'captured'} src={src} title={title} width={w} height={h} lazy={lazy} />
          </div>
        </div>
      ) : placeholder ? (
        <p className={styles.placeholder}>{placeholder}</p>
      ) : null}
      {preview.mode === 'captured' && showCaptured ? <span className={styles.captured}>{runPage.captured}</span> : null}
    </div>
  );
}
