'use client';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { global } from '../copy/strings';
import { useToast } from './Toast';
import styles from './CodeBlock.module.css';

/** Mono code on the tint ground, horizontal scroll, never wrapping, with a copy button. */
export function CodeBlock({ code, label, copyable = true, className }: { code: string; label?: string; copyable?: boolean; className?: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      toast.show(global.toasts.copied);
      setTimeout(() => setDone(false), 1600);
    } catch {
      // clipboard refused (insecure context); nothing to announce
    }
  }
  return (
    <div className={`${styles.block} ${className ?? ''}`}>
      <pre className={styles.pre} tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
      {copyable ? (
        <button type="button" className={styles.copy} aria-label={global.icons.copy} onClick={copy}>
          {done ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
