export type PutOptions = { contentType?: string; cacheControl?: string };

/** One interface, one S3 driver (docs/specs/architecture.md). */
export interface Storage {
  put(key: string, body: Buffer | Uint8Array | string, opts?: PutOptions): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  publicUrl(key: string): string;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  deletePrefix(prefix: string): Promise<number>;
}
