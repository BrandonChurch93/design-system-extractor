'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { fill } from '@dse/schema/labels';
import { global, keyPopover as copy } from '../../copy/strings';
import { saveKey, savedKey } from '../../lib/browser-store';
import { Button } from '../Button';
import { Input } from '../Input';
import { Popover, usePopoverClose, type PopoverTriggerProps } from '../Popover';
import styles from './KeyPopover.module.css';

export const KEY_EVENT = 'dse-key-change';

/** The saved key, kept in step across every component that shows it. */
export function useSavedKey(): [string | null, (k: string | null) => void] {
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setKey(savedKey());
    sync();
    window.addEventListener(KEY_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(KEY_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const set = (k: string | null) => {
    saveKey(k);
    window.dispatchEvent(new Event(KEY_EVENT));
  };
  return [key, set];
}

/** The popover's body; the catalog shows it on its own. */
export function KeyForm({ byoPageCap }: { byoPageCap: number }) {
  const [key, setKey] = useSavedKey();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const close = usePopoverClose();
  if (key) {
    return (
      <div className={styles.body}>
        <p className={styles.saved}>
          <span>{copy.saved}</span>
          <span aria-hidden="true"> · </span>
          <button type="button" className={styles.remove} onClick={() => setKey(null)}>
            {copy.remove}
          </button>
        </p>
        <p className={styles.caption}>{fill(copy.caption, { byoPageCap })}</p>
      </div>
    );
  }
  return (
    <form
      className={styles.body}
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (!/^sk-ant-[A-Za-z0-9_-]+$/.test(v) || v.length > 200) {
          setError(global.validation);
          return;
        }
        setKey(v);
        setValue('');
        setError(undefined);
        close();
      }}
    >
      <Input label={copy.label} type="password" autoComplete="off" spellCheck={false} placeholder={copy.placeholder} value={value} onChange={(e) => setValue(e.target.value)} error={error} />
      <Button type="submit" variant="primary" size="sm">
        {copy.save}
      </Button>
      <p className={styles.caption}>{fill(copy.caption, { byoPageCap })}</p>
    </form>
  );
}

/** The 360-wide key popover (docs/design/components.md, KeyPopover). */
export function KeyPopover({ byoPageCap, trigger, defaultOpen }: { byoPageCap: number; trigger: (p: PopoverTriggerProps) => ReactNode; defaultOpen?: boolean }) {
  return (
    <Popover label={copy.label} width={360} trigger={trigger} defaultOpen={defaultOpen}>
      <KeyForm byoPageCap={byoPageCap} />
    </Popover>
  );
}
