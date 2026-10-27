'use client';
import { Play, Square } from 'lucide-react';
import { runPage } from '../../copy/strings';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { Button } from '../Button';
import styles from './ReplayButton.module.css';

const M = runPage.motion;

/**
 * Plays a site's own motion once (docs/design/components.md, ReplayButton). With reduced motion it is
 * off: the motion shows its end state and the button points at the group's caption (`captionId`), or
 * carries the caption itself when it stands alone.
 */
export function ReplayButton({ playing, onToggle, captionId, forceReduced }: { playing: boolean; onToggle: () => void; captionId?: string; /** Catalog only. */ forceReduced?: boolean }) {
  const reduced = usePrefersReducedMotion() || Boolean(forceReduced);
  if (reduced)
    return (
      <span className={styles.wrap}>
        <Button variant="ghost" size="sm" icon={Play} disabled aria-describedby={captionId}>
          {M.replay}
        </Button>
        {captionId ? null : <span className={styles.caption}>{M.reducedMotion}</span>}
      </span>
    );
  return (
    <Button variant="ghost" size="sm" icon={playing ? Square : Play} onClick={onToggle} aria-pressed={playing}>
      {playing ? M.stop : M.replay}
    </Button>
  );
}

/** The shared caption a group of disabled Replay buttons points at. */
export function ReplayCaption({ id }: { id: string }) {
  const reduced = usePrefersReducedMotion();
  return reduced ? (
    <p id={id} className={styles.caption} data-testid="replay-reduced">
      {M.reducedMotion}
    </p>
  ) : null;
}
