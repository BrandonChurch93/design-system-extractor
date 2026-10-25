// Blocked-state classification (docs/specs/crawler.md).

export const botMarkers = ['cf-challenge', 'challenge-platform', 'captcha', 'verify you are human', 'access denied', 'request blocked', 'perimeterx', 'datadome', 'akamai'];

export function botMarker(body: string): string | undefined {
  const lower = body.toLowerCase();
  return botMarkers.find((m) => lower.includes(m));
}

/** A bot challenge: 403, 429 or 503 with a marker, or a tiny 200 with one. */
export function isBotChallenge(status: number, body: string): { blocked: boolean; marker?: string } {
  const marker = botMarker(body);
  if (!marker) return { blocked: false };
  if ([403, 429, 503].includes(status)) return { blocked: true, marker };
  if (status === 200 && Buffer.byteLength(body, 'utf8') < 2048) return { blocked: true, marker };
  return { blocked: false };
}

export const loginPathPattern = /\/(login|signin|sign-in|auth|account\/login|users\/sign_in)\b/i;

/** A page whose main content is one form with a password field and little text. */
export function looksLikeLoginPage(facts: { formCount: number; hasPassword: boolean; textLength: number }): boolean {
  return facts.formCount === 1 && facts.hasPassword && facts.textLength < 1500;
}

/** More than 80% of selected pages land on a sign-in screen. */
export function isLoginWalled(pages: { finalUrl: string; looksLikeLogin: boolean }[]): boolean {
  if (!pages.length) return false;
  const walled = pages.filter((p) => loginPathPattern.test(new URL(p.finalUrl).pathname) || p.looksLikeLogin).length;
  return walled / pages.length > 0.8;
}

export type NetworkFailure = 'dns' | 'refused' | 'tls' | 'timeout' | 'other';

export function classifyNetworkError(message: string): NetworkFailure {
  const m = message.toLowerCase();
  if (/enotfound|eai_again|name_not_resolved|err_name_resolution|dns/.test(m)) return 'dns';
  if (/econnrefused|connection_refused|err_connection_refused|econnreset|err_connection_reset/.test(m)) return 'refused';
  if (/cert|ssl|tls|err_ssl|handshake/.test(m)) return 'tls';
  if (/timeout|timed out|etimedout|err_timed_out/.test(m)) return 'timeout';
  return 'other';
}
