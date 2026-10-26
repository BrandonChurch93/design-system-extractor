import type { CaptureOutput } from '../stages/capture';
import type { CaptureSource } from './collect';

/** Every snapshot the run captured, revealed popups included, as collection sources. */
export function sourcesFrom(capture: CaptureOutput): CaptureSource[] {
  const out: CaptureSource[] = [];
  for (const pc of capture.pages) {
    if (pc.status !== 'captured') continue;
    for (const vc of Object.values(pc.viewports)) {
      if (!vc) continue;
      const focusOutlines: string[] = [];
      for (const recs of Object.values(vc.states)) {
        for (const r of recs) {
          if (r.state !== 'focus') continue;
          const width = r.delta.find((d) => d.property === 'outline-width');
          const color = r.delta.find((d) => d.property === 'outline-color');
          const style = r.delta.find((d) => d.property === 'outline-style');
          if (color && (!width || parseFloat(width.to) > 0) && style?.to !== 'none') focusOutlines.push(color.to);
        }
      }
      const base = { pageId: pc.page.id, isHome: pc.page.reason === 'home', viewport: vc.viewport, media: vc.sheets.media, fonts: vc.sheets.fonts };
      out.push({ ...base, snapshot: vc.snapshot, focusOutlines });
      for (const o of vc.opens) out.push({ ...base, snapshot: o.snapshot, focusOutlines: [], media: [], fonts: [] });
    }
  }
  return out;
}
