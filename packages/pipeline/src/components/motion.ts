import type { ComponentMotion, EasingToken, MotionPattern, StateCapture, Viewport } from '@dse/schema';
import type { PatternTarget } from '../capture/motion';
import { ancestors, descendants } from '../capture/snapshot';
import { splitList, transitionFor } from '../capture/states';
import type { CaptureOutput } from '../stages/capture';
import { msOf } from '../tokens/motion';
import { normalizeEasingValue } from '../tokens/site-vars';
import type { Item } from './items';

// Attachment to components (docs/specs/motion-capture.md): transitions per state, animations inside
// the component, and the patterns whose target is inside one of its instances.

const motionStates = new Set(['hover', 'focus', 'active', 'open', 'scrolled']);

export function easingLink(easing: string, easings: EasingToken[]): { easingTokenId: string } | { easing: string } {
  const id = easings.find((e) => e.value === normalizeEasingValue(easing))?.id;
  return id ? { easingTokenId: id } : { easing: normalizeEasingValue(easing) };
}

/**
 * Which component each pattern belongs to: the one whose instance is, or holds, the pattern's own
 * element (its first target, the element its selector names). Another target of a staggered group
 * never makes it the owner's (D-105).
 */
export function patternOwners(capture: CaptureOutput, owners: Map<string, string>, targets: Map<string, PatternTarget[]>): Map<string, string[]> {
  const snap = new Map<string, NonNullable<CaptureOutput['pages'][number]['viewports'][Viewport]>['snapshot']>();
  for (const pc of capture.pages) for (const [v, vc] of Object.entries(pc.viewports)) if (vc) snap.set(`${pc.page.id}|${v}`, vc.snapshot);
  const out = new Map<string, string[]>();
  for (const [patternId, list] of targets) {
    const t = list[0];
    const s = t && snap.get(`${t.pageId}|${t.viewport}`);
    const el = t && s?.byDse.get(t.d);
    if (!t || !s || !el) continue;
    for (const e of [el, ...ancestors(s, el)]) {
      const id = owners.get(`${t.pageId}|${t.viewport}|${e.d}`);
      if (id) {
        out.set(patternId, [id]);
        break;
      }
    }
  }
  return out;
}

export function componentMotion(first: Item, items: Item[], states: StateCapture[], easings: EasingToken[], patternIds: string[]): ComponentMotion | null {
  const transitions: ComponentMotion['transitions'] = [];
  const style = first.el.style;
  for (const s of states) {
    if (!s.captured || !motionStates.has(s.state)) continue;
    for (const d of s.delta) {
      if (!d.transition) continue;
      const css = transitionFor(style, d.property);
      transitions.push({ state: s.state, property: d.property, durationMs: d.transition.durationMs, delayMs: css?.delayMs ?? 0, ...easingLink(d.transition.easing, easings) });
    }
  }
  // A popup's own transitions run as it opens.
  const popup = items.find((i) => i.revealed);
  if (popup) {
    const main = popup.vc.snapshot.byDse.get(popup.el.d)?.style ?? popup.el.style;
    for (const property of splitList(main['transition-property'] ?? '')) {
      if (property === 'none' || property === 'all' || transitions.some((t) => t.state === 'open' && t.property === property)) continue;
      const t = transitionFor(main, property);
      if (t) transitions.push({ state: 'open', property, durationMs: t.durationMs, delayMs: t.delayMs, ...easingLink(t.easing, easings) });
    }
  }
  const animations: ComponentMotion['animations'] = [];
  for (const e of [first.el, ...descendants(first.snapshot, first.el)]) {
    const names = splitList(e.style['animation-name'] ?? '');
    if (!names.length || names[0] === 'none') continue;
    const durs = splitList(e.style['animation-duration'] ?? '');
    const eases = splitList(e.style['animation-timing-function'] ?? '');
    const counts = splitList(e.style['animation-iteration-count'] ?? '');
    names.forEach((name, i) => {
      if (name === 'none' || animations.some((a) => a.keyframesName === name)) return;
      const count = counts[i % Math.max(1, counts.length)] ?? '1';
      const infinite = count === 'infinite';
      animations.push({
        keyframesName: name,
        durationMs: msOf(durs[i % Math.max(1, durs.length)] ?? '0s'),
        ...easingLink(eases[i % Math.max(1, eases.length)] ?? 'ease', easings),
        iterations: infinite ? 'infinite' : Number(count) || 1,
        trigger: infinite ? 'loop' : 'entrance',
      });
    });
  }
  if (!transitions.length && !animations.length && !patternIds.length) return null;
  return { transitions, animations, patternIds };
}

/** The document's patterns with the component each belongs to. */
export function withOwners(patterns: MotionPattern[], owners: Map<string, string[]>): MotionPattern[] {
  return patterns.map((p) => {
    const ids = owners.get(p.id);
    return ids?.length ? { ...p, componentId: ids[0] } : p;
  });
}
