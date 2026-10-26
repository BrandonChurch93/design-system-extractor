import './zod-config';
import { z } from 'zod';

const usd = z.coerce.number().min(0);
const posInt = z.coerce.number().int().positive();
const flag = z.enum(['0', '1']);
const bool = z.enum(['true', 'false']);
const url = z.string().url();
const base64Key32 = z
  .string()
  .min(1, 'is empty')
  .refine((v) => {
    try {
      return Buffer.from(v, 'base64').length === 32;
    } catch {
      return false;
    }
  }, 'must be 32 bytes, base64 encoded');

/** Every variable in `.env.example`, with the shape it must have. */
export const envShape = {
  ANTHROPIC_API_KEY: z.string().regex(/^sk-ant-[A-Za-z0-9_-]{20,}$/, 'must look like sk-ant-…'),
  DSE_MODEL_SMALL: z.string().optional(),
  DSE_MODEL_LARGE: z.string().optional(),
  DSE_DEV_SPEND_CAP_USD: usd,
  DSE_DEV_SPEND_RESERVE_USD: usd,
  DSE_MODEL_MODE: z.enum(['live', 'record', 'replay']),
  DSE_KEEP_INTERMEDIATE: flag,
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgres:// URL'),
  REDIS_URL: z.string().regex(/^rediss?:\/\//, 'must be a redis:// or rediss:// URL'),
  STORAGE_ENDPOINT: url,
  STORAGE_REGION: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_PUBLIC_BASE_URL: url.refine((v) => !v.endsWith('/'), 'must not end with a slash'),
  DSE_GLOBAL_DAILY_BUDGET_USD: usd,
  DSE_VISITOR_RUNS_PER_DAY: posInt,
  DSE_PAGE_CAP: posInt,
  DSE_BYO_PAGE_CAP: posInt,
  DSE_WORST_CASE_RUN_USD: usd,
  DSE_RUN_TIMEOUT_MS: posInt,
  DSE_BUDGET_TIMEZONE: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'must be an IANA time zone'),
  DSE_ALLOW_PRIVATE_HOSTS: z
    .string()
    .regex(/^$|^[a-z0-9.-]+:\d+(,[a-z0-9.-]+:\d+)*$/, 'must be host:port values separated by commas'),
  DSE_JOB_ENCRYPTION_KEY: base64Key32,
  DSE_ADMIN_TOKEN: z.string().min(32, 'must be at least 32 characters'),
  NEXT_PUBLIC_APP_URL: url.refine((v) => !v.endsWith('/'), 'must not end with a slash'),
  DSE_USER_AGENT: z.string().regex(/^DesignSystemExtractorBot\/\d+\.\d+ \(\+https?:\/\/\S+\/how-it-works\)$/, 'must be DesignSystemExtractorBot/x.y (+{appUrl}/how-it-works)'),
  DSE_CONTACT_EMAIL: z.string().email(),
  BILLING_ENABLED: bool,
} as const;

export type EnvKey = keyof typeof envShape;
export const envKeys = Object.keys(envShape) as EnvKey[];

/** Variables that may be absent or empty. */
export const optionalEnvKeys: ReadonlySet<EnvKey> = new Set(['DSE_MODEL_SMALL', 'DSE_MODEL_LARGE', 'DSE_ALLOW_PRIVATE_HOSTS']);

export type EnvIssue = { key: string; problem: string };

export function validateEnv(source: Record<string, string | undefined>): EnvIssue[] {
  const issues: EnvIssue[] = [];
  for (const key of envKeys) {
    const raw = source[key];
    if (raw === undefined || raw === '') {
      if (!optionalEnvKeys.has(key)) issues.push({ key, problem: raw === undefined ? 'is missing' : 'is empty' });
      continue;
    }
    const result = envShape[key].safeParse(raw);
    if (!result.success) issues.push({ key, problem: result.error.issues[0]?.message ?? 'is invalid' });
  }
  return issues;
}

/** The private-host allowance is ignored in production (docs/specs/architecture.md). */
export function allowedPrivateHosts(source: Record<string, string | undefined> = process.env): string[] {
  if (source.NODE_ENV === 'production') return [];
  return (source.DSE_ALLOW_PRIVATE_HOSTS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
