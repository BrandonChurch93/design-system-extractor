import { PageShell } from '../../../components/PageShell';
import { StateCard } from '../../../components/StateCard';
import { Button } from '../../../components/Button';
import { runPage, statePages } from '../../../copy/strings';
import styles from '../../state.module.css';

export default function RunNotFound() {
  return (
    <PageShell>
      <div className={styles.center}>
        <StateCard
          title={runPage.notFound}
          primary={
            <Button variant="primary" href="/">
              {statePages.browseShowcase}
            </Button>
          }
        />
      </div>
    </PageShell>
  );
}
