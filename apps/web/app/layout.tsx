import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import { Providers } from '../components/Providers';
import '../styles/fonts.css';
import '../styles/globals.css';
import { global } from '../copy/strings';
import { pageMeta } from '../lib/meta';
import { fontPreloads } from './fonts';

export const metadata: Metadata = {
  ...pageMeta({ description: global.description }),
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: { default: global.homeTitle, template: `%s${global.titleSuffix}` },
};

export const viewport: Viewport = { themeColor: '#FCFAF8', colorScheme: 'light' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Every page renders per request so its scripts carry the request's CSP nonce (proxy.ts).
  await connection();
  for (const href of fontPreloads) preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
