'use client';
import { useId } from 'react';
import type { RunDocumentPartial } from '@dse/schema';
import { fill } from '@dse/schema/labels';
import { runPage } from '../../copy/strings';
import { count } from '../../lib/format';
import { baseDuration, motionCounts } from '../../lib/motion-view';
import { Card } from '../Card';
import { DurationStrip } from './DurationStrip';
import { EasingGrid } from './EasingCard';
import { KeyframesList } from './KeyframesList';
import { PatternList } from './PatternList';
import { RegionSkeleton } from './RegionSkeleton';
import { ReplayCaption } from './ReplayButton';
import { CardHead, Section } from './Section';
import styles from './MotionSection.module.css';

const M = runPage.motion;

/** Motion: durations on one scale, the easings, the keyframes, then what moves and when (pages.md, 9). */
export function MotionSection({ doc, landed, hrefFor, onOpen, id = 'motion', label }: { doc: RunDocumentPartial; landed: boolean; hrefFor?: (id: string) => string; onOpen?: (id: string) => void; id?: string; label?: string }) {
  const captionId = useId();
  const t = doc.tokens;
  const n = motionCounts(doc);
  const none = landed && n.durations + n.easings + n.keyframes + n.patterns === 0;
  const caption = landed && !none ? fill(M.caption, { durations: count(n.durations), easings: count(n.easings), keyframes: count(n.keyframes), patterns: count(n.patterns) }) : undefined;
  return (
    <Section id={id} title={M.heading} caption={caption} label={label}>
      {!landed ? (
        <RegionSkeleton region="motion" />
      ) : none ? (
        <Card className={styles.empty}>
          <p className={styles.emptyTitle}>{M.empty}</p>
          <p className={styles.emptyCaption}>{M.emptyCaption}</p>
        </Card>
      ) : (
        <div className={styles.stack}>
          <ReplayCaption id={captionId} />
          {t?.duration?.length ? (
            <Card>
              <CardHead title={M.durationsTitle} meta={count(n.durations)} />
              <DurationStrip durations={t.duration} />
            </Card>
          ) : null}
          {t?.easing?.length ? (
            <div className={styles.group}>
              <CardHead title={M.easingsTitle} meta={count(n.easings)} level={3} />
              <EasingGrid easings={t.easing} durationMs={baseDuration(doc)} captionId={captionId} />
            </div>
          ) : null}
          {t?.keyframes?.length ? (
            <Card>
              <CardHead title={M.keyframesTitle} meta={count(n.keyframes)} />
              <KeyframesList keyframes={t.keyframes} doc={doc} />
            </Card>
          ) : null}
          {doc.motion?.patterns.length ? (
            <Card>
              <CardHead title={M.patternsTitle} meta={count(n.patterns)} />
              <PatternList patterns={doc.motion.patterns} doc={doc} hrefFor={hrefFor} onOpen={onOpen} captionId={captionId} />
            </Card>
          ) : null}
        </div>
      )}
    </Section>
  );
}
