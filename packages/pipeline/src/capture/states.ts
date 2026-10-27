import type { Page } from 'playwright';
import type { State } from '@dse/schema';
import { hexOf, parseCssColor } from '../color/parse';
import { normalizeShadow } from '../tokens/collect';
import { runningIn, type RunningAnimation } from './motion-script';
import { styleProps } from './snapshot-script';

// Reaching states (docs/specs/capture-and-states.md, States). Every crop is a fresh screenshot of
// the viewport region at that moment, so hover and focus visuals are real.

export type StyleDelta = { property: string; from: string; to: string; transition?: { durationMs: number; easing: string } };
export type StateRecord = {
  state: State;
  crop?: Buffer;
  delta: StyleDelta[];
  reachedByKeyboard?: boolean;
  /** For `open`: the data-dse-id of the revealed element's root. */
  revealed?: string;
  /** Script-driven animations that ran on the element during the state (D-089). */
  animations?: RunningAnimation[];
};

export const CROP_PAD = 8;
/** The longest a state waits for script-driven motion to end, the 150 ms settle included (D-089). */
export const STATE_WAIT_CAP = 1200;
export const SETTLE_MS = 150;

export async function readStyles(page: Page, dse: string): Promise<string[] | null> {
  return page.evaluate(
    ({ d, props }) => {
      const el = document.querySelector(`[data-dse-id="${d}"]`);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return props.map((p) => cs.getPropertyValue(p));
    },
    { d: dse, props: [...styleProps] },
  );
}

const sides = ['top', 'right', 'bottom', 'left'] as const;
/** The state diff's property set, in the order entries are written (D-088). */
const SIMPLE = ['background-color', 'background-image', 'color', 'box-shadow', 'opacity', 'transform', 'translate', 'scale', 'rotate', 'filter', 'backdrop-filter', 'text-decoration-line', 'text-decoration-color', 'letter-spacing', 'font-weight', 'gap', 'width', 'height', 'cursor'] as const;
const colorProps = new Set(['background-color', 'color', 'text-decoration-color', 'outline-color', 'border-color']);

/** A color as hex when opaque, else `rgb(r g b / a%)`. */
export function normalizeColor(v: string): string {
  const c = parseCssColor(v);
  if (!c) return v.trim() === '' ? '' : 'transparent';
  if (c.a >= 1) return hexOf(c);
  return `rgb(${c.r} ${c.g} ${c.b} / ${Math.round(c.a * 100)}%)`;
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** A computed transform matrix decomposed into the functions a reader writes: translateY(-1px), scale(0.98). */
export function normalizeTransform(v: string): string {
  const t = v.trim();
  const m = /^matrix\(([^)]+)\)$/.exec(t);
  if (!m) return t || 'none';
  const [a, b, c, d, e, f] = m[1]!.split(',').map(Number) as [number, number, number, number, number, number];
  const sx = Math.hypot(a, b);
  const rot = (Math.atan2(b, a) * 180) / Math.PI;
  const sy = sx ? (a * d - b * c) / sx : 0;
  const parts: string[] = [];
  if (round(e) !== 0 && round(f) !== 0) parts.push(`translate(${round(e)}px, ${round(f)}px)`);
  else if (round(e) !== 0) parts.push(`translateX(${round(e)}px)`);
  else if (round(f) !== 0) parts.push(`translateY(${round(f)}px)`);
  if (round(rot) !== 0) parts.push(`rotate(${round(rot)}deg)`);
  if (round(sx, 3) !== 1 || round(sy, 3) !== 1) parts.push(round(sx, 3) === round(sy, 3) ? `scale(${round(sx, 3)})` : `scale(${round(sx, 3)}, ${round(sy, 3)})`);
  return parts.length ? parts.join(' ') : 'none';
}

/** One value as the diff compares and records it. */
export function normalizeValue(property: string, v: string): string {
  if (colorProps.has(property)) return normalizeColor(v);
  if (property === 'transform') return normalizeTransform(v);
  if (property === 'box-shadow') return normalizeShadow(v) || 'none';
  return v.replace(/\s+/g, ' ').trim();
}

/**
 * The state diff over the fixed property set (D-088): normalized values, the four border sides as
 * one entry when they agree, outline entries only where an outline exists in one of the states.
 */
