import type { ComponentType } from '@dse/schema';
import { viewportSize } from '@dse/schema';
import { ancestors, descendants, px, wordCount, type SnapElement, type Snapshot } from '../capture/snapshot';
import { representative } from './cluster';
import type { Item } from './items';

// Rule classification (docs/specs/component-detection.md), specific forms before general ones (D-050).

export type Guess = { type: ComponentType; confidence: number };

const statusWords = /\b(live|active|inactive|online|offline|operational|degraded|down|delayed|outage|paid|due|overdue|draft|published|pending|failed|failing|passing|success|error|warning|done|open|closed|resolved|healthy|unhealthy|enabled|disabled)\b/i;

const isHeading = (e: SnapElement) => /^h[1-6]$/.test(e.tag);
const hasLink = (e: SnapElement) => e.tag === 'a' && e.href;

function inPageHref(it: Item): boolean {
  return it.el.attrs.href?.startsWith('#') ?? false;
}

/** Repeated sibling containers stacked in one column, each nearly as wide as its parent. */
function stackedRows(items: Item[]): boolean {
  const desk = items.filter((i) => i.viewport === 'desktop');
  const byParent = new Map<string, Item[]>();
  for (const it of desk) {
    const k = `${it.page.id}|${it.el.p}`;
    byParent.set(k, [...(byParent.get(k) ?? []), it]);
  }
  for (const sibs of byParent.values()) {
    if (sibs.length < 3) continue;
    const parent = sibs[0]!.snapshot.elements[sibs[0]!.el.p];
    const xs = new Set(sibs.map((s) => Math.round(s.el.x)));
    if (parent && xs.size === 1 && sibs.every((s) => s.el.w >= parent.w * 0.8)) return true;
  }
  return false;
}

function containerFacts(s: Snapshot, el: SnapElement) {
  const desc = descendants(s, el);
  return {
    heading: desc.some((d) => isHeading(d) || (d.own && px(d.style['font-size']) >= 20 && Number(d.style['font-weight']) >= 600)),
    image: desc.some((d) => d.tag === 'img' || d.tag === 'svg' || d.tag === 'picture'),
    text: wordCount(el.text) > 0,
    buttons: desc.filter((d) => d.tag === 'button' || (d.tag === 'a' && d.href)).length,
    bigHeading: desc.some((d) => isHeading(d) && px(d.style['font-size']) >= 32),
  };
}

export function classify(items: Item[]): Guess {
  const it = representative(items);
  const el = it.el;
  const role = el.role ?? '';
  const label = (el.aria['aria-label'] ?? '').toLowerCase();
  const cls = el.cls.join(' ').toLowerCase();

  if (it.revealed) return { type: 'dropdown', confidence: 0.85 };
  if (role === 'switch') return { type: 'toggle', confidence: 0.85 };
  if (el.tag === 'input' && el.type === 'checkbox') return { type: 'checkbox', confidence: 0.98 };
  if (el.tag === 'input' && el.type === 'radio') return { type: 'radio', confidence: 0.98 };
  if (el.tag === 'input' && !['submit', 'button', 'reset', 'image'].includes(el.type ?? 'text')) return { type: 'input', confidence: 0.98 };
  if (el.tag === 'select') return { type: 'select', confidence: 0.98 };
  if (el.tag === 'textarea') return { type: 'textarea', confidence: 0.98 };
  if (el.tag === 'button' || el.tag === 'input' || role === 'button') return { type: 'button', confidence: 0.95 };
  if (hasLink(el) && it.rules.includes('styled-link')) {
    // A tab or page number that is a link moves between pages: it is a link, however short.
    const navItem = role === 'tab' || /pagination/.test(cls) || ancestors(it.snapshot, el).some((a) => a.role === 'tablist' || /pagination/i.test(a.cls.join(' ')) || /pagination/i.test(a.aria['aria-label'] ?? ''));
    return wordCount(el.text) <= 3 && !inPageHref(it) && !navItem ? { type: 'button', confidence: 0.95 } : { type: 'link', confidence: 0.9 };
  }
  if (el.tag === 'form') return { type: 'form', confidence: 0.95 };
  if (label.includes('breadcrumb') || cls.includes('breadcrumb')) return { type: 'breadcrumb', confidence: 0.8 };
  if (label.includes('pagination') || cls.includes('pagination')) return { type: 'pagination', confidence: 0.8 };
  if (role === 'tablist') return { type: 'tabs', confidence: 0.95 };
  if (el.tag === 'nav' || role === 'navigation') return { type: 'nav', confidence: 0.95 };
  if ((el.tag === 'header' || role === 'banner') && el.y < 10) return { type: 'header', confidence: 0.95 };
  if (el.tag === 'footer' || role === 'contentinfo') return { type: 'footer', confidence: 0.95 };
  if (role === 'menu' || role === 'menubar') return { type: 'menu', confidence: 0.85 };
  if (el.tag === 'table') return { type: 'table', confidence: 0.98 };
  if (el.tag === 'pre' || el.tag === 'code') return { type: 'code-block', confidence: 0.95 };
  if (role === 'dialog') return { type: 'modal', confidence: 0.95 };
  if (role === 'tooltip') return { type: 'tooltip', confidence: 0.9 };
  const facts = containerFacts(it.snapshot, el);
  if (role === 'alert' || (/(alert|banner|notice)/.test(cls) && facts.image && facts.text)) return { type: 'alert', confidence: 0.8 };
  if (/(toast|snackbar)/.test(cls) && el.style.position === 'fixed') return { type: 'toast', confidence: 0.8 };
  if (it.rules.includes('inline-mark')) {
    const status = items.filter((i) => statusWords.test(i.el.text) || /^\d+$/.test(i.el.text.trim())).length;
    return { type: status * 2 > items.length ? 'badge' : 'tag', confidence: 0.7 };
  }
  if (it.rules.includes('avatar')) return { type: 'avatar', confidence: 0.9 };
  if (it.page.reason === 'home' && el.h > viewportSize[it.viewport].height * 0.5 && facts.bigHeading) return { type: 'hero', confidence: 0.8 };
  if (stackedRows(items)) return { type: 'list-row', confidence: 0.7 };
  if (it.page.reason === 'empty-state' && facts.image && facts.text && facts.buttons === 1) return { type: 'empty-state', confidence: 0.6 };
  const ground = it.rules.includes('container') || /url\(|gradient\(/.test(el.style['background-image'] ?? '');
  if (!ground && facts.heading && facts.text && descendants(it.snapshot, el).length <= 4 && facts.buttons === 0 && !facts.image) return { type: 'section-header', confidence: 0.6 };
  if ((facts.heading || facts.image) && facts.text) return { type: 'card', confidence: 0.6 };
  return { type: 'other', confidence: 0.3 };
}
