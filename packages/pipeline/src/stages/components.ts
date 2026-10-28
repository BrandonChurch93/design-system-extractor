import { createHash } from 'node:crypto';
import { ComponentGroup, componentGroupOf, viewportSize, type Component, type ComponentTier, type ComponentType, type Preview, type State, type StateCapture, type Tokens } from '@dse/schema';
import { deltaE, parseCssColor } from '../color/parse';
import { px, radiusOf } from '../capture/snapshot';
import { classify, type Guess } from '../components/classify';
import { classesAllowMerge, clusterItems, exactKey, representative, toneOnly, type Cluster } from '../components/cluster';
import { cropShot, downscale, padded, shotExtent, sourceRegion } from '../components/crop';
import { commonGround, CROP_MARGIN, groundOf, withGround } from '../components/ground';
import { itemsFrom, type Item } from '../components/items';
import { nameComponents, resolveCollisions, stylesAgree, type CollisionPair, type Draft, type Naming } from '../components/model';
import { componentMotion, easingLink, patternOwners, withOwners } from '../components/motion';
import { easingUsedBy } from '../components/used-by';
import { endsInDigit, slugsOf, uniqueNames } from '../components/naming';
import { nameVariants, sized, splitVariants, stateOf, type VariantDraft } from '../components/variants';
import type { RunContext } from '../context';
import { stableId } from '../ids';
import { keys } from '../storage/keys';
import { splitList } from '../capture/states';
import { normalizeShadow } from '../tokens/collect';
import { msOf, roundMs } from '../tokens/motion';
import type { CaptureOutput } from './capture';
import type { ExtractedTokens } from './tokens';

// Stage `components` (docs/specs/component-detection.md).

export const COMPONENT_CAP = 120;
/** Types whose tone is a variant, never a component of its own (D-090). */
const TONED = new Set<ComponentType>(['alert', 'toast']);
const stateOrder: State[] = ['default', 'hover', 'focus', 'active', 'disabled', 'error', 'checked', 'selected', 'open', 'scrolled'];

type Working = { id: string; items: Item[]; guess: Guess; naming?: Naming; variants: VariantDraft[] };

/** First seen: the earliest page in capture order, desktop preferred, then document order. */
export function firstSeen(items: Item[]): Item {
  return [...items].sort((a, b) => a.page.order - b.page.order || Number(a.viewport !== 'desktop') - Number(b.viewport !== 'desktop') || a.el.index - b.el.index)[0]!;
}

/** Noise: a wrapper with no interactive descendant, no text and no image, or wider than 60% of the viewport. */
function isNoise(c: Cluster): boolean {
  const it = representative(c.items);
  const vp = viewportSize[it.viewport];
  if (it.el.w * it.el.h > vp.width * vp.height * 0.6 && !it.revealed) return true;
  if (!it.rules.every((r) => r === 'container')) return false;
  const desc = it.snapshot.elements.filter((e) => {
    for (let p = e.p; p >= 0; p = it.snapshot.elements[p]!.p) if (p === it.el.index) return true;
    return false;
  });
  const interactive = desc.some((d) => ['a', 'button', 'input', 'select', 'textarea'].includes(d.tag));
  const image = desc.some((d) => d.tag === 'img' || d.tag === 'svg');
  return !interactive && !image && !it.el.text.trim();
}

/** The element plus its 4 px margin, painted with its ground (D-094). */
function crop(it: Item): Buffer | null {
  if (it.revealed) return it.revealed.open.crop ?? null;
  return withGround(cropShot(it.vc.screenshot, padded({ x: it.el.x, y: it.el.y, w: it.el.w, h: it.el.h }, CROP_MARGIN)), it, groundOf(it));
}

function rebuild(w: Working, tokens: Tokens) {
  w.variants = nameVariants(splitVariants(w.items), tokens.colors);
}

