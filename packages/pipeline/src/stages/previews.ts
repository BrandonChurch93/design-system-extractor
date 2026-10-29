import type { Browser } from 'playwright';
import { previewCounts, viewportSize, type Component, type Preview, type State } from '@dse/schema';
import { PNG } from 'pngjs';
import { cropShot } from '../components/crop';
import { groundOf } from '../components/ground';
import type { Item } from '../components/items';
import { overBudget } from '../budget';
import type { RunContext } from '../context';
import { buildPreview, statePreview, type PreviewDoc } from '../previews/build';
import { IMAGE_CAP_BYTES, LIVE_MAX_DIFF_PCT } from '../previews/constants';
import { FontCopier, fontsFor } from '../previews/fonts';
import { diffPercent, maskBoxes, openRenderSession, renderPreview, textBoxes, type Placement, type RenderSession } from '../previews/render';
import type { CssPolicy } from '../previews/sanitize';
import { keys } from '../storage/keys';
import type { CaptureOutput } from './capture';
import type { ComponentSources } from './components';

// Stage `previews` (docs/specs/preview-fidelity.md): build, sanitize, store, render from storage,
// compare, decide live or captured.

type Outcome = { preview: Preview; doc?: PreviewDoc; fonts?: string };

/** The storage origin and path previews and copied fonts are served from. */
export function storageBaseOf(ctx: RunContext): string {
  const probe = ctx.files.publicUrl('dse-base-probe');
  return probe.slice(0, -'/dse-base-probe'.length);
}

function averageColor(png: Buffer | null): string | undefined {
  if (!png) return undefined;
  const p = PNG.sync.read(png);
  let r = 0;
  let g = 0;
  let b = 0;
  const n = p.width * p.height || 1;
  for (let i = 0; i < p.data.length; i += 4) {
    r += p.data[i]!;
    g += p.data[i + 1]!;
    b += p.data[i + 2]!;
  }
  return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
}

/**
 * The part of the element the page shows: its box within the viewport's width and every ancestor
 * that clips its overflow, in page coordinates (D-098). Null when nothing of it shows.
 */
