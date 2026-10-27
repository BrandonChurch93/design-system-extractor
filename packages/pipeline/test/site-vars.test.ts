import { describe, expect, it } from 'vitest';
import type { SiteVariable } from '@dse/schema';
import type { MatchedStyles } from '../src/capture/matched-css';
import { normalizeColor, normalizeTransform, styleDelta, transitionFor, withTransitions } from '../src/capture/states';
import { styleProps } from '../src/capture/snapshot-script';
import { parseCssColor } from '../src/color/parse';
import { buildColors } from '../src/tokens/colors';
import { emptyRaw, type RawColor } from '../src/tokens/collect';
import { buildOverlays, roundAlpha, splitOverlays } from '../src/tokens/overlays';
import { applySiteNames, collectSiteVariables, inferKind, isHashedName, shadowKey, siteTokenName } from '../src/tokens/site-vars';
import { fakeCapture } from './helpers/capture';
import { snap } from './helpers/snap';

const raw = (hex: string, weight: number, use: 'text' | 'background' = 'text'): RawColor => ({ hex, rgba: parseCssColor(hex)!, weight, uses: { text: use === 'text' ? weight : 0, background: use === 'background' ? weight : 0, border: 0, other: 0 }, semantic: 0, pages: new Map([['page0000', weight]]) });
const decl = (name: string, value: string) => ({ name, value, important: false });

describe('site variables', () => {
  function captureWith(rootVars: { name: string; value: string; resolved: string }[], declarations: { name: string; value: string }[]) {
    const cap = fakeCapture([{ path: '/', desktop: snap([{ tag: 'body' }, { tag: 'button', parent: 0 }]) }]);
    const vc = cap.pages[0]!.viewports.desktop!;
    vc.sheets = { ...vc.sheets, keyframes: [], rootVars: rootVars.map((v) => ({ ...v, scope: 'root' as const })) };
    const matched: Record<string, MatchedStyles> = { e1: { rules: [{ selector: '.btn', matched: ['.btn'], origin: 'regular', media: [], supports: [], declarations: declarations.map((d) => decl(d.name, d.value)) }], inline: [], pseudo: [] } };
    vc.matched = matched;
    return cap;
  }

  it('collects what a kept declaration references, with its kind from where it is used', () => {
    const cap = captureWith(
      [
        { name: '--color-text-primary', value: '#0b1f3a', resolved: '#0b1f3a' },
        { name: '--radius-rounded', value: '999px', resolved: '999px' },
        { name: '--text-small-size', value: '14px', resolved: '14px' },
        { name: '--ease-out-quart', value: 'cubic-bezier(0.25, 1, 0.5, 1)', resolved: 'cubic-bezier(0.25, 1, 0.5, 1)' },
        { name: '--unused', value: '1px', resolved: '1px' },
        { name: '--sx-1fj52yw', value: '#2458e6', resolved: '#2458e6' },
      ],
      [
        { name: 'color', value: 'var(--color-text-primary)' },
        { name: 'border-radius', value: 'var(--radius-rounded)' },
        { name: 'font-size', value: 'var(--text-small-size)' },
        { name: 'transition', value: 'transform 160ms var(--ease-out-quart)' },
        { name: 'background', value: 'var(--sx-1fj52yw)' },
      ],
    );
    const vars = collectSiteVariables(cap);
    expect(vars.map((v) => [v.name, v.kind ?? '', v.hashed])).toEqual([
      ['--color-text-primary', 'color', false],
      ['--ease-out-quart', 'easing', false],
      ['--radius-rounded', 'radius', false],
      ['--sx-1fj52yw', 'color', true],
      ['--text-small-size', 'type', false],
    ]);
  });

  it('never names a token from a hashed, doubled or framework-internal variable', () => {
    for (const n of ['--sx-1fj52yw', '--x---icon-default-color', '--tw-ring-color', '--a-b1c2d3e']) expect(isHashedName(n), n).toBe(true);
    for (const n of ['--color-gray-500', '--radius-rounded', '--space-4xl', '--ease-out-quart']) expect(isHashedName(n), n).toBe(false);
  });

  it('strips the leading dashes, the kind prefix and a type size word', () => {
    expect(siteTokenName('color', '--color-text-tertiary')).toBe('text-tertiary');
    expect(siteTokenName('color', '--clr-ink')).toBe('ink');
    expect(siteTokenName('type', '--text-small-size')).toBe('text-small');
    expect(siteTokenName('radius', '--radius-rounded')).toBe('rounded');
    expect(siteTokenName('easing', '--ease-out-quart')).toBe('ease-out-quart');
  });

  it("beats the generated name: the site's name within ΔE 1, the most used variable naming, the others mapped", () => {
    const r = emptyRaw();
    for (const c of [raw('#0B1F3A', 40), raw('#6B7280', 20)]) r.colors.set(c.hex, c);
    const palette = buildColors(r).tokens;
    const vars: SiteVariable[] = [
      { name: '--color-text-primary', value: '', resolved: '#0B1F3B', kind: 'color' as const, hashed: false, usage: 9, pages: [], scope: 'root' as const },
      { name: '--brand-ink', value: '', resolved: '#0B1F3A', kind: 'color' as const, hashed: false, usage: 2, pages: [], scope: 'root' as const },
      { name: '--sx-9ab3c1', value: '', resolved: '#6B7280', kind: 'color' as const, hashed: true, usage: 30, pages: [], scope: 'component' as const },
    ];
    const named = applySiteNames('color', palette, (t) => t.value, vars);
    expect(named.map((n) => [n.token.value, n.name])).toEqual([['#0B1F3A', 'text-primary']]);
    expect(vars[1]!.mapsTo).toBe(palette.find((t) => t.value === '#0B1F3A')!.id);
  });

  it('compares a declared shadow with the computed one by its parts', () => {
    expect(shadowKey('0 1px 2px rgba(11, 31, 58, 0.12)')).toBe(shadowKey('rgba(11, 31, 58, 0.12) 0px 1px 2px 0px'));
    expect(shadowKey('none')).toBe('');
  });

  it('infers a kind from the value alone when nothing types it', () => {
    expect(inferKind('--x', '#fff', new Map())).toBe('color');
    expect(inferKind('--bp-md', '768px', new Map())).toBe('breakpoint');
    expect(inferKind('--x', '12px', new Map())).toBeUndefined();
  });
});

