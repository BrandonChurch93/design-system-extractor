import type { Metadata } from 'next';
import { pageMeta } from '../../lib/meta';
import { fill } from '@dse/schema/labels';
import { CatalogView } from '../../components/catalog/CatalogView';
import { Footer } from '../../components/Footer';
import { Meter } from '../../components/Meter';
import { TopNav } from '../../components/TopNav';
import { catalog, meta } from '../../copy/strings';
import { readDevSpend } from '../../lib/dev-spend';
import layout from '../../styles/layout.module.css';
import styles from './page.module.css';

export const metadata: Metadata = pageMeta({ title: meta.catalog.title, description: meta.catalog.description, index: false });

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
