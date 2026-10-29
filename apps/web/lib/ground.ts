import { contrastRatio, deltaE, parseHex } from '@dse/pipeline/color';

// The contrast fallback (docs/specs/preview-fidelity.md, Preview ground; D-109): when the component's own
// fill is within ΔE 5 of the ground it sat on, the app paints its opposite tone. The sample stays the record.

export type GroundTone = 'light' | 'dark';

export function contrastFallback(fill: string | null | undefined, ground: string | null | undefined): GroundTone | null {
  if (!fill || !ground) return null;
  let f, g;
  try {
    f = parseHex(fill);
    g = parseHex(ground);
  } catch {
    return null;
  }
  if (deltaE(f, g) > 5) return null;
  // A dark ground reads better against white text than against black: `surface` for it, `inverse-bg` for a light one.
  return contrastRatio('#FFFFFF', ground) >= contrastRatio('#000000', ground) ? 'light' : 'dark';
}
