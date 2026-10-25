import styles from './PaletteStrip.module.css';

export type PaletteBand = { value: string; share: number };

/** Up to 8 colors as bands proportional to usage, each at least 8%. No gaps, no labels. */
export function paletteWidths(bands: PaletteBand[]): number[] {
  const top = bands.slice(0, 8);
  if (!top.length) return [];
  const total = top.reduce((s, b) => s + Math.max(b.share, 0), 0) || top.length;
  const raw = top.map((b) => (total ? Math.max(b.share, 0) / total : 1 / top.length) * 100);
  const floor = 8;
  const fixed = raw.map((w) => w < floor);
  const used = fixed.filter(Boolean).length * floor;
  const rest = raw.reduce((s, w, i) => (fixed[i] ? s : s + w), 0);
  return raw.map((w, i) => (fixed[i] ? floor : rest ? (w / rest) * (100 - used) : (100 - used) / (top.length - fixed.filter(Boolean).length)));
}

export function PaletteStrip({ bands, block, height = 64, label }: { bands: PaletteBand[]; block?: boolean; height?: number; label?: string }) {
  const widths = paletteWidths(bands);
  if (!widths.length) {
    return <span className={`${styles.strip} ${styles.empty} ${block ? styles.block : ''}`} style={block ? undefined : { height }} aria-hidden="true" />;
  }
  return (
    <span
      className={`${styles.strip} ${block ? styles.block : ''}`}
      style={block ? undefined : { height }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {bands.slice(0, 8).map((b, i) => (
        <span key={`${b.value}-${i}`} className={styles.band} style={{ width: `${widths[i]}%`, background: b.value }} />
      ))}
    </span>
  );
}