function nearestColorToken(value: string, tokens: Tokens) {
  const c = parseCssColor(value);
  if (!c) return undefined;
  let best: { id: string; d: number } | undefined;
  // A translucent value is an overlay's, never a palette step's (D-086).
  const pool = c.a < 1 ? (tokens.overlays ?? []).map((o) => ({ id: o.id, value: o.value })) : tokens.colors;
  for (const t of pool) {
    const tc = parseCssColor(t.value)!;
    if (Math.abs(tc.a - c.a) > 0.05) continue;
    const d = deltaE({ ...tc, a: 1 }, { ...c, a: 1 });
    if (!best || d < best.d) best = { id: t.id, d };
  }
  return best && best.d <= 2.3 ? best.id : undefined;
}

/** Each default value linked to the token it matches, the rest listed as unmapped. */
export function tokensUsedBy(it: Item, tokens: Tokens): Pick<Component, 'tokensUsed' | 'unmapped' | 'borderWidth'> {
  const used: Component['tokensUsed'] = [];
  const unmapped: Component['unmapped'] = [];
  const st = it.el.style;
  const link = (property: string, value: string, id: string | undefined) => (id ? used.push({ tokenId: id, property }) : unmapped.push({ property, value }));
  if (parseCssColor(st['background-color'])) link('background-color', st['background-color'], nearestColorToken(st['background-color'], tokens));
  if (it.el.text.trim()) link('color', st.color, nearestColorToken(st.color, tokens));
  if (px(st['border-top-width']) > 0 && st['border-top-style'] !== 'none') link('border-color', st['border-top-color'], nearestColorToken(st['border-top-color'], tokens));
  const r = radiusOf(it.el);
  if (r > 0) {
    const pill = r >= 999 || r >= it.el.h / 2 - 0.5;
    link('border-radius', `${r}px`, tokens.radius.find((t) => (pill ? t.isPill : t.value === r))?.id);
  }
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const v = Math.round(px(st[`padding-${side}`]) * 2) / 2;
    if (v > 0) link(`padding-${side}`, `${v}px`, tokens.space.find((t) => t.value === v)?.id);
  }
  if (it.el.text.trim()) {
    const size = px(st['font-size']);
    const weight = Number(st['font-weight']) || 400;
    const t = tokens.type.find((x) => x.size === size && x.weight === weight && (x.family === it.el.font || st['font-family'].includes(x.family)));
    link('font', `${size}px ${weight}`, t?.id);
  }
  const shadow = normalizeShadow(st['box-shadow']);
  if (shadow) link('box-shadow', shadow, tokens.shadow.find((t) => t.value === shadow)?.id);
  // The durations and easings of its transitions.
  const durs = splitList(st['transition-duration'] ?? '');
  const eases = splitList(st['transition-timing-function'] ?? '');
  splitList(st['transition-property'] ?? '').forEach((p, i) => {
    if (p === 'none') return;
    const ms = roundMs(msOf(durs[i % Math.max(1, durs.length)] ?? '0s'));
    if (ms <= 0) return;
    const d = (tokens.duration ?? []).find((t) => t.ms === ms);
    if (!used.some((u) => u.property === 'transition-duration' && u.tokenId === d?.id)) link('transition-duration', `${ms}ms`, d?.id);
    const e = easingLink(eases[i % Math.max(1, eases.length)] ?? 'ease', tokens.easing ?? []);
    if ('easingTokenId' in e) {
      if (!used.some((u) => u.tokenId === e.easingTokenId)) used.push({ tokenId: e.easingTokenId, property: 'transition-timing-function' });
    } else if (!unmapped.some((u) => u.value === e.easing)) unmapped.push({ property: 'transition-timing-function', value: e.easing });
  });
  const borderWidth = px(st['border-top-width']) > 0 && st['border-top-style'] !== 'none' ? px(st['border-top-width']) : undefined;
  return { tokensUsed: used, unmapped, ...(borderWidth ? { borderWidth } : {}) };
}

/** The capture items behind each component and each of its variants, for the previews stage. */
export type ComponentSources = Map<string, { first: Item; variants: Map<string, Item>; items: Item[]; variantOf: Map<Item, string> }>;

