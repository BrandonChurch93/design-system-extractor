'use client';
import { useEffect, useRef, useState } from 'react';
import { fill, viewportLabels } from '@dse/schema/labels';
import { catalog } from '../../copy/strings';
import { Tag } from '../Tag';
import { demos, type Demo } from './demos';
import styles from './Catalog.module.css';

function StateCell({ label, node, wide, inverse }: { label: string; node: React.ReactNode; wide?: boolean; inverse?: boolean }) {
  return (
    <div className={`${styles.state} ${wide ? styles.wide : ''}`}>
      <span className={styles.stateLabel}>{label}</span>
      <div className={`${styles.stateBody} ${inverse ? styles.inverseGround : ''}`} data-inverse={inverse ? '' : undefined}>
        {node}
      </div>
    </div>
  );
}

/** A 392 px iframe of /catalog/frame/{slug}, so phone media queries apply for real. It sizes
 *  itself to the frame's content, which posts its height. */
function PhoneFrame({ slug, title, initialHeight, view = 'phone', width = 392 }: { slug: string; title: string; initialHeight: number; view?: 'phone' | 'states'; width?: number | string }) {
  const [height, setHeight] = useState(initialHeight);
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { dseFrame?: string; height?: number };
      if (data?.dseFrame === `${slug}:${view}` && typeof data.height === 'number') setHeight(Math.ceil(data.height));
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [slug, view]);
  const src = view === 'states' ? `/catalog/frame/${slug}?view=states` : `/catalog/frame/${slug}`;
  // Demo frames repeat content shown beside them, so they stay out of the tab order.
  return <iframe className={view === 'states' ? styles.isolated : styles.frame} src={src} title={title} width={width} height={height} tabIndex={-1} />;
}

function Section({ demo }: { demo: Demo }) {
  return (
    <section id={demo.slug} className={styles.section} aria-labelledby={`${demo.slug}-title`} data-catalog-section={demo.slug}>
      <div className={styles.sectionHead}>
        <h2 id={`${demo.slug}-title`} className={styles.name}>
          {demo.name}
        </h2>
        <div className={styles.tokens}>
          {demo.tokens.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
      <div className={styles.body}>
        {demo.isolate ? (
          <PhoneFrame slug={demo.slug} title={demo.name} initialHeight={160} view="states" width="100%" />
        ) : (
          <div className={styles.states}>
            {demo.states().map((st, i) => (
              <StateCell key={`${st.label}-${i}`} {...st} />
            ))}
          </div>
        )}
        <div className={styles.frameWrap}>
          <span className={styles.stateLabel}>
            {viewportLabels.mobile} · 390 px
          </span>
          <PhoneFrame slug={demo.slug} title={fill(catalog.frameTitle, { name: demo.name })} initialHeight={demo.frameHeight} />
        </div>
      </div>
    </section>
  );
}

export function CatalogView() {
  return (
    <>
      <nav aria-label={catalog.indexLabel} className={styles.index}>
        {demos.map((d) => (
          <a key={d.slug} href={`#${d.slug}`}>
            <Tag>{d.name}</Tag>
          </a>
        ))}
      </nav>
      {demos.map((d) => (
        <Section key={d.slug} demo={d} />
      ))}
    </>
  );
}

export function CatalogFrame({ slug, view = 'phone' }: { slug: string; view?: 'phone' | 'states' }) {
  const demo = demos.find((d) => d.slug === slug);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || window.parent === window) return;
    const post = () => window.parent.postMessage({ dseFrame: `${slug}:${view}`, height: el.getBoundingClientRect().height }, window.location.origin);
    const ro = new ResizeObserver(post);
    ro.observe(el);
    post();
    return () => ro.disconnect();
  }, [slug, view]);
  if (!demo) return null;
  return (
    <div className={view === 'states' ? styles.statesFrame : styles.phone} ref={root}>
      {view === 'states' ? (
        <div className={styles.states}>
          {demo.states().map((st, i) => (
            <StateCell key={`${st.label}-${i}`} {...st} />
          ))}
        </div>
      ) : demo.phone ? (
        demo.phone()
      ) : (
        <div className={styles.phoneStates}>
          {demo.states().map((st, i) => (
            <StateCell key={`${st.label}-${i}`} {...st} wide />
          ))}
        </div>
      )}
    </div>
  );
}
