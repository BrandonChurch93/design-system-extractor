import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

// A visitor's Anthropic key travels in the job payload only as AES-256-GCM ciphertext under
// DSE_JOB_ENCRYPTION_KEY (docs/specs/caps-and-budget.md, BYO key).

export const BYO_KEY_SHAPE = /^sk-ant-[A-Za-z0-9_-]+$/;

/** The header value is a key worth sending to the worker: right prefix, at most 200 characters. */
export function isByoKeyShape(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length <= 200 && BYO_KEY_SHAPE.test(value);
}

function keyBytes(base64Key: string): Buffer {
  const k = Buffer.from(base64Key, 'base64');
  if (k.length !== 32) throw new Error('DSE_JOB_ENCRYPTION_KEY must be 32 bytes, base64 encoded');
  return k;
}

/** `iv · tag · ciphertext`, base64url. A fresh IV every time, so equal keys never encrypt alike. */
export function encryptSecret(plain: string, base64Key: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes(base64Key), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}

/** Throws when the ciphertext was altered or made with another key. */
export function decryptSecret(sealed: string, base64Key: string): string {
  const raw = Buffer.from(sealed, 'base64url');
  if (raw.length < 29) throw new Error('sealed value is too short');
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(base64Key), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

/** A keyed hash for identity values (IP, IP plus user agent) so raw addresses are never stored. */
export function identityHash(value: string, base64Key: string, length = 16): string {
  const k = createHmac('sha256', keyBytes(base64Key)).update('dse-identity').digest();
  return createHmac('sha256', k).update(value).digest('base64url').slice(0, length);
}
