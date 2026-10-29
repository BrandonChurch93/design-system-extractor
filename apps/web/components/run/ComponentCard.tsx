'use client';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import type { Component } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { revealContentVariants } from '../../lib/motion';
import { contrastFallback } from '../../lib/ground';
import { FitPreview } from '../FitPreview';
import { GroundToggle, paintFor, type Ground } from '../GroundToggle';
import { Tag } from '../Tag';
import { CheckBadge } from './CheckBadge';
import { StatesStrip } from './StatesStrip';
import styles from './ComponentCard.module.css';

export function sourceLine(c: Component, firstPath: string): string {
  const C = runPage.components;
  const pages = c.provenance.pages.length;
  const variants = c.variants.length;
  return C.source
    .replace('{path}', firstPath)
    .replace('{pages} pages', pages === 1 ? C.onePage : `${count(pages)} pages`)
    .replace('{variants} variants', variants === 1 ? C.oneVariant : `${count(variants)} variants`);
}

type Props = {
  component: Component;
  href: string;
  base?: string;
  tokens: string[];
  /** The card that opened the panel keeps a ring that fades, so the eye connects them. */
  opened?: boolean;
  reveal?: boolean;
  onOpen?: () => void;
};

/** A component: its preview, name, check badge, source line, states and up to four tokens. */
export function ComponentCard({ component: c, href, base, tokens, opened, reveal, onOpen }: Props) {
  const site = c.preview.ground ?? c.ground;
  // A ground that matches the component's own fill starts on the opposite tone (D-109).
  const [ground, setGround] = useState<Ground>(() => contrastFallback(c.preview.fill, site) ?? 'site');
  const paint = paintFor(ground, site);
  return (
    <article className={styles.card} data-opened={opened || undefined} data-testid="component-card">
      <div className={styles.preview} style={paint ? { background: paint } : undefined} data-testid="card-preview">
        <FitPreview preview={c.preview} base={base} title={fill(runPage.previewTitle, { name: c.name })} lazy ground={paint} fit="card" code={c.code.html} />
        <GroundToggle value={ground} onChange={setGround} size="sm" className={styles.ground} />
      </div>
      {/* On touch the whole card opens the drawer (D-106). The body's reveal clips its own overlay to the body, so the card carries this one; the name link is the one a reader reaches. */}
      <Link href={href} scroll={false} className={styles.cover} tabIndex={-1} aria-hidden="true" onClick={(e) => {
        if (onOpen) {
          e.preventDefault();
          onOpen();
        }
      }} />
      <motion.div className={styles.body} variants={reveal ? revealContentVariants() : undefined}>
        <div className={styles.head}>
          <h3 className={styles.name}>
            <Link
              href={href}
              scroll={false}
              className={styles.link}
              onClick={(e) => {
                if (onOpen) {
                  e.preventDefault();
                  onOpen();
                }
              }}
            >
              {c.name}
            </Link>
          </h3>
          <CheckBadge checks={c.checks} name={c.name} />
        </div>
        <p className={styles.source}>{sourceLine(c, c.provenance.firstSeen.path)}</p>
        <StatesStrip states={c.states} base={base} name={c.name} />
        {tokens.length ? (
          <div className={styles.tags}>
            {tokens.slice(0, 4).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        ) : null}
      </motion.div>
    </article>
  );
}

export function cardTokens(c: Component, names: Map<string, { name: string }>): string[] {
  return [...new Set(c.tokensUsed.map((u) => names.get(u.tokenId)?.name).filter((n): n is string => Boolean(n)))];
}

