import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

/** A still block at the exact size of what replaces it. `on` is the ground it sits on. */
export function Skeleton({ width, height, on = 'bg', radius, className }: { width?: number | string; height: number | string; on?: 'bg' | 'surface'; radius?: 'sm' | 'md' | 'lg' | 'pill'; className?: string }) {
  const style: CSSProperties = { width: width ?? '100%', height, borderRadius: radius ? `var(--dse-radius-${radius})` : undefined };
  return <span aria-hidden="true" className={`${styles.skeleton} ${styles[on]} ${className ?? ''}`} style={style} />;
}