export function styleDelta(from: string[] | null, to: string[] | null): StyleDelta[] {
  if (!from || !to) return [];
  const get = (arr: string[], p: string) => arr[(styleProps as readonly string[]).indexOf(p)] ?? '';
  const out: StyleDelta[] = [];
  const push = (property: string, a: string, b: string) => {
    if (a !== b) out.push({ property, from: a, to: b });
  };
  const n = (arr: string[], p: string) => normalizeValue(p, get(arr, p));
  for (const p of ['background-color', 'background-image', 'color'] as const) push(p, n(from, p), n(to, p));
  for (const [prop, part] of [
    ['border-color', 'color'],
    ['border-width', 'width'],
    ['border-style', 'style'],
  ] as const) {
    const norm = (arr: string[]) => sides.map((s) => normalizeValue(prop, get(arr, `border-${s}-${part}`)));
    const a = norm(from);
    const b = norm(to);
    if (a.every((v, i) => v === b[i])) continue;
    if (a.every((v) => v === a[0]) && b.every((v) => v === b[0])) push(prop, a[0]!, b[0]!);
    else sides.forEach((s, i) => push(`border-${s}-${part}`, a[i]!, b[i]!));
  }
  const noOutline = (arr: string[]) => get(arr, 'outline-style') === 'none' || parseFloat(get(arr, 'outline-width')) === 0;
  if (!(noOutline(from) && noOutline(to))) for (const p of ['outline-width', 'outline-style', 'outline-color', 'outline-offset'] as const) push(p, n(from, p), n(to, p));
  for (const p of SIMPLE.slice(3)) push(p, n(from, p), n(to, p));
  const pad = (arr: string[]) => sides.map((s) => get(arr, `padding-${s}`)).join(' ');
  push('padding', pad(from), pad(to));
  const order = (p: string) => {
    const i = (SIMPLE as readonly string[]).indexOf(p);
    return i >= 0 ? i : p.startsWith('border') ? 2.5 : p.startsWith('outline') ? 2.7 : p === 'padding' ? 99 : 50;
  };
  return out.sort((a, b) => order(a.property) - order(b.property));
}

/** The longhands a transition-property entry covers. */
function covers(entry: string, property: string): boolean {
  const e = entry.trim();
  if (e === 'all' || e === property) return true;
  if (property.startsWith(`${e}-`)) return true;
  if (property === 'border-color' || property === 'border-width' || property === 'border-style') return e === 'border' || e.startsWith('border-') && e.endsWith(property.slice(7));
  if (property === 'padding') return e.startsWith('padding');
  return false;
}

const msOf = (v: string) => (v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000) || 0;

/** Splits a computed list at top-level commas (cubic-bezier keeps its own). */
export function splitList(v: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of v) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** The resolved transition that covers a property, from the element's longhands read before the freeze. */
export function transitionFor(style: Record<string, string>, property: string): { durationMs: number; delayMs: number; easing: string } | null {
  const props = splitList(style['transition-property'] ?? '');
  const durations = splitList(style['transition-duration'] ?? '');
  const easings = splitList(style['transition-timing-function'] ?? '');
  const delays = splitList(style['transition-delay'] ?? '');
  if (!props.length || props[0] === 'none') return null;
  for (let i = props.length - 1; i >= 0; i--) {
    if (!covers(props[i]!, property)) continue;
    const durationMs = msOf(durations[i % Math.max(1, durations.length)] ?? '0s');
    if (durationMs <= 0) return null;
    return { durationMs, delayMs: msOf(delays[i % Math.max(1, delays.length)] ?? '0s'), easing: easings[i % Math.max(1, easings.length)] ?? 'ease' };
  }
  return null;
}

/** Attaches each entry's timing: the CSS transition that covers it, else the script animation that moved it. */
export function withTransitions(delta: StyleDelta[], style: Record<string, string> | undefined, animations: RunningAnimation[] = []): StyleDelta[] {
  return delta.map((d) => {
    const css = style ? transitionFor(style, d.property) : null;
    if (css) return { ...d, transition: { durationMs: css.durationMs, easing: css.easing } };
    const js = animations.find((a) => a.property === d.property || d.property.startsWith(`${a.property}-`) || a.property.startsWith(`${d.property}-`));
    return js ? { ...d, transition: { durationMs: js.durationMs, easing: js.easing } } : d;
  });
}

/** After the settle, waits while script-driven motion runs on the element, to 1,200 ms in all (D-089). */
export async function settle(page: Page, dse: string, already = 0): Promise<RunningAnimation[]> {
  await page.waitForTimeout(Math.max(0, SETTLE_MS - already));
  const running = await page.evaluate(runningIn, dse).catch(() => [] as RunningAnimation[]);
  const finite = running.filter((a) => !a.infinite);
  if (finite.length) {
    const wait = Math.min(Math.max(...finite.map((a) => a.remainingMs)) + 50, STATE_WAIT_CAP - SETTLE_MS);
    if (wait > 0) await page.waitForTimeout(wait);
  }
  return running;
}

/** Scrolls the element into view and returns its viewport rectangle. */
async function inView(page: Page, dse: string): Promise<{ x: number; y: number; w: number; h: number } | null> {
  return page.evaluate((d) => {
    const el = document.querySelector(`[data-dse-id="${d}"]`) as HTMLElement | null;
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }, dse);
}

