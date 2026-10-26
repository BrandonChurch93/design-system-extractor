import './zod-config';
import { z } from 'zod';
import { Check, ColorGroup, ComponentType, PageReason, State, TypeRole, Viewport } from './enums';

/** fixtures/sites/{name}/expected.json (docs/evals.md). */
export const ExpectedFixture = z.object({
  pages: z.array(z.object({ path: z.string(), reason: PageReason })),
  tokens: z.object({
    colors: z.array(z.object({ value: z.string(), group: ColorGroup, minUsage: z.number().int().nonnegative() })),
    type: z.array(z.object({ role: TypeRole, size: z.number(), weight: z.number() })),
    space: z.object({ base: z.union([z.literal(4), z.literal(8)]), steps: z.array(z.number()), offGrid: z.array(z.number()) }),
    radius: z.array(z.number()),
    shadowCount: z.number().int().nonnegative(),
    breakpoints: z.array(z.number()),
  }),
  components: z.array(
    z.object({
      type: ComponentType,
      name: z.string(),
      page: z.string(),
      bbox: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
      viewport: Viewport,
      variants: z.number().int().positive(),
      states: z.array(State),
    }),
  ),
  checks: z.object({
    plantedFailures: z.array(z.object({ component: z.string(), check: Check, detailContains: z.string() })),
    plantedPasses: z.array(z.object({ component: z.string(), check: Check, detailContains: z.string().optional() })),
  }),
  drift: z.object({
    nearDuplicateColors: z.array(z.tuple([z.string(), z.string()])),
    offGrid: z.array(z.number()),
    variantCollapses: z.array(z.object({ component: z.string(), count: z.number().int() })),
    typeNearDuplicates: z.array(z.tuple([z.number(), z.number()])).default([]),
    expectNone: z.boolean(),
  }),
  previews: z.object({ minLiveRate: z.number() }),
});
export type ExpectedFixture = z.infer<typeof ExpectedFixture>;
