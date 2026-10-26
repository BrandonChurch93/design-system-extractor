'use client';
import type { Check, RunDocumentPartial } from '@dse/schema';
import { checkDescriptions, checkLabels, fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { Card } from '../Card';
import { Popover } from '../Popover';
import { Skeleton } from '../Skeleton';
import { Enter } from '../motion/Enter';
import { Section } from './Section';
import { StatStrip } from './StatStrip';
import styles from './ChecksSection.module.css';

const K = runPage.checks;

/** Automated checks: the summary strip and one row per check (docs/design/components.md). */
export function ChecksSection({ doc }: { doc: RunDocumentPartial }) {
  const checks = doc.checks;
  const comps = doc.components ?? [];
  const failingFor = (check: Check) =>
    comps.flatMap((c) => c.checks.filter((r) => r.check === check && r.status === 'fail').map((r) => fill(K.failing, { component: c.name, detail: r.detail })));
  return (
    <Section id="checks" title={K.heading} caption={K.disclaimer}>
      {checks ? (
        <>
          <StatStrip
            cells={[
              { label: K.passed, value: checks.summary.passed },
              { label: K.failed, value: checks.summary.failed },
              { label: K.applicable, value: checks.summary.applicable },
            ]}
            caption={fill(K.summaryCaption, { components: count(comps.length) })}
          />
          <Card className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{K.headers.check}</th>
                  <th scope="col">{K.headers.measures}</th>
                  <th scope="col">{K.headers.passed}</th>
                  <th scope="col">{K.headers.failing}</th>
                </tr>
              </thead>
              <tbody>
                {checks.byCheck.map((b, i) => {
                  const failing = failingFor(b.check);
                  return (
                    <tr key={b.check} className={styles.row}>
                      <th scope="row" className={styles.check}>
                        <Enter as="span" move="wipe" index={i}>
                          {checkLabels[b.check]}
                        </Enter>
                      </th>
                      <td className={styles.measures}>{checkDescriptions[b.check]}</td>
                      <td className={styles.passed}>{fill(runPage.components.badge, { passed: count(b.passed), applicable: count(b.applicable) })}</td>
                      <td className={styles.failing}>
                        {failing.length ? (
                          <>
                            {failing.slice(0, 3).join(' · ')}
                            {failing.length > 3 ? (
                              <>
                                {' '}
                                <Popover
                                  label={checkLabels[b.check]}
                                  width={420}
                                  trigger={(t) => (
                                    <button type="button" className={styles.more} {...t}>
                                      {fill(K.more, { n: count(failing.length - 3) })}
                                    </button>
                                  )}
                                >
                                  <ul className={styles.moreList}>
                                    {failing.map((f, j) => (
                                      <li key={`${f}-${j}`}>{f}</li>
                                    ))}
                                  </ul>
                                </Popover>
                              </>
                            ) : null}
                          </>
                        ) : (
                          <span className={styles.none}>{K.none}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <>
          <Skeleton height={112} radius="lg" />
          <Skeleton height={320} radius="lg" />
        </>
      )}
    </Section>
  );
}
