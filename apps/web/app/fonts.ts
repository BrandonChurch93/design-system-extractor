import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';

export const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--dse-font-sans-face',
  display: 'swap',
});

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--dse-font-mono-face',
  display: 'swap',
});
