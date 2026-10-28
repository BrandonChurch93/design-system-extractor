import type { Component, EasingToken, MotionPattern } from '@dse/schema';

// What uses each easing (D-093, D-097): a component type counts its components whose transitions or
// animations use the easing; a pattern kind counts its patterns. Browser-safe: the upgrade runs in /open.

const byCount = <T extends { count: number }>(key: (x: T) => string) => (a: T, b: T) => b.count - a.count || key(a).localeCompare(key(b));

export function easingUsedBy(easings: EasingToken[], components: Pick<Component, 'type' | 'motion'>[], patterns: Pick<MotionPattern, 'kind' | 'easingTokenId'>[]): EasingToken[] {
  return easings.map((e) => {
    const types = new Map<Component['type'], number>();
    for (const c of components) {
      const m = c.motion;
      if (!m) continue;
      if ([...m.transitions, ...m.animations].some((t) => t.easingTokenId === e.id)) types.set(c.type, (types.get(c.type) ?? 0) + 1);
    }
    const kinds = new Map<MotionPattern['kind'], number>();
    for (const p of patterns) if (p.easingTokenId === e.id) kinds.set(p.kind, (kinds.get(p.kind) ?? 0) + 1);
    return {
      ...e,
      usedBy: {
        componentTypes: [...types].map(([type, count]) => ({ type, count })).sort(byCount((x) => x.type)),
        patternKinds: [...kinds].map(([kind, count]) => ({ kind, count })).sort(byCount((x) => x.kind)),
      },
    };
  });
}
