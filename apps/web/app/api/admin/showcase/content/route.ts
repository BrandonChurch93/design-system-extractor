import { ShowcaseContent } from '@dse/schema';
import { error, isAdmin, json, VALIDATION_LINE } from '../../../../../lib/server/http';
import { services } from '../../../../../lib/server/services';
import { SHOWCASE_KEY } from '../../../../../lib/showcase';

/** Stores the showcase content the home page reads (D-020). */
export async function POST(request: Request): Promise<Response> {
  const svc = services();
  if (!isAdmin(request, svc.adminToken)) return error(401, 'Not authorized.');
  const parsed = ShowcaseContent.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return error(400, VALIDATION_LINE);
  await svc.storage.put(SHOWCASE_KEY, `${JSON.stringify(parsed.data, null, 2)}\n`, { contentType: 'application/json', cacheControl: 'public, max-age=300' });
  return json({ stored: SHOWCASE_KEY, entries: parsed.data.entries.length });
}
