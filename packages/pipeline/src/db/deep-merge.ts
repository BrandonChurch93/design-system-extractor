type Json = Record<string, unknown>;

function isPlainObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * The run document patch rule (docs/specs/architecture.md): objects merge recursively, arrays
 * and scalars replace, `undefined` leaves the target alone, `null` sets null.
 */
export function deepMerge<T extends Json>(target: T, patch: Json): T {
  const out: Json = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = out[key];
    out[key] = isPlainObject(value) && isPlainObject(current) ? deepMerge(current, value) : value;
  }
  return out as T;
}
