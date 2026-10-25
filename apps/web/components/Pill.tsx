import type { ReactNode } from 'react';
import styles from './Pill.module.css';

export type PillVariant = 'solid' | 'soft' | 'inverse';

/** A status marker: Complete, New, Deterministic, Model · Haiku. Not a Tag, not a Chip. */
export function Pill({ variant = 'soft', children }: { variant?: PillVariant; children: ReactNode }) {
  return <span className={`${styles.pill} ${styles[variant]}`}>{children}</span>;
}
