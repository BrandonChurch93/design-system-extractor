import { byoLimitsFrom, planLimits } from '@dse/schema';
import { home } from '../copy/strings';
import { PageShell } from '../components/PageShell';
import { Showcase } from '../components/home/Showcase';
import { UrlForm } from '../components/home/UrlForm';
import { getShowcaseContent } from '../lib/showcase';
import styles from './home.module.css';

export default async function Home() {
  const content = await getShowcaseContent();
  const free = planLimits('free');
  return (
    <PageShell footer={home.footer}>
      <section className={styles.hero} aria-labelledby="home-title" data-testid="chrome">
        <h1 id="home-title" className={styles.headline}>
          {home.headline}
        </h1>
        <p className={styles.subline}>{home.subline}</p>
        <UrlForm runsPerDay={free.runsPerDay} pageCap={free.pageCap} byoPageCap={byoLimitsFrom().pageCap} />
      </section>
      <Showcase entries={content.entries} />
    </PageShell>
  );
}
