'use client';
import { autoUpdate, flip, offset, shift, size, useFloating, type Placement } from '@floating-ui/react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { duration, ease, REDUCED_DURATION } from '../lib/motion';
import { usePrefersReducedMotion } from '../lib/motion/reduced';
import { focusables } from '../lib/focus';
import { PHONE, useMedia } from '../lib/use-media';
import { Sheet } from './Sheet';
import styles from './Popover.module.css';

const PopoverCloseContext = createContext<(restoreFocus?: boolean) => void>(() => {});

/** Closes the nearest Popover (for an action inside it, like saving a key). */
export function usePopoverClose(): (restoreFocus?: boolean) => void {
  return useContext(PopoverCloseContext);
}

export type PopoverTriggerProps = {
  ref: Ref<HTMLButtonElement>;
  onClick: () => void;
  'aria-expanded': boolean;
  'aria-haspopup': 'dialog';
  'aria-controls': string | undefined;
};

type PopoverProps = {
  /** The dialog's name, for screen readers. */
  label: string;
  /** Max width in px; over 320 it opens as a Sheet on phones. */
  width?: number;
  placement?: Placement;
  trigger: (props: PopoverTriggerProps) => ReactNode;
  children: ReactNode;
  /** Catalog and tests: start open. */
  defaultOpen?: boolean;
};

/** A floating Card anchored to its trigger. Opens on click, Enter or Space; closes on Escape,
 *  outside click, and when focus leaves. Focus moves in on open and back on close. */
export function Popover({ label, width = 320, placement = 'bottom-start', trigger, children, defaultOpen = false }: PopoverProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const phone = useMedia(PHONE);
  const reduced = usePrefersReducedMotion();
  const asSheet = phone && width > 320;
  const { refs, floatingStyles, placement: finalPlacement } = useFloating({
    open: open && !asSheet,
    placement,
    strategy: 'fixed',
    middleware: [
      offset(8),
      flip({ padding: 12 }),
      shift({ padding: 12 }),
      size({
        padding: 12,
        apply({ availableWidth, availableHeight, elements }) {
          elements.floating.style.maxWidth = `${Math.min(width, availableWidth)}px`;
          elements.floating.style.maxHeight = `${Math.max(160, Math.min(availableHeight, 560))}px`;
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const setTrigger = useCallback(
    (el: HTMLButtonElement | null) => {
      triggerRef.current = el;
      refs.setReference(el);
    },
    [refs],
  );
  const setContent = useCallback(
    (el: HTMLDivElement | null) => {
      contentRef.current = el;
      refs.setFloating(el);
    },
    [refs],
  );

  const close = useCallback((restore = true) => {
    setOpen(false);
    if (restore) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open || asSheet) return;
    const t = setTimeout(() => {
      const root = contentRef.current;
      if (root) (focusables(root)[0] ?? root).focus();
    }, 0);
    function onDown(e: PointerEvent) {
      const target = e.target as Node;
      if (contentRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    }
    document.addEventListener('pointerdown', onDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, asSheet, close]);

  const side = finalPlacement.split('-')[0];
  const from = { top: { y: 8 }, bottom: { y: -8 }, left: { x: 8 }, right: { x: -8 } }[side as 'top'] ?? { y: -8 };
  const enter = reduced ? { opacity: 1, transition: { duration: REDUCED_DURATION } } : { x: 0, y: 0, opacity: 1, transition: { duration: duration.fast, ease: ease.standard } };
  const leave = reduced ? { opacity: 0, transition: { duration: REDUCED_DURATION } } : { ...from, opacity: 0, transition: { duration: duration.fast, ease: ease.exit } };
  const body = <PopoverCloseContext.Provider value={close}>{children}</PopoverCloseContext.Provider>;

  return (
    <>
      {/* eslint-disable-next-line react-hooks/refs -- ref callbacks handed to the render prop run on commit, not during render */}
      {trigger({
        ref: setTrigger,
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        'aria-controls': open ? id : undefined,
      } as PopoverTriggerProps)}
      {asSheet ? (
        <Sheet open={open} onClose={() => close()} label={label} handleLabel={label}>
          <div id={id}>{body}</div>
        </Sheet>
      ) : typeof document !== 'undefined' ? (
        createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                key="popover"
                id={id}
                ref={setContent}
                role="dialog"
                aria-label={label}
                tabIndex={-1}
                className={styles.popover}
                style={{ ...floatingStyles, width }}
                initial={reduced ? { opacity: 0 } : { ...from, opacity: 0 }}
                animate={enter}
                exit={leave}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    close();
                  }
                }}
                onBlur={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && (contentRef.current?.contains(next) || triggerRef.current?.contains(next))) return;
                  if (next) close(false);
                }}
              >
                {body}
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      ) : null}
    </>
  );
}
