import { ImageResponse } from 'next/og';
import { global, home } from '../copy/strings';
import { ogFonts } from '../lib/og-fonts';
import { getShowcaseContent } from '../lib/showcase';

export const alt = global.homeTitle;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The wordmark and the headline on bg, the first showcase entry's palette beneath (docs/design/pages.md). */
export default async function Image() {
  const content = await getShowcaseContent();
  const palette = content.entries[0]?.palette ?? [];
  const sum = palette.reduce((s, p) => s + p.share, 0) || 1;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FCFAF8', fontFamily: 'Plus Jakarta Sans' }}>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '72px 72px 0' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#23201E' }}>{global.wordmark}</div>
          <div style={{ display: 'flex', marginTop: 56, fontSize: 76, fontWeight: 700, color: '#23201E', letterSpacing: '-0.025em', lineHeight: 1.05, maxWidth: 940 }}>{home.headline}</div>
        </div>
        <div style={{ display: 'flex', width: '100%', height: 120 }}>
          {palette.map((p, i) => (
            <div key={`${p.value}-${i}`} style={{ display: 'flex', height: '100%', width: `${(p.share / sum) * 100}%`, backgroundColor: p.value.slice(0, 7) }} />
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
