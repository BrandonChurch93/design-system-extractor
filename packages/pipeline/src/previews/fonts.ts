import { createHash } from 'node:crypto';
import type { SheetScan } from '../capture/sheet-scan';
import type { RunContext } from '../context';
import { guardedFetch } from '../crawl/fetch';
import { keys } from '../storage/keys';
import { FONT_CAP_BYTES } from './constants';
import type { FontFaceOut, PreviewFonts } from './build';

// Fonts for previews (docs/specs/preview-fidelity.md, step 3): Google Fonts by link, same-origin or
// CORS files under 300 KB copied to storage, else the fallback stack.

const formats: Record<string, string> = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };

export class FontCopier {
  private copied = new Map<string, string | null>();
  constructor(private readonly ctx: RunContext) {}

  /** The storage URL of a copy of the font file, or null when it cannot be served. */
  async copy(src: string): Promise<string | null> {
    if (this.copied.has(src)) return this.copied.get(src)!;
    let out: string | null = null;
    const ext = /\.(woff2|woff|ttf|otf)(\?|#|$)/i.exec(src)?.[1]?.toLowerCase();
    if (ext) {
      const res = await guardedFetch(src, { userAgent: this.ctx.config.userAgent, allow: this.ctx.config.allowPrivateHosts, retryDelays: [] }).catch(() => null);
      if (res?.ok && res.body.length > 0 && res.body.length <= FONT_CAP_BYTES) {
        const key = keys.componentFont(this.ctx.runId, `${createHash('sha1').update(src).digest('hex').slice(0, 16)}.${ext}`);
        await this.ctx.files.put(key, res.body);
        out = this.ctx.files.publicUrl(key);
      }
    }
    this.copied.set(src, out);
    return out;
  }
}

function googleFamilies(links: string[]): Set<string> {
  const out = new Set<string>();
  for (const l of links) {
    try {
      for (const f of new URL(l).searchParams.getAll('family')) out.add(f.split(':')[0]!.replace(/\+/g, ' ').toLowerCase());
    } catch {
      // not a URL
    }
  }
  return out;
}

/** Fonts for one component: the families and weights it uses. */
export async function fontsFor(used: { family: string; weights: number[] }[], sheets: SheetScan, copier: FontCopier): Promise<PreviewFonts> {
  const google = googleFamilies(sheets.googleFonts);
  const links: string[] = [];
  const faces: FontFaceOut[] = [];
  let fallback = false;
  for (const u of used) {
    if (google.has(u.family.toLowerCase())) {
      const weights = [...new Set(u.weights)].sort((a, b) => a - b).join(';');
      links.push(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(u.family).replace(/%20/g, '+')}:wght@${weights}&display=swap`);
      continue;
    }
    const own = sheets.fontFaces.filter((f) => f.family.toLowerCase() === u.family.toLowerCase() && f.src);
    if (!own.length) continue;
    for (const f of own) {
      const url = await copier.copy(f.src);
      if (!url) {
        fallback = true;
        continue;
      }
      const ext = /\.(woff2|woff|ttf|otf)/i.exec(f.src)?.[1]?.toLowerCase() ?? 'woff2';
      faces.push({ family: u.family, url, weight: f.weight, style: f.style, format: formats[ext] ?? 'woff2' });
    }
  }
  const mode = links.length ? 'google' : faces.length ? 'copied' : fallback ? 'fallback' : 'none';
  return { googleLinks: links, faces, mode: fallback && mode !== 'none' ? 'fallback' : mode };
}