/** Merges, in place, clusters of a toned type whose looks differ only in color; returns how many it merged. */
function toneMerge(list: Working[], typeOf: (w: Working) => ComponentType, tokens: ExtractedTokens): number {
  let merged = 0;
  for (let i = 0; i < list.length; i++) {
    for (let j = list.length - 1; j > i; j--) {
      const a = list[i]!;
      const b = list[j]!;
      if (typeOf(a) !== typeOf(b) || !TONED.has(typeOf(a))) continue;
      const ra = representative(a.items).fp;
      const rb = representative(b.items).fp;
      if (ra.tag !== rb.tag || ra.role !== rb.role || ra.iconOnly !== rb.iconOnly || ra.trigger !== rb.trigger || !classesAllowMerge(ra.baseTokens, rb.baseTokens)) continue;
      // A notice holds what it says, with or without an action, so its box decides, not its children.
      if (!toneOnly(ra.style, rb.style)) continue;
      a.items.push(...b.items);
      list.splice(j, 1);
      rebuild(a, tokens);
      merged++;
    }
  }
  return merged;
}

export async function components(ctx: RunContext, capture: CaptureOutput, tokens: ExtractedTokens): Promise<{ components: Component[]; sources: ComponentSources }> {
  const items = itemsFrom(capture);
  for (const it of items) {
    if (!it.rules.includes('inline-mark')) continue;
    const id = nearestColorToken(it.el.style['background-color'], tokens) ?? nearestColorToken(it.el.style['border-top-color'], tokens);
    it.fp.semanticGround = tokens.colors.find((t) => t.id === id)?.group === 'semantic';
  }
  const clusters = clusterItems(items);
  const kept = clusters.filter((c) => !isNoise(c));
  const noise = clusters.length - kept.length;

  // Drafts in first-seen order, so ids, batches and names follow the pages.
  const working: Working[] = kept
    .map((c) => ({ id: '', items: c.items, guess: classify(c.items), variants: [] as VariantDraft[] }))
    .sort((a, b) => {
      const fa = firstSeen(a.items);
      const fb = firstSeen(b.items);
      return fa.page.order - fb.page.order || Number(fa.viewport !== 'desktop') - Number(fb.viewport !== 'desktop') || fa.el.index - fb.el.index;
    });
  working.forEach((w) => rebuild(w, tokens));
  // Two clusters of one type that share a variant's exact look are one component (D-052).
  for (let i = 0; i < working.length; i++) {
    for (let j = working.length - 1; j > i; j--) {
      const a = working[i]!;
      const b = working[j]!;
      const ra = representative(a.items).fp;
      const rb = representative(b.items).fp;
      if (a.guess.type !== b.guess.type || ra.iconOnly !== rb.iconOnly || ra.trigger !== rb.trigger || !classesAllowMerge(ra.baseTokens, rb.baseTokens)) continue;
      // Only where a look is a choice (controls, marks): plain wrappers all look alike.
      if (!a.items.some(sized) || !b.items.some(sized)) continue;
      const looks = new Set(a.variants.map((v) => v.key));
      if (!b.variants.some((v) => looks.has(v.key))) continue;
      a.items.push(...b.items);
      working.splice(j, 1);
      rebuild(a, tokens);
    }
  }
  // Notices that differ only in color are one component in several tones (D-090).
  toneMerge(working, (w) => w.guess.type, tokens);
  working.forEach((w, i) => (w.id = `c${i + 1}`));

  const drafts: Draft[] = working.map((w) => {
    const c = crop(firstSeen(w.items));
    return { id: w.id, items: w.items, guess: w.guess, variantNames: w.variants.map((v) => v.name), crop: c ? downscale(c) : undefined };
  });
  const named = await nameComponents(ctx, drafts);
  working.forEach((w, i) => (w.naming = named.namings[i]));
  const dropped = working.filter((w) => !w.naming!.isComponent).length;
  let list = working.filter((w) => w.naming!.isComponent);

  // Cross-page merge of same-named clusters: by style, else by the collision call (D-052).
  const parent = new Map(list.map((w) => [w, w]));
  const find = (w: Working): Working => (parent.get(w) === w ? w : find(parent.get(w)!));
  const pairs: CollisionPair[] = [];
  const byName = new Map<string, Working[]>();
  for (const w of list) {
    // A generated name carries no judgment, so it never merges two clusters.
    if (w.naming!.by === 'fallback') continue;
    const k = `${w.naming!.type}|${w.naming!.name.toLowerCase()}`;
    byName.set(k, [...(byName.get(k) ?? []), w]);
  }
  let mergedByStyle = 0;
  for (const group of byName.values()) {
    for (let i = 1; i < group.length; i++) {
      const a = find(group[0]!);
      const b = group[i]!;
      // A trigger never joins an action control, whatever the model called the two (D-054, D-070).
      if (representative(a.items).fp.trigger !== representative(b.items).fp.trigger) continue;
      if (stylesAgree(draftOf(a), draftOf(b))) {
        parent.set(b, a);
        mergedByStyle++;
      } else if (classesAllowMerge(representative(a.items).fp.baseTokens, representative(b.items).fp.baseTokens)) {
        pairs.push({ id: `p${pairs.length + 1}`, a: draftOf(a), b: draftOf(b), name: group[0]!.naming!.name });
      }
      // Clusters the site's own class names set apart stay apart, whatever the model called them.
    }
  }
  function draftOf(w: Working): Draft {
    return drafts.find((d) => d.id === w.id)!;
  }
  const collisions = await resolveCollisions(ctx, pairs);
  for (const p of pairs) {
    const a = list.find((w) => w.id === p.a.id)!;
    const b = list.find((w) => w.id === p.b.id)!;
    if (collisions.same.has(p.id)) parent.set(b, find(a));
  }
  const roots = list.filter((w) => find(w) === w);
  for (const w of list) {
    const r = find(w);
    if (r !== w) r.items.push(...w.items);
  }
  const mergedCount = list.length - roots.length;
  list = roots;
  // Again by the final types: a notice the rules could not type is typed by the model (D-090).
  const toned = toneMerge(list, (w) => w.naming!.type, tokens);
  for (const w of list) rebuild(w, tokens);
  // Names still shared after merging take their context, never a number; a name ending in one is renamed (D-084).
  const finalNames = list.map((w) => ({ name: w.naming!.name, first: firstSeen(w.items) }));
  const renamed = uniqueNames(finalNames);
  list.forEach((w, i) => (w.naming = { ...w.naming!, name: finalNames[i]!.name }));

  // Caps and order: by group, then instance count.
  const groupRank = (t: ComponentType) => ComponentGroup.options.indexOf(componentGroupOf[t]);
  list.sort((a, b) => groupRank(a.naming!.type) - groupRank(b.naming!.type) || b.items.length - a.items.length || firstSeen(a.items).page.order - firstSeen(b.items).page.order);
  while (list.length > COMPONENT_CAP) {
    const other = list.map((w, i) => ({ w, i })).filter(({ w }) => w.naming!.type === 'other');
    const drop = other.length ? other.sort((a, b) => a.w.items.length - b.w.items.length)[0]!.i : list.reduce((m, w, i) => (w.items.length < list[m]!.items.length ? i : m), 0);
    list.splice(drop, 1);
  }

  const assembled: Assembled[] = [];
  const sources: ComponentSources = new Map();
  const ids = new Set<string>();
  const owners = new Map<string, string>();
  for (const w of list) {
    let id = stableId(`component:${exactKey(representative(w.items))}`);
    for (let n = 2; ids.has(id); n++) id = stableId(`component:${exactKey(representative(w.items))}:${n}`);
    ids.add(id);
    for (const it of w.items) owners.set(`${it.page.id}|${it.viewport}|${it.el.d}`, id);
    assembled.push(await assemble(ctx, w, id, tokens));
    const variantOf = new Map<Item, string>();
    for (const v of w.variants) for (const it of v.items) variantOf.set(it, stableId(`variant:${id}:${v.key}`));
    sources.set(id, { first: firstSeen(w.items), variants: new Map(w.variants.map((v) => [stableId(`variant:${id}:${v.key}`), firstSeen(v.items)])), items: w.items, variantOf });
  }

  // Tier (D-085), slug, and motion (motion-capture.md, Attachment to components).
  const owned = patternOwners(capture, owners, tokens.motionBuild?.targets ?? new Map());
  const patternsOf = new Map<string, string[]>();
  for (const [pid, cids] of owned) for (const cid of cids) patternsOf.set(cid, [...(patternsOf.get(cid) ?? []), pid]);
  const tiers = tiersOf(assembled);
  const slugs = slugsOf(assembled.map((c) => c.name));
  const out: Component[] = assembled.map((c, i) => {
    const w = list[i]!;
    return { ...c, tier: tiers[i]!, slug: slugs[i]!, motion: componentMotion(firstSeen(w.items), w.items, c.states, tokens.easing ?? [], patternsOf.get(c.id) ?? []) };
  });
  const built = tokens.motionBuild?.motion ?? { patterns: [], truncatedPages: [], intersectionObservers: 0 };
  const motion = { ...built, patterns: withOwners(built.patterns, owned) };
  const easing = easingUsedBy(tokens.easing ?? [], out, motion.patterns);
  for (const v of out.flatMap((c) => c.variants)) if (endsInDigit(v.name)) throw new Error(`variant name ends in a number: ${v.name}`);

  const byModel = list.filter((w) => w.naming!.by !== 'fallback').length;
  await ctx.emit({ stage: 'components', message: `${out.length} found from ${items.length.toLocaleString('en-US')} element candidates · ${byModel} by model`, data: { calls: named.calls, collisions: collisions.by }, patch: { components: out, motion, tokens: { easing } } });
  for (const r of renamed) await ctx.emit({ stage: 'components', message: `renamed ${r.from} to ${r.to}` });
  const core = out.filter((c) => c.tier === 'core').length;
  await ctx.emit({ stage: 'components', message: `${core} core · ${out.length - core} page-specific` });
  await ctx.emit({ stage: 'components', message: `motion attached to ${out.filter((c) => c.motion).length} components · ${owned.size} patterns` });
  const cut = named.calls.filter((c) => c === 'by fallback (time budget)').length;
  if (cut) await ctx.emit({ stage: 'components', level: 'warn', message: `time budget for naming reached · ${cut} of ${named.calls.length} batches named by the rules` });
  if (mergedByStyle + mergedCount + toned > 0) await ctx.emit({ stage: 'components', message: `merged ${mergedCount + toned} across pages` });
  if (noise + dropped > 0) await ctx.emit({ stage: 'components', message: `${noise + dropped} noise cluster${noise + dropped > 1 ? 's' : ''} dropped` });
  return { components: out, sources };
}

