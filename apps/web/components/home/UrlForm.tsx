'use client';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { fill } from '@dse/schema/labels';
import { home } from '../../copy/strings';
import { variantsFor } from '../../lib/motion';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { normalizeUrl, submitRun } from '../../lib/submit-run';
import { Button } from '../Button';
import { Input } from '../Input';
import { KeyPopover } from './KeyPopover';
import styles from './UrlForm.module.css';

type Props = { runsPerDay: number; pageCap: number; byoPageCap: number; initialUrl?: string };

/** The URL field, the Extract button, the caps caption and the added-pages disclosure. */
export function UrlForm({ runsPerDay, pageCap, byoPageCap, initialUrl = '' }: Props) {
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const [url, setUrl] = useState(initialUrl);
  const [includeOpen, setIncludeOpen] = useState(false);
  const [include, setInclude] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [includeError, setIncludeError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const includeId = useId();
  const includeErrorId = `${includeId}-error`;

  const caps = fill(home.caps, { runsPerDay, pageCap });
  const [before, after] = caps.split(home.capsKey);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setIncludeError(undefined);
    const main = normalizeUrl(url);
    if ('error' in main) return setError(home.errors[main.error]);
    const host = new URL(main.url).host.replace(/^www\./, '');
    const lines = include.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 5);
    const pages: string[] = [];
    for (const line of lines) {
      const r = normalizeUrl(line);
      if ('error' in r) return setIncludeError(home.errors[r.error]);
      if (new URL(r.url).host.replace(/^www\./, '') !== host) return setIncludeError(home.errors.otherHost);
      pages.push(r.url);
    }
    setBusy(true);
    const out = await submitRun(main.url, pages);
    if ('go' in out) router.push(out.go);
    else {
      setError(out.error);
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.row}>
        <Input
          label={home.inputLabel}
          hideLabel
          size="xl"
          className={styles.field}
          type="url"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder={home.placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={error}
        />
        <Button type="submit" variant="primary" size="xl" className={styles.extract} disabled={busy}>
          {home.extract}
        </Button>
      </div>
      <p className={styles.caps}>
        {before}
        <KeyPopover
          byoPageCap={byoPageCap}
          trigger={(t) => (
            <button type="button" className={styles.keyButton} {...t}>
              {home.capsKey}
            </button>
          )}
        />
        {after}
      </p>
      <button type="button" className={styles.disclosure} aria-expanded={includeOpen} aria-controls={includeId} onClick={() => setIncludeOpen((o) => !o)}>
        <span>{home.include.toggle}</span>
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className={includeOpen ? styles.chevronOpen : styles.chevron} />
      </button>
      <AnimatePresence initial={false}>
        {includeOpen ? (
          <motion.div key="include" id={includeId} className={styles.include} variants={variantsFor('slide', reduced, { edge: 'top', d: 0.26 })} initial="hidden" animate="shown" exit="exit">
            <label htmlFor={`${includeId}-text`} className="visually-hidden">
              {home.include.toggle}
            </label>
            <textarea
              id={`${includeId}-text`}
              className={styles.textarea}
              rows={3}
              spellCheck={false}
              placeholder={home.include.placeholder}
              value={include}
              onChange={(e) => setInclude(e.target.value)}
              aria-invalid={includeError ? true : undefined}
              aria-describedby={includeError ? includeErrorId : `${includeId}-caption`}
            />
            {includeError ? (
              <p id={includeErrorId} className={styles.error}>
                <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>{includeError}</span>
              </p>
            ) : null}
            <p id={`${includeId}-caption`} className={styles.includeCaption}>
              {home.include.caption}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
