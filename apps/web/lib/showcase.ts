import { ShowcaseContent } from '@dse/schema';
import committed from '../content/showcase.json';

export const SHOWCASE_KEY = 'showcase/showcase.json';
export const SHOWCASE_REVALIDATE_S = 3600;

/**
 * The home page's showcase (docs/specs/showcase.md): the storage object written by the admin
 * content route, revalidated hourly, else the committed seed file.
 */
export async function getShowcaseContent(publicBaseUrl: string | undefined = process.env.STORAGE_PUBLIC_BASE_URL): Promise<ShowcaseContent> {
  if (publicBaseUrl) {
    try {
      const res = await fetch(`${publicBaseUrl.replace(/\/$/, '')}/${SHOWCASE_KEY}`, { next: { revalidate: SHOWCASE_REVALIDATE_S }, signal: AbortSignal.timeout(3000) } as RequestInit);
      if (res.ok) {
        const parsed = ShowcaseContent.safeParse(await res.json());
        if (parsed.success) return parsed.data;
      }
    } catch {
      // Storage unreachable: the committed file stands in.
    }
  }
  return ShowcaseContent.parse(committed);
}