async function put(ctx: RunContext, key: string, png: Buffer | null): Promise<{ key: string; width: number; height: number } | null> {
  if (!png) return null;
  await ctx.files.put(key, png, { contentType: 'image/png' });
  // Crops are taken at device scale 2; sizes are recorded in CSS px.
  return { key, width: Math.round(png.readUInt32BE(16) / 2), height: Math.round(png.readUInt32BE(20) / 2) };
}

const capturedPreview = (shot: { key: string; width: number; height: number }): Preview => ({ mode: 'captured', cropKey: shot.key, width: shot.width, height: shot.height });

type Assembled = Omit<Component, 'tier' | 'slug' | 'motion'>;

const coreTypes = new Set<ComponentType>(['button', 'input', 'select', 'checkbox', 'radio', 'toggle', 'textarea', 'link', 'badge', 'tag', 'avatar', 'tooltip']);

/**
 * Core: instances on two or more pages, or three or more on one page, or the most used component of a
 * control or mark type; everything else is page-specific (D-085).
 */
export function tiersOf(list: Pick<Component, 'type' | 'provenance'>[]): ComponentTier[] {
  const total = (c: Pick<Component, 'provenance'>) => c.provenance.pages.reduce((s, p) => s + p.count, 0);
  const top = new Map<ComponentType, number>();
  list.forEach((c, i) => {
    const prev = top.get(c.type);
    if (coreTypes.has(c.type) && (prev === undefined || total(c) > total(list[prev]!))) top.set(c.type, i);
  });
  return list.map((c, i) => (c.provenance.pages.length >= 2 || c.provenance.pages.some((p) => p.count >= 3) || top.get(c.type) === i ? 'core' : 'page'));
}

