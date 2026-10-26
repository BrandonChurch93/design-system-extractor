import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { Providers } from '../components/Providers';
import '../styles/globals.css';
import { global } from '../copy/strings';
import { pageMeta } from '../lib/meta';
import { mono, sans } from './fonts';

export const metadata: Metadata = {
  ...pageMeta({ description: global.description }),
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: { default: global.homeTitle, template: `%s${global.titleSuffix}` },
};

export const viewport: Viewport = { themeColor: '#FCFAF8', colorScheme: 'light' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Every page renders per request so its scripts carry the request's CSP nonce (proxy.ts).
  await connection();
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
