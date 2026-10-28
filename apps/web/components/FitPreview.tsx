'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Preview } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../copy/strings';
import { PreviewFrame } from './PreviewFrame';
import styles from './FitPreview.module.css';

/** Where a local run has no image server, the caption that stands in for a crop or preview (/open). */
export const PreviewPlaceholder = createContext<string | undefined>(undefined);

/**
 * A component preview at 1:1, scaled down (never up) to fit its ground. The live preview is a
 * sandboxed frame at the size the render check measured; a captured one is its crop.
 */
/** The scale written as copy says: two decimals at most, trailing zeros dropped (`0.8`, `0.65`). */
export const scaleText = (scale: number) => String(Math.floor(scale * 100) / 100);

export function FitPreview({ preview, base, title, padding = 16, htmlKey, cropKey, showCaptured = true, lazy, ground, showScale = true, reload }: { preview: Preview; base?: string; title: string; padding?: number; htmlKey?: string; /** A state's crop in place of the default one. */ cropKey?: string; showCaptured?: boolean; lazy?: boolean; /** The color painted behind the preview (D-094); the parent's ground when absent. */ ground?: string; showScale?: boolean; /** Changes to load the frame again (a replayed state). */ reload?: number }) {
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
  const key = preview.mode === 'live' ? (htmlKey ?? preview.htmlKey) : (cropKey ?? preview.cropKey);
  const src = base && key ? `${base.replace(/\/$/, '')}/${key}` : undefined;
  return (
    <div ref={box} className={styles.ground} style={ground ? { background: ground } : undefined} data-ground={ground}>
      {src ? (
        <div className={styles.scaled} style={{ width: w * scale, height: h * scale }}>
          <div data-fit style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <PreviewFrame key={`${src}|${reload ?? 0}`} mode={preview.mode === 'live' ? 'live' : 'captured'} src={src} title={title} width={w} height={h} lazy={lazy} />
          </div>
        </div>
      ) : placeholder ? (
        <p className={styles.placeholder}>{placeholder}</p>
      ) : null}
      {preview.mode === 'captured' && showCaptured ? <span className={styles.captured}>{runPage.captured}</span> : null}
      {src && showScale && room && scale < 0.995 ? <span className={styles.scale}>{fill(runPage.preview.scale, { scale: scaleText(scale) })}</span> : null}
    </div>
  );
}
