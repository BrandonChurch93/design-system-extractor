import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { contentTypeFor } from './keys';
import type { PutOptions, Storage } from './storage';

export type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

export function s3ConfigFromEnv(env: Record<string, string | undefined> = process.env): S3Config {
  const need = (k: string) => {
    const v = env[k];
    if (!v) throw new Error(`${k} is not set`);
    return v;
  };
  return {
    endpoint: need('STORAGE_ENDPOINT'),
    region: need('STORAGE_REGION'),
    bucket: need('STORAGE_BUCKET'),
    accessKeyId: need('STORAGE_ACCESS_KEY'),
    secretAccessKey: need('STORAGE_SECRET_KEY'),
    publicBaseUrl: need('STORAGE_PUBLIC_BASE_URL').replace(/\/$/, ''),
  };
}

/** The test bucket: `dse-test` beside `dse`, with the public base pointed at it. */
export function testS3Config(env: Record<string, string | undefined> = process.env): S3Config {
  const c = s3ConfigFromEnv(env);
  const bucket = 'dse-test';
  return { ...c, bucket, publicBaseUrl: c.publicBaseUrl.replace(new RegExp(`/${c.bucket}$`), `/${bucket}`) };
}

// Images and previews never change once written; the showcase file is revalidated hourly.
const immutable = 'public, max-age=31536000, immutable';

export class S3Storage implements Storage {
  private readonly client: S3Client;

  constructor(private readonly config: S3Config) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      requestHandler: { requestTimeout: 30_000, connectionTimeout: 5_000 },
    });
  }

  async put(key: string, body: Buffer | Uint8Array | string, opts: PutOptions = {}): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: opts.contentType ?? contentTypeFor(key),
        CacheControl: opts.cacheControl ?? (key.startsWith('showcase/') ? 'public, max-age=300' : immutable),
      }),
    );
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: key }));
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch (e) {
      if (e instanceof NoSuchKey || (e as { name?: string }).name === 'NoSuchKey') return null;
      throw e;
    }
  }

  publicUrl(key: string): string {
    return `${this.config.publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  async list(prefix: string): Promise<string[]> {
    const out: string[] = [];
    let token: string | undefined;
    do {
      const res = await this.client.send(new ListObjectsV2Command({ Bucket: this.config.bucket, Prefix: prefix, ContinuationToken: token }));
      for (const o of res.Contents ?? []) if (o.Key) out.push(o.Key);
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out;
  }

  async deletePrefix(prefix: string): Promise<number> {
    if (!prefix || prefix === '/') throw new Error('refusing to delete the whole bucket');
    const found = await this.list(prefix);
    for (let i = 0; i < found.length; i += 1000) {
      const batch = found.slice(i, i + 1000);
      await this.client.send(new DeleteObjectsCommand({ Bucket: this.config.bucket, Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true } }));
    }
    return found.length;
  }
}
