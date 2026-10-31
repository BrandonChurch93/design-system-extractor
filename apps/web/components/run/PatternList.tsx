'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { MotionPattern, RunDocumentPartial } from '@dse/schema';
import { fill, motionKindLabels } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { chipValues } from '../../lib/chip-scale';
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

/** The pattern's start or end values as an inline style for the chip's block. */
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

/** A staggered pattern plays this many chips at most (D-098). */
const STAGGER_CHIPS = 6;
/** A chip and its gap; the chips take at most 40% of a row, or the whole row once stacked. */
const CHIP_STEP = 64;
/** The ambient hold and fade a play ends with before it returns to rest (D-104). */
const HOLD_MS = 500;
const FADE_MS = 150;
/** A play is cut here and snaps to the end state (D-104). */
const PLAY_CAP_MS = 12_000;

/** rest: the scaled start, opacity floored; start: the true scaled start; end; out: fading; in: back at rest, faded in. */
type Phase = 'rest' | 'start' | 'end' | 'snap' | 'out' | 'in';

export function PatternRow({ pattern: p, doc, hrefFor, onOpen, captionId }: { pattern: MotionPattern; doc: RunDocumentPartial; hrefFor?: (id: string) => string; onOpen?: (id: string) => void; captionId?: string }) {
  const reduced = usePrefersReducedMotion();
  const row = useRef<HTMLLIElement>(null);
  const [phase, setPhase] = useState<Phase>('rest');
  const [width, setWidth] = useState(0);
  // The auto-preview (D-093): the chip plays once when the row scrolls into view; Replay follows.
  const [previewed, setPreviewed] = useState(false);
  const playing = phase !== 'rest';
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const frames = useRef<number[]>([]);
  // Stop and unmount cancel the frames as well as the timers, so a frame queued by a play never lands after it (D-112).
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    frames.current.forEach(cancelAnimationFrame);
    frames.current = [];
  };
  const twoFrames = (next: () => void) => {
    frames.current.push(requestAnimationFrame(() => frames.current.push(requestAnimationFrame(next))));
  };
  useEffect(() => clear, []);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const chips = p.stagger ? Math.max(1, Math.min(p.stagger.count, STAGGER_CHIPS, Math.floor(((width < 600 ? width : width * 0.4) + 8) / CHIP_STEP) || 1)) : 1;
  const total = p.durationMs + p.delayMs + (p.stagger ? (chips - 1) * p.stagger.stepMs : 0);
  const play = () => {
    clear();
    setPhase('start');
    const after = (ms: number, next: () => void) => timers.current.push(setTimeout(next, ms));
    // Two frames so the start is painted before the transition to the end begins.
    twoFrames(() => setPhase('end'));
    const run = Math.min(total, PLAY_CAP_MS);
    if (total > PLAY_CAP_MS) after(run, () => setPhase('snap'));
    after(run + HOLD_MS, () => setPhase('out'));
    after(run + HOLD_MS + FADE_MS, () => {
      setPhase('in');
      twoFrames(() => setPhase('rest'));
    });
    after(run + HOLD_MS + FADE_MS * 2 + 50, () => setPreviewed(true));
  };
  useEffect(() => {
    const el = row.current;
    if (!el || reduced || previewed) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      play();
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, previewed]);
  const toggle = () => {
    if (playing) {
      clear();
      setPhase('rest');
      setPreviewed(true);
      return;
    }
    play();
  };
  const component = p.componentId ? doc.components?.find((c) => c.id === p.componentId) : undefined;
  const easing = easingName(doc, p.easingTokenId, p.easing);
  const props = [...new Set([...Object.keys(p.start), ...Object.keys(p.end)])];
  const sampled = p.source === 'inline-style';
  const timing = (i: number) => `${p.durationMs}ms ${p.easing ?? 'ease'} ${p.delayMs + i * (p.stagger?.stepMs ?? 0)}ms`;
  // Under reduced motion the chip shows the end at once; otherwise it rests on the start (D-104).
  const blockStyle = (i: number): CSSProperties => {
    if (reduced) return { ...chipStyle(chipValues(p.end)), transition: 'none' };
    switch (phase) {
      case 'start':
        return { ...chipStyle(chipValues(p.start)), transition: 'none' };
      case 'end':
        return { ...chipStyle(chipValues(p.end)), transition: props.map((x) => `${x} ${timing(i)}`).join(', ') };
      case 'snap':
        return { ...chipStyle(chipValues(p.end)), transition: 'none' };
      case 'out':
        return { ...chipStyle(chipValues(p.end)), opacity: 0, transition: `opacity ${FADE_MS}ms linear` };
      case 'in':
        return { ...chipStyle(chipValues(p.start, true)), opacity: 0, transition: 'none' };
      default:
        return { ...chipStyle(chipValues(p.start, true)), transition: previewed ? `opacity ${FADE_MS}ms linear` : 'none' };
    }
  };
  return (
    <li ref={row} className={styles.row} data-testid="pattern-row" data-previewed={previewed || reduced || undefined}>
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
        <span className={styles.chips} aria-hidden="true">
          {Array.from({ length: chips }, (_, i) => (
            <span key={i} className={styles.chip}>
              <span className={styles.block} data-at={reduced ? 'end' : phase} data-testid="pattern-chip" style={blockStyle(i)} />
            </span>
          ))}
        </span>
        <span className={styles.replayButton} data-shown={previewed || reduced || undefined}>
          <ReplayButton playing={playing} onToggle={toggle} captionId={captionId} />
        </span>
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
