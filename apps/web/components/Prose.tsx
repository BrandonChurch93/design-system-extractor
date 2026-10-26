import { PageShell } from './PageShell';
import styles from './Prose.module.css';

/** About, Privacy and Terms: a title and paragraphs on a 600 px measure in a 720 px column. */
export function Prose({ title, paragraphs }: { title: string; paragraphs: readonly string[] }) {
  const email = process.env.DSE_CONTACT_EMAIL ?? '';
  return (
    <PageShell narrow>
      <article className={styles.article}>
        <h1 className={styles.title}>{title}</h1>
        {paragraphs.map((p) => (
          <p key={p} className={styles.p}>
            {p.includes('{email}') ? (
              <>
                {p.split('{email}')[0]}
                <a href={`mailto:${email}`} className={styles.link}>
                  {email}
                </a>
                {p.split('{email}')[1]}
              </>
            ) : (
              p
            )}
          </p>
        ))}
      </article>
    </PageShell>
  );
}
