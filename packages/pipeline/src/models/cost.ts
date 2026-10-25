import { prices, type PriceRow } from './config';

/** The usage fields of a Messages API response that carry cost. */
export type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

/** USD for one response, from the verified price table (D-026). Throws on an unknown model. */
export function costOf(modelId: string, usage: Usage): number {
  const entry = prices[modelId];
  if (!entry) throw new Error(`no price for model ${modelId}`);
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const promptTokens = usage.input_tokens + cacheWrite + cacheRead;
  const row: PriceRow = entry.longContext && promptTokens > entry.longContext.threshold ? entry.longContext : entry;
  const usd = (usage.input_tokens * row.input + cacheWrite * row.cacheWrite + cacheRead * row.cachedInput + usage.output_tokens * row.output) / 1_000_000;
  return Math.round(usd * 1e8) / 1e8;
}

export function totalInputTokens(usage: Usage): number {
  return usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
}
