import { z } from 'zod';
import { ColorGroup, ExportSet } from './enums';
import { RunId } from './ids';

export const ExportMeta = z.object({
  tool: z.literal('Design System Extractor'),
  host: z.string(),
  runId: RunId,
  set: ExportSet,
  date: z.string(),
});
export type ExportMeta = z.infer<typeof ExportMeta>;

/** `tokens.json`: the run's own shape (docs/specs/exports-and-mcp.md). */
export const TokensJson = z.object({
  $meta: ExportMeta,
  color: z.record(z.string(), z.object({ value: z.string(), group: ColorGroup, usage: z.number().int().nonnegative() })),
  type: z.record(
    z.string(),
    z.object({ family: z.string(), size: z.string(), lineHeight: z.string(), weight: z.number().int(), letterSpacing: z.string() }),
  ),
  font: z.record(z.string(), z.string()),
  space: z.array(z.number().positive()),
  radius: z.record(z.string(), z.string()),
  shadow: z.record(z.string(), z.string()),
  breakpoints: z.array(z.number().positive()),
});
export type TokensJson = z.infer<typeof TokensJson>;
