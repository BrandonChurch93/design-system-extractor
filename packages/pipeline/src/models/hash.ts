import { createHash } from 'node:crypto';

/** JSON with object keys sorted, so equal values always serialize the same. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(',')}}`;
}

// Volatile values never belong in a request hash: run ids, ISO timestamps, storage URLs that embed them.
const volatile: [RegExp, string][] = [
  [/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, '<ts>'],
  [/\/runs\/[0-9a-z]{10}\//g, '/runs/<run>/'],
];

export function requestHash(request: unknown): string {
  let s = stableStringify(request);
  for (const [re, rep] of volatile) s = s.replace(re, rep);
  return createHash('sha256').update(s).digest('hex');
}
