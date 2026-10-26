import { createHash, timingSafeEqual } from 'node:crypto';
import { VISITOR_COOKIE } from '../entitlements';

export const json = (body: unknown, init: ResponseInit = {}) => Response.json(body, init);
export const error = (status: number, message: string, headers: HeadersInit = {}) => Response.json({ error: message }, { status, headers });

/** copy.md, Home. */
export const VALIDATION_LINE = 'Something about that request was not right. Try again.';
export const RATE_LIMIT_LINE = 'Too many requests. Try again in a minute.';

export const NO_STORE = 'no-store';
export const TERMINAL_CACHE = 'public, max-age=3600, stale-while-revalidate=86400';

/** The `dse_v` cookie: a year, httpOnly, lax, secure in production (docs/specs/caps-and-budget.md). */
export function visitorCookie(visitorId: string, production: boolean): string {
  return [`${VISITOR_COOKIE}=${visitorId}`, 'Path=/', 'Max-Age=31536000', 'HttpOnly', 'SameSite=Lax', ...(production ? ['Secure'] : [])].join('; ');
}

export function etagOf(body: string): string {
  return `W/"${createHash('sha1').update(body).digest('base64url')}"`;
}

/** A JSON body with an ETag; a matching If-None-Match gets 304. */
export function withEtag(request: Request, body: unknown, cacheControl: string): Response {
  const text = JSON.stringify(body);
  const etag = etagOf(text);
  const headers = { etag, 'cache-control': cacheControl, 'content-type': 'application/json' };
  const match = request.headers.get('if-none-match');
  if (match && match.split(',').some((t) => t.trim() === etag)) return new Response(null, { status: 304, headers });
  return new Response(text, { status: 200, headers });
}

/** `Authorization: Bearer {DSE_ADMIN_TOKEN}`, compared in constant time. An unset token admits nobody. */
export function isAdmin(request: Request, token: string): boolean {
  if (token.length < 32) return false;
  const got = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '')?.[1]?.trim() ?? '';
  const a = createHash('sha256').update(got).digest();
  const b = createHash('sha256').update(token).digest();
  return timingSafeEqual(a, b) && got.length > 0;
}
