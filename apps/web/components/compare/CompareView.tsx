'use client';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import type { RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { compare as C, global, recent, runPage } from '../../copy/strings';
import { noRecent, recentSnapshot, subscribeRecent } from '../../lib/browser-store';
import { colorDiff, componentChanges, deltaCaptions, deltas, motionDiff, sameTitle, type Stat } from '../../lib/compare';
import { count, runDate, shortDate } from '../../lib/format';
import { pagesWord } from '../../lib/run-view';
import { Button } from '../Button';
import { Card } from '../Card';
import { Footer } from '../Footer';
import { Input } from '../Input';
import { Pill } from '../Pill';
import { CountUp } from '../motion/CountUp';
import { Enter } from '../motion/Enter';
import { RecentRunRow } from '../recent/RecentRunRow';
import styles from './CompareView.module.css';

type Mode = 'same' | 'two';
type Props = { a: RunDocumentPartial; b?: RunDocumentPartial; shareUrl: string; /** The catalog shows the page inside its own: no main, no footer. */ embedded?: boolean };

function Column({ doc, label, after }: { doc: RunDocumentPartial; label: string; after?: boolean }) {
  return (
    <Card className={after ? `${styles.column} ${styles.after}` : styles.column}>
      <p className={styles.label}>{label}</p>
      <h2 className={styles.host}>{doc.host}</h2>
      <p className={styles.meta}>{doc.id}</p>
      <p className={styles.meta}>{runDate(doc.finishedAt ?? doc.createdAt ?? '')}</p>
      <p className={styles.meta}>{fill(C.facts.replace('{pages} pages', pagesWord(doc.pages?.length ?? 0)), { viewports: count(doc.viewports?.length ?? 2) })}</p>
    </Card>
  );
}

function Delta({ label, stat, captions }: { label: string; stat: Stat; captions: (string | null)[] }) {
  const lines = captions.filter((c): c is string => Boolean(c));
  return (
    <div className={styles.delta}>
      <p className={styles.figures}>
        <CountUp value={stat.before} className={styles.stat} />
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
        <span className="visually-hidden">→</span>
        <CountUp value={stat.after} className={styles.stat} />
      </p>
      {lines.length ? lines.map((l) => <p key={l} className={styles.deltaCaption}>{l}</p>) : <p className={styles.deltaCaption}>{label}</p>}
    </div>
  );
}

function Picker({ a }: { a: RunDocumentPartial }) {
  const router = useRouter();
  const runs = useSyncExternalStore(subscribeRecent, recentSnapshot, () => noRecent);
  const [link, setLink] = useState('');
  const others = runs.filter((r) => r.id !== a.id && r.status === 'complete').sort((x, y) => Number(y.host === a.host) - Number(x.host === a.host));
  return (
    <Card className={styles.picker}>
      <h2 className={styles.pickerTitle}>{C.picker.title}</h2>
      {others.length ? (
        <ul className={styles.pickerList}>
          {others.map((r) => (
            <RecentRunRow
              key={r.id}
              run={r}
              now={new Date()}
              action={
                <Button variant="ghost" size="sm" href={`/compare?a=${a.id}&b=${r.id}`}>
                  {recent.buttons.compare}
                </Button>
              }
            />
          ))}
        </ul>
      ) : null}
      <form
        className={styles.paste}
        onSubmit={(e) => {
          e.preventDefault();
          const m = /([0-9a-z]{10})\/?$/.exec(link.trim().split('?')[0] ?? '');
          if (m) router.push(`/compare?a=${a.id}&b=${m[1]}`);
        }}
      >
        <Input label={C.picker.paste} value={link} onChange={(e) => setLink(e.target.value)} spellCheck={false} />
        <Button type="submit" variant="ghost">
          {recent.buttons.compare}
        </Button>
      </form>
    </Card>
  );
}

/** Two runs side by side: tokens, components and checks (docs/design/pages.md, Compare). */
export function CompareView({ a, b, shareUrl, embedded }: Props) {
  const Main = embedded ? 'div' : 'main';
  const sameHost = Boolean(b && a.host === b.host);
  const [mode, setMode] = useState<Mode>(sameHost ? 'same' : 'two');
  const [before, after] = b && mode === 'same' && Date.parse(b.createdAt ?? '') < Date.parse(a.createdAt ?? '') ? [b, a] : [a, b];
  const crumbs = sameHost || !b ? fill(global.breadcrumbs.compareOne, { host: a.host ?? '' }) : global.breadcrumbs.compareTwo;
  const title = !after ? C.picker.title : mode === 'same' ? sameTitle(before.createdAt ?? '', after.createdAt ?? '') : fill(C.twoTitle, { hostA: before.host ?? '', hostB: after.host ?? '' });
  const labels = mode === 'same' ? [C.columns.before, C.columns.after] : [C.columns.a, C.columns.b];

  return (
    <>
      <Main id={embedded ? undefined : 'main'} className={styles.main}>
        <header className={styles.header}>
          <p className={styles.crumbs}>{crumbs}</p>
          <Enter as={embedded ? 'h2' : 'h1'} move="wipe" className={styles.title}>
            {title}
          </Enter>
          {after ? <p className={styles.caption}>{mode === 'same' ? C.captionSame : C.captionTwo}</p> : null}
          {after ? (
            <div
              role="radiogroup"
              aria-label={runPage.buttons.compare}
              className={styles.toggle}
              onKeyDown={(e) => {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                e.preventDefault();
                const next = mode === 'same' ? 'two' : 'same';
                setMode(next);
                e.currentTarget.querySelector<HTMLButtonElement>(`[data-mode="${next}"]`)?.focus();
              }}
            >
              {(['same', 'two'] as const).map((m) => (
                <button key={m} type="button" role="radio" data-mode={m} aria-checked={mode === m} tabIndex={mode === m ? 0 : -1} className={styles.segment} onClick={() => setMode(m)}>
                  {m === 'same' ? C.toggle.same : C.toggle.two}
                </button>
              ))}
            </div>
          ) : null}
        </header>
        <div className={styles.columns}>
          <Column doc={before} label={labels[0]!} />
          {after ? <Column doc={after} label={labels[1]!} after /> : <Picker a={a} />}
        </div>
        {after ? (
          <>
            <Card className={styles.notice}>
              <p>{C.footer}</p>
              <OpenButtons before={before} after={after} />
            </Card>
            <Desktop before={before} after={after} labels={[labels[0]!, labels[1]!]} />
          </>
        ) : null}
      </Main>
      {embedded ? null : <Footer
        context={
          after ? (
            <>
              <p>{C.footer}</p>
              <p>{fill(runPage.footer.share, { url: shareUrl })}</p>
            </>
          ) : undefined
        }
      />}
    </>
  );
}

function OpenButtons({ before, after }: { before: RunDocumentPartial; after: RunDocumentPartial }) {
  // The date the run cards show; two runs of one day are told apart by their order (D-099).
  const [a, b] = [before, after].map((d) => shortDate(d.finishedAt ?? d.createdAt ?? ''));
  return (
    <div className={styles.buttons}>
      <Button variant="ghost" href={`/r/${before.id}`}>
        {a === b ? C.openEarlier : fill(C.open, { date: a! })}
      </Button>
      <Button variant="primary" href={`/r/${after.id}`}>
        {a === b ? C.openLater : fill(C.open, { date: b! })}
      </Button>
    </div>
  );
}

function Desktop({ before, after, labels }: { before: RunDocumentPartial; after: RunDocumentPartial; labels: [string, string] }) {
  const d = deltas(before, after);
  const cap = deltaCaptions(d);
  const colors = colorDiff(before, after);
  const changes = componentChanges(before, after);
  const motion = motionDiff(before, after);
  const L = runPage.statLabels;
  return (
    <div className={styles.desktop}>
      <div className={styles.strip}>
        <Delta label={L.colors} stat={d.colors} captions={[cap.colors, cap.grays]} />
        <Delta label={L.typeStyles} stat={d.typeStyles} captions={[]} />
        <Delta label={L.spacingSteps} stat={d.spacingSteps} captions={[cap.spacing]} />
        <Delta label={L.components} stat={d.components} captions={[cap.components]} />
        <Delta label={L.checksPassed} stat={d.checksPassed} captions={[cap.checks]} />
      </div>
      <section className={styles.section}>
        <h2 id="compare-tokens" className={styles.h2}>
          {runPage.tokens.heading}
        </h2>
        <div className={styles.tokenCards}>
          <Card>
            <p className={styles.cardTitle}>{fill(C.tokens.added, { n: count(colors.added.length) })}</p>
            <ul className={styles.swatchList}>
              {colors.added.map((c) => (
                <li key={c.value} className={styles.swatchLine}>
                  <span className={styles.chip} style={{ background: c.value }} aria-hidden="true" />
                  <span className={styles.hex}>{c.name}</span>
                  <span className={styles.where}>{c.where}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <p className={styles.cardTitle}>{fill(C.tokens.removed, { n: count(colors.removed.length) })}</p>
            <div className={styles.chips}>
              {colors.removed.map((c) => (
                <span key={c.value} className={styles.chip} style={{ background: c.value }} aria-hidden="true" />
              ))}
            </div>
            <p className={styles.where}>{colors.removed.map((c) => c.name).join(', ')}</p>
          </Card>
          <Card>
            <p className={styles.cardTitle}>{fill(C.tokens.unchanged, { n: count(colors.unchanged.length) })}</p>
            <div className={styles.chips}>
              {colors.unchanged.map((c) => (
                <span key={c.value} className={styles.chip} style={{ background: c.value }} aria-hidden="true" />
              ))}
            </div>
          </Card>
        </div>
      </section>
      <section className={styles.section}>
        <h2 id="compare-motion" className={styles.h2}>
          {C.motion.heading}
        </h2>
        <Card className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <td />
                <th scope="col">{labels[0]}</th>
                <th scope="col">{labels[1]}</th>
              </tr>
            </thead>
            <tbody>
              {motion.map((m) => (
                <tr key={m.label}>
                  <th scope="row">{C.motion[m.label]}</th>
                  <td className={styles.mono}>{count(m.before)}</td>
                  <td className={styles.mono}>{count(m.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
      <section className={styles.section}>
        <h2 id="compare-components" className={styles.h2}>
          {runPage.components.heading}
        </h2>
        <Card className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{C.table.component}</th>
                <th scope="col">{C.table.change}</th>
                <th scope="col">{C.table.before}</th>
                <th scope="col">{C.table.after}</th>
                <th scope="col">{C.table.checks}</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={`${c.change}-${c.name}`}>
                  <th scope="row">{c.name}</th>
                  <td>
                    <Pill variant={c.change === 'new' ? 'solid' : 'soft'}>{C.pills[c.change]}</Pill>
                  </td>
                  <td className={styles.mono}>{c.before}</td>
                  <td className={styles.mono}>{c.after}</td>
                  <td className={styles.mono}>{c.checks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
      <OpenButtons before={before} after={after} />
    </div>
  );
}
