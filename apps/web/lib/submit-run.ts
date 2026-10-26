'use client';
import type { BlockedReason, CreateRunResponse } from '@dse/schema';
import { global } from '../copy/strings';
import { rememberRun, savedKey, storeBlocked } from './browser-store';

// POST /api/runs from a browser (docs/design/pages.md, Home): created runs open their page,
// blocked results open their state page with the detail in sessionStorage.

export const stateRoute: Record<BlockedReason, string> = {
  budget: 'budget',
  busy: 'busy',
  'visitor-cap': 'visitor-cap',
  'invalid-url': 'invalid',
  'private-address': 'invalid',
  bot: 'bot',
  robots: 'robots',
  login: 'login',
  unreachable: 'unreachable',
};

export type SubmitOutcome = { go: string } | { error: string };

/** Client-side checks first: these never reach the server. */
export function normalizeUrl(raw: string): { url: string } | { error: 'notUrl' | 'notHttp' } {
  const v = raw.trim();
  // A bare domain is what most people paste; it means https.
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : /^[^\s/]+\.[^\s/]+/.test(v) ? `https://${v}` : v;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return { error: 'notUrl' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { error: 'notHttp' };
  if (!u.hostname) return { error: 'notUrl' };
  return { url: u.toString() };
}

export async function submitRun(url: string, include: string[], key = savedKey()): Promise<SubmitOutcome> {
  let res: Response;
  try {
    res = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(key ? { 'x-byo-key': key } : {}) },
      body: JSON.stringify(include.length ? { url, include } : { url }),
    });
  } catch {
    return { error: global.validation };
  }
  if (res.status === 429) return { error: global.rateLimit };
  if (!res.ok) return { error: global.validation };
  const body = (await res.json()) as CreateRunResponse;
  if ('id' in body) {
    rememberRun({ id: body.id, host: new URL(url).host.replace(/^www\./, ''), createdAt: new Date().toISOString(), status: 'queued' });
    return { go: `/r/${body.id}` };
  }
  storeBlocked(body.detail);
  return { go: `/state/${stateRoute[body.blocked]}?url=${encodeURIComponent(url)}` };
}
