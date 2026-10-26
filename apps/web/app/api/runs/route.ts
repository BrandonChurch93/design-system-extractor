import { byoKeyOf, resolveViewer } from '../../../lib/entitlements';
import { error, json, RATE_LIMIT_LINE, VALIDATION_LINE, visitorCookie } from '../../../lib/server/http';
import { admitRun } from '../../../lib/server/runs';
import { services } from '../../../lib/server/services';

export async function POST(request: Request): Promise<Response> {
  const svc = services();
  const viewer = resolveViewer(request, svc.encryptionKey);
  const headers = new Headers();
  if (viewer.cookieMissing) headers.append('set-cookie', visitorCookie(viewer.visitorId, svc.production));
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  try {
    const result = await admitRun(svc, { body, viewer, byoKey: byoKeyOf(request) });
    switch (result.kind) {
      case 'invalid':
        return error(400, VALIDATION_LINE, headers);
      case 'rate-limited':
        headers.set('retry-after', String(result.retryAfterS));
        return error(429, RATE_LIMIT_LINE, headers);
      case 'blocked':
      case 'created':
        return json(result.body, { headers });
    }
  } catch (e) {
    console.error(JSON.stringify({ route: 'POST /api/runs', error: (e as Error).message }));
    return error(500, 'Something broke on our side.', headers);
  }
}
