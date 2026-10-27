import { describe, expect, it } from 'vitest';
import type { SiteVariable } from '@dse/schema';
import { finalizePatterns, patternsOf, rootMarginBottom, stagger, type BuiltPattern, type PatternSource } from '../src/capture/motion';
import type { AnimRecord, MotionElement, MotionRecords, StyleSample } from '../src/capture/motion-script';
import { easingTable, knownEasing, nearEasing } from '../src/tokens/easing-table';
import { buildDurations, buildEasings, buildKeyframes, buildMotion, collectTimings, durationRoles } from '../src/tokens/motion';
import { fakeCapture } from './helpers/capture';
import { snap } from './helpers/snap';

const easeAcc = (value: string, usage: number) => [value, { value, usage, pages: new Map([['page0000', usage]]) }] as const;

describe('the easing table', () => {
  it('matches every known curve to itself, within 0.02 a point, and nothing beyond it', () => {
    for (const e of easingTable) {
      const v = `cubic-bezier(${e.bezier.join(', ')})`;
      expect(knownEasing(v), e.name).toBe(e.name);
      const nudged = `cubic-bezier(${e.bezier.map((x, i) => (i === 1 ? x + 0.015 : x)).join(', ')})`;
      expect(knownEasing(nudged), `${e.name} nudged`).toBe(e.name);
    }
    expect(knownEasing('ease-out')).toBe('ease-out');
  });

  it('names a perturbed curve ease-custom-1, steps() steps-{n} and a many-stop linear() spring-{n}', () => {
    const acc = new Map([easeAcc('cubic-bezier(0.25, 0.46, 0.45, 0.94)', 9), easeAcc('cubic-bezier(0.25, 0.5, 0.45, 0.94)', 4), easeAcc('steps(4, end)', 2), easeAcc('linear(0, 0.4, 0.8, 1)', 1)]);
    expect(buildEasings(acc, []).map((e) => e.name)).toEqual(['ease-out-quad', 'ease-custom-1', 'steps-4', 'spring-1']);
  });

  it('calls two easings near when every control point is within 0.05', () => {
    expect(nearEasing('cubic-bezier(0.25, 0.46, 0.45, 0.94)', 'cubic-bezier(0.28, 0.5, 0.45, 0.94)')).toBe(true);
    expect(nearEasing('cubic-bezier(0.25, 0.46, 0.45, 0.94)', 'ease-in')).toBe(false);
  });
});

describe('static motion', () => {
  const el = (style: Record<string, string>) => ({ tag: 'button', parent: 0, style });
  const capture = () =>
    fakeCapture([
      {
        path: '/',
        desktop: snap([
          { tag: 'body' },
          el({ 'transition-property': 'background-color, transform, box-shadow', 'transition-duration': '0.16s, 0.16s, 0.16s', 'transition-timing-function': 'cubic-bezier(0.25, 0.46, 0.45, 0.94), cubic-bezier(0.25, 0.46, 0.45, 0.94), cubic-bezier(0.25, 0.46, 0.45, 0.94)', 'transition-delay': '0s' }),
          el({ 'transition-property': 'opacity', 'transition-duration': '240ms', 'transition-timing-function': 'cubic-bezier(0.25, 1, 0.5, 1)', 'transition-delay': '0.06s' }),
          el({ 'transition-property': 'opacity', 'transition-duration': '0.242s', 'transition-timing-function': 'cubic-bezier(0.25, 1, 0.5, 1)', 'transition-delay': '0.12s' }),
          el({ 'animation-name': 'fade-up', 'animation-duration': '0.48s', 'animation-timing-function': 'cubic-bezier(0.25, 1, 0.5, 1)', 'animation-iteration-count': '1', 'transition-property': 'all', 'transition-duration': '0s' }),
        ]),
      },
    ]);

  it('reads durations from transition and animation longhands, rounded to 5 ms, delays never', () => {
    const t = collectTimings(capture());
    expect([...t.durations.keys()].sort((a, b) => a - b)).toEqual([160, 240, 480]);
    expect(t.durations.get(160)!.usage).toBe(3);
    expect(t.durations.get(240)!.raw).toEqual(new Set(['240ms', '0.242s']));
  });

  it('names an easing the site declares by its variable, before the table', () => {
    const vars: SiteVariable[] = [{ name: '--ease-out-quart', value: 'cubic-bezier(0.25, 1, 0.5, 1)', resolved: 'cubic-bezier(0.25, 1, 0.5, 1)', kind: 'easing', hashed: false, usage: 3, pages: [], scope: 'root' }];
    const easing = buildEasings(collectTimings(capture()).easings, vars);
    expect(easing.map((e) => [e.name, e.siteName ?? ''])).toEqual([
      ['ease-out-quad', ''],
      ['ease-out-quart', '--ease-out-quart'],
    ]);
  });

  it('roles the most used duration base, the nearer shorter fast then faster, longer slow then slower', () => {
    const roles = durationRoles([100, 120, 160, 240, 480, 1600].map((ms) => ({ ms, usage: ms === 160 ? 9 : 1 })));
    expect(Object.fromEntries(roles)).toEqual({ 160: 'base', 120: 'fast', 100: 'faster', 240: 'slow', 480: 'slower' });
    const d = buildDurations(collectTimings(capture()).durations, []);
    expect(d.map((x) => [x.name, x.role])).toEqual([
      ['duration-160', 'base'],
      ['duration-240', 'slow'],
      ['duration-480', 'slower'],
    ]);
  });

  it('keeps every @keyframes block with its condition, marks the unused, and resolves root variables', () => {
    const cap = capture();
    const vc = cap.pages[0]!.viewports.desktop!;
    vc.sheets = { ...vc.sheets, keyframes: [{ name: 'fade-up', css: '@keyframes fade-up { from { opacity: 0; color: var(--c-ink); } to { opacity: 1; } }' }, { name: 'spin', css: '@keyframes spin { to { transform: rotate(360deg); } }', condition: '@media (prefers-reduced-motion: no-preference)' }], rootVars: [] };
    const vars: SiteVariable[] = [{ name: '--c-ink', value: '#111', resolved: '#111111', kind: 'color', hashed: false, usage: 1, pages: [], scope: 'root' }];
    const k = buildKeyframes(cap, collectTimings(cap).keyframeUse, vars);
    expect(k.map((x) => [x.name, x.used, x.condition ?? ''])).toEqual([
      ['fade-up', true, ''],
      ['spin', false, '@media (prefers-reduced-motion: no-preference)'],
    ]);
    expect(k[0]!.css).toContain('color: #111111');
    expect(k[0]!.unresolved).toEqual([]);
  });
});

