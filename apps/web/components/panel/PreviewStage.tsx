'use client';
import { useEffect, useRef, useState } from 'react';
import { State, type Component } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { ChipGroup } from '../ChipGroup';
import { FitPreview } from '../FitPreview';
import { StateBar } from '../StateBar';
import styles from './PreviewStage.module.css';

const R = runPage.preview;
type Ground = 'site' | 'light' | 'dark';
/** The app's own two grounds, so no color enters the chrome (D-003, D-097). */
const grounds: Record<Exclude<Ground, 'site'>, string> = { light: 'var(--dse-surface)', dark: 'var(--dse-inverse-bg)' };
/** Play steps these states in order, the ones the component has (D-094). */
const playOrder: State[] = ['default', 'hover', 'active', 'default'];
const stateOrder = State.options;

/** How long Play holds a state: its longest recorded transition plus 400 ms, 600 ms at least (D-097). */
export function holdFor(c: Pick<Component, 'states'>, s: State): number {
  const longest = Math.max(0, ...(c.states.find((x) => x.state === s)?.delta ?? []).map((d) => d.transition?.durationMs ?? 0));
  return Math.max(600, longest + 400);
}

/** The variant whose preview is the component's own, which the state files and crops belong to. */
export function mainVariant(c: Component): Component['variants'][number] {
  return c.variants.find((v) => (c.preview.mode === 'live' ? v.preview.htmlKey === c.preview.htmlKey : v.preview.cropKey === c.preview.cropKey)) ?? c.variants[0]!;
}

/**
 * The states a preview can show: a live one's state files, a captured one's state crops; Default
 * first. Only on the variant that shares the component's preview, since the state files are built
 * from that instance (D-097).
 */
export function pinnable(c: Component, variantId: string): State[] {
  const variant = c.variants.find((v) => v.id === variantId) ?? c.variants[0]!;
  if (variant.id !== mainVariant(c).id) return ['default'];
  const have = variant.preview.mode === 'live' ? new Set(Object.keys(c.preview.stateHtmlKeys ?? {})) : new Set(c.states.filter((s) => s.captured && s.cropKey).map((s) => s.state));
  return ['default', ...stateOrder.filter((s) => s !== 'default' && have.has(s))];
}

/**
 * The panel's preview (D-094): the selected variant on its ground, with the StateBar that pins a
 * state (a live preview loads that state's file, which plays its transition; a captured one shows
 * the state's crop), Play, and the Ground toggle.
 */
export function PreviewStage({ component: c, variantId, base, title }: { component: Component; variantId: string; base?: string; title: string }) {
  const variant = c.variants.find((v) => v.id === variantId) ?? c.variants[0]!;
  const states = pinnable(c, variant.id);
  const [state, setState] = useState<State>('default');
  const [reload, setReload] = useState(0);
  const [ground, setGround] = useState<Ground>('site');
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const shown = states.includes(state) ? state : 'default';
  const pick = (s: State) => {
    if (s === shown) setReload((r) => r + 1);
    else setState(s);
  };
  const steps = playOrder.filter((s) => states.includes(s));
  const canPlay = Boolean(c.motion?.transitions.length) && steps.length > 2;
  const play = () => {
    timers.current.forEach(clearTimeout);
    setPlaying(true);
    let at = 0;
    timers.current = steps.map((s, i) => {
      const t = setTimeout(() => {
        setState(s);
        setReload((r) => r + 1);
        if (i === steps.length - 1) setPlaying(false);
      }, at);
      at += holdFor(c, s);
      return t;
    });
  };
  const live = variant.preview.mode === 'live';
  const htmlKey = live && shown !== 'default' ? c.preview.stateHtmlKeys?.[shown] : undefined;
  const cropKey = !live && shown !== 'default' ? c.states.find((s) => s.state === shown)?.cropKey : undefined;
  const site = variant.preview.ground ?? c.ground;
  const paint = ground === 'site' ? site : grounds[ground];
  return (
    <div className={styles.stage}>
      <div className={styles.ground} style={paint ? { background: paint } : undefined} data-testid="preview-stage" data-state={shown}>
        <FitPreview preview={variant.preview} base={base} title={title} padding={0} htmlKey={htmlKey} cropKey={cropKey} reload={reload} ground={paint} />
      </div>
      <div className={styles.controls}>
        {states.length > 1 ? <StateBar states={states} value={shown} onChange={pick} onPlay={canPlay ? play : undefined} playing={playing} /> : <span />}
        <div className={styles.groundToggle}>
          <span className={styles.label} aria-hidden="true">
            {R.ground}
          </span>
          <ChipGroup label={R.ground} value={ground} onChange={setGround} options={(['site', 'light', 'dark'] as const).map((g) => ({ value: g, label: R.grounds[g] }))} />
        </div>
      </div>
      {(variant.preview.fontsSubstituted ?? []).map((family) => (
        <p key={family} className={styles.caption}>
          {fill(R.font, { family })}
        </p>
      ))}
    </div>
  );
}
