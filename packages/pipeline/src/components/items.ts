import type { FrameworkHint, SelectedPage, Viewport } from '@dse/schema';
import type { CandidateRule } from '../capture/candidates';
import { isInteractive, px, radiusOf, wordCount, type SnapElement, type Snapshot } from '../capture/snapshot';
import type { CaptureOutput, OpenCapture, ViewportCapture } from '../stages/capture';

// Element candidates from every capture, with their fingerprints (docs/specs/component-detection.md).

export type Item = {
  key: string;
  page: SelectedPage;
  viewport: Viewport;
  vc: ViewportCapture;
  snapshot: Snapshot;
  el: SnapElement;
  rules: CandidateRule[];
  interactive: boolean;
  selector: string;
  /** Set for the root of a popup revealed by an `open` state. */
  revealed?: { open: OpenCapture; trigger: SnapElement; mobileMenu: boolean };
  fp: Fingerprint;
};

export type Fingerprint = {
  tag: string;
  role: string;
  classTokens: string[];
  /** Class tokens without modifiers (`btn-primary` beside `btn`, `is-*`, `has-*`). */
  baseTokens: string[];
  structure: string;
  style: StyleInputs;
  iconOnly: boolean;
  textLen: 0 | 1 | 2 | 3 | 4;
  /** Opens something (`aria-haspopup`, `aria-expanded`, `aria-controls`): a trigger is not an action button. */
  trigger: boolean;
  /** Hidden at capture and kept because it takes focus: a skip link is not the button it looks like (D-108). */
  hidden?: boolean;
  /** For inline marks: whether the ground is a semantic color (a status badge, not a tag). */
  semanticGround?: boolean;
};

/** The computed values the style hash and the style merge read. */
export type StyleInputs = {
  background: string;
  borderWidth: number;
  borderStyle: string;
  borderColor: string;
  radius: number;
  padding: number[];
  fontSize: number;
  fontWeight: number;
  display: string;
  shadow: boolean;
  textTransform: string;
};

const hashed = /[0-9a-f]{5,}|^css-|^sc-|^_/;
const genericModifier = /^(is-|has-)|^(sm|md|lg|xl|small|large|active|current|selected|disabled|open)$/;

export function classTokens(el: SnapElement, framework?: FrameworkHint): string[] {
  // Utility classes describe values, not components, so a Tailwind site groups like a hashed one (D-052).
  if (framework === 'tailwind') return [];
  return [...new Set(el.cls.map((c) => c.toLowerCase()).filter((c) => !hashed.test(c)))].sort().slice(0, 8);
}

/** Tokens that are not a modifier of another token in the set. */
export function baseTokens(tokens: string[]): string[] {
  return tokens.filter((t) => !genericModifier.test(t) && !tokens.some((b) => b !== t && (t.startsWith(`${b}-`) || t.startsWith(`${b}--`))));
}

export function structureOf(s: Snapshot, el: SnapElement): string {
  const counts = new Map<string, number>();
  for (const k of el.kids) {
    const c = s.elements[k]!;
    counts.set(c.tag, (counts.get(c.tag) ?? 0) + 1);
    for (const g of c.kids) {
      const gc = s.elements[g]!;
      counts.set(gc.tag, (counts.get(gc.tag) ?? 0) + 1);
    }
  }
  return [...counts]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([t, n]) => `${t}:${n}`)
    .join(' ');
}

export function styleInputs(el: SnapElement): StyleInputs {
  const st = el.style;
  return {
    background: st['background-color'],
    borderWidth: px(st['border-top-width']),
    borderStyle: st['border-top-style'],
    borderColor: st['border-top-color'],
    radius: radiusOf(el),
    padding: (['top', 'right', 'bottom', 'left'] as const).map((sd) => Math.round(px(st[`padding-${sd}`]) / 2) * 2),
    fontSize: px(st['font-size']),
    fontWeight: Number(st['font-weight']) || 400,
    // Inner display only: a flex item's inline-flex is blockified to flex by its parent.
    display: st.display.replace(/^inline-(?=flex|grid|block)/, ''),
    shadow: Boolean(st['box-shadow']) && st['box-shadow'] !== 'none',
    textTransform: st['text-transform'] || 'none',
  };
}

function textLen(text: string): Fingerprint['textLen'] {
  const n = wordCount(text);
  return n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 20 ? 3 : 4;
}

export function fingerprint(s: Snapshot, el: SnapElement, framework?: FrameworkHint): Fingerprint {
  const tokens = classTokens(el, framework);
  const type = el.type ?? 'text';
  // Text-like fields are one input whatever their type; checkboxes, radios and buttons are not.
  const tag = el.tag === 'input' ? `input[${/^(text|email|password|search|tel|url|number|date|time)$/.test(type) ? 'text' : type}]` : el.tag;
  return {
    tag,
    role: el.role ?? '',
    classTokens: tokens,
    baseTokens: baseTokens(tokens),
    structure: structureOf(s, el),
    style: styleInputs(el),
    iconOnly: el.text.trim().length < 2 && el.kids.length > 0,
    trigger: ['aria-haspopup', 'aria-expanded', 'aria-controls'].some((a) => a in el.aria),
    ...(el.hidden ? { hidden: true } : {}),
    textLen: textLen(el.text),
  };
}

function selectorFor(el: SnapElement): string {
  if (el.id) return `#${el.id}`;
  return `${el.tag}${el.cls.map((c) => `.${c}`).join('')}`;
}

/** Every element candidate of every captured page and viewport, plus every revealed popup root. */
export function itemsFrom(capture: CaptureOutput): Item[] {
  const out: Item[] = [];
  const framework = capture.frameworkHint;
  for (const pc of [...capture.pages].sort((a, b) => a.page.order - b.page.order)) {
    if (pc.status !== 'captured') continue;
    for (const viewport of ['desktop', 'mobile'] as const) {
      const vc = pc.viewports[viewport];
      if (!vc) continue;
      for (const c of vc.candidates) {
        const el = vc.snapshot.byDse.get(c.dse);
        if (!el) continue;
        out.push({ key: `${pc.page.id}|${viewport}|${c.dse}`, page: pc.page, viewport, vc, snapshot: vc.snapshot, el, rules: c.rules, interactive: c.interactive, selector: vc.selectors[c.dse] ?? selectorFor(el), fp: fingerprint(vc.snapshot, el, framework) });
      }
      for (const open of vc.opens) {
        const el = open.snapshot.byDse.get(open.revealed);
        const trigger = vc.snapshot.byDse.get(open.trigger);
        if (!el || !trigger) continue;
        const mobileMenu = viewport === 'mobile' && !trigger.text.trim() && 'aria-expanded' in trigger.aria;
        out.push({
          key: `${pc.page.id}|${viewport}|open|${open.revealed}`,
          page: pc.page,
          viewport,
          vc,
          snapshot: open.snapshot,
          el,
          rules: ['popup'],
          interactive: isInteractive(el),
          selector: selectorFor(el),
          revealed: { open, trigger, mobileMenu },
          fp: { ...fingerprint(open.snapshot, el, framework), role: `revealed:${el.role ?? ''}` },
        });
      }
    }
  }
  return out;
}
