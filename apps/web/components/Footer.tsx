import Link from 'next/link';
import type { ReactNode } from 'react';
import { links } from '../copy/links';
import { global } from '../copy/strings';
import styles from './Footer.module.css';

/** Two lines above a rule; the right side carries context the page supplies. */
export function Footer({ context }: { context?: ReactNode }) {
  const f = global.footer;
  const [before] = f.openSource.split(f.builtBy);
  return (
    <footer className={styles.footer} data-testid="chrome">
      <div className={styles.inner}>
        <div className={styles.left}>
          <p>
            {before}
            <a href={links.portfolio} className={styles.link} target="_blank" rel="noopener noreferrer">
              {f.builtBy}
            </a>
          </p>
          <p>
            <Link href="/about" className={styles.link}>
              {f.about}
            </Link>
            {' · '}
            <Link href="/privacy" className={styles.link}>
              {f.privacy}
            </Link>
            {' · '}
            <Link href="/terms" className={styles.link}>
              {f.terms}
            </Link>
            {' · '}
            <Link href="/catalog" className={styles.link}>
              {f.builtWith}
            </Link>
          </p>
        </div>
        {context ? <div className={styles.right}>{context}</div> : null}
      </div>
    </footer>
  );
}
