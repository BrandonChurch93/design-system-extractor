import type { Metadata } from 'next';
import { fill } from '@dse/schema/labels';
import { CatalogView } from '../../components/catalog/CatalogView';
import { Footer } from '../../components/Footer';
import { Meter } from '../../components/Meter';
import { TopNav } from '../../components/TopNav';
import { catalog } from '../../copy/strings';
import { readDevSpend } from '../../lib/dev-spend';
import layout from '../../styles/layout.module.css';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: `${catalog.title} · Design System Extractor`,
  description: 'Every component of the app, in every state.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const usd = (n: number) => `$${n.toFixed(2)}`;

export default function CatalogPage() {
  const spend = readDevSpend();
  return (
    <>
      <TopNav />
      <main className={`${layout.container} ${styles.main}`}>
        <header className={styles.header}>
          {spend ? (
            <div className={styles.dev} data-qa-mask="dev-spend">
              <span>{fill(catalog.devLine, { used: usd(spend.usedUsd), cap: usd(spend.capUsd) })}</span>
              <Meter value={spend.usedUsd} max={spend.capUsd} label={fill(catalog.devLine, { used: usd(spend.usedUsd), cap: usd(spend.capUsd) })} animate={false} />
            </div>
          ) : null}
          <h1 className={styles.title}>{catalog.title}</h1>
          <p className={styles.caption}>{catalog.caption}</p>
        </header>
        <CatalogView />
      </main>
      <Footer />
    </>
  );
}