const anim = (key: number, over: Partial<AnimRecord>): AnimRecord => ({ key, pseudo: null, source: 'css-transition', name: '', property: 'opacity', duration: 240, delay: 0, easing: 'cubic-bezier(0.25, 1, 0.5, 1)', iterations: 1, start: { opacity: '0' }, end: { opacity: '1' }, t: 3000, scrollY: 900, inView: true, top: 700, vh: 900, scrollTimeline: false, ...over });
const elementOf = (d: string, path: string): MotionElement => ({ d, own: true, tag: 'div', path, parent: path.split('.').slice(0, -1).join('.') });

function source(records: Partial<MotionRecords>, els: MotionElement[]): PatternSource {
  const s = snap([{ tag: 'body' }, { tag: 'header', parent: 0, box: [0, 0, 1440, 64] }, ...Array.from({ length: 6 }, (_e, i) => ({ tag: 'div', parent: 0, box: [0, 900 + i * 300, 400, 200] as [number, number, number, number] }))]);
  return { pageId: 'page0000', viewport: 'desktop', records: { anims: [], samples: [], classes: [], observers: [], truncated: false, scrollStart: 2000, elements: els, ...records }, selectors: Object.fromEntries(s.elements.map((e) => [e.d, `.x${e.index}`])), snapshot: s, scrolled: [] };
}

