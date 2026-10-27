import type { MotionKind, MotionPattern, Viewport } from '@dse/schema';
import { stableId } from '../ids';
import { noveltyKey } from './candidates';
import type { AnimRecord, MotionRecords, ObserverRecord, StyleSample } from './motion-script';
import { ancestors, type Snapshot } from './snapshot';
import { normalizeValue, type StyleDelta } from './states';

// Classification into patterns (docs/specs/motion-capture.md): records joined per element and reduced
// to motions with a start, an end, timing and a trigger.

export const ENTRANCE_WINDOW_MS = 2500;
export const PATTERN_CAP = 80;
export const SCROLLED_OFFSET = 400;
const STAGGER_CV = 0.25;
/** Transitions of one element starting this close together are one motion. */
const SAME_START_MS = 50;
/** Inline-style samples further apart than this belong to separate motions. */
const RUN_GAP_MS = 250;

export type PatternSource = {
  pageId: string;
  viewport: Viewport;
  records: MotionRecords;
  selectors: Record<string, string>;
  /** The snapshot taken before the freeze, whose ids the records point at. */
  snapshot: Snapshot;
  /** The header's scrolled-state deltas, with their transition timing. */
  scrolled: { d: string; delta: StyleDelta[] }[];
};

export type PatternTarget = { pageId: string; viewport: Viewport; d: string };
export type BuiltPattern = Omit<MotionPattern, 'id'> & { targets: PatternTarget[]; fingerprint: string; parent: string; at: number };

const kindOrder: MotionKind[] = ['entrance', 'scroll-reveal', 'scroll-progress', 'scrolled-header', 'open', 'loop', 'hover'];
const round = (n: number, step = 1) => Math.round(n / step) * step;
const round05 = (n: number) => Math.min(1, Math.max(0, Math.round(n * 20) / 20));

/** Start and end values, normalized, keeping only properties that change. */
export function diffValues(start: Record<string, string>, end: Record<string, string>): { start: Record<string, string>; end: Record<string, string> } {
  const s: Record<string, string> = {};
  const e: Record<string, string> = {};
  for (const p of new Set([...Object.keys(start), ...Object.keys(end)])) {
    const a = normalizeValue(p, start[p] ?? '');
    const b = normalizeValue(p, end[p] ?? '');
    if (a !== b && (a || b)) {
      s[p] = a || 'none';
      e[p] = b || 'none';
    }
  }
  return { start: s, end: e };
}

/** The bottom inset of a root margin, as a fraction of the viewport: `0px 0px -15% 0px` is 0.15. */
export function rootMarginBottom(rootMargin: string, vh: number): number | null {
  const parts = rootMargin.trim().split(/\s+/);
  const bottom = parts[parts.length === 1 || parts.length === 2 ? 0 : 2];
  if (!bottom) return null;
  const n = parseFloat(bottom);
  if (!Number.isFinite(n)) return null;
  const frac = bottom.endsWith('%') ? -n / 100 : -n / vh;
  return round05(frac);
}

function inViewValue(rec: { top: number; vh: number; key: number; t: number }, classes: MotionRecords['classes'], observers: ObserverRecord[]): number {
  const toggled = classes.some((c) => c.key === rec.key && c.added.length && rec.t - c.t >= -20 && rec.t - c.t <= 300);
  const margins = [...new Set(observers.map((o) => rootMarginBottom(o.rootMargin, rec.vh)).filter((v): v is number => v !== null))];
  if (toggled && margins.length === 1) return margins[0]!;
  return round05((rec.vh - rec.top) / rec.vh);
}

/** Whether every change of a sampled value coincides with a change of scroll position: motion driven by scrolling. */
function scrollDriven(samples: StyleSample[]): boolean {
  if (samples.length < 5) return false;
  let changes = 0;
  for (let i = 1; i < samples.length; i++) {
    const moved = JSON.stringify(samples[i]!.values) !== JSON.stringify(samples[i - 1]!.values);
    if (!moved) continue;
    changes++;
    if (samples[i]!.scrollY === samples[i - 1]!.scrollY) return false;
  }
  return changes >= 4;
}

