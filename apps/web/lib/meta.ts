import type { Metadata } from 'next';
import { global } from '../copy/strings';

type PageMeta = {
  /** The `{page}` value of the title pattern; none for home, whose title is its own (copy.md, Page metadata). */
  title?: string;
  description: string;
  /** A run's own image; every other page shares the home image. */
  image?: string;
  index?: boolean;
};

/** The home image (`app/opengraph-image.tsx`); file-based images reach only their own segment. */
export const HOME_IMAGE = '/opengraph-image';

/**
 * Title, description, link preview and indexing for one page. Next replaces a parent's `openGraph`
 * and `twitter` wholesale, so every page states all of them here (D-065).
 */
export function pageMeta({ title, description, image = HOME_IMAGE, index = true }: PageMeta): Metadata {
  const full = title ? `${title}${global.titleSuffix}` : global.homeTitle;
  const images = [{ url: image, width: 1200, height: 630, alt: image === HOME_IMAGE ? global.homeTitle : full }];
  return {
    ...(title ? { title } : {}),
    description,
    openGraph: { title: full, description, siteName: global.wordmark, type: 'website', images },
    twitter: { card: 'summary_large_image', title: full, description, images },
    ...(index ? {} : { robots: { index: false, follow: false } }),
  };
}
