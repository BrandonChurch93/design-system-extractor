// Runs inside the page (docs/specs/motion-capture.md, The runtime motion pass). Self-contained:
// each function is serialized into the page, so nothing here may reach outside its own body.

/** Properties a motion record keeps, in the order the spec lists them. */
export const TRACKED = [
  'opacity',
  'transform',
  'translate',
  'scale',
  'rotate',
  'filter',
  'backdrop-filter',
  'clip-path',
  'background-color',
  'color',
  'border-color',
  'box-shadow',
  'width',
  'height',
  'max-height',
  'top',
  'left',
  'inset',
  'background-position',
  'stroke-dashoffset',
  'letter-spacing',
] as const;

export const ANIMATION_CAP = 400;
export const SAMPLE_CAP = 2000;
/** Inline styles are sampled on elements no deeper than this below `body` (motion-capture.md). */
export const SAMPLE_DEPTH = 12;

export type AnimRecord = {
  /** Index into the element list. */
  key: number;
  pseudo: string | null;
  source: 'css-transition' | 'css-animation' | 'waapi';
  name: string;
  property: string;
  duration: number;
  delay: number;
  easing: string;
  iterations: number | 'infinite';
  start: Record<string, string>;
  end: Record<string, string>;
  /** ms from navigation start */
  t: number;
  scrollY: number;
  inView: boolean;
  top: number;
  vh: number;
  scrollTimeline: boolean;
};

export type StyleSample = { key: number; t: number; scrollY: number; values: Record<string, string>; inView?: boolean; top?: number; vh?: number };
export type ClassRecord = { key: number; t: number; scrollY: number; added: string[]; removed: string[] };
export type ObserverRecord = { rootMargin: string; thresholds: number[] };
export type MotionElement = { d: string | null; own: boolean; tag: string; path: string; parent: string };

export type MotionRecords = {
  anims: AnimRecord[];
  samples: StyleSample[];
  classes: ClassRecord[];
  observers: ObserverRecord[];
  truncated: boolean;
  /** When the scroll pass began, ms from navigation start; null when it was never marked. */
  scrollStart: number | null;
  elements: MotionElement[];
};

