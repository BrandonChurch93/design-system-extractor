import { buildSnapshot, type Snapshot, type StyleMap } from '../../src/capture/snapshot';
import { styleProps } from '../../src/capture/snapshot-script';

// Crafted snapshots for unit tests: computed-style defaults a browser would report, overridden per element.

const defaults: Partial<StyleMap> = {
  color: 'rgb(0, 0, 0)',
  'background-color': 'rgba(0, 0, 0, 0)',
  'background-image': 'none',
  'box-shadow': 'none',
  display: 'block',
  position: 'static',
  opacity: '1',
  'font-family': 'Inter',
  'font-size': '16px',
  'font-weight': '400',
  'line-height': '24px',
  'letter-spacing': 'normal',
  'text-transform': 'none',
  'animation-name': 'none',
  'transition-duration': '0s',
};
for (const side of ['top', 'right', 'bottom', 'left']) {
  defaults[`border-${side}-width` as keyof StyleMap] = '0px';
  defaults[`border-${side}-style` as keyof StyleMap] = 'none';
  defaults[`border-${side}-color` as keyof StyleMap] = 'rgb(0, 0, 0)';
  defaults[`padding-${side}` as keyof StyleMap] = '0px';
  defaults[`margin-${side}` as keyof StyleMap] = '0px';
}
for (const corner of ['top-left', 'top-right', 'bottom-right', 'bottom-left']) defaults[`border-${corner}-radius` as keyof StyleMap] = '0px';

export type El = { tag: string; parent?: number; cls?: string[]; text?: string; own?: string; role?: string; aria?: Record<string, string>; box?: [number, number, number, number]; style?: Partial<StyleMap>; href?: boolean };

export function snap(els: El[], doc = { w: 1440, h: 3000 }): Snapshot {
  return buildSnapshot({
    elements: els.map((e, i) => {
      const [x, y, w, h] = e.box ?? [0, 0, 100, 40];
      const style = { ...defaults, ...e.style } as StyleMap;
      return { d: `e${i}`, p: e.parent ?? -1, tag: e.tag, id: '', cls: e.cls ?? [], role: e.role ?? null, type: null, href: e.href ?? e.tag === 'a', disabled: false, aria: e.aria ?? {}, attrs: {}, text: e.text ?? '', own: e.own ?? '', children: 0, x, y, w, h, vis: true, st: styleProps.map((p) => style[p] ?? ''), font: '', focusable: false };
    }),
    truncated: false,
    docW: doc.w,
    docH: doc.h,
    nodeCount: els.length,
    title: '',
    h1: '',
  });
}
