import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '../components/Providers';
import '../styles/globals.css';
import { mono, sans } from './fonts';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'Design System Extractor · Paste a URL. Get its design system back.',
  description:
    'Tokens, components with every state, automated accessibility checks and a drift report from any public site. Exports to CSS, JSON, Tailwind, W3C tokens, a prompt and an MCP server.',
};

export const viewport: Viewport = { themeColor: '#FCFAF8', colorScheme: 'light' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