export function patternsOf(src: PatternSource): BuiltPattern[] {
  const { records, snapshot } = src;
  const headers = new Set(snapshot.elements.filter((e) => e.vis && (e.tag === 'header' || e.role === 'banner' || (e.tag === 'nav' && e.y < 10)) && e.y < 10).map((e) => e.d));
  const inHeader = (d: string) => {
    const e = snapshot.byDse.get(d);
    if (!e) return false;
    return headers.has(d) || ancestors(snapshot, e).some((a) => headers.has(a.d));
  };
  const fingerprint = (d: string, tag: string) => {
    const e = snapshot.byDse.get(d);
    return e ? noveltyKey(e) : tag;
  };
  const selectorOf = (d: string, own: boolean, tag: string) => {
    const base = src.selectors[d];
    if (!base) return null;
    return own ? base : `${base} ${tag}`;
  };
  const out: BuiltPattern[] = [];
  const scrollStart = records.scrollStart;

  const classify = (t: number, scrollY: number, inView: boolean, infinite: boolean, scrollTimeline: boolean): MotionKind | null => {
    if (scrollTimeline) return 'scroll-progress';
    if (infinite) return 'loop';
    if ((scrollStart === null || t < scrollStart) && t <= ENTRANCE_WINDOW_MS && inView && scrollY === 0) return 'entrance';
    if (scrollStart !== null && t >= scrollStart && inView) return 'scroll-reveal';
    return null;
  };

  // Animation records: the CSS transitions of one element that start together are one motion.
  const groups: AnimRecord[][] = [];
  for (const rec of [...records.anims].sort((a, b) => a.t - b.t)) {
    const g = groups.find((x) => x[0]!.key === rec.key && x[0]!.source === rec.source && rec.source === 'css-transition' && Math.abs(x[0]!.t - rec.t) <= SAME_START_MS && x[0]!.duration === rec.duration && x[0]!.easing === rec.easing);
    if (g) g.push(rec);
    else groups.push([rec]);
  }
  for (const g of groups) {
    const rec = g[0]!;
    const el = records.elements[rec.key];
    if (!el?.d || inHeader(el.d)) continue;
    const kind = classify(rec.t, rec.scrollY, rec.inView, rec.iterations === 'infinite', rec.scrollTimeline);
    if (!kind) continue;
    const selector = selectorOf(el.d, el.own, el.tag);
    if (!selector) continue;
    const { start, end } = diffValues(Object.assign({}, ...g.map((r) => r.start)), Object.assign({}, ...g.map((r) => r.end)));
    if (!Object.keys(start).length) continue;
    const trigger = kind === 'scroll-reveal' ? { type: 'in-view' as const, value: inViewValue(rec, records.classes, records.observers) } : kind === 'scroll-progress' ? { type: 'scroll' as const } : { type: 'load' as const };
    out.push({
      kind,
      elementKey: `${el.tag}|${el.path}`,
      selector,
      pageId: src.pageId,
      pageIds: [src.pageId],
      viewport: src.viewport,
      instances: 1,
      trigger,
      start,
      end,
      durationMs: round(rec.duration),
      delayMs: round(rec.delay),
      easing: rec.easing,
      iterations: rec.iterations,
      ...(rec.source === 'css-animation' && rec.name ? { keyframesName: rec.name } : {}),
      source: rec.source,
      observed: rec.source === 'waapi',
      targets: [{ pageId: src.pageId, viewport: src.viewport, d: el.d }],
      fingerprint: fingerprint(el.d, el.tag),
      parent: el.parent,
      at: rec.t + rec.delay,
    });
  }

  // Inline styles written frame by frame (GSAP, anime.js, requestAnimationFrame code): the easing is not knowable.
  const byKey = new Map<number, StyleSample[]>();
  for (const s of records.samples) byKey.set(s.key, [...(byKey.get(s.key) ?? []), s]);
  for (const [key, samples] of byKey) {
    const el = records.elements[key];
    if (!el?.d || inHeader(el.d)) continue;
    const runs: StyleSample[][] = [];
    for (const s of samples.sort((a, b) => a.t - b.t)) {
      const last = runs[runs.length - 1];
      if (last && s.t - last[last.length - 1]!.t <= RUN_GAP_MS) last.push(s);
      else runs.push([s]);
    }
    for (const run of runs) {
      if (run.length < 2) continue;
      const first = run[0]!;
      const lastS = run[run.length - 1]!;
      const { start, end } = diffValues(first.values, lastS.values);
      if (!Object.keys(start).length) continue;
      const progress = scrollDriven(run);
      const kind: MotionKind | null = progress ? 'scroll-progress' : classify(first.t, first.scrollY, first.inView ?? false, false, false);
      if (!kind) continue;
      const selector = selectorOf(el.d, el.own, el.tag);
      if (!selector) continue;
      const vh = first.vh ?? 900;
      const ys = run.map((s) => s.scrollY);
      const trigger =
        kind === 'scroll-progress'
          ? { type: 'scroll' as const, value: round05((Math.max(...ys) - Math.min(...ys)) / vh) }
          : kind === 'scroll-reveal'
            ? { type: 'in-view' as const, value: inViewValue({ key, t: first.t, top: first.top ?? vh, vh }, records.classes, records.observers) }
            : { type: 'load' as const };
      out.push({
        kind,
        elementKey: `${el.tag}|${el.path}`,
        selector,
        pageId: src.pageId,
        pageIds: [src.pageId],
        viewport: src.viewport,
        instances: 1,
        trigger,
        start,
        end,
        durationMs: round(lastS.t - first.t),
        delayMs: 0,
        easing: null,
        iterations: 1,
        source: 'inline-style',
        observed: true,
        targets: [{ pageId: src.pageId, viewport: src.viewport, d: el.d }],
        fingerprint: fingerprint(el.d, el.tag),
        parent: el.parent,
        at: first.t,
      });
    }
  }

  // The header's scrolled state, now with its timing (only when a transition covers what changes).
  for (const { d, delta } of src.scrolled) {
    const timed = delta.filter((x) => x.transition);
    const selector = src.selectors[d];
    if (!timed.length || !selector) continue;
    const { start, end } = diffValues(Object.fromEntries(delta.map((x) => [x.property, x.from])), Object.fromEntries(delta.map((x) => [x.property, x.to])));
    if (!Object.keys(start).length) continue;
    const e = snapshot.byDse.get(d);
    out.push({
      kind: 'scrolled-header',
      elementKey: `${e?.tag ?? 'header'}|${d}`,
      selector,
      pageId: src.pageId,
      pageIds: [src.pageId],
      viewport: src.viewport,
      instances: 1,
      trigger: { type: 'scroll', value: SCROLLED_OFFSET },
      start,
      end,
      durationMs: Math.max(...timed.map((x) => x.transition!.durationMs)),
      delayMs: 0,
      easing: timed[0]!.transition!.easing,
      iterations: 1,
      source: 'css-transition',
      observed: false,
      targets: [{ pageId: src.pageId, viewport: src.viewport, d }],
      fingerprint: e ? noveltyKey(e) : 'header',
      parent: '',
      at: 0,
    });
  }
  return stagger(out);
}