export async function cropOf(page: Page, dse: string, extra?: string, pad = CROP_PAD): Promise<Buffer | undefined> {
  const r = await inView(page, dse);
  if (!r) return undefined;
  let box = r;
  if (extra) {
    const r2 = await page.evaluate((d) => {
      const el = document.querySelector(`[data-dse-id="${d}"]`);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.left, y: b.top, w: b.width, h: b.height };
    }, extra);
    if (r2) {
      const x = Math.min(r.x, r2.x);
      const y = Math.min(r.y, r2.y);
      box = { x, y, w: Math.max(r.x + r.w, r2.x + r2.w) - x, h: Math.max(r.y + r.h, r2.y + r2.h) - y };
    }
  }
  const vp = page.viewportSize()!;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  const w = Math.min(vp.width - x, box.w + pad * 2);
  const h = Math.min(vp.height - y, box.h + pad * 2);
  if (w < 1 || h < 1) return undefined;
  return page.screenshot({ clip: { x, y, width: w, height: h }, type: 'png', animations: 'disabled', caret: 'hide' });
}

export async function neutral(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
}

/**
 * The Tab walk: from the top, press Tab up to 80 times, recording which element has focus, until
 * focus cycles. Focus states of the chosen elements are captured as they are reached.
 */
export async function tabWalk(
  page: Page,
  chosen: Set<string>,
): Promise<{ order: string[]; focus: Map<string, { crop?: Buffer; styles: string[] | null }> }> {
  await neutral(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => {
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
    document.body.removeAttribute('tabindex');
  });
  const order: string[] = [];
  const focus = new Map<string, { crop?: Buffer; styles: string[] | null }>();
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const d = await page.evaluate(() => {
      let el = document.activeElement as Element | null;
      while (el && !el.hasAttribute('data-dse-id') && el !== document.body) el = el.parentElement;
      return el && el !== document.body ? el.getAttribute('data-dse-id') : null;
    });
    if (!d) {
      if (order.length) break;
      continue;
    }
    if (order.length && d === order[0]) break;
    if (order.includes(d)) break;
    order.push(d);
    if (chosen.has(d) && !focus.has(d)) {
      const styles = await readStyles(page, d);
      const crop = await cropOf(page, d);
      focus.set(d, { crop, styles });
    }
  }
  return { order, focus };
}

export async function hoverState(page: Page, dse: string, base: string[] | null): Promise<StateRecord | null> {
  await neutral(page);
  const r = await inView(page, dse);
  if (!r) return null;
  await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2);
  const animations = await settle(page, dse);
  const styles = await readStyles(page, dse);
  const crop = await cropOf(page, dse);
  await page.mouse.move(0, 0);
  return { state: 'hover', crop, delta: styleDelta(base, styles), ...(animations.length ? { animations } : {}) };
}

/** Press without a click: mouse down, capture, move 40 px outside the element, mouse up. */
export async function activeState(page: Page, dse: string, base: string[] | null): Promise<StateRecord | null> {
  await neutral(page);
  const r = await inView(page, dse);
  if (!r) return null;
  const vp = page.viewportSize()!;
  await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2);
  await page.mouse.down();
  const animations = await settle(page, dse, SETTLE_MS - 100);
  const styles = await readStyles(page, dse);
  const crop = await cropOf(page, dse);
  const outsideY = r.y + r.h + 40 < vp.height ? r.y + r.h + 40 : Math.max(1, r.y - 40);
  await page.mouse.move(r.x + r.w / 2, outsideY, { steps: 2 });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  return { state: 'active', crop, delta: styleDelta(base, styles), ...(animations.length ? { animations } : {}) };
}

/** Header styles at scroll 0 and 400, for the `scrolled` state. */
export async function scrolledState(page: Page, dse: string, waitMs = SETTLE_MS): Promise<StateRecord | null> {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(waitMs);
  const top = await readStyles(page, dse);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await page.waitForTimeout(waitMs);
  const scrolled = await readStyles(page, dse);
  const delta = styleDelta(top, scrolled);
  let crop: Buffer | undefined;
  if (delta.length) {
    const r = await page.evaluate((d) => {
      const el = document.querySelector(`[data-dse-id="${d}"]`);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.left, y: b.top, w: b.width, h: b.height };
    }, dse);
    const vp = page.viewportSize()!;
    if (r && r.y >= -1 && r.y < vp.height) {
      const y = Math.max(0, r.y - CROP_PAD);
      crop = await page.screenshot({ clip: { x: Math.max(0, r.x - CROP_PAD), y, width: Math.min(vp.width, r.w + CROP_PAD * 2), height: Math.min(vp.height - y, r.h + CROP_PAD * 2) }, type: 'png' });
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  return delta.length ? { state: 'scrolled', crop, delta } : null;
}
