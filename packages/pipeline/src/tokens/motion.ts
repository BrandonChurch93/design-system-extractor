import type { DurationToken, EasingToken, Keyframes, Motion, MotionPattern, SiteVariable } from '@dse/schema';
import { finalizePatterns, patternsOf, type PatternTarget } from '../capture/motion';
import { splitList } from '../capture/states';
import { stableId } from '../ids';
import type { CaptureOutput } from '../stages/capture';
import { knownEasing } from './easing-table';
import { applySiteNames, freeName, normalizeEasingValue } from './site-vars';

// Motion tokens (docs/specs/motion-capture.md, Motion tokens): substage `tokens:motion`.

const bump = (m: Map<string, number>, k: string, n = 1) => m.set(k, (m.get(k) ?? 0) + n);
const pagesOf = (m: Map<string, number>) => [...m].map(([pageId, count]) => ({ pageId, count })).sort((a, b) => b.count - a.count || a.pageId.localeCompare(b.pageId));
export const msOf = (v: string) => {
  const t = v.trim();
  const n = t.endsWith('ms') ? parseFloat(t) : parseFloat(t) * 1000;
  return Number.isFinite(n) ? n : 0;
};
/** Durations cluster by exact value after rounding to 5 ms. */
export const roundMs = (ms: number) => Math.round(ms / 5) * 5;

type DurAcc = { ms: number; usage: number; pages: Map<string, number>; raw: Set<string> };
type EaseAcc = { value: string; usage: number; pages: Map<string, number> };

export type MotionBuild = {
  duration: DurationToken[];
  easing: EasingToken[];
  keyframes: Keyframes[];
  motion: Motion;
  /** Every element each pattern was seen on, for attaching patterns to components. */
  targets: Map<string, PatternTarget[]>;
};

/** Every static and runtime timing of the run: computed transition and animation longhands read before the freeze, and Web Animations records. */
export function collectTimings(capture: CaptureOutput) {
  const durations = new Map<number, DurAcc>();
  const easings = new Map<string, EaseAcc>();
  const keyframeUse = new Map<string, Map<string, number>>();
  const addDuration = (raw: string, ms: number, pageId: string) => {
    if (ms <= 0) return;
    const r = roundMs(ms);
    const d = durations.get(r) ?? { ms: r, usage: 0, pages: new Map(), raw: new Set() };
    d.usage++;
    bump(d.pages, pageId);
    d.raw.add(raw);
    durations.set(r, d);
  };
  const addEasing = (value: string, pageId: string) => {
    const v = normalizeEasingValue(value);
    if (!v) return;
    const e = easings.get(v) ?? { value: v, usage: 0, pages: new Map() };
    e.usage++;
    bump(e.pages, pageId);
    easings.set(v, e);
  };
  for (const pc of capture.pages) {
    if (pc.status !== 'captured') continue;
    const pageId = pc.page.id;
    for (const vc of Object.values(pc.viewports)) {
      if (!vc) continue;
      for (const e of vc.snapshot.elements) {
        const st = e.style;
        const props = splitList(st['transition-property'] ?? '');
        if (props.length && props[0] !== 'none') {
          const durs = splitList(st['transition-duration'] ?? '');
          const eases = splitList(st['transition-timing-function'] ?? '');
          props.forEach((_p, i) => {
            const raw = durs[i % Math.max(1, durs.length)] ?? '0s';
            const ms = msOf(raw);
            if (ms <= 0) return;
            addDuration(raw, ms, pageId);
            addEasing(eases[i % Math.max(1, eases.length)] ?? 'ease', pageId);
          });
        }
        const names = splitList(st['animation-name'] ?? '');
        if (names.length && names[0] !== 'none') {
          const durs = splitList(st['animation-duration'] ?? '');
          const eases = splitList(st['animation-timing-function'] ?? '');
          names.forEach((n, i) => {
            if (n === 'none') return;
            bump((keyframeUse.get(n) ?? keyframeUse.set(n, new Map()).get(n)!), pageId);
            const raw = durs[i % Math.max(1, durs.length)] ?? '0s';
            const ms = msOf(raw);
            if (ms <= 0) return;
            addDuration(raw, ms, pageId);
            addEasing(eases[i % Math.max(1, eases.length)] ?? 'ease', pageId);
          });
        }
      }
      for (const a of vc.motion?.anims ?? []) {
        if (a.source !== 'waapi') continue;
        addDuration(`${a.duration}ms`, a.duration, pageId);
        addEasing(a.easing, pageId);
      }
    }
  }
  return { durations, easings, keyframeUse };
}

/** Roles by rank among the durations: the most used is base, the nearest shorter fast then faster, longer slow then slower. */
export function durationRoles(tokens: { ms: number; usage: number }[]): Map<number, DurationToken['role']> {
  const roles = new Map<number, DurationToken['role']>();
  if (!tokens.length) return roles;
  const base = [...tokens].sort((a, b) => b.usage - a.usage || a.ms - b.ms)[0]!;
  roles.set(base.ms, 'base');
  const shorter = tokens.filter((t) => t.ms < base.ms).sort((a, b) => b.ms - a.ms);
  const longer = tokens.filter((t) => t.ms > base.ms).sort((a, b) => a.ms - b.ms);
  if (shorter[0]) roles.set(shorter[0].ms, 'fast');
  if (shorter[1]) roles.set(shorter[1].ms, 'faster');
  if (longer[0]) roles.set(longer[0].ms, 'slow');
  if (longer[1]) roles.set(longer[1].ms, 'slower');
  return roles;
}

