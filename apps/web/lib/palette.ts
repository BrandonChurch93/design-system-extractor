import type { RunDocumentPartial } from '@dse/schema';

/** The top colors by usage with their share of all uses: the PaletteStrip of a card and the OG image. */
export function paletteOf(doc: RunDocumentPartial, max = 8): { value: string; share: number }[] {
  const colors = [...(doc.tokens?.colors ?? [])].sort((a, b) => b.usage - a.usage);
  const total = colors.reduce((s, c) => s + c.usage, 0);
  if (!total) return [];
  return colors.slice(0, max).map((c) => ({ value: c.value, share: Math.round((c.usage / total) * 1000) / 1000 }));
}
