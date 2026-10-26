import { runPage } from '../../copy/strings';
import { Pill } from '../Pill';
import { Enter } from '../motion/Enter';
import styles from './HowItWorks.module.css';

/** A numbered step with who does it: deterministic code, or a model (docs/design/components.md). */
export function PipelineStep({ n, name, body, who, index }: { n: number; name: string; body: string; who: string; index: number }) {
  return (
    <li className={styles.step}>
      {index > 0 ? <Enter move="draw" className={styles.stepRule} aria-hidden /> : null}
      <div className={styles.stepRow}>
        <span className={styles.ring} aria-hidden="true">
          {n}
        </span>
        <div className={styles.stepText}>
          <h3 className={styles.stepName}>{name}</h3>
          <p className={styles.stepBody}>{body}</p>
        </div>
        <Pill variant={who === runPage.deterministic ? 'soft' : 'inverse'}>{who}</Pill>
      </div>
    </li>
  );
}
