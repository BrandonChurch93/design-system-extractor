'use client';
import { useState } from 'react';
import type { Keyframes, RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { ChevronDown } from 'lucide-react';
import { runPage } from '../../copy/strings';
import { count, dots } from '../../lib/format';
import { pagePaths } from '../../lib/doc';
import { Button } from '../Button';
import { CodeBlock } from '../CodeBlock';
import { Enter } from '../motion/Enter';
import { Pill } from '../Pill';
import { FIRST_ROWS, revealIndex } from './show-all';
import styles from './KeyframesList.module.css';

const M = runPage.motion;

/** The usage and pages line: the first three paths, then `· {n} more` (D-104). */
export function keyframesMeta(uses: string, paths: string[]): string {
  const line = dots([uses, ...paths.slice(0, 3)]);
  return paths.length > 3 ? `${line} ${fill(M.pagesMore, { n: count(paths.length - 3) })}` : line;
}

/** The @keyframes blocks, used ones first: six by default, the rest behind Show all; each one's CSS a disclosure away. */
export function KeyframesList({ keyframes, doc }: { keyframes: Keyframes[]; doc: RunDocumentPartial }) {
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const paths = pagePaths(doc);
  const ordered = [...keyframes].sort((a, b) => Number(b.used) - Number(a.used));
  const shown = all ? ordered : ordered.slice(0, FIRST_ROWS);
  const meta = (k: Keyframes) => keyframesMeta(k.usage === 1 ? M.oneUse : fill(M.uses, { n: count(k.usage) }), k.pages.map((p) => paths.get(p.pageId) ?? p.pageId));
  return (
    <>
    <ul className={styles.list} data-testid="keyframes-list">
      {shown.map((k, i) => (
        <Row key={k.name} index={i} className={styles.row}>
          <div className={styles.head}>
            <button type="button" className={styles.toggle} aria-expanded={open === k.name} aria-controls={`kf-${k.name}`} onClick={() => setOpen(open === k.name ? null : k.name)}>
              <span className={styles.name}>{k.name}</span>
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className={styles.chevron} />
            </button>
            {k.used ? null : <Pill variant="soft">{M.unused}</Pill>}
            <span className={styles.meta}>{meta(k)}</span>
          </div>
          {open === k.name ? (
            <div id={`kf-${k.name}`}>
              <CodeBlock code={k.css.replace(/\s*\{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\s*\}\s*/g, '\n}\n').trim()} label={k.name} />
            </div>
          ) : null}
        </Row>
      ))}
    </ul>
      {ordered.length > FIRST_ROWS ? (
        <Button
          variant="ghost"
          className={styles.more}
          aria-expanded={all}
          onClick={() => {
            // Collapsing closes any open disclosure.
            if (all) setOpen(null);
            setAll(!all);
          }}
        >
          {all ? runPage.showFewer : fill(M.showAllKeyframes, { n: count(ordered.length) })}
        </Button>
      ) : null}
    </>
  );
}

/** The first six stand; the rest reveal in staggers of 12 when shown, as the ComponentGrid's do. */
function Row({ index, className, children }: { index: number; className?: string; children: React.ReactNode }) {
  if (index < FIRST_ROWS) return <li className={className}>{children}</li>;
  return (
    <Enter as="li" move="extend" index={revealIndex(index)} className={className}>
      {children}
    </Enter>
  );
}
