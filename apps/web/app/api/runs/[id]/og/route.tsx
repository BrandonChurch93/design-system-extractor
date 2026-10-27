import { ImageResponse } from 'next/og';
import { fill } from '@dse/schema/labels';
import { global, home } from '../../../../../copy/strings';
import { NO_STORE, TERMINAL_CACHE, error } from '../../../../../lib/server/http';
import { ogFonts } from '../../../../../lib/og-fonts';
import { paletteOf } from '../../../../../lib/palette';
import { runPayload } from '../../../../../lib/server/runs';
import { services } from '../../../../../lib/server/services';

const BG = '#FCFAF8';
const INK = '#23201E';
const MUTED = '#6A635E';
const SKELETON = '#EFEBE7';

/** The run's Open Graph image: its palette strip, the host and the stats line on `bg` (docs/design/pages.md). */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const svc = services();
  const run = await runPayload(svc.db, id);
  if (!run) return error(404, 'No run with that link.', { 'cache-control': NO_STORE });
  const key = `runs/${run.id}/og.png`;
  const complete = run.status === 'complete';
  if (complete) {
    const stored = await svc.storage.get(key);
    if (stored) return new Response(new Uint8Array(stored), { headers: { 'content-type': 'image/png', 'cache-control': TERMINAL_CACHE } });
  }
  const doc = run.document;
  const palette = paletteOf(doc);
  const shareSum = palette.reduce((s, p) => s + p.share, 0) || 1;
  const stats = doc.stats ?? (doc.tokens ? { colors: doc.tokens.colors?.length ?? 0, typeStyles: doc.tokens.type?.length ?? 0, components: doc.components?.length ?? 0 } : null);
  const image = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: BG, fontFamily: 'Plus Jakarta Sans' }}>
        <div style={{ display: 'flex', width: '100%', height: 220 }}>
          {palette.length ? palette.map((p) => <div key={p.value} style={{ display: 'flex', height: '100%', width: `${(p.share / shareSum) * 100}%`, backgroundColor: p.value.slice(0, 7) }} />) : <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: SKELETON }} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, padding: '56px 72px 60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: INK, letterSpacing: '-0.025em', lineHeight: 1.05 }}>{doc.host ?? ''}</div>
            {stats ? <div style={{ display: 'flex', marginTop: 20, fontSize: 32, fontWeight: 500, color: MUTED }}>{fill(home.cardStats, { colors: stats.colors, typeStyles: stats.typeStyles, components: stats.components })}</div> : null}
          </div>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: INK }}>{global.wordmark}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: await ogFonts(),
    },
  );
  const png = new Uint8Array(await image.arrayBuffer());
  // The image is still served when it cannot be kept; the next request draws it again.
  if (complete) await svc.storage.put(key, png, { contentType: 'image/png' }).catch((e: Error) => console.error(JSON.stringify({ route: 'GET /api/runs/{id}/og', error: e.message })));
  return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': complete ? TERMINAL_CACHE : NO_STORE } });
}
