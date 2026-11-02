import { Skeleton } from '../Skeleton';
import styles from './RegionSkeleton.module.css';

export type SkeletonRegion = 'palette' | 'type' | 'spacing' | 'radius' | 'shadow' | 'motion' | 'components' | 'checks' | 'drift' | 'exports';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** The clean fixture's Motion section, measured at each breakpoint in RegionSkeleton.module.css (D-080, D-111, D-113). */
const MOTION = { strip: 'var(--dse-motion-strip)', easing: 'var(--dse-motion-easing)', lists: 'var(--dse-motion-lists)' };

/**
 * A run page region before its stage lands, at the height of a typical result so nothing below it
 * moves when the region fills (docs/design/components.md, RegionSkeleton; motion.md).
 */
export function RegionSkeleton({ region }: { region: SkeletonRegion }) {
  switch (region) {
    case 'palette':
      return (
        <ul className={styles.swatches} aria-hidden="true">
          {range(8).map((i) => (
            <li key={i} className={styles.swatch}>
              <Skeleton height={96} radius="md" />
              <Skeleton height={14} width="60%" />
              <Skeleton height={14} width="80%" />
            </li>
          ))}
        </ul>
      );
    case 'type':
      return (
        <span className={styles.rows} style={{ height: 580 }} aria-hidden="true">
          {range(8).map((i) => (
            <Skeleton key={i} height={0} width={`${92 - i * 7}%`} radius="md" className={styles.row} />
          ))}
        </span>
      );
    case 'spacing':
      return (
        <span className={styles.rows} style={{ height: 446 }} aria-hidden="true">
          {range(9).map((i) => (
            <Skeleton key={i} height={0} width={`${12 + i * 11}%`} radius="sm" className={styles.row} />
          ))}
        </span>
      );
    case 'radius':
    case 'shadow':
      // Heights per breakpoint, measured on the clean fixture's cards (D-103, D-112).
      return <Skeleton height="var(--dse-token-row)" radius="lg" className={region === 'radius' ? styles.radiusCard : styles.shadowCard} />;
    case 'motion':
      return (
        <span className={`${styles.stack} ${styles.motion}`} aria-hidden="true">
          <Skeleton height={MOTION.strip} radius="lg" />
          <ul className={styles.easings}>
            {range(2).map((i) => (
              <li key={i}>
                <Skeleton height={MOTION.easing} radius="lg" />
              </li>
            ))}
          </ul>
          <span className={styles.rows} style={{ height: MOTION.lists }}>
            {range(4).map((i) => (
              <Skeleton key={i} height={0} radius="md" className={styles.row} />
            ))}
          </span>
        </span>
      );
    case 'components':
      return (
        <span className={styles.stack} aria-hidden="true">
          <Skeleton height={32} width="56%" radius="pill" />
          {/* The tier heading, and the cards' taller check Pills (D-096). */}
          <Skeleton height={26} width={180} />
          <ul className={styles.cards}>
            {range(6).map((i) => (
              <li key={i} className={styles.card}>
                <Skeleton height={152} on="surface" />
                {/* The control strip under the preview region: the clean fixture's two rows average 59 (39, and 79 where a card holds both captions; D-112). */}
                <Skeleton height={59} on="surface" className={styles.cardControls} />
                <span className={styles.cardBody}>
                  <Skeleton height={16} width="50%" on="surface" />
                  <Skeleton height={12} width="80%" on="surface" />
                  <Skeleton height={12} width="60%" on="surface" />
                </span>
              </li>
            ))}
          </ul>
          <Skeleton height={44} width={120} radius="md" />
        </span>
      );
    case 'checks':
      return (
        <span className={styles.stack} aria-hidden="true">
          {/* The opening line and its margin (D-096): 63 px in all with the stack's gap. */}
          <Skeleton height={43} width="60%" />
          <Skeleton height={143} radius="lg" />
          <span className={styles.rows} style={{ height: 374 }}>
            {range(5).map((i) => (
              <Skeleton key={i} height={0} radius="md" className={styles.row} />
            ))}
          </span>
        </span>
      );
    case 'drift':
      return (
        <span className={styles.stack} aria-hidden="true">
          <span className={styles.numbers}>
            {range(3).map((i) => (
              <Skeleton key={i} height={150} radius="lg" />
            ))}
          </span>
          <Skeleton height={260} radius="lg" />
        </span>
      );
    case 'exports':
      return (
        <span className={styles.stack} aria-hidden="true">
          <Skeleton height={36} width="40%" radius="pill" />
          <ul className={styles.cards}>
            {range(8).map((i) => (
              <li key={i}>
                <Skeleton height={146} radius="lg" />
              </li>
            ))}
          </ul>
          <Skeleton height={158} radius="lg" />
        </span>
      );
  }
}
