'use client';
import { motion } from 'motion/react';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { variantsFor, type Move } from '../../lib/motion';
import { usePrefersReducedMotion } from '../../lib/motion/reduced';
import { useEntered } from '../../lib/motion/use-entered';

type Tag = 'div' | 'span' | 'li' | 'p' | 'h1' | 'h2' | 'h3' | 'section' | 'tr' | 'ul';

/**
 * An element that performs one move the first time it comes into view, whether it was on the page
 * at load or arrived with a poll. Never again: a poll that changes nothing re-renders it without
 * re-animating.
 */
export function Enter({
  move,
  index = 0,
  as = 'div',
  className,
  style,
  children,
  ...rest
}: {
  move: Exclude<Move, 'count'>;
  index?: number;
  as?: Tag;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  'aria-hidden'?: boolean;
  'aria-labelledby'?: string;
  role?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const entered = useEntered(ref);
  const M = motion[as] as typeof motion.div;
  return (
    <M
      ref={ref}
      className={className}
      style={move === 'extend' ? { transformOrigin: 'left center', ...style } : style}
      data-move={move}
      variants={variantsFor(move, reduced)}
      custom={index}
      initial="hidden"
      animate={entered ? 'shown' : 'hidden'}
      {...rest}
    >
      {children}
    </M>
  );
}