export function buildDurations(acc: Map<number, DurAcc>, vars: SiteVariable[]): DurationToken[] {
  const list = [...acc.values()].sort((a, b) => a.ms - b.ms);
  const roles = durationRoles(list);
  const tokens: DurationToken[] = list.map((d) => ({
    id: stableId(`duration:${d.ms}`),
    name: `duration-${d.ms}`,
    ms: d.ms,
    ...(roles.get(d.ms) ? { role: roles.get(d.ms) } : {}),
    usage: d.usage,
    pages: pagesOf(d.pages),
    rawValues: [...d.raw].sort(),
  }));
  nameBySite('duration', tokens, (t) => t.ms, vars);
  return tokens;
}

/** Site names first (D-082); the generated names that collide with one take a letter. */
function nameBySite<T extends { id: string; name: string; siteName?: string }>(kind: 'duration' | 'easing', tokens: T[], valueOf: (t: T) => string | number, vars: SiteVariable[]) {
  const named = applySiteNames(kind, tokens, valueOf, vars);
  const site = new Set(named.map((n) => n.name));
  for (const n of named) {
    n.token.name = n.name;
    n.token.siteName = n.variable.name;
  }
  const taken = new Set(site);
  for (const t of tokens) if (!t.siteName) t.name = freeName(t.name, taken);
}

export function buildEasings(acc: Map<string, EaseAcc>, vars: SiteVariable[]): EasingToken[] {
  const list = [...acc.values()].sort((a, b) => b.usage - a.usage || a.value.localeCompare(b.value));
  let spring = 0;
  let custom = 0;
  const tokens: EasingToken[] = list.map((e) => {
    let name = knownEasing(e.value);
    if (!name) {
      const steps = /^steps\((\d+)/.exec(e.value);
      const linear = /^linear\((.+)\)$/.exec(e.value);
      if (steps) name = `steps-${steps[1]}`;
      else if (linear && linear[1]!.split(',').length > 2) name = `spring-${++spring}`;
      else if (linear) name = 'linear';
      else name = `ease-custom-${++custom}`;
    }
    return { id: stableId(`easing:${e.value}`), name, value: e.value, usage: e.usage, pages: pagesOf(e.pages) };
  });
  nameBySite('easing', tokens, (t) => t.value, vars);
  return tokens;
}

/** Every `@keyframes` block, its custom properties resolved where the root resolves them. */
export function buildKeyframes(capture: CaptureOutput, use: Map<string, Map<string, number>>, vars: SiteVariable[]): Keyframes[] {
  const seen = new Map<string, { css: string; condition?: string }>();
  for (const pc of capture.pages) {
    if (pc.status !== 'captured') continue;
    for (const vc of Object.values(pc.viewports)) for (const k of vc?.sheets.keyframes ?? []) if (!seen.has(k.name)) seen.set(k.name, { css: k.css, ...(k.condition ? { condition: k.condition } : {}) });
  }
  const rootValue = new Map(vars.filter((v) => v.scope === 'root').map((v) => [v.name, v.resolved]));
  return [...seen]
    .map(([name, k]) => {
      const unresolved = new Set<string>();
      const css = k.css
        .replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (m, v: string) => {
          const r = rootValue.get(v);
          if (r) return r;
          unresolved.add(v);
          return m;
        })
        .replace(/\s+/g, ' ')
        .trim();
      const pages = use.get(name) ?? new Map<string, number>();
      const usage = [...pages.values()].reduce((s, n) => s + n, 0);
      return { name, css, ...(k.condition ? { condition: k.condition } : {}), used: usage > 0, usage, pages: pagesOf(pages), unresolved: [...unresolved].sort() };
    })
    .sort((a, b) => Number(b.used) - Number(a.used) || b.usage - a.usage || a.name.localeCompare(b.name));
}

export function buildPatterns(capture: CaptureOutput): { motion: Motion; targets: Map<string, PatternTarget[]>; patterns: MotionPattern[] } {
  const built = [];
  const truncatedPages: string[] = [];
  let intersectionObservers = 0;
  for (const pc of capture.pages) {
    if (pc.status !== 'captured') continue;
    for (const vc of Object.values(pc.viewports)) {
      if (!vc?.motion) continue;
      if (vc.motion.truncated && !truncatedPages.includes(pc.page.path)) truncatedPages.push(pc.page.path);
      intersectionObservers = Math.max(intersectionObservers, vc.motion.observers.length);
      const scrolled = Object.entries(vc.states).flatMap(([d, recs]) => recs.filter((r) => r.state === 'scrolled').map((r) => ({ d, delta: r.delta })));
      built.push(...patternsOf({ pageId: pc.page.id, viewport: vc.viewport, records: vc.motion, selectors: vc.motionSelectors, snapshot: vc.snapshot, scrolled }));
    }
  }
  const final = finalizePatterns(built);
  const targets = new Map(final.map((p) => [p.id, p.targets]));
  const patterns = final.map(({ targets: _t, ...p }) => p);
  return { motion: { patterns, truncatedPages, intersectionObservers }, targets, patterns };
}

/** Each pattern's easing token, when its easing is one of the run's tokens. */
export function linkEasings(patterns: MotionPattern[], easings: EasingToken[]): void {
  const byValue = new Map(easings.map((e) => [e.value, e.id]));
  for (const p of patterns) {
    if (!p.easing) continue;
    const id = byValue.get(normalizeEasingValue(p.easing));
    if (id) p.easingTokenId = id;
  }
}

export function buildMotion(capture: CaptureOutput, vars: SiteVariable[]): MotionBuild {
  const t = collectTimings(capture);
  const duration = buildDurations(t.durations, vars);
  const easing = buildEasings(t.easings, vars);
  const keyframes = buildKeyframes(capture, t.keyframeUse, vars);
  const { motion, targets } = buildPatterns(capture);
  linkEasings(motion.patterns, easing);
  return { duration, easing, keyframes, motion, targets };
}