async function assemble(ctx: RunContext, w: Working, id: string, tokens: Tokens): Promise<Assembled> {
  const first = firstSeen(w.items);
  const instanceId = (it: Item) => stableId(`instance:${it.key}`);
  const variantIds = new Map(w.variants.map((v) => [v, stableId(`variant:${id}:${v.key}`)]));
  const variantOf = (it: Item) => w.variants.find((v) => v.items.includes(it))!;

  const defaultShot = await put(ctx, keys.componentCrop(ctx.runId, id, 'default'), crop(first));
  const variants: Component['variants'] = [];
  for (const v of w.variants) {
    const vid = variantIds.get(v)!;
    const rep = firstSeen(v.items);
    const shot = (await put(ctx, keys.variantCrop(ctx.runId, id, vid), crop(rep))) ?? defaultShot;
    variants.push({ id: vid, name: v.name, instanceIds: v.items.map(instanceId), delta: v.delta, preview: shot ? capturedPreview(shot) : capturedPreview({ key: keys.componentCrop(ctx.runId, id, 'default'), width: 0, height: 0 }) });
  }

  const instances: Component['instances'] = w.items.map((it) => ({
    id: instanceId(it),
    pageId: it.page.id,
    viewport: it.viewport,
    selector: it.selector,
    bbox: { x: Math.round(it.el.x), y: Math.round(it.el.y), w: Math.round(it.el.w), h: Math.round(it.el.h) },
    variantId: variantIds.get(variantOf(it))!,
    ...(it.el.text.trim() ? { text: it.el.text.trim().slice(0, 80) } : {}),
    ground: groundOf(it),
  }));

  const ground = commonGround(instances.flatMap((i) => (i.ground ? [i.ground] : [])));

  // Provenance (D-008): the source crop is cut from the first-seen page's screenshot.
  const bbox = { x: Math.round(first.el.x), y: Math.round(first.el.y), w: Math.round(first.el.w), h: Math.round(first.el.h) };
  const shot = first.vc.screenshot;
  const { region, outline } = sourceRegion(bbox, { width: shot.width, height: shotExtent(shot) });
  const source = first.revealed ? null : await put(ctx, keys.componentSource(ctx.runId, id, first.viewport), cropShot(shot, region));
  const pageCounts = new Map<string, { pageId: string; path: string; order: number; desktop: number; mobile: number }>();
  for (const it of w.items) {
    const p = pageCounts.get(it.page.id) ?? { pageId: it.page.id, path: it.page.path, order: it.page.order, desktop: 0, mobile: 0 };
    p[it.viewport]++;
    pageCounts.set(it.page.id, p);
  }

  const rep = representative(w.items);
  const signature = {
    tag: rep.el.tag,
    ...(rep.el.role ? { role: rep.el.role } : {}),
    classTokens: rep.fp.classTokens,
    structure: rep.fp.structure,
    styleHash: createHash('sha1').update(JSON.stringify(rep.fp.style)).digest('hex').slice(0, 12),
  };

  const responsive = await responsiveVariantOf(ctx, w, id, first);
  return {
    id,
    name: w.naming!.name,
    type: w.naming!.type,
    group: componentGroupOf[w.naming!.type],
    confidence: w.guess.confidence,
    signature,
    variants,
    instances,
    provenance: {
      firstSeen: { pageId: first.page.id, path: first.page.path, viewport: first.viewport, selector: first.selector, bbox, ...(source ? { sourceCrop: { key: source.key, width: source.width, height: source.height, outline } } : {}) },
      pages: [...pageCounts.values()].sort((a, b) => a.order - b.order).map((p) => ({ pageId: p.pageId, path: p.path, count: p.desktop || p.mobile })),
    },
    states: await statesOf(ctx, w, id, first, instanceId),
    ...tokensUsedBy(first, tokens),
    preview: defaultShot ? capturedPreview(defaultShot) : capturedPreview({ key: keys.componentCrop(ctx.runId, id, 'default'), width: 0, height: 0 }),
    ...(ground ? { ground } : {}),
    code: { html: '', css: '' },
    checks: [],
    ...(responsive ? { responsiveVariant: responsive } : {}),
  };
}

