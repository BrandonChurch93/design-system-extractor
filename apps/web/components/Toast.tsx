'use client';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { variantsFor } from '../lib/motion';
import { usePrefersReducedMotion } from '../lib/motion/reduced';
import styles from './Toast.module.css';

type ToastApi = { show: (message: string) => void };
const ToastContext = createContext<ToastApi>({ show: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const DISMISS_MS = 4000;

/** One toast at a time, bottom right, auto-dismissed after 4 s, paused while hovered. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remaining = useRef(DISMISS_MS);
  const startedAt = useRef(0);
  const reduced = usePrefersReducedMotion();

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const start = useCallback((ms: number) => {
    clear();
    startedAt.current = Date.now();
    remaining.current = ms;
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const show = useCallback(
    (message: string) => {
      setToast({ id: Date.now(), message });
      start(DISMISS_MS);
    },
    [start],
  );

  useEffect(() => clear, []);
  const api = useMemo(() => ({ show }), [show]);
  const variants = variantsFor('slide', reduced, { edge: 'bottom' });

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        <AnimatePresence>
          {toast ? (
            <motion.div
              key={toast.id}
              className={styles.toast}
              data-inverse=""
              variants={variants}
              initial="hidden"
              animate="shown"
              exit="exit"
              onMouseEnter={() => {
                clear();
                remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
              }}
              onMouseLeave={() => start(Math.max(remaining.current, 1200))}
            >
              {toast.message}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** Catalog only: a toast drawn in place, at rest. */
export function ToastSample({ message }: { message: string }) {
  return (
    <div className={styles.toast} data-inverse="">
      {message}
    </div>
  );
}
