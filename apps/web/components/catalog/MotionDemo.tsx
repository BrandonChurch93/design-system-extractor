'use client';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { drawVariants, extendVariants, revealContentVariants, revealFrameVariants, slideVariants } from '../../lib/motion';
import { countTo } from '../../lib/motion/gsap';
import { Button } from '../Button';
import { Card } from '../Card';
import styles from './MotionDemo.module.css';

const moves = ['draw', 'wipe', 'extend', 'count', 'slide', 'reveal'] as const;

function Count({ to, run }: { to: number; run: number }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const t = countTo(el.current, to);
    return () => {
      t?.kill();
    };
  }, [to, run]);
  return (
    <span ref={el} className={styles.count}>
      {to}
    </span>
  );
}

/** The six moves of docs/design/motion.md, each replayable. */
export function MotionDemo({ replayLabel }: { replayLabel: string }) {
  const [run, setRun] = useState(0);
  return (
    <div className={styles.demo}>
      <Button size="sm" icon={RefreshCw} onClick={() => setRun((r) => r + 1)}>
        {replayLabel}
      </Button>
      <div className={styles.grid} key={run}>
        <figure className={styles.cell}>
          <motion.span className={styles.rule} data-move="draw" variants={drawVariants(0.6)} initial="hidden" animate="shown" />
          <figcaption className={styles.caption}>{moves[0]}</figcaption>
        </figure>
        <figure className={styles.cell}>
          <motion.span className={styles.wipe} data-move="wipe" variants={drawVariants(0.6)} initial="hidden" animate="shown">
            14 grays across 12 pages. 5 would do.
          </motion.span>
          <figcaption className={styles.caption}>{moves[1]}</figcaption>
        </figure>
        <figure className={styles.cell}>
          <div className={styles.bars}>
            {[96, 64, 48, 32, 16].map((w, i) => (
              <motion.span key={w} className={styles.bar} style={{ width: `${w}%` }} custom={i} data-move="extend" variants={extendVariants(0.42)} initial="hidden" animate="shown" />
            ))}
          </div>
          <figcaption className={styles.caption}>{moves[2]}</figcaption>
        </figure>
        <figure className={styles.cell}>
          <Count to={118} run={run} />
          <figcaption className={styles.caption}>{moves[3]}</figcaption>
        </figure>
        <figure className={styles.cell}>
          <motion.div data-move="slide" variants={slideVariants('bottom')} initial="hidden" animate="shown">
            <Card className={styles.small}>tidewater.app</Card>
          </motion.div>
          <figcaption className={styles.caption}>{moves[4]}</figcaption>
        </figure>
        <figure className={styles.cell}>
          <motion.div className={styles.revealFrame} data-move="reveal" variants={revealFrameVariants()} initial="hidden" animate="shown">
            <motion.span className={styles.revealText} data-move="wipe" variants={revealContentVariants()}>
              tidewater.app
            </motion.span>
          </motion.div>
          <figcaption className={styles.caption}>{moves[5]}</figcaption>
        </figure>
      </div>
    </div>
  );
}
