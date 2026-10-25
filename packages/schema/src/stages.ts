import { z } from 'zod';
import { FrameworkHint, PageReason, Viewport } from './enums';
import { EntityId } from './ids';

// Inputs and outputs of the pipeline stages (docs/specs/architecture.md).

export const CandidateSource = z.enum(['start', 'header', 'footer', 'nav', 'sitemap', 'body', 'include', 'synthetic']);
export type CandidateSource = z.infer<typeof CandidateSource>;

export const PageCandidate = z.object({
  id: EntityId,
  url: z.string().url(),
  path: z.string(),
  source: CandidateSource,
  depth: z.number().int().nonnegative(),
  preScore: z.number(),
  finalScore: z.number(),
  reason: PageReason,
  mandatory: z.boolean(),
  templateGroup: z.string().optional(),
  templateSize: z.number().int().positive().optional(),
  fingerprint: z.string().optional(),
  fetchFailed: z.boolean(),
  title: z.string(),
  h1: z.string(),
});
export type PageCandidate = z.infer<typeof PageCandidate>;

export const DiscoverOutput = z.object({
  startUrl: z.string().url(),
  scopePrefix: z.string(),
  host: z.string(),
  candidates: z.array(PageCandidate),
  frameworkHint: FrameworkHint.optional(),
  darkThemeDetected: z.boolean(),
  sitemapUrls: z.number().int().nonnegative(),
  hashRouter: z.boolean(),
});
export type DiscoverOutput = z.infer<typeof DiscoverOutput>;

export const SelectedPage = PageCandidate.extend({ order: z.number().int().nonnegative() });
export type SelectedPage = z.infer<typeof SelectedPage>;

export const SelectOutput = z.object({
  pages: z.array(SelectedPage).min(1),
  by: z.enum(['model', 'model (retry)', 'fallback', 'all']),
  fallbackReason: z.string().optional(),
});
export type SelectOutput = z.infer<typeof SelectOutput>;

export const RunConfig = z.object({
  url: z.string().url(),
  include: z.array(z.string()),
  pageCap: z.number().int().positive(),
  viewports: z.array(Viewport).min(1),
  userAgent: z.string().min(1),
  allowPrivateHosts: z.array(z.string()),
  timeoutMs: z.number().int().positive(),
  keepIntermediate: z.boolean(),
  byo: z.boolean(),
});
export type RunConfig = z.infer<typeof RunConfig>;
