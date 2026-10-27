'use client';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import type { MotionPattern, RunDocumentPartial } from '@dse/schema';
import { fill, motionKindLabels } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { dots } from '../../lib/format';
import { durationText, easingName, suggestedEasing, triggerPhrase } from '../../lib/motion-view';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { Pill } from '../Pill';
import { Swatch } from '../Swatch';
import { Tag } from '../Tag';
import { ReplayButton } from './ReplayButton';
import styles from './PatternList.module.css';

const M = runPage.motion;

// What the preview chip may take from a hostile site: visual properties only, never a url().
const chipProps = new Set(['opacity', 'transform', 'translate', 'scale', 'rotate', 'filter', 'background-color', 'color', 'border-color', 'box-shadow', 'clip-path']);
const camel = (p: string) => p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** The pattern's start or end values as an inline style for the 18 px block. */
export function chipStyle(values: Record<string, string>): CSSProperties {
  const out: Record<string, string> = {};
  for (const [p, v] of Object.entries(values)) if (chipProps.has(p) && !/url\(|expression\(/i.test(v)) out[camel(p)] = v;
  return out as CSSProperties;
}

const isColor = (v: string) => /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|oklab\(|color\()/i.test(v.trim());

/** One property's start and end: two Swatches for a color, two Tags otherwise. */
function Change({ property, from, to }: { property: string; from?: string; to?: string }) {
  if (from && to && isColor(from) && isColor(to))
    return (
      <span className={styles.change}>
        <span className={styles.property}>{property}</span>
        <Swatch value={from} size="mini" showHex={false} tabIndex={-1} aria-hidden="true" />
        <span aria-hidden="true">→</span>
        <Swatch value={to} size="mini" showHex={false} tabIndex={-1} aria-hidden="true" />
        <span className="visually-hidden">{`${from} → ${to}`}</span>
      </span>
    );
  return (
    <span className={styles.change}>
      <span className={styles.property}>{property}</span>
      <Tag>{from ?? 'none'}</Tag>
      <span aria-hidden="true">→</span>
      <Tag>{to ?? 'none'}</Tag>
    </span>
  );
}

export function PatternRow({ pattern: p, doc, hrefFor, onOpen, captionId }: { pattern: MotionPattern; doc: RunDocumentPartial; hrefFor?: (id: string) => string; onOpen?: (id: string) => void; captionId?: string }) {
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState<'start' | 'end'>('end');
  const shown = reduced ? 'end' : at;
  useEffect(() => {
    if (!playing) return;
    const f = requestAnimationFrame(() => requestAnimationFrame(() => setAt('end')));
    return () => cancelAnimationFrame(f);
  }, [playing]);
  const toggle = () => {
    if (playing) {
      setPlaying(false);
      setAt('end');
      return;
    }
    setAt('start');
    setPlaying(true);
  };
  const component = p.componentId ? doc.components?.find((c) => c.id === p.componentId) : undefined;
  const easing = easingName(doc, p.easingTokenId, p.easing);
  const props = [...new Set([...Object.keys(p.start), ...Object.keys(p.end)])];
  const sampled = p.source === 'inline-style';
  const timing = `${p.durationMs}ms ${p.easing ?? 'ease'} ${p.delayMs}ms`;
  return (
    <li className={styles.row} data-testid="pattern-row">
      <div className={styles.main}>
        <div className={styles.head}>
          <Pill variant="soft">{motionKindLabels[p.kind]}</Pill>
          {component && hrefFor ? (
            <Link
              href={hrefFor(component.id)}
              scroll={false}
              className={styles.link}
              onClick={(e) => {
                if (onOpen) {
                  e.preventDefault();
                  onOpen(component.id);
                }
              }}
            >
              {component.name}
            </Link>
          ) : (
            <code className={styles.selector}>{p.selector}</code>
          )}
          {p.observed ? <Tag>{M.observed}</Tag> : null}
        </div>
        <p className={styles.trigger} data-qa-mask={sampled ? 'sampled' : undefined}>{dots([triggerPhrase(p), p.stagger ? fill(M.stagger, { count: p.stagger.count, step: p.stagger.stepMs }) : null])}</p>
        {/* A sampled reading differs a little on every run; QA masks it like the clock. */}
        <div className={styles.changes} data-qa-mask={sampled ? 'sampled' : undefined}>
          {props.map((prop) => (
            <Change key={prop} property={prop} from={p.start[prop]} to={p.end[prop]} />
          ))}
        </div>
        <p className={styles.timing} data-qa-mask={sampled ? 'sampled' : undefined}>
          {dots([durationText(p), easing])}
        </p>
        {p.observed && !easing ? <p className={styles.caption}>{fill(M.observedCaption, { name: suggestedEasing(doc) })}</p> : null}
      </div>
      <div className={styles.replay}>
        <span className={styles.chip} aria-hidden="true">
          <span
            className={styles.block}
            data-at={shown}
            style={{ ...chipStyle(shown === 'end' ? p.end : p.start), transition: !reduced && playing && at === 'end' ? props.map((x) => `${x} ${timing}`).join(', ') : 'none' }}
            onTransitionEnd={() => setPlaying(false)}
          />
        </span>
        <ReplayButton playing={playing} onToggle={toggle} captionId={captionId} />
      </div>
    </li>
  );
}

/** A Card of PatternRows in the document's order. */
export function PatternList({ patterns, doc, hrefFor, onOpen, captionId }: { patterns: MotionPattern[]; doc: RunDocumentPartial; hrefFor?: (id: string) => string; onOpen?: (id: string) => void; captionId?: string }) {
  return (
    <ul className={styles.list}>
      {patterns.map((p) => (
        <PatternRow key={p.id} pattern={p} doc={doc} hrefFor={hrefFor} onOpen={onOpen} captionId={captionId} />
      ))}
    </ul>
  );
}