/** The init script, installed with addInitScript before navigation. */
export function motionInit(): void {
  type El = Element & { style?: CSSStyleDeclaration };
  const w = window as unknown as Record<string, unknown>;
  if (w.__dseMotion) return;
  const tracked = [
    'opacity',
    'transform',
    'translate',
    'scale',
    'rotate',
    'filter',
    'backdrop-filter',
    'clip-path',
    'background-color',
    'color',
    'border-color',
    'box-shadow',
    'width',
    'height',
    'max-height',
    'top',
    'left',
    'inset',
    'background-position',
    'stroke-dashoffset',
    'letter-spacing',
  ];
  const camel = (p: string) => p.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
  const state = {
    elements: [] as Element[],
    keys: new WeakMap<Element, number>(),
    anims: [] as unknown[],
    samples: [] as unknown[],
    classes: [] as unknown[],
    observers: [] as unknown[],
    seen: new WeakSet<Animation>(),
    truncated: false,
    scrollStart: null as number | null,
    stopped: false,
  };
  w.__dseMotion = state;
  const keyOf = (el: Element) => {
    let k = state.keys.get(el);
    if (k === undefined) {
      k = state.elements.length;
      state.elements.push(el);
      state.keys.set(el, k);
    }
    return k;
  };
  const rectOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, inView: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight };
  };
  const pick = (f: Record<string, unknown>) => {
    const o: Record<string, string> = {};
    for (const p of tracked) {
      const v = f[camel(p)] ?? f[p];
      if (v !== undefined && v !== null && v !== '') o[p] = String(v);
    }
    return o;
  };
  const sample = () => {
    if (state.stopped) return;
    let list: Animation[];
    try {
      list = document.getAnimations();
    } catch {
      return;
    }
    for (const a of list) {
      if (state.seen.has(a)) continue;
      state.seen.add(a);
      if (state.anims.length >= 400) {
        state.truncated = true;
        continue;
      }
      const eff = a.effect;
      if (!(eff instanceof KeyframeEffect) || !eff.target) continue;
      const timing = eff.getTiming();
      let frames: ComputedKeyframe[] = [];
      try {
        frames = eff.getKeyframes();
      } catch {
        // a keyframe list the page cannot serialize
      }
      const anim = a as Animation & { animationName?: string; transitionProperty?: string };
      const source = typeof CSSTransition !== 'undefined' && a instanceof CSSTransition ? 'css-transition' : typeof CSSAnimation !== 'undefined' && a instanceof CSSAnimation ? 'css-animation' : 'waapi';
      const tl = a.timeline as (AnimationTimeline & { constructor: { name: string } }) | null;
      const r = rectOf(eff.target);
      const frameEasing = frames.map((f) => f.easing).find((e) => e && e !== 'linear');
      state.anims.push({
        key: keyOf(eff.target),
        pseudo: eff.pseudoElement ?? null,
        source,
        name: anim.animationName ?? '',
        property: anim.transitionProperty ?? '',
        duration: typeof timing.duration === 'number' ? timing.duration : 0,
        delay: timing.delay ?? 0,
        easing: timing.easing && timing.easing !== 'linear' ? timing.easing : (frameEasing ?? 'linear'),
        iterations: timing.iterations === Infinity ? 'infinite' : (timing.iterations ?? 1),
        start: pick((frames[0] ?? {}) as Record<string, unknown>),
        end: pick((frames[frames.length - 1] ?? {}) as Record<string, unknown>),
        t: typeof a.startTime === 'number' ? a.startTime : performance.now(),
        scrollY,
        inView: r.inView,
        top: r.top,
        vh: innerHeight,
        scrollTimeline: Boolean(tl && /Scroll|View/.test(tl.constructor.name)),
      });
    }
  };
  const depthOf = (el: Element) => {
    let n = 0;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) n++;
    return n;
  };
  const observer = new MutationObserver((muts) => {
    if (state.stopped) return;
    const t = performance.now();
    for (const m of muts) {
      const el = m.target as El;
      if (!(el instanceof Element) || el.closest('script, style') || (el.namespaceURI === 'http://www.w3.org/2000/svg' && el.tagName.toLowerCase() !== 'svg')) continue;
      if (m.attributeName === 'class') {
        const before = new Set((m.oldValue ?? '').split(/\s+/).filter(Boolean));
        const after = new Set([...el.classList]);
        const added = [...after].filter((c) => !before.has(c));
        const removed = [...before].filter((c) => !after.has(c));
        if (added.length || removed.length) state.classes.push({ key: keyOf(el), t, scrollY, added, removed });
        continue;
      }
      if (state.samples.length >= 2000) {
        state.truncated = true;
        continue;
      }
      if (!el.style || depthOf(el) > 12) continue;
      const values: Record<string, string> = {};
      for (const p of tracked) {
        const v = el.style.getPropertyValue(p);
        if (v) values[p] = v;
      }
      if (!Object.keys(values).length) continue;
      const r = rectOf(el);
      state.samples.push({ key: keyOf(el), t, scrollY, values, inView: r.inView, top: r.top, vh: innerHeight });
    }
  });
  observer.observe(document, { attributes: true, attributeFilter: ['style', 'class'], attributeOldValue: true, subtree: true });
  const IO = window.IntersectionObserver;
  if (IO) {
    window.IntersectionObserver = class extends IO {
      constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) {
        super(cb, opts);
        const th = opts?.threshold ?? 0;
        state.observers.push({ rootMargin: opts?.rootMargin ?? '0px', thresholds: Array.isArray(th) ? th : [th] });
      }
    };
  }
  setInterval(sample, 100);
  let last = 0;
  addEventListener(
    'scroll',
    () => {
      const now = performance.now();
      if (now - last < 50) return;
      last = now;
      sample();
    },
    { capture: true, passive: true },
  );
}

