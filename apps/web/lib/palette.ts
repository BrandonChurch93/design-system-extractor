import { composite, contrastRatio, parseCssColor } from '@dse/pipeline/color';
import type { RunDocumentPartial } from '@dse/schema';

/** The top colors by usage with their share of all uses: the PaletteStrip of a card and the OG image. */
export function paletteOf(doc: RunDocumentPartial, max = 8): { value: string; share: number }[] {
  const colors = [...(doc.tokens?.colors ?? [])].sort((a, b) => b.usage - a.usage);
  const total = colors.reduce((s, c) => s + c.usage, 0);
  if (!total) return [];
  return colors.slice(0, max).map((c) => ({ value: c.value, share: Math.round((c.usage / total) * 1000) / 1000 }));
}

/**
 * Whether a color reads as white on the app's ground, for the swatch's inner border. Any CSS color a
 * site wrote is read (a pattern's `rgb(12 10 9 / 85%)` included), a translucent one over white; one the
 * parser cannot read has no border rather than failing the page.
 */
export function nearWhite(value: string): boolean {
  const c = parseCssColor(value);
  if (!c) return false;
  return contrastRatio(c.a < 1 ? composite(c, { r: 255, g: 255, b: 255, a: 1 }) : c, '#FFFFFF') < 1.15;
}
