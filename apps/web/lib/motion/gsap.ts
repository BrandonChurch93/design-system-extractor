'use client';
import { gsap } from 'gsap';
import { prefersReducedMotion } from './reduced';
import { duration, easeCss, REDUCED_DURATION, staggerDelay } from './timing';

// GSAP owns what happens inside an element: the draw, the extend, the wipe, the count.
// Motion owns presence and layout. Neither touches the other's element.

const standard = 'dse.standard';
const exit = 'dse.exit';
let registered = false;

function ensureEases() {
  if (registered) return;
  registered = true;
  gsap.registerEase(standard, (t) => cubicBezier(0.2, 0, 0, 1)(t));
  gsap.registerEase(exit, (t) => cubicBezier(0.4, 0, 1, 1)(t));
}

/** A CSS cubic-bezier as an easing function of progress (Newton-Raphson on x). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-6 || d === 0) break;
      t -= e / d;
    }
    return sy(Math.min(Math.max(t, 0), 1));
  };
}

type Target = gsap.TweenTarget;

function reducedFade(el: Target) {
  return gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: REDUCED_DURATION, ease: 'none', clearProps: 'opacity' });
}

/** Hairline or SVG stroke drawing left to right. */
export function drawIn(el: Target, opts: { index?: number; d?: number } = {}) {
  ensureEases();
  if (prefersReducedMotion()) return reducedFade(el);
  return gsap.fromTo(
    el,
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', duration: opts.d ?? duration.base, ease: standard, delay: staggerDelay(opts.index ?? 0), clearProps: 'clipPath' },
  );
}

/** An SVG path stroke drawing in (check icons, the rail connector). */
export function strokeIn(path: SVGPathElement | SVGGeometryElement, opts: { d?: number; delay?: number } = {}) {
  ensureEases();
  if (prefersReducedMotion()) return reducedFade(path);
  const length = path.getTotalLength();
  return gsap.fromTo(
    path,
    { strokeDasharray: length, strokeDashoffset: length },
    { strokeDashoffset: 0, duration: opts.d ?? duration.base, ease: standard, delay: opts.delay ?? 0, clearProps: 'strokeDasharray,strokeDashoffset' },
  );
}

/** Text revealed left to right behind a clip. */
export const wipeIn = drawIn;

/** A bar or block grows from its leading edge. */
export function extendIn(el: Target, opts: { index?: number; d?: number; axis?: 'x' | 'y' } = {}) {
  ensureEases();
  if (prefersReducedMotion()) return reducedFade(el);
  const prop = opts.axis === 'y' ? 'scaleY' : 'scaleX';
  return gsap.fromTo(
    el,
    { [prop]: 0, transformOrigin: opts.axis === 'y' ? 'center bottom' : 'left center' },
    { [prop]: 1, duration: opts.d ?? duration.base, ease: standard, delay: staggerDelay(opts.index ?? 0), clearProps: 'transform' },
  );
}

/** The reverse of extend: shrink back to the leading edge. */
export function shrinkOut(el: Target, opts: { d?: number } = {}) {
  ensureEases();
  if (prefersReducedMotion()) return gsap.to(el, { opacity: 0, duration: REDUCED_DURATION, ease: 'none' });
  return gsap.to(el, { scaleX: 0, transformOrigin: 'left center', duration: opts.d ?? duration.fast, ease: exit });
}

/** A number ticking from `from` to `to`, tabular, over motion-stage. */
export function countTo(el: HTMLElement, to: number, opts: { from?: number; d?: number; format?: (n: number) => string; decimals?: number } = {}) {
  ensureEases();
  const decimals = opts.decimals ?? (Number.isInteger(to) ? 0 : 1);
  const format = opts.format ?? ((n: number) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  if (prefersReducedMotion()) {
    el.textContent = format(to);
    return null;
  }
  const state = { v: opts.from ?? 0 };
  el.textContent = format(state.v);
  return gsap.to(state, {
    v: to,
    duration: opts.d ?? duration.stage,
    ease: standard,
    onUpdate: () => {
      el.textContent = format(decimals ? Number(state.v.toFixed(decimals)) : Math.round(state.v));
    },
    onComplete: () => {
      el.textContent = format(to);
    },
  });
}

export { easeCss };
