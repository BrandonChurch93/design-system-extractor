import type { Page } from 'playwright';
import type { State } from '@dse/schema';
import { styleProps } from './snapshot-script';

// Reaching states (docs/specs/capture-and-states.md, States). Every crop is a fresh screenshot of
// the viewport region at that moment, so hover and focus visuals are real.

export type StyleDelta = { property: string; from: string; to: string };
export type StateRecord = {
  state: State;
  crop?: Buffer;
  delta: StyleDelta[];
  reachedByKeyboard?: boolean;
  /** For `open`: the data-dse-id of the revealed element's root. */
  revealed?: string;
};

export const CROP_PAD = 8;

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

export function styleDelta(from: string[] | null, to: string[] | null): StyleDelta[] {
  if (!from || !to) return [];
  const out: StyleDelta[] = [];
  styleProps.forEach((p, i) => {
    if (from[i] !== to[i]) out.push({ property: p, from: from[i] ?? '', to: to[i] ?? '' });
  });
  return out;
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
  await page.waitForTimeout(150);
  const styles = await readStyles(page, dse);
  const crop = await cropOf(page, dse);
  await page.mouse.move(0, 0);
  return { state: 'hover', crop, delta: styleDelta(base, styles) };
}

/** Press without a click: mouse down, capture, move 40 px outside the element, mouse up. */
export async function activeState(page: Page, dse: string, base: string[] | null): Promise<StateRecord | null> {
  await neutral(page);
  const r = await inView(page, dse);
  if (!r) return null;
  const vp = page.viewportSize()!;
  await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  const styles = await readStyles(page, dse);
  const crop = await cropOf(page, dse);
  const outsideY = r.y + r.h + 40 < vp.height ? r.y + r.h + 40 : Math.max(1, r.y - 40);
  await page.mouse.move(r.x + r.w / 2, outsideY, { steps: 2 });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  return { state: 'active', crop, delta: styleDelta(base, styles) };
}

/** Header styles at scroll 0 and 400, for the `scrolled` state. */
export async function scrolledState(page: Page, dse: string): Promise<StateRecord | null> {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(150);
  const top = await readStyles(page, dse);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await page.waitForTimeout(150);
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