const sameMotion = (a: BuiltPattern, b: BuiltPattern) =>
  a.kind === b.kind && a.source === b.source && a.durationMs === b.durationMs && a.easing === b.easing && JSON.stringify(a.start) === JSON.stringify(b.start) && JSON.stringify(a.end) === JSON.stringify(b.end);

/** Siblings that make the same motion at near-constant steps collapse into one staggered pattern. */
export function stagger(patterns: BuiltPattern[]): BuiltPattern[] {
  const out: BuiltPattern[] = [];
  const done = new Set<BuiltPattern>();
  for (const p of patterns) {
    if (done.has(p)) continue;
    const group = patterns.filter((q) => !done.has(q) && q.parent === p.parent && q.parent !== '' && q.pageId === p.pageId && q.viewport === p.viewport && sameMotion(p, q)).sort((a, b) => a.at - b.at);
    // Two siblings always share their one step; a constant step takes three or more (D-090).
    if (group.length >= 3) {
      const steps = group.slice(1).map((q, i) => q.at - group[i]!.at);
      const mean = steps.reduce((s, x) => s + x, 0) / steps.length;
      const sd = Math.sqrt(steps.reduce((s, x) => s + (x - mean) ** 2, 0) / steps.length);
      for (const q of group) done.add(q);
      if (mean >= 5 && sd / mean < STAGGER_CV) out.push({ ...group[0]!, instances: group.length, stagger: { count: group.length, stepMs: Math.round(mean) }, targets: group.flatMap((q) => q.targets) });
      else out.push(...group);
      continue;
    }
    done.add(p);
    out.push(p);
  }
  return out;
}

/** Deduplicates across the run, orders by kind then instances, caps at 80, and gives each an id. */
export function finalizePatterns(all: BuiltPattern[]): (MotionPattern & { targets: PatternTarget[] })[] {
  const merged: BuiltPattern[] = [];
  for (const p of all) {
    const hit = merged.find((m) => m.fingerprint === p.fingerprint && (m.keyframesName ?? '') === (p.keyframesName ?? '') && sameMotion(m, p));
    if (!hit) {
      merged.push({ ...p, pageIds: [...p.pageIds], targets: [...p.targets] });
      continue;
    }
    hit.instances += p.instances;
    for (const id of p.pageIds) if (!hit.pageIds.includes(id)) hit.pageIds.push(id);
    hit.targets.push(...p.targets);
  }
  const ordered = merged
    .filter((p) => p.kind !== 'hover')
    .map((p, i) => ({ p, i }))
    .sort((a, b) => kindOrder.indexOf(a.p.kind) - kindOrder.indexOf(b.p.kind) || b.p.instances - a.p.instances || a.i - b.i)
    .slice(0, PATTERN_CAP)
    .map(({ p }) => p);
  const used = new Set<string>();
  return ordered.map((p) => {
    let id = stableId(`pattern:${p.kind}:${p.selector}:${p.pageId}:${p.viewport}`);
    for (let n = 1; used.has(id); n++) id = stableId(`pattern:${p.kind}:${p.selector}:${p.pageId}:${p.viewport}:${n}`);
    used.add(id);
    const { fingerprint: _f, parent: _p, at: _a, ...rest } = p;
    return { id, ...rest };
  });
}
