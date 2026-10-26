'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { global, home } from '../../copy/strings';
import { normalizeUrl, submitRun } from '../../lib/submit-run';
import { Button } from '../Button';
import { Input } from '../Input';
import styles from './StateView.module.css';

/** An input prefilled with the attempted address and one action that runs it again. */
export function RetryForm({ initial, label, keyMode }: { initial: string; label: string; keyMode?: { keyLabel: string; placeholder: string; onKey: (k: string) => void } }) {
  const router = useRouter();
  const [url, setUrl] = useState(initial);
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={styles.retry}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setError(undefined);
        const n = normalizeUrl(url);
        if ('error' in n) return setError(home.errors[n.error]);
        let byo: string | undefined;
        if (keyMode) {
          const k = key.trim();
          if (!/^sk-ant-[A-Za-z0-9_-]+$/.test(k) || k.length > 200) return setError(global.validation);
          keyMode.onKey(k);
          byo = k;
        }
        setBusy(true);
        const out = await submitRun(n.url, [], byo);
        if ('go' in out) router.push(out.go);
        else {
          setError(out.error);
          setBusy(false);
        }
      }}
    >
      {keyMode ? (
        <Input label={keyMode.keyLabel} type="password" autoComplete="off" spellCheck={false} placeholder={keyMode.placeholder} value={key} onChange={(e) => setKey(e.target.value)} />
      ) : (
        <Input label={home.inputLabel} hideLabel type="url" inputMode="url" spellCheck={false} placeholder={home.placeholder} value={url} onChange={(e) => setUrl(e.target.value)} error={error} />
      )}
      <Button type="submit" variant="primary" disabled={busy}>
        {label}
      </Button>
      {keyMode && error ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
}
