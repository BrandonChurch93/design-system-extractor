import Link from 'next/link';
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

type CardProps = {
  children: ReactNode;
  href?: string;
  /** No padding: the caller lays out flush regions (a preview, a palette strip). */
  flush?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
  forceState?: 'hover' | 'focus';
  'aria-label'?: string;
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>;

export function Card({ children, href, flush, className, as = 'div', forceState, ...rest }: CardProps) {
  const cls = [styles.card, flush ? styles.flush : '', href ? styles.link : '', className ?? ''].filter(Boolean).join(' ');
  if (href) {
    return (
      <Link href={href} className={cls} data-force={forceState} aria-label={rest['aria-label']}>
        {children}
      </Link>
    );
  }
  const Tag = as;
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
