// The app's Content-Security-Policy (docs/specs/preview-fidelity.md, Serving). The middleware (P11)
// sets it per request with a fresh nonce; previews load only from the storage origin, in sandboxed frames.

/** The local `dse serve` origin that `/open` may frame and show images from. */
export const LOCAL_SERVE_ORIGIN = 'http://localhost:4300';

export function storageOrigin(publicBaseUrl: string): string {
  return new URL(publicBaseUrl).origin;
}

export function buildCsp(opts: { nonce: string; storage: string; openRoute?: boolean }): string {
  const storage = storageOrigin(opts.storage);
  const local = opts.openRoute ? ` ${LOCAL_SERVE_ORIGIN}` : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${opts.nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${storage}${local}`,
    "font-src 'self'",
    `connect-src 'self' ${storage}`,
    `frame-src 'self' ${storage}${local}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
