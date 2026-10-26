import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import styles from './Tag.module.css';

type TagProps = { children: ReactNode; className?: string } & (
  | ({ interactive: true; ref?: Ref<HTMLButtonElement> } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>)
  | { interactive?: false }
);

/** A token or category chip. Static text, except inside the component panel. */
export function Tag(props: TagProps) {
  const cls = [styles.tag, props.className ?? ''].filter(Boolean).join(' ');
  if (props.interactive) {
    const { interactive: _i, children, className: _c, type = 'button', ...rest } = props;
    return (
      <button type={type} className={`${cls} ${styles.button}`} {...rest}>
        {children}
      </button>
    );
  }
  return <span className={cls}>{props.children}</span>;
}
