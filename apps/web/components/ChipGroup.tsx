'use client';
import { useRef, type KeyboardEvent } from 'react';
import styles from './ChipGroup.module.css';

export type ChipOption<T extends string> = { value: T; label: string; count?: number };

type ChipGroupProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  /** Catalog only. */
  forceState?: { value: T; state: 'hover' | 'focus' };
};

/** A single-select radio group of Chips with arrow-key movement and a roving tab stop. */
export function ChipGroup<T extends string>({ options, value, onChange, label, className, forceState }: ChipGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = options.findIndex((o) => o.value === value);
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % options.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + options.length) % options.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    else return;
    e.preventDefault();
    const opt = options[next];
    if (!opt) return;
    onChange(opt.value);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} className={`${styles.group} ${className ?? ''}`} onKeyDown={onKeyDown}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={styles.chip}
            data-force={forceState?.value === o.value ? forceState.state : undefined}
            onClick={() => onChange(o.value)}
          >
            <span>{o.label}</span>
            {o.count !== undefined ? (
              <>
                <span aria-hidden="true">·</span>
                <span className={styles.count}>{o.count}</span>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** A Chip that toggles on its own, beside a ChipGroup and not part of its radio group. */
export function ToggleChip({ label, pressed, onChange }: { label: string; pressed: boolean; onChange: (pressed: boolean) => void }) {
  return (
    <button type="button" className={styles.chip} aria-pressed={pressed} onClick={() => onChange(!pressed)}>
      {label}
    </button>
  );
}
