import { byoLimitsFrom, planLimits } from '@dse/schema';
import { home } from '../copy/strings';
import { PageShell } from '../components/PageShell';
import { Showcase } from '../components/home/Showcase';
import { UrlForm } from '../components/home/UrlForm';
import { PricingSection } from '../components/v2/PricingSection';
import { billingEnabled } from '../lib/flags';
import { currentSession } from '../lib/server/session';
import { getShowcaseContent } from '../lib/showcase';
import styles from './home.module.css';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [content, sp] = await Promise.all([getShowcaseContent(), searchParams]);
  const free = planLimits('free');
  return (
    <PageShell footer={home.footer}>
      <section className={styles.hero} aria-labelledby="home-title" data-testid="chrome">
        <h1 id="home-title" className={styles.headline}>
          {home.headline}
        </h1>
        <p className={styles.subline}>{home.subline}</p>
        <UrlForm runsPerDay={free.runsPerDay} pageCap={free.pageCap} byoPageCap={byoLimitsFrom().pageCap} initialUrl={typeof sp.url === 'string' ? sp.url : ''} />
      </section>
      <Showcase entries={content.entries} />
      {billingEnabled() ? <PricingSection limits={{ free, pro: planLimits('pro'), team: planLimits('team') }} session={await currentSession()} /> : null}
    </PageShell>
  );
}
