import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { mono, sans } from './fonts';

export const metadata: Metadata = {
  title: 'Design System Extractor · Paste a URL. Get its design system back.',
  description:
    'Tokens, components with every state, automated accessibility checks and a drift report from any public site. Exports to CSS, JSON, Tailwind, W3C tokens, a prompt and an MCP server.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
