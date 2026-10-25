'use client';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { ToastProvider } from './Toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
