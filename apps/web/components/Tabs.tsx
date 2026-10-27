'use client';
import { motion } from 'motion/react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { duration, ease } from '../lib/motion';
import { usePrefersReducedMotion } from '../lib/motion/reduced';
import styles from './Tabs.module.css';

export type TabItem<T extends string> = { value: T; label: string; panel: ReactNode };

type TabsProps<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  forceFocus?: T;
};

/** Text tabs switching content in place; the underline slides between tabs. */
export function Tabs<T extends string>({ items, value, onChange, label, forceFocus }: TabsProps<T>) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = items.findIndex((t) => t.value === value);
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    const item = items[next];
    if (!item) return;
    onChange(item.value);
    refs.current[next]?.focus();
  }

  const active = items.find((t) => t.value === value) ?? items[0];
  return (
    <div className={styles.tabs}>
      <div role="tablist" aria-label={label} className={styles.list} onKeyDown={onKeyDown}>
        {items.map((t, i) => {
          const selected = t.value === value;
          return (
            <button
              key={t.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${t.value}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.value}`}
              tabIndex={selected ? 0 : -1}
              className={styles.tab}
              data-force={forceFocus === t.value ? 'focus' : undefined}
              onClick={() => onChange(t.value)}
            >
              {t.label}
              {selected ? (
                // Reduced motion: the underline only appears under the tab, so it never takes part in layout projection.
                reduced ? (
                  <span className={styles.underline} />
                ) : (
                  <motion.span layoutId={`${base}-underline`} className={styles.underline} transition={{ duration: duration.base, ease: ease.standard }} />
                )
              ) : null}
            </button>
          );
        })}
      </div>
      {active ? (
        <div role="tabpanel" id={`${base}-panel-${active.value}`} aria-labelledby={`${base}-tab-${active.value}`} className={styles.panel} tabIndex={0}>
          {active.panel}
        </div>
      ) : null}
    </div>
  );
}