describe('overlays', () => {
  it('splits every translucent raw color out of the palette, as a base and an alpha rounded to 2%', () => {
    const r = emptyRaw();
    for (const c of [raw('#0B1F3A', 40), raw('#FFFFFF', 30, 'background'), raw('#FFFFFF14', 6, 'background'), raw('#08090A99', 4, 'background'), raw('#0B1F3A1F', 2)]) r.colors.set(c.hex, c);
    const translucent = splitOverlays(r);
    expect([...r.colors.keys()].sort()).toEqual(['#0B1F3A', '#FFFFFF']);
    const palette = buildColors(r).tokens;
    const overlays = buildOverlays(translucent, palette);
    const navy = palette.find((t) => t.value === '#0B1F3A')!;
    expect(overlays.map((o) => [o.name, o.base, o.alpha, o.value])).toEqual([
      ['white-8', 'white', 0.08, 'rgb(255 255 255 / 8%)'],
      [`${navy.name}-60`, navy.id, 0.6, 'rgb(11 31 58 / 60%)'],
      [`${navy.name}-12`, navy.id, 0.12, 'rgb(11 31 58 / 12%)'],
    ]);
    expect(roundAlpha(0.05)).toBe(0.06);
  });
});

describe('the state diff', () => {
  const row = (over: Record<string, string>) => {
    const base: Record<string, string> = { color: 'rgb(0, 0, 0)', 'background-color': 'rgb(255, 255, 255)', 'outline-style': 'none', 'outline-width': '0px', 'outline-color': 'rgb(0, 0, 0)', opacity: '1', transform: 'none', filter: 'none', 'box-shadow': 'none' };
    for (const s of ['top', 'right', 'bottom', 'left']) Object.assign(base, { [`border-${s}-color`]: 'rgb(200, 200, 200)', [`border-${s}-width`]: '1px', [`border-${s}-style`]: 'solid', [`padding-${s}`]: '8px' });
    const all = { ...base, ...over };
    return styleProps.map((p) => all[p] ?? '');
  };

  it('records a hover that lifts and glows: transform, filter, opacity and box-shadow, each with its timing', () => {
    const from = row({});
    const to = row({ transform: 'matrix(1, 0, 0, 1, 0, -1)', filter: 'brightness(1.1)', opacity: '0.9', 'box-shadow': 'rgba(0, 0, 0, 0.2) 0px 4px 12px 0px' });
    const style = { 'transition-property': 'transform, filter, opacity, box-shadow', 'transition-duration': '0.16s', 'transition-timing-function': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', 'transition-delay': '0s' };
    const delta = withTransitions(styleDelta(from, to), style);
    expect(delta.map((d) => [d.property, d.to, d.transition?.durationMs])).toEqual([
      ['box-shadow', '0px 4px 12px 0px #00000033', 160],
      ['opacity', '0.9', 160],
      ['transform', 'translateY(-1px)', 160],
      ['filter', 'brightness(1.1)', 160],
    ]);
  });

  it('drops outline entries where no state has an outline, and keeps them where one does', () => {
    expect(styleDelta(row({}), row({ 'outline-color': 'rgba(0, 0, 0, 0)' })).some((d) => d.property.startsWith('outline'))).toBe(false);
    expect(styleDelta(row({}), row({ 'outline-style': 'solid', 'outline-width': '2px' })).map((d) => d.property)).toEqual(['outline-width', 'outline-style']);
  });

  it('collapses four equal border sides into one entry, else lists each side', () => {
    const same = styleDelta(row({}), row(Object.fromEntries(['top', 'right', 'bottom', 'left'].map((s) => [`border-${s}-color`, 'rgb(36, 88, 230)']))));
    expect(same.map((d) => [d.property, d.to])).toEqual([['border-color', '#2458E6']]);
    const one = styleDelta(row({}), row({ 'border-bottom-color': 'rgb(36, 88, 230)' }));
    expect(one.map((d) => d.property)).toEqual(['border-bottom-color']);
  });

  it('normalizes transforms and colors, and reads the transition that covers a property', () => {
    expect(normalizeTransform('matrix(0.98, 0, 0, 0.98, 0, 0)')).toBe('scale(0.98)');
    expect(normalizeTransform('matrix(1, 0, 0, 1, 0, 0)')).toBe('none');
    expect(normalizeColor('rgba(255, 255, 255, 0.08)')).toBe('rgb(255 255 255 / 8%)');
    const style = { 'transition-property': 'all', 'transition-duration': '200ms', 'transition-timing-function': 'ease', 'transition-delay': '50ms' };
    expect(transitionFor(style, 'border-color')).toEqual({ durationMs: 200, delayMs: 50, easing: 'ease' });
    expect(transitionFor({ 'transition-property': 'color', 'transition-duration': '0.2s', 'transition-timing-function': 'ease', 'transition-delay': '0s' }, 'opacity')).toBeNull();
  });
});
