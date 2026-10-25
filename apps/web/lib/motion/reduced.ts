'use client';
import { useReducedMotion } from 'motion/react';

/** The one gate every animated component reads. True under prefers-reduced-motion: reduce. */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
