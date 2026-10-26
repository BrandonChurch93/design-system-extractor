import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { TopNav } from './TopNav';
import styles from './PageShell.module.css';

/** TopNav, the page in the content column, and the Footer with the page's context line. */
export function PageShell({ children, footer, narrow, className }: { children: ReactNode; footer?: ReactNode; narrow?: boolean; className?: string }) {
  return (
    <>
      <TopNav />
      <main id="main" className={[styles.main, narrow ? styles.narrow : '', className ?? ''].filter(Boolean).join(' ')}>
        {children}
      </main>
      <Footer context={footer} />
    </>
  );
}
