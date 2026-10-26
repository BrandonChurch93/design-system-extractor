import { Fragment } from 'react';
import { fill } from '@dse/schema/labels';
import { howItWorks as H } from '../../copy/strings';
import results from '../../../../fixtures/results.json';
import styles from './HowItWorks.module.css';

type Metrics = { tokens?: { precision: number; recall: number }; components?: { precision: number; recall: number }; liveRate?: { live: number; total: number } };
const order = ['clean', 'messy', 'tailwind', 'css-in-js', 'library'] as const;
const pr = (m?: { precision: number; recall: number }) => (m ? fill(H.testing.precisionRecall, { p: m.precision.toFixed(2), r: m.recall.toFixed(2) }) : '');

/** A narrow cell wraps at the interpunct, never inside "precision 1.00". */
function Pairs({ text }: { text: string }) {
  const parts = text.split(' · ');
  return parts.map((t, i) => (
    <Fragment key={t}>
      <span className={styles.nowrap}>{i < parts.length - 1 ? `${t} ·` : t}</span>
      {i < parts.length - 1 ? ' ' : null}
    </Fragment>
  ));
}

/** The current build's eval numbers, read from fixtures/results.json, never typed by hand. */
export function EvalTable() {
  const byName = new Map((results.fixtures as { name: string; metrics: Metrics }[]).map((f) => [f.name, f.metrics]));
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{H.testing.headers.fixture}</th>
            <th scope="col">{H.testing.headers.proves}</th>
            <th scope="col">{H.testing.headers.tokens}</th>
            <th scope="col">{H.testing.headers.components}</th>
            <th scope="col">{H.testing.headers.live}</th>
          </tr>
        </thead>
        <tbody>
          {order.map((name) => {
            const m = byName.get(name);
            const row = H.testing.rows[name];
            return (
              <tr key={name}>
                <th scope="row">{row.name}</th>
                <td>{row.proves}</td>
                <td className={styles.mono} data-label={H.testing.headers.tokens}>
                  <Pairs text={pr(m?.tokens)} />
                </td>
                <td className={styles.mono} data-label={H.testing.headers.components}>
                  <Pairs text={pr(m?.components)} />
                </td>
                <td className={styles.mono} data-label={H.testing.headers.live}>
                  {m?.liveRate ? <span className={styles.nowrap}>{fill(H.testing.liveOf, { live: m.liveRate.live, total: m.liveRate.total })}</span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