describe('classification into patterns', () => {
  const els = [elementOf('e1', '0'), elementOf('e2', '1.0'), elementOf('e3', '1.1'), elementOf('e4', '1.2'), elementOf('e5', '1.3')];

  it('finds an entrance, a reveal triggered at the observer margin, and a loop; header motion is the scrolled header', () => {
    const src = source(
      {
        anims: [
          anim(1, { source: 'css-animation', name: 'fade-up', t: 120, scrollY: 0, inView: true, duration: 480, start: { opacity: '0', transform: 'translateY(12px)' }, end: { opacity: '1', transform: 'none' } }),
          anim(2, { t: 3100 }),
          anim(3, { source: 'css-animation', name: 'pulse', iterations: 'infinite', duration: 1600, start: { opacity: '1' }, end: { opacity: '0.4' } }),
          anim(0, { t: 2500 }),
        ],
        classes: [{ key: 2, t: 3095, scrollY: 900, added: ['is-visible'], removed: [] }],
        observers: [{ rootMargin: '0px 0px -15% 0px', thresholds: [0] }],
      },
      els,
    );
    const p = patternsOf(src);
    expect(p.map((x) => [x.kind, x.trigger.type, x.trigger.value ?? null, x.observed])).toEqual([
      ['entrance', 'load', null, false],
      ['loop', 'load', null, false],
      ['scroll-reveal', 'in-view', 0.15, false],
    ]);
    expect(p[0]!.start).toEqual({ opacity: '0', transform: 'translateY(12px)' });
    expect(p[0]!.keyframesName).toBe('fade-up');
  });

  it('reads an inline-style reveal with its measured duration and no easing, and tells scrolling from time', () => {
    const run = (key: number, t0: number, scrolls: boolean): StyleSample[] => Array.from({ length: 6 }, (_, i) => ({ key, t: t0 + i * 80, scrollY: 1800 + (scrolls ? i * 100 : 0), values: { opacity: String(i / 5), transform: `translateY(${10 - i * 2}px)` }, inView: true, top: 600, vh: 900 }));
    const src = source({ samples: [...run(1, 3000, false), ...run(2, 3000, true)] }, els);
    const p = patternsOf(src);
    expect(p.map((x) => [x.kind, x.source, x.observed, x.easing, x.durationMs])).toEqual([
      ['scroll-reveal', 'inline-style', true, null, 400],
      ['scroll-progress', 'inline-style', true, null, 400],
    ]);
    expect(p[1]!.trigger).toEqual({ type: 'scroll', value: 0.55 });
  });

  it('collapses five siblings moving 60 ms apart into one staggered pattern', () => {
    const src = source({ anims: [0, 1, 2, 3, 4].map((k) => anim(k, { t: 3000, delay: k * 60 })) }, [elementOf('e2', '1.0'), elementOf('e3', '1.1'), elementOf('e4', '1.2'), elementOf('e5', '1.3'), elementOf('e6', '1.4')]);
    const p = patternsOf(src);
    expect(p).toHaveLength(1);
    expect(p[0]!.stagger!.count).toBe(5);
    expect(Math.abs(p[0]!.stagger!.stepMs - 60)).toBeLessThanOrEqual(10);
  });

  it('does not stagger siblings that start apart at uneven steps', () => {
    const base = patternsOf(source({ anims: [anim(1, { t: 3000 }), anim(2, { t: 3060 }), anim(3, { t: 3900 })] }, els));
    expect(base.map((x) => x.stagger?.count ?? 1)).toEqual([1, 1, 1]);
    expect(stagger(base)).toHaveLength(3);
  });

  it('dedups the same motion on the same fingerprint, orders by kind then instances, and caps at 80', () => {
    const one = (kind: BuiltPattern['kind'], fingerprint: string, page = 'page0000'): BuiltPattern => ({ kind, elementKey: 'div|0', selector: `.${fingerprint}`, pageId: page, pageIds: [page], viewport: 'desktop', instances: 1, trigger: { type: 'load' }, start: { opacity: '0' }, end: { opacity: '1' }, durationMs: 200, delayMs: 0, easing: 'ease', iterations: 1, source: 'css-transition', observed: false, targets: [{ pageId: page, viewport: 'desktop', d: 'e1' }], fingerprint, parent: '', at: 0 });
    const many = [one('loop', 'a'), one('entrance', 'b'), one('entrance', 'b', 'page0001'), ...Array.from({ length: 90 }, (_, i) => one('scroll-reveal', `r${i}`))];
    const out = finalizePatterns(many);
    expect(out).toHaveLength(80);
    expect(out[0]!.kind).toBe('entrance');
    expect(out[0]!.instances).toBe(2);
    expect(out[0]!.pageIds).toEqual(['page0000', 'page0001']);
    expect(out.some((x) => x.kind === 'loop')).toBe(false);
    expect(new Set(out.map((x) => x.id)).size).toBe(80);
  });

  it('keeps one pattern, the desktop reading, for one element seen moving at both viewports', () => {
    const at = (viewport: 'desktop' | 'mobile', start: string, fingerprint: string, value: number): BuiltPattern => ({ kind: 'scroll-reveal', elementKey: 'div|1.0.3.0', selector: 'div.testimonial', pageId: 'page0000', pageIds: ['page0000'], viewport, instances: 1, trigger: { type: 'in-view', value }, start: { opacity: start }, end: { opacity: '1' }, durationMs: 400, delayMs: 0, easing: null, iterations: 1, source: 'inline-style', observed: true, targets: [{ pageId: 'page0000', viewport, d: viewport === 'desktop' ? 'e1' : 'e9' }], fingerprint, parent: '', at: 0 });
    const out = finalizePatterns([at('mobile', '0.04', 'div|small', 0.4), at('desktop', '0.03', 'div|large', 0.25)]);
    expect(out.map((p) => [p.viewport, p.trigger.value, p.instances])).toEqual([['desktop', 0.25, 1]]);
    expect(out[0]!.targets.map((t) => t.d)).toEqual(['e1', 'e9']);
  });

  it('reads a root margin bottom as a fraction of the viewport', () => {
    expect(rootMarginBottom('0px 0px -15% 0px', 900)).toBe(0.15);
    expect(rootMarginBottom('-90px', 900)).toBe(0.1);
    expect(rootMarginBottom('0px', 900)).toBe(0);
  });

  it('builds the run motion from a capture with no records as empty', () => {
    const m = buildMotion(fakeCapture([{ path: '/', desktop: snap([{ tag: 'body' }]) }]), []);
    expect(m.motion).toEqual({ patterns: [], truncatedPages: [], intersectionObservers: 0 });
    expect(m.duration).toEqual([]);
  });
});
