import { CircleAlert } from 'lucide-react';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

type InputProps = {
  label: string;
  /** The design shows no visible label; the label element stays for screen readers. */
  hideLabel?: boolean;
  size?: 'md' | 'xl';
  error?: string;
  className?: string;
  forceState?: 'hover' | 'focus';
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel, size = 'md', error, className, forceState, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const errorId = `${inputId}-error`;
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label htmlFor={inputId} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`${styles.input} ${styles[size]}`}
        data-force={forceState}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error ? (
        <p id={errorId} className={styles.error}>
          <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});
