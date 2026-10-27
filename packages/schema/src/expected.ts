import './zod-config';
import { z } from 'zod';
import { Check, ColorGroup, ComponentTier, ComponentType, MotionKind, PageReason, State, TypeRole, Viewport } from './enums';
import { MotionTriggerType } from './run-document';

/** fixtures/sites/{name}/expected.json (docs/evals.md). */
export const ExpectedFixture = z.object({
  pages: z.array(z.object({ path: z.string(), reason: PageReason })),
  tokens: z.object({
    colors: z.array(z.object({ value: z.string(), group: ColorGroup, minUsage: z.number().int().nonnegative() })),
    /** `name` is the type token's name under the role words (D-087). */
    type: z.array(z.object({ role: TypeRole, size: z.number(), weight: z.number(), name: z.string() })),
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
  /** `captured`: components planted to fail the render check, with the reason they must carry (preview-fidelity.md, Tests). */
  previews: z.object({ minLiveRate: z.number(), captured: z.array(z.object({ name: z.string(), reason: z.string() })).default([]) }),
  /** v1.1 (docs/evals.md): motion, naming and export integrity. */
  motion: z.object({
    durations: z.array(z.object({ ms: z.number().positive(), name: z.string().optional() })),
    easings: z.array(z.object({ value: z.string(), name: z.string().optional() })),
    keyframes: z.array(z.string()),
    patterns: z
      .array(
        z.object({
          kind: MotionKind,
          trigger: MotionTriggerType,
          start: z.record(z.string(), z.string()),
          end: z.record(z.string(), z.string()),
          durationMs: z.number().nonnegative(),
          easing: z.string().nullable(),
          stagger: z.object({ count: z.number().int(), stepMs: z.number() }).optional(),
          observed: z.boolean(),
        }),
      )
      .default([]),
    hover: z.array(z.object({ component: z.string(), properties: z.array(z.string()).min(1) })).default([]),
    noOutline: z.array(z.string()).default([]),
    collapsedBorder: z.array(z.string()).default([]),
  }),
  siteVariables: z.object({ named: z.record(z.string(), z.string()).default({}), hashed: z.array(z.string()).default([]) }),
  overlays: z.array(z.object({ name: z.string(), base: z.string(), alpha: z.number() })),
  tiers: z.record(z.string(), ComponentTier),
  variantNames: z.array(z.object({ component: z.string(), names: z.array(z.string()).min(2) })).default([]),
  fallbackNames: z.array(z.object({ component: z.string(), name: z.string() })).default([]),
  noNumericNames: z.literal(true),
});
export type ExpectedFixture = z.infer<typeof ExpectedFixture>;