export function visibleBox(it: Pick<Item, 'el' | 'snapshot' | 'viewport'>): { x: number; y: number; w: number; h: number } | null {
  let x0 = Math.max(it.el.x, 0);
  let y0 = Math.max(it.el.y, 0);
  let x1 = Math.min(it.el.x + it.el.w, viewportSize[it.viewport].width);
  let y1 = it.el.y + it.el.h;
  for (let p = it.el.p; p >= 0; p = it.snapshot.elements[p]!.p) {
    const a = it.snapshot.elements[p]!;
    const clipX = a.style['overflow-x'] && a.style['overflow-x'] !== 'visible';
    const clipY = a.style['overflow-y'] && a.style['overflow-y'] !== 'visible';
    if (a.tag === 'html' || a.tag === 'body') continue;
    if (clipX) {
      x0 = Math.max(x0, a.x);
      x1 = Math.min(x1, a.x + a.w);
    }
    if (clipY) {
      y0 = Math.max(y0, a.y);
      y1 = Math.min(y1, a.y + a.h);
    }
  }
  return x1 - x0 >= 1 && y1 - y0 >= 1 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

function referenceCrop(it: Item, shown: { x: number; y: number; w: number; h: number } | null): Buffer | null {
  if (it.revealed) return it.revealed.open.rootCrop ?? null;
  return cropShot(it.vc.screenshot, shown ?? { x: it.el.x, y: it.el.y, w: it.el.w, h: it.el.h });
}

/** The render cut to the part of the element the page shows, in the render's own coordinates. */
function cutRender(png: Buffer, it: Item, shown: { x: number; y: number; w: number; h: number }, place?: Placement): Buffer | null {
  const px = place && (place.phase.x > 0 || place.phase.y > 0) ? place : null;
  const origin = { x: it.el.x - (px?.phase.x ?? 0), y: it.el.y - (px?.phase.y ?? 0) };
  return cropShot({ png, width: px ? px.clip.w : Math.round(it.el.w * 100) / 100, height: px ? px.clip.h : it.el.h }, { x: shown.x - origin.x, y: shown.y - origin.y, w: shown.w, h: shown.h });
}

function fontsUsed(it: Item): { family: string; weights: number[] }[] {
  const out = new Map<string, Set<number>>();
  const s = it.snapshot;
  const stack = [it.el.index];
  while (stack.length) {
    const e = s.elements[stack.pop()!]!;
    stack.push(...e.kids);
    const family = e.font || e.style['font-family'].split(',')[0]!.trim().replace(/^['"]|['"]$/g, '');
    if (!family) continue;
    const set = out.get(family) ?? new Set<number>();
    set.add(Number(e.style['font-weight']) || 400);
    out.set(family, set);
  }
  return [...out].map(([family, w]) => ({ family, weights: [...w] }));
}

/** This instance, or the earliest of the same variant and viewport whose matched CSS was read (D-066). */
function cssSource(src: NonNullable<ReturnType<ComponentSources['get']>>, it: Item): Item {
  if (it.revealed || it.vc.matched[it.el.d]) return it;
  const variant = src.variantOf.get(it);
  return src.items.find((x) => !x.revealed && x.viewport === it.viewport && src.variantOf.get(x) === variant && x.vc.matched[x.el.d]) ?? it;
}

async function previewFor(ctx: RunContext, it: Item, htmlKey: string, existing: Preview, policy: CssPolicy, session: RenderSession, copier: FontCopier, siteVars: ReadonlySet<string>): Promise<Outcome> {
  // Hidden until focus and no crop keep their capture: there is nothing at rest to check against, but the code is still built (D-108).
  const kept = existing.capturedReason === 'hidden-until-focus' || existing.capturedReason === 'no-crop';
  if (!kept && overBudget(ctx, 'previews')) return { preview: { ...existing, mode: 'captured', capturedReason: 'not-checked' } };
  const markup = it.revealed ? it.revealed.open.markup : it.vc.markup[it.el.d];
  const matched = it.revealed ? it.revealed.open.matched : it.vc.matched;
  if (!markup?.html) return { preview: kept ? existing : { ...existing, mode: 'captured', capturedReason: 'css-too-large' } };
  // The component's images keep their own pixels from the page screenshot, on their average color (D-098).
  const imageColors: Record<string, string> = {};
  const imageUrls: Record<string, string> = {};
  const dir = htmlKey.slice(0, htmlKey.lastIndexOf('/'));
  const inside = (e: { p: number }) => {
    for (let p = e.p; p >= 0; p = it.snapshot.elements[p]!.p) if (p === it.el.index) return true;
    return false;
  };
  for (const e of it.snapshot.elements) {
    if (!['img', 'picture', 'video', 'canvas', 'iframe'].includes(e.tag) || it.revealed || !(e === it.el || inside(e))) continue;
    const crop = e.w >= 1 && e.h >= 1 ? cropShot(it.vc.screenshot, { x: e.x, y: e.y, w: e.w, h: e.h }) : null;
    const c = averageColor(crop);
    if (c) imageColors[e.d] = c;
    if (crop && crop.length <= IMAGE_CAP_BYTES && e.tag !== 'iframe' && e.tag !== 'video') {
      const key = `${dir}/img-${e.d}.png`;
      await ctx.files.put(key, crop, { contentType: 'image/png' });
      imageUrls[e.d] = ctx.files.publicUrl(key);
    }
  }
  const ground = groundOf(it);
  const fonts = await fontsFor(fontsUsed(it), it.vc.sheets, copier);
  const doc = buildPreview({ markup: markup.html, vars: markup.vars, snapshot: it.snapshot, root: it.el, matched, imageColors, imageUrls, fonts, policy, siteVars, viewport: viewportSize[it.viewport] });
  if (doc.tooLarge) return { preview: kept ? { ...existing, ground } : { ...existing, ground, mode: 'captured', capturedReason: 'css-too-large' }, doc, fonts: fonts.mode };
  if (kept) return { preview: { ...existing, ground }, doc, fonts: fonts.mode };
  await ctx.files.put(htmlKey, doc.html, { contentType: 'text/html; charset=utf-8' });
  // The crop of the page starts on a whole device pixel at or before the element; the render starts there too (D-098).
  const frac = (v: number) => (v * 2 - Math.floor(v * 2)) / 2;
  const place = it.revealed ? undefined : { phase: { x: frac(it.el.x), y: frac(it.el.y) }, clip: { w: (Math.ceil((it.el.x + it.el.w) * 2) - Math.floor(it.el.x * 2)) / 2, h: (Math.ceil((it.el.y + it.el.h) * 2) - Math.floor(it.el.y * 2)) / 2 } };
  const rendered = await renderPreview(session, ctx.files.publicUrl(htmlKey), { w: it.el.w, h: it.el.h }, ground, place);
  const shown = it.revealed ? null : visibleBox(it);
  const clipped = shown && (shown.x > it.el.x + 0.5 || shown.y > it.el.y + 0.5 || shown.w < it.el.w - 0.5 || shown.h < it.el.h - 0.5);
  const shot = rendered && clipped ? cutRender(rendered, it, shown, place) : rendered;
  const ref = referenceCrop(it, clipped ? shown : null);
  const diffPct = shot && ref ? diffPercent(shot, ref) : 100;
  const size = { width: Math.round(it.el.w), height: Math.round(it.el.h) };
  if (diffPct <= LIVE_MAX_DIFF_PCT) return { preview: { ...existing, ...size, ground, mode: 'live', htmlKey, diffPct }, doc, fonts: fonts.mode };
  // A substituted font alone never demotes a component: the comparison runs again with the text masked (D-095).
  if (fonts.mode === 'fallback' && shot && ref) {
    const dx = clipped ? shown.x - it.el.x : 0;
    const dy = clipped ? shown.y - it.el.y : 0;
    const boxes = (await textBoxes(session)).map((b) => ({ ...b, x: b.x - dx, y: b.y - dy }));
    const width = clipped ? shown.w : it.el.w;
    // Masking that covers most of the box proves nothing about the rest, so it does not decide (D-098).
    const covered = boxes.reduce((a, b) => a + Math.max(0, b.w + 4) * Math.max(0, b.h + 4), 0) / Math.max(1, width * (clipped ? shown.h : it.el.h));
    const masked = boxes.length && covered <= 0.5 ? diffPercent(maskBoxes(shot, boxes, width), maskBoxes(ref, boxes, width)) : diffPct;
    if (masked <= LIVE_MAX_DIFF_PCT) return { preview: { ...existing, ...size, ground, mode: 'live', htmlKey, diffPct, fontsSubstituted: fonts.substituted ?? [] }, doc, fonts: fonts.mode };
    return { preview: { ...existing, ground, mode: 'captured', capturedReason: 'fonts-unavailable', diffPct, htmlKey }, doc, fonts: fonts.mode };
  }
  return { preview: { ...existing, ground, mode: 'captured', capturedReason: fonts.mode === 'fallback' ? 'fonts-unavailable' : 'diff', diffPct, htmlKey }, doc, fonts: fonts.mode };
}

/** Render checks in flight at once, each on its own page: loading and drawing overlap the comparisons (D-066). */
export const PREVIEW_LANES = 3;

/** Core components first, then page-specific, most instances first within each, then grid order (D-095). */
export function renderOrder(comps: Pick<Component, 'tier' | 'instances'>[]): number[] {
  return comps.map((_, i) => i).sort((a, b) => Number(comps[a]!.tier !== 'core') - Number(comps[b]!.tier !== 'core') || comps[b]!.instances.length - comps[a]!.instances.length || a - b);
}

/** The previews event's reasons, each with a count above zero (preview-fidelity.md, Events). */
export function reasonWords(c: ReturnType<typeof previewCounts>): string {
  const parts: [number, string][] = [
    [c.diff, 'render differed'],
    [c['fonts-unavailable'], 'fonts unavailable'],
    [c['css-too-large'], 'styles too large'],
    [c['not-checked'], 'not checked in time'],
    [c['hidden-until-focus'] ?? 0, 'hidden until focused'],
    [c['no-crop'] ?? 0, 'no capture'],
  ];
  return parts
    .filter(([n]) => n > 0)
    .map(([n, w]) => ` · ${n} ${w}`)
    .join('');
}

export async function previews(ctx: RunContext, capture: CaptureOutput, comps: Component[], sources: ComponentSources, browser: Browser): Promise<Component[]> {
  const policy: CssPolicy = { storageBase: storageBaseOf(ctx) };
  const sessions = await Promise.all(Array.from({ length: Math.min(PREVIEW_LANES, Math.max(1, comps.length)) }, () => openRenderSession(browser, policy.storageBase)));
  const copier = new FontCopier(ctx);
  const diffs: number[] = [];
  const fontCases: Record<string, number> = {};
  const out: Component[] = new Array(comps.length);
  // The Code tab and the exports show the component's own reset-filtered rules; token variables are written per export set (D-069, D-083).
  // The site variables the exports declare by name stay named in the code; the rest resolve (D-083).
  const siteVars = new Set((ctx.current().tokens?.siteVariables ?? []).filter((v) => !v.hashed).map((v) => v.name));

  const one = async (c: Component, session: RenderSession): Promise<Component> => {
    const src = sources.get(c.id);
    if (!src) return c;
    const main = await previewFor(ctx, cssSource(src, src.first), keys.componentPreview(ctx.runId, c.id), c.preview, policy, session, copier, siteVars);
    if (main.preview.diffPct !== undefined) diffs.push(main.preview.diffPct);
    if (main.fonts) fontCases[main.fonts] = (fontCases[main.fonts] ?? 0) + 1;
    // A live component gets one file per captured state: the same document plus that state's diff.
    if (main.preview.mode === 'live' && main.doc) {
      const stateHtmlKeys: Partial<Record<State, string>> = {};
      for (const s of c.states) {
        if (!s.captured || s.state === 'default' || !s.delta.length) continue;
        const key = keys.componentStatePreview(ctx.runId, c.id, s.state);
        await ctx.files.put(key, statePreview(main.doc.html, s.delta, policy), { contentType: 'text/html; charset=utf-8' });
        stateHtmlKeys[s.state] = key;
      }
      if (Object.keys(stateHtmlKeys).length) main.preview.stateHtmlKeys = stateHtmlKeys;
    }
    const variants: Component['variants'] = [];
    for (const v of c.variants) {
      const rep = src.variants.get(v.id);
      if (!rep || rep === src.first) {
        variants.push({ ...v, preview: { ...v.preview, mode: main.preview.mode, ...(main.preview.capturedReason ? { capturedReason: main.preview.capturedReason } : {}), ...(main.preview.htmlKey ? { htmlKey: main.preview.htmlKey } : {}), ...(main.preview.diffPct !== undefined ? { diffPct: main.preview.diffPct } : {}) } });
        continue;
      }
      const r = await previewFor(ctx, cssSource(src, rep), keys.variantPreview(ctx.runId, c.id, v.id), v.preview, policy, session, copier, siteVars);
      variants.push({ ...v, preview: r.preview });
    }
    const code = main.doc ? { html: main.doc.markup, css: main.doc.code, ...(capture.frameworkHint === 'tailwind' ? { tailwind: main.doc.markup } : {}) } : c.code;
    return { ...c, preview: main.preview, variants, code };
  };

  try {
    const order = renderOrder(comps);
    let next = 0;
    await Promise.all(
      sessions.map(async (session) => {
        while (next < order.length) {
          const i = order[next++]!;
          out[i] = await one(comps[i]!, session);
        }
      }),
    );
  } finally {
    await Promise.all(sessions.map((s) => s.close()));
  }
  const refused = sessions.flatMap((s) => s.refused);
  const live = out.filter((c) => c.preview.mode === 'live').length;
  const median = diffs.length ? [...diffs].sort((a, b) => a - b)[Math.floor(diffs.length / 2)]! : 0;
  const unchecked = out.filter((c) => c.preview.capturedReason === 'not-checked').length;
  if (unchecked) await ctx.emit({ stage: 'previews', level: 'warn', message: `time budget for render checks reached · ${unchecked} previews not checked` });
  await ctx.emit({
    stage: 'previews',
    message: `${out.length} built · ${live} live · ${out.length - live} captured (median diff ${median.toFixed(1)} %)${reasonWords(previewCounts(out))}`,
    data: { refused: refused.length, fonts: fontCases, previews: previewCounts(out) },
    patch: { components: out },
  });
  if (refused.length) ctx.log.warn({ refused: refused.slice(0, 10) }, 'preview requests outside the allowlist were refused');
  return out;
}