/** The union of states across instances, the first-seen instance's capture preferred. */
async function statesOf(ctx: RunContext, w: Working, id: string, first: Item, instanceId: (it: Item) => string): Promise<StateCapture[]> {
  const ordered = [first, ...w.items.filter((i) => i !== first)];
  const out = new Map<State, StateCapture>();
  const save = async (state: State, png: Buffer | null | undefined) => (await put(ctx, keys.componentCrop(ctx.runId, id, state), png ?? null))?.key;
  out.set('default', { state: 'default', captured: true, cropKey: keys.componentCrop(ctx.runId, id, 'default'), delta: [], instanceId: instanceId(first) });

  const interactive = w.items.some((i) => i.interactive && !i.revealed);
  for (const state of ['hover', 'focus', 'active', 'scrolled'] as const) {
    for (const it of ordered) {
      const rec = (it.vc.states[it.el.d] ?? []).find((r) => r.state === state);
      if (!rec || it.revealed) continue;
      out.set(state, { state, captured: true, cropKey: await save(state, withGround(rec.crop, it, groundOf(it), rec.delta)), delta: rec.delta, ...(state === 'focus' ? { reachedByKeyboard: Boolean(rec.reachedByKeyboard) } : {}), instanceId: instanceId(it) });
      break;
    }
    if (!out.has(state) && interactive && state !== 'scrolled') {
      const probed = w.items.filter((it) => it.interactive && !it.revealed);
      const unreachable = probed.some((it) => it.vc.stateUnreachable.has(it.el.d));
      const overCap = probed.some((it) => !it.vc.stateCaptured.has(it.el.d) && !it.vc.stateUnreachable.has(it.el.d));
      out.set(state, { state, captured: false, reason: unreachable ? 'not reachable' : overCap ? 'over capture cap' : 'no instance found', delta: [] });
    }
  }
  for (const it of ordered) {
    const s = stateOf(it.el);
    if (!s || out.has(s) || it.revealed) continue;
    out.set(s, { state: s, captured: true, cropKey: await save(s, crop(it)), delta: [], instanceId: instanceId(it) });
  }
  for (const it of ordered) {
    const open = it.vc.opens.find((o) => o.trigger === it.el.d);
    if (!open || out.has('open') || it.revealed) continue;
    out.set('open', { state: 'open', captured: true, cropKey: await save('open', open.crop), delta: open.triggerDelta, instanceId: instanceId(it) });
  }
  return stateOrder.filter((s) => out.has(s)).map((s) => out.get(s)!);
}

