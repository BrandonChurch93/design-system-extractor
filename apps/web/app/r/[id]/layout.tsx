import type { ReactNode } from 'react';

/** The run page and its component panel, a parallel-route slot reading `?c=` (D-007). */
export default function RunLayout({ children, panel }: { children: ReactNode; panel: ReactNode }) {
  return (
    <>
      {children}
      {panel}
    </>
  );
}
