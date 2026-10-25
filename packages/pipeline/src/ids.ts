import { createHash } from 'node:crypto';
import { ID_ALPHABET } from '@dse/schema';

/** A stable 8-character id from a key, in the id alphabet, so replays and goldens stay stable. */
export function stableId(key: string, length = 8): string {
  let n = BigInt(`0x${createHash('sha256').update(key).digest('hex').slice(0, 24)}`);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ID_ALPHABET[Number(n % 36n)];
    n /= 36n;
  }
  return out;
}
