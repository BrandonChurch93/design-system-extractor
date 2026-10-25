import type { ReactNode } from 'react';
import styles from './StateCard.module.css';

type StateCardProps = {
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  /** A CodeBlock, Meter, list or form. */
  detail?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  footer?: ReactNode;
  /** The title's heading level: h1 on a state page, h2 inside a run page. */
  level?: 1 | 2;
};

/** The blocked-state layout: 640 wide, centered, one primary action. */
export function StateCard({ eyebrow, title, body, detail, primary, secondary, footer, level = 1 }: StateCardProps) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <section className={styles.card} data-testid="chrome">
      <div className={styles.head}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <Heading className={styles.title}>{title}</Heading>
        {body ? <div className={styles.body}>{body}</div> : null}
      </div>
      {detail ? <div className={styles.detail}>{detail}</div> : null}
      {primary ? <div className={styles.primary}>{primary}</div> : null}
      {secondary ? <div className={styles.secondary}>{secondary}</div> : null}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </section>
  );
}
