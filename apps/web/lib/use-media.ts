'use client';
import { useSyncExternalStore } from 'react';

/** Subscribes to a media query. Server render assumes it does not match. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const PHONE = '(max-width: 640px)';
