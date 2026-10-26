import type { Metadata } from 'next';
import { Button } from '../components/Button';
import { PageShell } from '../components/PageShell';
import { StateCard } from '../components/StateCard';
import { global } from '../copy/strings';
import styles from './state.module.css';

export const metadata: Metadata = { robots: { index: false } };

export default function NotFound() {
  return (
    <PageShell>
      <div className={styles.center}>
        <StateCard
          title={global.notFound.title}
          body={global.notFound.body}
          primary={
            <Button variant="primary" href="/">
              {global.notFound.action}
            </Button>
          }
        />
      </div>
    </PageShell>
  );
}
