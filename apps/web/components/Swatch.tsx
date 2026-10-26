import { isNearWhite } from '@dse/pipeline/color';
import type { ButtonHTMLAttributes, Ref } from 'react';
import styles from './Swatch.module.css';

export type SwatchSize = 'xl' | 'token' | 'mini';

type SwatchProps = {
  value: string;
  size?: SwatchSize;
  /** "navy · 412 uses" under xl and token sizes. */
  caption?: string;
  /** Shown under mini when the caller wants the hex only. */
  showHex?: boolean;
  forceState?: 'hover' | 'focus';
  ref?: Ref<HTMLButtonElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

/** An extracted color, unadjusted. A button that opens the token's popover. */
export function Swatch({ value, size = 'xl', caption, showHex = size !== 'mini', forceState, className, type = 'button', ...rest }: SwatchProps) {
  const edge = isNearWhite(value);
  return (
    <button type={type} className={`${styles.swatch} ${styles[size]} ${className ?? ''}`} data-force={forceState} {...rest}>
      <span className={`${styles.chip} ${edge ? styles.edge : ''}`} style={{ background: value }} />
      {showHex || caption ? (
        <span className={styles.text}>
          {showHex ? <span className={styles.hex}>{value.toUpperCase()}</span> : null}
          {caption ? <span className={styles.caption}>{caption}</span> : null}
        </span>
      ) : null}
    </button>
  );
}
