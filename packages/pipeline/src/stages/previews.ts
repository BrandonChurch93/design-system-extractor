import type { Browser } from 'playwright';
import type { Component, Preview, State } from '@dse/schema';
import { PNG } from 'pngjs';
import { effectiveBackground } from '../capture/snapshot';
import { cropShot } from '../components/crop';
import type { Item } from '../components/items';
import { overBudget } from '../budget';
import { exportTokens } from '../exports/model';
import { withTokenVars } from '../exports/substitute';
import type { RunContext } from '../context';
import { buildPreview, statePreview, type PreviewDoc } from '../previews/build';
import { LIVE_MAX_DIFF_PCT } from '../previews/constants';
import { FontCopier, fontsFor } from '../previews/fonts';
import { diffPercent, openRenderSession, renderPreview, type RenderSession } from '../previews/render';
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

function referenceCrop(it: Item): Buffer | null {
  if (it.revealed) return it.revealed.open.rootCrop ?? null;
  return cropShot(it.vc.screenshot, { x: it.el.x, y: it.el.y, w: it.el.w, h: it.el.h });
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

async function previewFor(ctx: RunContext, it: Item, htmlKey: string, existing: Preview, policy: CssPolicy, session: RenderSession, copier: FontCopier): Promise<Outcome> {
  if (overBudget(ctx, 'previews')) return { preview: { ...existing, mode: 'captured', capturedReason: 'not-checked' } };
  const markup = it.revealed ? it.revealed.open.markup : it.vc.markup[it.el.d];
  const matched = it.revealed ? it.revealed.open.matched : it.vc.matched;
  if (!markup?.html) return { preview: { ...existing, mode: 'captured', capturedReason: 'css-too-large' } };
  const imageColors: Record<string, string> = {};
  for (const e of it.snapshot.elements) {
    if (!['img', 'picture', 'video', 'canvas', 'iframe'].includes(e.tag) || it.revealed) continue;
    const c = averageColor(cropShot(it.vc.screenshot, { x: e.x, y: e.y, w: e.w, h: e.h }));
    if (c) imageColors[e.d] = c;
  }
  const bg = effectiveBackground(it.snapshot, it.el, false);
  const fonts = await fontsFor(fontsUsed(it), it.vc.sheets, copier);
  const doc = buildPreview({ markup: markup.html, vars: markup.vars, snapshot: it.snapshot, root: it.el, matched, ground: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`, imageColors, fonts, policy });
  if (doc.tooLarge) return { preview: { ...existing, mode: 'captured', capturedReason: 'css-too-large' }, doc, fonts: fonts.mode };
  await ctx.files.put(htmlKey, doc.html, { contentType: 'text/html; charset=utf-8' });
  const shot = await renderPreview(session, ctx.files.publicUrl(htmlKey), { w: it.el.w, h: it.el.h });
  const ref = referenceCrop(it);
  const diffPct = shot && ref ? diffPercent(shot, ref) : 100;
  const size = { width: Math.round(it.el.w), height: Math.round(it.el.h) };
  if (diffPct <= LIVE_MAX_DIFF_PCT) return { preview: { ...existing, ...size, mode: 'live', htmlKey, diffPct }, doc, fonts: fonts.mode };
  const webFontMissing = fonts.mode === 'fallback';
  return { preview: { ...existing, mode: 'captured', capturedReason: webFontMissing ? 'fonts-unavailable' : 'diff', diffPct, htmlKey }, doc, fonts: fonts.mode };
}

/** Render checks in flight at once, each on its own page: loading and drawing overlap the comparisons (D-066). */
export const PREVIEW_LANES = 3;

export async function previews(ctx: RunContext, capture: CaptureOutput, comps: Component[], sources: ComponentSources, browser: Browser): Promise<Component[]> {
  const policy: CssPolicy = { storageBase: storageBaseOf(ctx) };
  const sessions = await Promise.all(Array.from({ length: Math.min(PREVIEW_LANES, Math.max(1, comps.length)) }, () => openRenderSession(browser, policy.storageBase)));
  const copier = new FontCopier(ctx);
  const diffs: number[] = [];
  const fontCases: Record<string, number> = {};
  const out: Component[] = new Array(comps.length);
  // The Code tab and the exports show the component's own rules with token variables (D-069).
  const raw = exportTokens(ctx.current(), 'raw');

  const one = async (c: Component, session: RenderSession): Promise<Component> => {
    const src = sources.get(c.id);
    if (!src) return c;
    const main = await previewFor(ctx, cssSource(src, src.first), keys.componentPreview(ctx.runId, c.id), c.preview, policy, session, copier);
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
      const r = await previewFor(ctx, cssSource(src, rep), keys.variantPreview(ctx.runId, c.id, v.id), v.preview, policy, session, copier);
      variants.push({ ...v, preview: r.preview });
    }
    const code = main.doc ? { html: main.doc.markup, css: withTokenVars(main.doc.rules, raw), ...(capture.frameworkHint === 'tailwind' ? { tailwind: main.doc.markup } : {}) } : c.code;
    return { ...c, preview: main.preview, variants, code };
  };

  try {
    let next = 0;
    await Promise.all(
      sessions.map(async (session) => {
        while (next < comps.length) {
          const i = next++;
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
    message: `${out.length} built · ${live} live · ${out.length - live} captured (median diff ${median.toFixed(1)} %)`,
    data: { refused: refused.length, fonts: fontCases },
    patch: { components: out },
  });
  if (refused.length) ctx.log.warn({ refused: refused.slice(0, 10) }, 'preview requests outside the allowlist were refused');
  return out;
}
