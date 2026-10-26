'use client';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Component, RunDocumentPartial } from '@dse/schema';
import { componentGroupLabels, fill } from '@dse/schema/labels';
import { componentPanel as P } from '../../copy/strings';
import { count } from '../../lib/format';
import { variantsFor } from '../../lib/motion';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import type { Neighbor } from '../../lib/panel-doc';
import { PHONE, useMedia } from '../../lib/use-media';
import { Sheet } from '../Sheet';
import { ComponentDetail } from './ComponentDetail';
import styles from './ComponentPanel.module.css';

type Props = { runId: string; doc: RunDocumentPartial; component: Component; neighbors: Neighbor[]; base?: string; runUrl: string };

/** The component panel: 560 wide from the right (480 on tablets), a sheet on phones (D-007). */
export function ComponentPanel({ runId, doc, component: c, neighbors, base, runUrl }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const phone = useMedia(PHONE);
  const reduced = usePrefersReducedMotion();
  const [closing, setClosing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const at = neighbors.findIndex((n) => n.id === c.id);
  const sameGroup = neighbors.filter((n) => n.group === c.group);
  const prev = neighbors[at - 1];
  const next = neighbors[at + 1];
  const go = (id: string) => router.push(`/r/${runId}?c=${id}`, { scroll: false });

  function close() {
    if (closing) return;
    setClosing(true);
    const done = () => {
      router.push(`/r/${runId}`, { scroll: false });
      requestAnimationFrame(() => document.querySelector<HTMLAnchorElement>(`a[href="/r/${runId}?c=${c.id}"]`)?.focus());
    };
    if (phone || reduced) done();
    else setTimeout(done, 420);
  }

  useEffect(() => {
    heading.current?.focus();
  }, [c.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // A soft navigation to the component's own page keeps this slot's last state; it belongs to /r/{id} only.
  if (pathname !== `/r/${runId}`) return null;

  const head = (
    <div className={styles.head}>
      <div className={styles.titles}>
        <p className={styles.eyebrow}>{fill(P.eyebrow, { group: componentGroupLabels[c.group], index: count(sameGroup.findIndex((n) => n.id === c.id) + 1), count: count(sameGroup.length) })}</p>
        <h2 ref={heading} tabIndex={-1} id={`panel-${c.id}`} className={styles.name}>
          {c.name}
        </h2>
      </div>
      <div className={styles.icons}>
        <button type="button" className={styles.icon} aria-label={P.previous} disabled={!prev} onClick={() => prev && go(prev.id)}>
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button type="button" className={styles.icon} aria-label={P.next} disabled={!next} onClick={() => next && go(next.id)}>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <a className={styles.icon} aria-label={P.openAsPage} href={`/r/${runId}/c/${c.id}`}>
          <ExternalLink size={20} strokeWidth={1.75} aria-hidden="true" />
        </a>
        <button type="button" className={styles.icon} aria-label={P.close} onClick={close}>
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
  const body = <ComponentDetail key={c.id} doc={doc} component={c} base={base} runUrl={runUrl} />;

  if (phone) {
    return (
      <Sheet open={!closing} onClose={close} label={c.name} handleLabel={P.handleLabel} height="tall">
        <div className={styles.sheetBody}>
          {head}
          {body}
        </div>
      </Sheet>
    );
  }
  return (
    <motion.aside
      className={styles.panel}
      role="dialog"
      aria-labelledby={`panel-${c.id}`}
      variants={variantsFor('slide', reduced, { edge: 'right' })}
      initial="hidden"
      animate={closing ? 'exit' : 'shown'}
    >
      {head}
      <div className={styles.scroll}>{body}</div>
    </motion.aside>
  );
}
