// The Shadow card's spacing (docs/design/components.md, ShadowSample; D-103): the gap is the smallest
// spacing token at or above twice the largest blur, never below `space-6`; the list pads itself by half.

/** The app's spacing scale in px (`design-system.md`, Spacing). */
const SCALE = [4, 8, 12, 16, 20, 28, 40, 64, 96];
const FLOOR = 28;

/** The blur radius of each layer: its third length, after `inset`; 0 when it cannot be read. */
export function blurRadii(value: string): number[] {
  const layers: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      layers.push(cur);
      cur = '';
    } else cur += ch;
  }
  layers.push(cur);
  return layers.map((layer) => {
    const lengths = layer
      .replace(/\b(rgba?|hsla?|oklch|oklab|color|lab|lch)\([^)]*\)/gi, '')
      .trim()
      .split(/\s+/)
      .filter((t) => t !== 'inset' && /^-?\d*\.?\d+(px)?$/.test(t))
      .map((t) => Number.parseFloat(t));
    const blur = lengths[2];
    return blur !== undefined && Number.isFinite(blur) && blur > 0 ? blur : 0;
  });
}

export function shadowGap(values: string[]): number {
  const want = Math.max(FLOOR, 2 * Math.max(0, ...values.flatMap(blurRadii)));
  return SCALE.find((s) => s >= want) ?? SCALE[SCALE.length - 1]!;
}
