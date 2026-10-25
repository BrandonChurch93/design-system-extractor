'use client';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { links } from '../copy/links';
import { global } from '../copy/strings';
import { drawVariants, variantsFor } from '../lib/motion';
import { usePrefersReducedMotion } from '../lib/motion/reduced';
import styles from './TopNav.module.css';

const items = [
  { href: '/#showcase', label: global.nav.showcase, match: '/' },
  { href: '/recent', label: global.nav.recent, match: '/recent' },
  { href: '/how-it-works', label: global.nav.howItWorks, match: '/how-it-works' },
  { href: links.repository, label: global.nav.github, external: true },
];

/** The wordmark and the four links. Not sticky. Phone: a menu button opens a disclosure list. */
export function TopNav({ extra, forceMenuOpen }: { extra?: React.ReactNode; forceMenuOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(forceMenuOpen));
  const pathname = usePathname();
  const [shownFor, setShownFor] = useState(pathname);
  const reduced = usePrefersReducedMotion();
  if (pathname !== shownFor) {
    setShownFor(pathname);
    setOpen(false);
  }

  const linkList = (cls: string | undefined) =>
    items.map((i) =>
      i.external ? (
        <a key={i.label} href={i.href} className={cls} target="_blank" rel="noopener noreferrer">
          {i.label}
        </a>
      ) : (
        <Link key={i.label} href={i.href} className={cls} aria-current={i.match && pathname === i.match && i.match !== '/' ? 'page' : undefined}>
          {i.label}
        </Link>
      ),
    );

  return (
    <header className={styles.header} data-testid="chrome">
      <div className={styles.bar}>
        <Link href="/" className={styles.wordmark}>
          {global.wordmark}
        </Link>
        <nav aria-label={global.navLabel} className={styles.links}>
          {linkList(styles.link)}
          {extra}
        </nav>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={global.icons.menu}
          aria-expanded={open}
          aria-controls="dse-nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} strokeWidth={1.75} aria-hidden="true" /> : <Menu size={20} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.nav
            id="dse-nav-menu"
            aria-label={global.navLabel}
            className={styles.menu}
            variants={variantsFor('slide', reduced, { edge: 'top', d: 0.26 })}
            initial="hidden"
            animate="shown"
            exit="exit"
          >
            {linkList(styles.menuLink)}
            {extra}
          </motion.nav>
        ) : null}
      </AnimatePresence>
      <motion.span className={styles.rule} aria-hidden="true" data-move="draw" variants={drawVariants(0.6)} initial="hidden" animate="shown" />
    </header>
  );
}
