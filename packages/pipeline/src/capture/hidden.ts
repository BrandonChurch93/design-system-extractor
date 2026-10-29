// Hidden at capture (docs/specs/capture-and-states.md, DOM snapshot; D-108): what a reader cannot see on
// the page at rest, measured, so a 1440 × 0 header or an `sr-only` link is never taken for a visible element.

type Box = { x: number; y: number; w: number; h: number };
type Styles = { display?: string; visibility?: string; opacity?: string; clip?: string; 'clip-path'?: string; width?: string; height?: string };

const zeroRect = /^rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)$/;

/** The style half of the rule, which a state's styles can be read against too. */
export function hiddenByStyle(s: Styles): boolean {
  if (s.display === 'none' || s.visibility === 'hidden') return true;
  if (s.opacity !== undefined && s.opacity !== '' && Number(s.opacity) === 0) return true;
  if (zeroRect.test((s.clip ?? '').trim())) return true;
  const inset = /^inset\(\s*(\d+(?:\.\d+)?)%/.exec((s['clip-path'] ?? '').trim());
  return Boolean(inset && Number(inset[1]) >= 50);
}

export function hiddenAtCapture(b: Box, s: Styles, docW: number): boolean {
  if (b.w <= 1 || b.h <= 1) return true;
  if (b.x + b.w <= 0 || b.y + b.h <= 0 || b.x >= docW) return true;
  return hiddenByStyle(s);
}

/** A hidden element that can still take focus stays a candidate, so its focus state is captured. */
export function focusableWhileHidden(s: Styles, tabbable: boolean): boolean {
  return tabbable && s.display !== 'none' && s.visibility !== 'hidden';
}

/** Whether an element's styles at focus (computed width and height included) still hide it. */
export function hiddenAtFocus(s: Styles): boolean {
  const n = (v?: string) => Number.parseFloat(v ?? '');
  if (n(s.width) <= 1 || n(s.height) <= 1) return true;
  return hiddenByStyle(s);
}
