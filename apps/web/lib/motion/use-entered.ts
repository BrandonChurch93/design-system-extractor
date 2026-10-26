'use client';
import { useEffect, useState, type RefObject } from 'react';

/**
 * True once the element's parent has come into view (10% from the bottom edge). The parent is
 * observed because the element itself starts clipped to nothing, and a fully clipped element
 * never reports an intersection; a list's items then enter together, in their stagger.
 */
export function useEntered(ref: RefObject<Element | null>, observe: 'parent' | 'self' = 'parent'): boolean {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const target = observe === 'self' ? el : (el?.parentElement ?? el);
    if (!target || entered) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setEntered(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [ref, entered, observe]);
  return entered;
}
