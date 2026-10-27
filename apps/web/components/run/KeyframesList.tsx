'use client';
import { useState } from 'react';
import type { Keyframes, RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { ChevronDown } from 'lucide-react';
import { runPage } from '../../copy/strings';
import { count, dots } from '../../lib/format';
import { pagePaths } from '../../lib/doc';
import { CodeBlock } from '../CodeBlock';
import { Pill } from '../Pill';
import styles from './KeyframesList.module.css';

const M = runPage.motion;

/** Every @keyframes block: name, usage, pages; its CSS a disclosure away. */
export function KeyframesList({ keyframes, doc }: { keyframes: Keyframes[]; doc: RunDocumentPartial }) {
  const [open, setOpen] = useState<string | null>(null);
  const paths = pagePaths(doc);
  return (
    <ul className={styles.list}>
      {keyframes.map((k) => (
        <li key={k.name} className={styles.row}>
          <div className={styles.head}>
            <button type="button" className={styles.toggle} aria-expanded={open === k.name} aria-controls={`kf-${k.name}`} onClick={() => setOpen(open === k.name ? null : k.name)}>
              <span className={styles.name}>{k.name}</span>
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className={styles.chevron} />
            </button>
            {k.used ? null : <Pill variant="soft">{M.unused}</Pill>}
            <span className={styles.meta}>{dots([k.usage === 1 ? M.oneUse : fill(M.uses, { n: count(k.usage) }), ...k.pages.slice(0, 3).map((p) => paths.get(p.pageId) ?? p.pageId)])}</span>
          </div>
          {open === k.name ? (
            <div id={`kf-${k.name}`}>
              <CodeBlock code={k.css.replace(/\s*\{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\s*\}\s*/g, '\n}\n').trim()} label={k.name} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