/** `Stacks at 390 px` when display changes; `Changes layout at 390 px` when it fills its container only on phones. */
/** How the phone instance differs from the desktop one, if it does (docs/specs/component-detection.md, Responsive variants). */
export function responsiveNote(desktop: Item, mobile: Item): 'Stacks at 390 px' | 'Changes layout at 390 px' | undefined {
  const flow = (it: Item) => `${it.el.style.display}|${/flex/.test(it.el.style.display) ? it.el.style['flex-direction'] : ''}`;
  if (flow(desktop) !== flow(mobile)) return 'Stacks at 390 px';
  const parentW = (it: Item) => it.snapshot.elements[it.el.p]?.w ?? viewportSize[it.viewport].width;
  if (mobile.el.w >= parentW(mobile) * 0.9 && desktop.el.w <= parentW(desktop) * 0.6) return 'Changes layout at 390 px';
  return undefined;
}

async function responsiveVariantOf(ctx: RunContext, w: Working, id: string, first: Item): Promise<Component['responsiveVariant'] | undefined> {
  const desktop = w.items.find((i) => i.viewport === 'desktop' && i.page.id === first.page.id && !i.revealed);
  if (!desktop) return undefined;
  const mobile = w.items.find((i) => i.viewport === 'mobile' && i.page.id === desktop.page.id && i.selector === desktop.selector);
  if (!mobile) return undefined;
  const note = responsiveNote(desktop, mobile);
  if (!note) return undefined;
  const shot = await put(ctx, keys.componentMobile(ctx.runId, id), crop(mobile));
  if (!shot) return undefined;
  return { mobilePreview: capturedPreview(shot), note };
}
