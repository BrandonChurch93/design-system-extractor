import { z } from 'zod';
import { Hex, Stats } from './run-document';
import { RunId } from './ids';

/** The home page category chips, in their copy order. */
export const ShowcaseCategory = z.enum(['SaaS', 'Developer tools', 'Commerce', 'Finance', 'Government', 'Media', 'Personal']);
export type ShowcaseCategory = z.infer<typeof ShowcaseCategory>;

export const ShowcaseEntry = z.object({
  runId: RunId,
  url: z.string().url(),
  host: z.string().min(1),
  name: z.string().min(1),
  category: ShowcaseCategory,
  order: z.number().int().positive(),
  stats: Stats,
  palette: z.array(z.object({ value: Hex, share: z.number().min(0).max(1) })).max(8),
});
export type ShowcaseEntry = z.infer<typeof ShowcaseEntry>;

/** `apps/web/content/showcase.json` and the storage object `showcase/showcase.json`. */
export const ShowcaseContent = z.object({
  generatedAt: z.string().datetime({ offset: true }),
  appUrl: z.string().url(),
  entries: z.array(ShowcaseEntry),
});
export type ShowcaseContent = z.infer<typeof ShowcaseContent>;
