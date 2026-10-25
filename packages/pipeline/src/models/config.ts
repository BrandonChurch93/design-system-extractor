// Verified on platform.claude.com (models overview and pricing) on 2026-10-25. See D-026.
// This is the only file that names a model id.

export const models = {
  small: process.env.DSE_MODEL_SMALL || 'claude-haiku-5-5',
  large: process.env.DSE_MODEL_LARGE || 'claude-sonnet-5-5',
} as const;

export type ModelSize = keyof typeof models;

export type PriceRow = {
  /** USD per million base input tokens. */
  input: number;
  /** USD per million cache read (hit) input tokens. */
  cachedInput: number;
  /** USD per million 5-minute cache write input tokens. */
  cacheWrite: number;
  /** USD per million output tokens, thinking included. */
  output: number;
};

export type PriceEntry = PriceRow & {
  /** A higher price row applied when a request's prompt exceeds `threshold` input tokens. */
  longContext?: PriceRow & { threshold: number };
};

export const prices: Record<string, PriceEntry> = {
  'claude-haiku-5-5': {
    input: 0.1,
    cachedInput: 0.01,
    cacheWrite: 0.125,
    output: 0.5,
    longContext: { threshold: 100_000, input: 0.5, cachedInput: 0.05, cacheWrite: 0.625, output: 2.5 },
  },
  'claude-sonnet-5-5': {
    input: 2,
    cachedInput: 0.1,
    cacheWrite: 2.5,
    output: 10,
  },
};

export const PRICES_VERIFIED_ON = '2026-10-25';
