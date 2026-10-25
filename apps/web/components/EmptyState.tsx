import { Button } from './Button';
import { Card } from './Card';
import styles from './EmptyState.module.css';

/** A sentence, a line and one action, inside a Card. */
export function EmptyState({ title, body, action, level = 2 }: { title: string; body: string; action: { label: string; href: string }; level?: 2 | 3 }) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <Card className={styles.empty}>
      <Heading className={styles.title}>{title}</Heading>
      <p className={styles.body}>{body}</p>
      <Button href={action.href} variant="primary">
        {action.label}
      </Button>
    </Card>
  );
}
