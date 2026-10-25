import { viewportSize, type Viewport } from '@dse/schema';
import {
  descendants,
  effectiveBackground,
  hasBackground,
  hasShadow,
  hasVisibleBorder,
  isInteractive,
  px,
  radiusOf,
  wordCount,
  type SnapElement,
  type Snapshot,
} from './snapshot';

// Element candidates (docs/specs/component-detection.md): DOM elements that may become components.

export type CandidateRule = 'control' | 'styled-link' | 'landmark' | 'role' | 'data' | 'popup' | 'container' | 'inline-mark' | 'avatar';

export type ElementCandidate = { dse: string; rules: CandidateRule[]; interactive: boolean; area: number };

const landmarkTags = new Set(['nav', 'header', 'footer', 'table', 'pre']);
const roles = new Set(['navigation', 'banner', 'contentinfo', 'tablist', 'tab', 'dialog', 'alert', 'status', 'menu', 'menuitem', 'tooltip', 'switch', 'button']);

/** A link styled like a button: padding of 6 px or more on two sides and a ground, border or radius. */
export function isButtonLikeLink(e: SnapElement): boolean {
  if (e.tag !== 'a' || !e.href) return false;
  if (e.role === 'button') return true;
  const pads = (['top', 'right', 'bottom', 'left'] as const).filter((s) => px(e.style[`padding-${s}`]) >= 6).length;
  const styled = hasBackground(e) || hasVisibleBorder(e) || radiusOf(e) > 0;
  return pads >= 2 && styled && wordCount(e.text) <= 5;
}

function sameColor(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  return Math.abs(a.r - b.r) < 1 && Math.abs(a.g - b.g) < 1 && Math.abs(a.b - b.b) < 1;
}

export function findCandidates(s: Snapshot, viewport: Viewport): ElementCandidate[] {
  const vp = viewportSize[viewport];
  const vpArea = vp.width * vp.height;
  const out: ElementCandidate[] = [];
  for (const e of s.elements) {
    if (!e.vis) continue;
    const rules: CandidateRule[] = [];
    const area = e.w * e.h;
    const interactive = isInteractive(e);
    if (e.tag === 'button' || e.tag === 'select' || e.tag === 'textarea' || (e.tag === 'input' && e.type !== 'hidden')) rules.push('control');
    if (isButtonLikeLink(e)) rules.push('styled-link');
    if (landmarkTags.has(e.tag) && !(e.tag === 'header' && e.p >= 0 && s.elements[e.p]?.tag === 'article')) rules.push(e.tag === 'table' || e.tag === 'pre' ? 'data' : 'landmark');
    if (e.tag === 'code' && /^(block|flex|grid)$/.test(e.style.display)) rules.push('data');
    if (e.role && roles.has(e.role) && e.tag !== 'a') rules.push('role');
    if ('aria-haspopup' in e.aria || 'aria-expanded' in e.aria) rules.push('popup');
    const parent = e.p >= 0 ? s.elements[e.p] : undefined;
    if (!['html', 'body', 'main'].includes(e.tag)) {
      const differs = parent ? !sameColor(effectiveBackground(s, e), effectiveBackground(s, parent)) : false;
      if (hasVisibleBorder(e) || differs || hasShadow(e)) {
        const n = descendants(s, e).length;
        const mainWrapper = e.w >= s.docW * 0.95 && e.h >= s.docH * 0.6;
        if (n >= 2 && n <= 60 && area >= 2000 && area <= vpArea * 0.6 && !mainWrapper) rules.push('container');
      }
    }
    if ((hasBackground(e) || hasVisibleBorder(e)) && wordCount(e.text) <= 3 && e.text.length > 0 && e.h <= 32 && /^(inline|inline-flex|inline-block)$/.test(e.style.display)) rules.push('inline-mark');
    if ((e.tag === 'img' || e.tag === 'svg') && Math.abs(e.w - e.h) < 1 && e.w <= 64 && e.w > 0) {
      const r = e.style['border-top-left-radius'];
      if (r.endsWith('%') ? parseFloat(r) >= 50 : px(r) >= e.w / 2 - 0.5) rules.push('avatar');
    }
    if (rules.length) out.push({ dse: e.d, rules, interactive, area });
  }
  return out;
}

/** The per-page cap: 400 by area descending, keeping every interactive one. */
export function capCandidates(list: ElementCandidate[], cap = 400): ElementCandidate[] {
  const interactive = list.filter((c) => c.interactive);
  const rest = list.filter((c) => !c.interactive).sort((a, b) => b.area - a.area);
  const kept = new Set([...interactive, ...rest.slice(0, Math.max(0, cap - interactive.length))].map((c) => c.dse));
  return list.filter((c) => kept.has(c.dse));
}

/** A preliminary cluster key for state-capture novelty: tag, role and class tokens without hashes. */
export function noveltyKey(e: SnapElement): string {
  const cls = e.cls
    .map((c) => c.toLowerCase())
    .filter((c) => !/[0-9a-f]{5,}|^css-|^sc-|^_/.test(c))
    .sort()
    .slice(0, 8);
  return `${e.tag}|${e.role ?? ''}|${cls.join('.')}|${e.style['background-color']}|${Math.round(e.h / 4)}`;
}
