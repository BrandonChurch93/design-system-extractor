import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'ghost' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'xl';

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  /** Full width; only the Extract button on phones uses it. */
  block?: boolean;
  children: ReactNode;
  className?: string;
  /** Catalog only: render a state as if the pointer or keyboard were on it. */
  forceState?: 'hover' | 'focus' | 'active';
};

type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & { href?: undefined };
type AsLink = Common & { href: string; external?: boolean; onClick?: () => void; 'aria-label'?: string };

export function Button(props: AsButton | AsLink) {
  const { variant = 'ghost', size = 'md', icon: Icon, block, children, className, forceState } = props;
  const cls = [styles.button, styles[variant], styles[size], block ? styles.block : '', className ?? ''].filter(Boolean).join(' ');
  const content = (
    <>
      {Icon ? <Icon size={16} strokeWidth={1.75} aria-hidden="true" className={styles.icon} /> : null}
      <span className={styles.label}>{children}</span>
    </>
  );
  if (props.href !== undefined) {
    const { href, external, onClick } = props;
    if (external) {
      return (
        <a href={href} className={cls} data-force={forceState} onClick={onClick} aria-label={props['aria-label']} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} data-force={forceState} onClick={onClick} aria-label={props['aria-label']}>
        {content}
      </Link>
    );
  }
  const { variant: _v, size: _s, icon: _i, block: _b, children: _c, className: _cn, forceState: _f, type = 'button', ...rest } = props;
  return (
    <button type={type} className={cls} data-force={forceState} {...rest}>
      {content}
    </button>
  );
}
