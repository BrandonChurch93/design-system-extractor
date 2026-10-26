import type { Metadata } from 'next';
import { byoLimitsFrom, planLimits } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CodeBlock } from '../../components/CodeBlock';
import { PageShell } from '../../components/PageShell';
import { EvalTable } from '../../components/how/EvalTable';
import { PipelineStep } from '../../components/how/PipelineStep';
import { links } from '../../copy/links';
import { howItWorks as H, meta } from '../../copy/strings';
import { numberWord } from '../../lib/format';
import styles from '../../components/how/HowItWorks.module.css';

export const metadata: Metadata = { title: meta.howItWorks.title, description: meta.howItWorks.description };

export default function HowItWorksPage() {
  const free = planLimits('free');
  const byo = byoLimitsFrom();
  return (
    <PageShell footer={H.footer}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{H.title}</h1>
          <p className={styles.intro}>{H.intro}</p>
        </header>
        <section className={styles.section} aria-labelledby="pipeline">
          <h2 id="pipeline" className={styles.h2}>
            {H.pipeline}
          </h2>
          <Card className={styles.pipeline} id="crawl">
            <ol>
              {H.steps.map((s, i) => (
                <PipelineStep key={s.name} n={i + 1} index={i} name={s.name} body={s.body} who={s.who} />
              ))}
            </ol>
          </Card>
        </section>
        <div className={styles.pair}>
          <Card className={styles.prose}>
            <h2 className={styles.h3}>{H.cost.title}</h2>
            <p>{fill(H.cost.body, { runsPerDay: numberWord(free.runsPerDay), pageCap: free.pageCap })}</p>
            <p>{fill(H.cost.key, { byoPageCap: byo.pageCap })}</p>
            <CodeBlock code={H.cost.routing} copyable={false} label={H.cost.title} />
          </Card>
          <Card className={styles.prose}>
            <h2 className={styles.h3}>{H.checks.title}</h2>
            <p>{H.checks.body}</p>
            <p>{H.checks.body2}</p>
          </Card>
        </div>
        <section className={styles.section} aria-labelledby="testing">
          <h2 id="testing" className={styles.h2}>
            {H.testing.heading}
          </h2>
          <Card className={styles.tableCard}>
            <EvalTable />
          </Card>
          <p className={styles.caption}>{H.testing.caption}</p>
        </section>
        <section className={styles.section} id="cli" aria-labelledby="cli-title">
          <h2 id="cli-title" className={styles.h2}>
            {H.cli.heading}
          </h2>
          <CodeBlock code={H.cliCode} label={H.cli.heading} />
          <p className={styles.caption}>{H.cli.caption}</p>
        </section>
        <section className={styles.section} id="mcp" aria-labelledby="mcp-title">
          <h2 id="mcp-title" className={styles.h2}>
            {H.mcp.heading}
          </h2>
          <p className={styles.caption}>{H.mcp.caption}</p>
          <CodeBlock code={H.mcpCode} label={H.mcp.heading} />
        </section>
        <div className={styles.buttons}>
          <Button variant="primary" href={links.repository} external>
            {H.buttons.source}
          </Button>
          <Button variant="ghost" href="/">
            {H.buttons.try}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
