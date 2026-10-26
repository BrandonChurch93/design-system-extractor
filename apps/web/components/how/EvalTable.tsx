import { fill } from '@dse/schema/labels';
import { howItWorks as H } from '../../copy/strings';
import results from '../../../../fixtures/results.json';
import styles from './HowItWorks.module.css';

type Metrics = { tokens?: { precision: number; recall: number }; components?: { precision: number; recall: number }; liveRate?: { live: number; total: number } };
const order = ['clean', 'messy', 'tailwind', 'css-in-js', 'library'] as const;
const pr = (m?: { precision: number; recall: number }) => (m ? fill(H.testing.precisionRecall, { p: m.precision.toFixed(2), r: m.recall.toFixed(2) }) : '');

/** The current build's eval numbers, read from fixtures/results.json, never typed by hand. */
export function EvalTable() {
  const byName = new Map((results.fixtures as { name: string; metrics: Metrics }[]).map((f) => [f.name, f.metrics]));
  return (
    <div>
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
                <td className={styles.mono}>{pr(m?.tokens)}</td>
                <td className={styles.mono}>{pr(m?.components)}</td>
                <td className={styles.mono}>{m?.liveRate ? fill(H.testing.liveOf, { live: m.liveRate.live, total: m.liveRate.total }) : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