/** Marks the start of the scroll pass, after the main load's first read. */
export function motionMarkScroll(): number {
  const m = (window as unknown as { __dseMotion?: { scrollStart: number | null; anims: unknown[] } }).__dseMotion;
  if (!m) return 0;
  m.scrollStart = performance.now();
  return m.anims.length;
}

/** The second read, before the freeze: every record, and each element's place in the snapshot. Stops the sampler. */
export function motionReadout(): MotionRecords | null {
  type State = { elements: Element[]; anims: AnimRecord[]; samples: StyleSample[]; classes: ClassRecord[]; observers: ObserverRecord[]; truncated: boolean; scrollStart: number | null; stopped: boolean };
  const m = (window as unknown as { __dseMotion?: State }).__dseMotion;
  if (!m) return null;
  const pathOf = (el: Element): string => {
    const parts: number[] = [];
    for (let n: Element | null = el; n && n !== document.body && n.parentElement; n = n.parentElement) parts.unshift([...n.parentElement.children].indexOf(n));
    return parts.join('.');
  };
  const elements: MotionElement[] = m.elements.map((el) => {
    let d: string | null = null;
    let own = true;
    for (let n: Element | null = el; n; n = n.parentElement) {
      d = n.getAttribute('data-dse-id');
      if (d) break;
      own = false;
    }
    const path = pathOf(el);
    return { d, own: own && d !== null, tag: el.tagName.toLowerCase(), path, parent: path.split('.').slice(0, -1).join('.') };
  });
  m.stopped = true;
  return { anims: m.anims, samples: m.samples, classes: m.classes, observers: m.observers, truncated: m.truncated, scrollStart: m.scrollStart, elements };
}

/** Part of the freeze: CSS motion is stopped by the freeze style; Web Animations API ones are ended here. */
export function endScriptAnimations(): number {
  let n = 0;
  for (const a of document.getAnimations()) {
    if ((typeof CSSAnimation !== 'undefined' && a instanceof CSSAnimation) || (typeof CSSTransition !== 'undefined' && a instanceof CSSTransition)) continue;
    n++;
    try {
      if (a.effect?.getComputedTiming().iterations === Infinity) a.cancel();
      else a.finish();
    } catch {
      a.cancel();
    }
  }
  return n;
}

export type RunningAnimation = { property: string; durationMs: number; delayMs: number; easing: string; remainingMs: number; infinite: boolean };

/** Script-driven animations running on an element or inside it, during a state (D-089). */
export function runningIn(d: string): RunningAnimation[] {
  const el = document.querySelector(`[data-dse-id="${d}"]`);
  if (!el) return [];
  const out: RunningAnimation[] = [];
  for (const a of document.getAnimations()) {
    const eff = a.effect;
    if (!(eff instanceof KeyframeEffect) || !eff.target || !(eff.target === el || el.contains(eff.target)) || a.playState !== 'running') continue;
    const timing = eff.getTiming();
    const computed = eff.getComputedTiming();
    const duration = typeof timing.duration === 'number' ? timing.duration : 0;
    const infinite = computed.iterations === Infinity;
    const total = (computed.endTime as number) ?? duration;
    const now = typeof a.currentTime === 'number' ? a.currentTime : 0;
    let frames: ComputedKeyframe[] = [];
    try {
      frames = eff.getKeyframes();
    } catch {
      // as in the sampler
    }
    const props = new Set<string>();
    for (const f of frames) for (const k of Object.keys(f)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(k)) props.add(k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
    for (const property of props) out.push({ property, durationMs: duration, delayMs: timing.delay ?? 0, easing: timing.easing ?? 'linear', remainingMs: infinite ? 0 : Math.max(0, total - now), infinite });
  }
  return out;
}
