import { gzipSync } from 'node:zlib';
import type { Page as PwPage } from 'playwright';
import type { FrameworkHint, Page as DocPage, SelectedPage, Viewport } from '@dse/schema';
import { viewportSize } from '@dse/schema';
import { capCandidates, findCandidates, noveltyKey, type ElementCandidate } from '../capture/candidates';
import { matchedFromCssom, unreadableSheets } from '../capture/cssom-match';
import { endScriptAnimations, motionInit, motionMarkScroll, motionReadout, type MotionRecords } from '../capture/motion-script';
import type { MatchedStyles } from '../capture/matched-css';
import { scanSheets, type SheetScan } from '../capture/sheet-scan';
import { buildSnapshot, compactSnapshot, descendants, type SnapElement, type Snapshot } from '../capture/snapshot';
import type { ShotBand } from '../components/crop';
import { buildSelectors, motionProps, styleProps, takeSnapshot } from '../capture/snapshot-script';
import { activeState, cropOf, hoverState, neutral, readStyles, scrolledState, settle, splitList, STATE_WAIT_CAP, styleDelta, tabWalk, withTransitions, type StateRecord, type StyleDelta } from '../capture/states';
import type { RunContext } from '../context';
import { isBotChallenge, isLoginWalled, looksLikeLoginPage, loginPathPattern } from '../crawl/blocked';
import { newPage, type RunBrowserContext } from '../crawl/browser';
import { guardedFetch } from '../crawl/fetch';
import { loadPage } from '../crawl/navigate';
import { dismissConsent, loginFacts } from '../crawl/page-scripts';
import { markupOf } from '../capture/markup';
import type { Throttle } from '../crawl/throttle';
import { BlockedError, CancelledError } from '../errors';
import { keys } from '../storage/keys';
import { overBudget } from '../budget';

export const SNAPSHOT_CAP = 6000;
export const CANDIDATE_CAP = 400;
export const STATE_CAP = 40;
export const OPEN_CAP = 3;
/** Markup larger than this is left out; such a component can only be captured (its CSS cap is 200 KB). */
export const MARKUP_CAP = 300_000;

/** Every custom property the matched rules of these elements name. */
export function varsIn(matched: Record<string, MatchedStyles>): string[] {
  const names = new Set<string>();
  for (const m of Object.values(matched)) {
    const decls = [...m.rules.flatMap((r) => r.declarations), ...m.inline, ...m.pseudo.flatMap((p) => p.rules.flatMap((r) => r.declarations))];
    for (const d of decls) for (const v of d.value.matchAll(/var\(\s*(--[\w-]+)/g)) names.add(v[1]!);
  }
  return [...names];
}
/**
 * What earlier pages of this run already measured, per viewport (D-066). A preliminary cluster's
 * matched CSS, states, popup and reduced-motion reading are taken where it is first seen; later
 * pages measure only clusters they add, so a header on twelve pages is measured once.
 */
type NoveltyKind = 'css' | 'states' | 'opens' | 'motion';

/**
 * The keys earlier pages measured, read in page order: a page decides from what pages before it
 * chose, waiting for their choices, never from whichever page finished first. A run therefore
 * measures the same clusters every time, whatever the timing (D-066).
 */
export class NoveltyLedger {
  private slots = new Map<string, { done: Promise<Set<string>>; resolve: (keys: Set<string>) => void }>();

  private slot(kind: NoveltyKind, viewport: Viewport, page: number) {
    const id = `${kind}|${viewport}|${page}`;
    let s = this.slots.get(id);
    if (!s) {
      let resolve!: (keys: Set<string>) => void;
      const done = new Promise<Set<string>>((r) => (resolve = r));
      s = { done, resolve };
      this.slots.set(id, s);
    }
    return s;
  }

  async before(kind: NoveltyKind, viewport: Viewport, page: number): Promise<Set<string>> {
    const sets = await Promise.all(Array.from({ length: page }, (_, j) => this.slot(kind, viewport, j).done));
    return new Set(sets.flatMap((x) => [...x]));
  }

  commit(kind: NoveltyKind, viewport: Viewport, page: number, keys: Iterable<string>): void {
    this.slot(kind, viewport, page).resolve(new Set(keys));
  }

  /** A page that ended early (a failed load, an error) answers with nothing, so later pages never wait on it. */
  settle(page: number, viewports: Viewport[]): void {
    for (const kind of ['css', 'states', 'opens', 'motion'] as const) for (const v of viewports) this.commit(kind, v, page, []);
  }
}

/** The novelty key with the subtree's size: one header is not another header with twice the content. */
function cssKey(s: Snapshot, e: SnapElement): string {
  let n = 0;
  const stack = [...e.kids];
  while (stack.length) {
    n++;
    stack.push(...s.elements[stack.pop()!]!.kids);
  }
  return `${noveltyKey(e)}|${n}`;
}

/** The text of a stylesheet the page cannot read, fetched once per run. */
type CssText = (href: string) => Promise<string | null>;

/** Clip screenshots below the cut covering the given elements with 128 px around them, merged while one clip can hold them. */
export function bandRegions(boxes: { y: number; h: number }[], reach: number): { y: number; height: number }[] {
  const pad = 128;
  const out: { y: number; height: number }[] = [];
  for (const b of [...boxes].filter((x) => x.y < reach).sort((a, c) => a.y - c.y)) {
    const start = Math.max(0, Math.floor(b.y - pad));
    const end = Math.min(reach, Math.ceil(b.y + b.h + pad));
    const last = out.at(-1);
    if (last && end <= last.y + last.height) continue;
    if (last && end - last.y <= BAND_MAX_HEIGHT) {
      last.height = end - last.y;
      continue;
    }
    out.push({ y: start, height: Math.min(end - start, SCREENSHOT_MAX_HEIGHT) });
  }
  return out.slice(0, BAND_MAX_COUNT);
}

async function bandsBelowCut(p: PwPage, els: { y: number; h: number }[], width: number, reach: number): Promise<ShotBand[]> {
  const bands: ShotBand[] = [];
  for (const r of bandRegions(els, reach)) {
    const png = await p.screenshot({ fullPage: true, clip: { x: 0, y: r.y, width, height: r.height }, type: 'png', animations: 'disabled', caret: 'hide' }).catch(() => null);
    if (png) bands.push({ ...r, png });
  }
  return bands;
}
const SHEET_MAX_BYTES = 2_000_000;

export const SCREENSHOT_MAX_HEIGHT = 8000;
/** Clips below the cut: each at most this tall, this many per page and viewport, reaching this far down. */
export const BAND_MAX_HEIGHT = 2000;
export const BAND_MAX_COUNT = 12;
export const BAND_REACH = 24_000;
export const TAB_WALK_MAX = 80;

export type MotionProbe = { animation: boolean; transition: boolean };

export type Markup = { html: string; vars: Record<string, string> };

export type OpenCapture = { trigger: string; revealed: string; snapshot: Snapshot; matched: Record<string, MatchedStyles>; markup?: Markup; crop?: Buffer; /** The revealed element alone, no margin, for the preview check. */ rootCrop?: Buffer; triggerDelta: StyleDelta[] };

export type ViewportCapture = {
  viewport: Viewport;
  snapshot: Snapshot;
  candidates: ElementCandidate[];
  selectors: Record<string, string>;
  matched: Record<string, MatchedStyles>;
  /** Markup and custom property values of each element candidate, for previews. */
  markup: Record<string, Markup>;
  states: Record<string, StateRecord[]>;
  stateCaptured: Set<string>;
  /** Chosen for states, but the page navigated away first (D-066). */
  stateUnreachable: Set<string>;
  tabOrder: string[];
  motionMain: Record<string, MotionProbe>;
  motionReduced: Record<string, MotionProbe>;
  sheets: SheetScan;
  /** The runtime motion records, read before the freeze (motion-capture.md). */
  motion: MotionRecords | null;
  /** Stable selectors for the elements motion records name. */
  motionSelectors: Record<string, string>;
  opens: OpenCapture[];
  /** `bands`: clips below the cut where novel candidates sit, kept in memory for crops (D-098). */
  screenshot: { key: string; width: number; height: number; cut: boolean; png: Buffer; bands?: ShotBand[] };
  submitAttempts: number;
  /** Forms that a submit handler marked as submitted; must stay 0. */
  submittedMarkers: number;
  dialogs: string[];
};

export type PageCapture = {
  page: SelectedPage;
  status: 'captured' | 'failed';
  failedReason?: string;
  finalUrl: string;
  looksLikeLogin: boolean;
  title: string;
  h1: string;
  nodeCount: number;
  viewports: Partial<Record<Viewport, ViewportCapture>>;
};

export type CaptureOutput = {
  pages: PageCapture[];
  frameworkHint?: FrameworkHint;
  loginWall?: { redirectedTo?: string; pageId: string };
};

export const freezeCss = `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; } html { scrollbar-width: none !important; } ::-webkit-scrollbar { display: none !important; }`;

// Never submit a form or let a dialog block the page (docs/specs/capture-and-states.md, Never).
export const pageGuards = () => {
  const w = window as unknown as { __dseSubmits: number; __name?: unknown };
  w.__dseSubmits = 0;
  w.__name = w.__name ?? ((f: unknown) => f);
  document.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      w.__dseSubmits++;
    },
    true,
  );
  HTMLFormElement.prototype.submit = function submit() {
    w.__dseSubmits++;
  };
  HTMLFormElement.prototype.requestSubmit = function requestSubmit() {
    w.__dseSubmits++;
  };
  // Never follow a link: a probe's click still reaches the page's handlers, but not the address bar (D-066).
  const stay = (e: Event) => {
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    const href = a?.getAttribute('href') ?? '';
    if (a && !href.startsWith('#') && !href.toLowerCase().startsWith('javascript:')) e.preventDefault();
  };
  document.addEventListener('click', stay, true);
  document.addEventListener('auxclick', stay, true);
  window.open = () => null;
};

async function scrollPass(page: PwPage) {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const max = Math.min(document.documentElement.scrollHeight, 20_000);
    for (let y = 0; y < max; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
}

function motionOf(st: { 'animation-name': string; 'transition-duration': string; 'transition-property': string }): MotionProbe {
  const animation = Boolean(st['animation-name']) && st['animation-name'] !== 'none';
  const transition = st['transition-property'] !== 'none' && st['transition-duration'].split(',').some((d) => parseFloat(d) > 0);
  return { animation, transition };
}

/**
 * One element per preliminary cluster first, then by area (capture-and-states.md, Caps). Clusters an
 * earlier page already measured are left out, and only a viewport's first page fills by area (D-066).
 */
export function chooseForStates(snapshot: Snapshot, cands: ElementCandidate[], measured: Set<string> = new Set(), fill = true): string[] {
  const interactive = cands.filter((c) => c.interactive).map((c) => snapshot.byDse.get(c.dse)!).filter(Boolean);
  const seen = new Set<string>();
  const first: string[] = [];
  const rest: { d: string; area: number }[] = [];
  for (const e of interactive) {
    const k = noveltyKey(e);
    if (!seen.has(k) && !measured.has(k)) {
      seen.add(k);
      first.push(e.d);
    } else if (fill) rest.push({ d: e.d, area: e.w * e.h });
  }
  rest.sort((a, b) => b.area - a.area);
  return [...first, ...rest.map((r) => r.d)].slice(0, STATE_CAP);
}

async function openStates(page: PwPage, snapshot: Snapshot, cands: ElementCandidate[], viewport: Viewport, cssText: CssText, seen: Set<string>, opened: Set<string>, out: OpenCapture[], stillHere: () => Promise<boolean>): Promise<void> {
  const triggers = cands
    .map((c) => snapshot.byDse.get(c.dse)!)
    .filter((e) => e && e.role !== 'tab' && ('aria-haspopup' in e.aria || 'aria-controls' in e.aria || e.aria['aria-expanded'] === 'false'))
    .filter((e) => !seen.has(noveltyKey(e)) && !opened.has(noveltyKey(e)))
    .filter((e) => !(e.tag === 'button' && e.type === 'submit') && !(e.tag === 'input' && e.type === 'submit'));
  // On phones the menu button in the header comes first, so the mobile menu is captured.
  if (viewport === 'mobile') {
    const inHeader = (d: string) => {
      for (let e = snapshot.byDse.get(d); e && e.p >= 0; e = snapshot.elements[e.p]) if (['header', 'nav'].includes(e.tag) || e.role === 'banner' || e.role === 'navigation') return true;
      return false;
    };
    triggers.sort((a, b) => Number(inHeader(b.d) && b.tag === 'button') - Number(inHeader(a.d) && a.tag === 'button'));
  }
  let n = 0;
  for (const t of triggers) {
    if (out.length >= OPEN_CAP || !(await stillHere())) break;
    await neutral(page);
    const before = await readStyles(page, t.d);
    const box = await page.evaluate((d) => {
      const el = document.querySelector(`[data-dse-id="${d}"]`) as HTMLElement | null;
      if (!el) return null;
      // A trigger visible from the top opens there, so a sticky header's popup lands at one place.
      window.scrollTo({ top: 0, behavior: 'instant' });
      const top = el.getBoundingClientRect();
      if (top.bottom > window.innerHeight || top.top < 0) el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, t.d);
    if (!box) continue;
    await page.mouse.click(box.x, box.y);
    await page.waitForTimeout(300);
    const revealedSel = await page.evaluate((d) => {
      const trig = document.querySelector(`[data-dse-id="${d}"]`);
      if (!trig) return null;
      const visible = (el: Element | null) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      };
      const controls = trig.getAttribute('aria-controls');
      let target: Element | null = controls ? document.getElementById(controls) : null;
      if (!visible(target)) target = [...document.querySelectorAll('[role=menu],[role=listbox],[role=dialog],[role=tooltip]')].find(visible) ?? null;
      if (!visible(target) || !target) return null;
      target.setAttribute('data-dse-open', '1');
      return '[data-dse-open="1"]';
    }, t.d);
    if (revealedSel) {
      n++;
      const raw = await page.evaluate(takeSnapshot, { props: [...styleProps], cap: 500, root: revealedSel, prefix: `o${viewport[0]}${n}-` });
      const sub = buildSnapshot(raw);
      const root = sub.elements[0];
      if (root) {
        const after = await readStyles(page, t.d);
        const crop = await cropOf(page, t.d, root.d);
        const rootCrop = await cropOf(page, root.d, undefined, 0);
        const matched = await matchedFromCssom(page, sub.elements.map((e) => e.d), cssText);
        const markup = (await page.evaluate(markupOf, { items: [{ d: root.d, vars: varsIn(matched) }], cap: MARKUP_CAP }))[root.d];
        out.push({ trigger: t.d, revealed: root.d, snapshot: sub, matched, markup, crop, rootCrop, triggerDelta: styleDelta(before, after) });
        opened.add(noveltyKey(t));
      }
      await page.evaluate(() => document.querySelector('[data-dse-open]')?.removeAttribute('data-dse-open'));
    }
    await page.keyboard.press('Escape');
    await page.mouse.click(1, 1);
    await page.waitForTimeout(150);
  }
}

async function captureViewport(ctx: RunContext, rc: RunBrowserContext, throttle: Throttle, page: SelectedPage, viewport: Viewport, ledger: NoveltyLedger, index: number, cssText: CssText): Promise<{ vc: ViewportCapture; finalUrl: string; looksLikeLogin: boolean; status: number; html: string } | { error: string; status: number; html: string }> {
  const p = await newPage(rc, viewport);
  const dialogs: string[] = [];
  p.on('dialog', (d) => {
    dialogs.push(`${d.type()}: ${d.message().slice(0, 80)}`);
    d.dismiss().catch(() => {});
  });
  await p.addInitScript(pageGuards);
  await p.addInitScript(motionInit);
  try {
    const load = await loadPage(p, page.url, throttle);
    if (!load.ok) return { error: load.error ?? 'navigation failed', status: load.status, html: '' };
    if (page.source !== 'synthetic' && load.status >= 400) return { error: `HTTP ${load.status}`, status: load.status, html: load.html };
    const consent = await p.evaluate(dismissConsent).catch(() => null);
    if (consent) {
      await p.waitForTimeout(300);
      await ctx.emit({ stage: 'capture', message: `${page.path} · consent dismissed · ${consent}` });
    }
    const facts = await p.evaluate(loginFacts);
    // The motion pass (step 2b): the sampler has run since document start and keeps running through the scroll pass.
    await p.evaluate(motionMarkScroll).catch(() => 0);
    await scrollPass(p);
    const sheetTexts: Record<number, string> = {};
    for (const u of await p.evaluate(unreadableSheets)) {
      const t = await cssText(u.href);
      if (t) sheetTexts[u.index] = t;
    }
    const sheets = await p.evaluate(scanSheets, sheetTexts);

    // Header styles at scroll 0 and 400 must be read before the freeze.
    const pre = buildSnapshot(await p.evaluate(takeSnapshot, { props: [...styleProps], cap: SNAPSHOT_CAP }));
    const headerIds = pre.elements.filter((e) => e.vis && (e.tag === 'header' || e.role === 'banner' || (e.tag === 'nav' && e.y < 10)) && e.y < 10).map((e) => e.d);
    const scrolled = new Map<string, StateRecord>();
    for (const d of headerIds.slice(0, 2)) {
      // Transitions are live before the freeze, so the scrolled values are read once the header's own transition ends.
      const st = pre.byDse.get(d)!.style;
      const longest = Math.max(0, ...splitList(st['transition-duration']).map((v, i) => (parseFloat(v) + (parseFloat(splitList(st['transition-delay'])[i] ?? '0') || 0)) * 1000));
      const r = await scrolledState(p, d, Math.min(STATE_WAIT_CAP, Math.max(150, longest + 50)));
      if (r) scrolled.set(d, { ...r, delta: withTransitions(r.delta, st) });
    }
    // Read the motion records out first; the freeze ends every running animation.
    const motion = await p.evaluate(motionReadout).catch(() => null);
    // Marked so the matched CSS never takes capture's own rules for the site's.
    await (await p.addStyleTag({ content: freezeCss })).evaluate((el) => (el as Element).setAttribute('data-dse-capture', ''));
    await p.evaluate(endScriptAnimations).catch(() => 0);
    await p.waitForTimeout(50);

    const vp = viewportSize[viewport];
    const docH = await p.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    const cut = docH > SCREENSHOT_MAX_HEIGHT;
    const height = Math.min(docH, SCREENSHOT_MAX_HEIGHT);
    const png = await p.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: vp.width, height }, type: 'png', animations: 'disabled', caret: 'hide' });
    const shotKey = keys.pageScreenshot(ctx.runId, page.id, viewport);
    await ctx.files.put(shotKey, png, { contentType: 'image/png' });
    const snapshot = buildSnapshot(await p.evaluate(takeSnapshot, { props: [...styleProps], cap: SNAPSHOT_CAP }));
    const candidates = capCandidates(findCandidates(snapshot, viewport), CANDIDATE_CAP);
    const selectors = await p.evaluate(buildSelectors, candidates.map((c) => c.dse));
    const motionIds = [...new Set((motion?.elements ?? []).map((e) => e.d).filter((d): d is string => d !== null && !(d in selectors)))];
    const motionSelectors = { ...Object.fromEntries((motion?.elements ?? []).flatMap((e) => (e.d && selectors[e.d] ? [[e.d, selectors[e.d]!]] : []))), ...(motionIds.length ? await p.evaluate(buildSelectors, motionIds) : {}) };
    if (motion) {
      await ctx.emit({ stage: 'capture', message: `${page.path} · ${viewportSize[viewport].width} · motion ${motion.anims.length} animations · ${motion.samples.length} style samples` });
      if (motion.truncated) await ctx.emit({ stage: 'capture', level: 'warn', message: `${page.path} · motion records cut at ${motion.anims.length >= 400 ? '400' : '2,000'}` });
    }

    // Matched CSS for every candidate and its descendants.
    const need = new Set<string>();
    const cssSeen = await ledger.before('css', viewport, index);
    const cssRead = new Set<string>();
    const readHere: SnapElement[] = [];
    for (const c of candidates) {
      const e = snapshot.byDse.get(c.dse);
      if (!e) continue;
      const k = cssKey(snapshot, e);
      if (cssSeen.has(k) || cssRead.has(k)) continue;
      cssRead.add(k);
      readHere.push(e);
      need.add(e.d);
      const stack = [...e.kids];
      while (stack.length) {
        const k = snapshot.elements[stack.pop()!]!;
        need.add(k.d);
        stack.push(...k.kids);
      }
    }
    ledger.commit('css', viewport, index, cssRead);
    // Below the cut, the candidates this page reads are clipped in bands, so their crops and the
    // previews' reference exist (D-098).
    const bands = cut ? await bandsBelowCut(p, readHere.filter((e) => e.y + e.h > height), vp.width, Math.min(docH, BAND_REACH)) : [];
    if (cut) await ctx.emit({ stage: 'capture', message: `${page.path} · cut at ${SCREENSHOT_MAX_HEIGHT} px${bands.length ? ` · ${bands.length} ${bands.length === 1 ? 'clip' : 'clips'} below it for crops` : ''}` });
    const matched = await matchedFromCssom(p, [...need], cssText);
    const subtree = (d: string): string[] => {
      const e = snapshot.byDse.get(d);
      if (!e) return [];
      const ids = [d];
      const stack = [...e.kids];
      while (stack.length) {
        const k = snapshot.elements[stack.pop()!]!;
        ids.push(k.d);
        stack.push(...k.kids);
      }
      return ids;
    };
    const markup = await p.evaluate(markupOf, {
      items: candidates.map((c) => ({ d: c.dse, vars: varsIn(Object.fromEntries(subtree(c.dse).map((d) => [d, matched[d]!]).filter(([, m]) => m))) })),
      cap: MARKUP_CAP,
    });
    // States. A page that navigates away mid-probe keeps what was measured; the rest is not reachable (D-066).
    // Past the states share of the run's time, a page keeps its default capture only (D-066).
    const lite = overBudget(ctx, 'states');
    const chosen = lite ? [] : chooseForStates(snapshot, candidates, await ledger.before('states', viewport, index), index === 0);
    ledger.commit('states', viewport, index, chosen.map((d) => noveltyKey(snapshot.byDse.get(d)!)));
    const chosenSet = new Set(chosen);
    const unreachable = new Set<string>();
    const states: Record<string, StateRecord[]> = {};
    const add = (d: string, r: StateRecord | null) => {
      if (r) (states[d] ??= []).push(r.state === 'scrolled' ? r : { ...r, delta: withTransitions(r.delta, pre.byDse.get(d)?.style, r.animations) });
    };
    const marker = await p.evaluate(() => ((window as unknown as { __dseDoc: number }).__dseDoc = Math.random()));
    let left = false;
    const stillHere = async () => {
      if (left) return false;
      left = !(await p.evaluate((m) => (window as unknown as { __dseDoc?: number }).__dseDoc === m, marker).catch(() => false));
      return !left;
    };
    /** Runs one probe; a navigation shows as a thrown error or a new document, and ends the probing. */
    const probe = async <T>(fn: () => Promise<T>): Promise<T | null> => {
      if (left) return null;
      try {
        const r = await fn();
        return (await stillHere()) ? r : null;
      } catch (e) {
        if (!(await stillHere())) return null;
        throw e;
      }
    };
    const base = new Map<string, string[] | null>();
    for (const d of chosen) base.set(d, await readStyles(p, d));
    const walk = (lite ? null : await probe(() => tabWalk(p, chosenSet))) ?? { order: [], focus: new Map() };
    for (const [d, f] of walk.focus) add(d, { state: 'focus', crop: f.crop, delta: styleDelta(base.get(d) ?? null, f.styles), reachedByKeyboard: true });
    let hovers = 0;
    let focusFallback = 0;
    let actives = 0;
    for (const d of chosen) {
      if (await ctx.cancelled()) throw new CancelledError();
      const b = base.get(d) ?? null;
      const done = await probe(async () => {
        const h = await hoverState(p, d, b);
        if (h) hovers++;
        add(d, h);
        if (!walk.focus.has(d)) {
          await neutral(p);
          await p.evaluate((x) => (document.querySelector(`[data-dse-id="${x}"]`) as HTMLElement | null)?.focus({ preventScroll: false }), d);
          const animations = await settle(p, d);
          const styles = await readStyles(p, d);
          const crop = await cropOf(p, d);
          add(d, { state: 'focus', crop, delta: styleDelta(b, styles), reachedByKeyboard: false, ...(animations.length ? { animations } : {}) });
          focusFallback++;
        }
        const a = await activeState(p, d, b);
        if (a) actives++;
        add(d, a);
        return true;
      });
      if (!done) {
        unreachable.add(d);
        delete states[d];
      }
    }
    for (const [d, r] of scrolled) add(d, r);
    const opens: OpenCapture[] = [];
    const opened = new Set<string>();
    try {
      if (!lite) await probe(async () => openStates(p, snapshot, candidates, viewport, cssText, await ledger.before('opens', viewport, index), opened, opens, stillHere));
    } finally {
      ledger.commit('opens', viewport, index, opened);
    }
    if (left) await ctx.emit({ stage: 'capture', level: 'warn', message: `${page.path} · ${vp.width} · the page navigated during state capture · ${unreachable.size} elements not reachable` });
    const submitAttempts = await p.evaluate(() => (window as unknown as { __dseSubmits: number }).__dseSubmits ?? 0);
    const submittedMarkers = await p.evaluate(() => document.querySelectorAll('[data-submitted]').length);
    await ctx.emit({
      stage: 'capture',
      message: `${page.path} · ${vp.width} · hover ${hovers} · focus ${walk.focus.size + focusFallback} · tab ${walk.order.length} · active ${actives} · open ${opens.length}`,
      data: { candidates: candidates.length, dialogs: dialogs.length, submitAttempts },
    });
    if (dialogs.length) await ctx.emit({ stage: 'capture', level: 'warn', message: `${page.path} · ${dialogs.length} dialog${dialogs.length > 1 ? 's' : ''} dismissed` });

    // Motion is read from the snapshot taken before the freeze, which removes all of it.
    // A component moves when it, or anything inside it, animates; transitions count on itself.
    const motionMain: Record<string, MotionProbe> = {};
    for (const c of candidates) {
      const e = pre.byDse.get(c.dse) ?? snapshot.byDse.get(c.dse);
      if (!e) continue;
      const own = motionOf(e.style);
      const inner = descendants(pre.byDse.has(e.d) ? pre : snapshot, e).some((d) => motionOf(d.style).animation);
      motionMain[c.dse] = { animation: own.animation || inner, transition: own.transition };
    }
    for (const e of pre.elements) {
      const s = snapshot.byDse.get(e.d);
      if (s) for (const prop of motionProps) s.style[prop] = e.style[prop];
    }

    await ctx.files.put(keys.pageSnapshot(ctx.runId, page.id, viewport), gzipSync(JSON.stringify(compactSnapshot(snapshot))), { contentType: 'application/gzip' });
    await ctx.files.put(keys.pageCss(ctx.runId, page.id, viewport), gzipSync(JSON.stringify(matched)), { contentType: 'application/gzip' });

    return {
      vc: {
        viewport,
        snapshot,
        candidates,
        selectors,
        matched,
        markup,
        states,
        stateCaptured: new Set(chosen.filter((d) => !unreachable.has(d))),
        stateUnreachable: unreachable,
        tabOrder: walk.order,
        motionMain,
        motionReduced: {},
        sheets: { ...sheets, hasReducedMotionRule: sheets.hasReducedMotionRule },
        motion,
        motionSelectors,
        opens,
        screenshot: { key: shotKey, width: vp.width, height, cut, png, ...(bands.length ? { bands } : {}) },
        submitAttempts,
        submittedMarkers,
        dialogs,
      },
      finalUrl: p.url(),
      looksLikeLogin: looksLikeLoginPage(facts),
      status: load.status,
      html: load.html,
    };
  } finally {
    await p.close().catch(() => {});
  }
}

/** The reduced-motion probe: the same page under prefers-reduced-motion, measuring what still moves. */
async function probeReducedMotion(rc: RunBrowserContext, throttle: Throttle, page: SelectedPage, vc: ViewportCapture, ledger: NoveltyLedger, index: number): Promise<void> {
  const key = (d: string) => noveltyKey(vc.snapshot.byDse.get(d)!);
  const probed = await ledger.before('motion', vc.viewport, index);
  const moving: [string, MotionProbe][] = [];
  const keys = new Set<string>();
  for (const [d, m] of Object.entries(vc.motionMain)) {
    if (!(m.animation || m.transition) || !vc.snapshot.byDse.has(d) || probed.has(key(d))) continue;
    moving.push([d, m]);
    keys.add(key(d));
  }
  ledger.commit('motion', vc.viewport, index, keys);
  if (!moving.length) return;
  const p = await newPage(rc, vc.viewport);
  await p.addInitScript(pageGuards);
  p.on('dialog', (d) => d.dismiss().catch(() => {}));
  try {
    await p.emulateMedia({ reducedMotion: 'reduce' });
    const load = await loadPage(p, page.url, throttle);
    if (!load.ok) return;
    await p.evaluate(dismissConsent).catch(() => null);
    await scrollPass(p);
    for (const [d] of moving) {
      const sel = vc.selectors[d];
      if (!sel) continue;
      const interactive = vc.candidates.find((c) => c.dse === d)?.interactive ?? false;
      const r = await p.evaluate(
        ({ sel }) => {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (!el) return null;
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const b = el.getBoundingClientRect();
          return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        },
        { sel },
      );
      if (!r) continue;
      if (interactive) await p.mouse.move(r.x, r.y);
      const st = await p.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const inner = [...el.querySelectorAll('*')].some((c) => getComputedStyle(c).animationName !== 'none');
        return { 'animation-name': inner ? 'inner' : cs.animationName, 'transition-duration': cs.transitionDuration, 'transition-property': cs.transitionProperty };
      }, sel);
      if (interactive) await p.mouse.move(0, 0);
      if (st) vc.motionReduced[d] = motionOf(st);
    }
  } finally {
    await p.close().catch(() => {});
  }
}

export type CaptureDeps = { browser: RunBrowserContext; throttle: Throttle; pages: SelectedPage[]; frameworkHint?: FrameworkHint };

export async function capture(ctx: RunContext, deps: CaptureDeps): Promise<CaptureOutput> {
  const { pages } = deps;
  const results: PageCapture[] = pages.map((page) => ({ page, status: 'captured', finalUrl: page.url, looksLikeLogin: false, title: page.title, h1: page.h1, nodeCount: 0, viewports: {} }));
  const docPages: DocPage[] = pages.map((p) => ({ id: p.id, url: p.url, path: p.path, reason: p.reason, templateGroup: p.templateGroup, templateSize: p.templateSize, title: p.title, h1: p.h1, nodeCount: 0, status: 'pending', captures: {} }));
  let consecutiveFailures = 0;
  let challenged = 0;
  let done = 0;
  let budgetNoted = false;
  const sheets = new Map<string, Promise<string | null>>();
  const cssText: CssText = (href) => {
    let t = sheets.get(href);
    if (!t) {
      t = guardedFetch(href, { userAgent: ctx.config.userAgent, allow: ctx.config.allowPrivateHosts, retryDelays: [], timeoutMs: 8000, maxBytes: SHEET_MAX_BYTES }).then(
        (r) => (r.ok ? r.body.toString('utf8') : null),
        () => null,
      );
      sheets.set(href, t);
    }
    return t;
  };
  const ledger = new NoveltyLedger();

  const one = async (i: number) => {
    const page = pages[i]!;
    const r = results[i]!;
    for (const viewport of ctx.config.viewports) {
      if (await ctx.cancelled()) throw new CancelledError();
      const res = await captureViewport(ctx, deps.browser, deps.throttle, page, viewport, ledger, i, cssText);
      if ('error' in res) {
        r.status = 'failed';
        r.failedReason = res.error;
        if (isBotChallenge(res.status, res.html).blocked) challenged++;
        break;
      }
      r.viewports[viewport] = res.vc;
      r.finalUrl = res.finalUrl;
      r.looksLikeLogin = r.looksLikeLogin || res.looksLikeLogin;
      r.nodeCount = Math.max(r.nodeCount, res.vc.snapshot.nodeCount);
      r.title = res.vc.snapshot.title || r.title;
      r.h1 = res.vc.snapshot.h1 || r.h1;
      if (!overBudget(ctx, 'states')) await probeReducedMotion(deps.browser, deps.throttle, page, res.vc, ledger, i);
      else {
        ledger.commit('motion', viewport, i, []);
        if (!budgetNoted) {
          budgetNoted = true;
          await ctx.emit({ stage: 'capture', level: 'warn', message: 'time budget for states reached · later pages captured without states' });
        }
      }
    }
    done++;
    if (r.status === 'failed') {
      consecutiveFailures++;
      docPages[i] = { ...docPages[i]!, status: 'failed', failedReason: r.failedReason };
      await ctx.emit({ stage: 'capture', level: 'warn', message: `${page.path} · failed · ${r.failedReason}` });
      if (consecutiveFailures >= 2) {
        const origin = new URL(page.url).origin;
        const head = await guardedFetch(origin, { userAgent: ctx.config.userAgent, allow: ctx.config.allowPrivateHosts, retryDelays: [] });
        if (!head.ok) throw new BlockedError('unreachable', { reason: 'the site stopped answering' });
      }
    } else {
      consecutiveFailures = 0;
      const d = r.viewports.desktop;
      const m = r.viewports.mobile;
      docPages[i] = {
        ...docPages[i]!,
        title: r.title,
        h1: r.h1,
        nodeCount: r.nodeCount,
        status: 'captured',
        captures: {
          desktop: d ? { screenshotKey: d.screenshot.key, width: d.screenshot.width, height: d.screenshot.height } : undefined,
          mobile: m ? { screenshotKey: m.screenshot.key, width: m.screenshot.width, height: m.screenshot.height } : undefined,
        },
      };
      const shots = Object.keys(r.viewports).length;
      await ctx.emit({
        stage: 'capture',
        message: `${page.path} · ${ctx.config.viewports.map((v) => viewportSize[v].width).join(' and ')} · ${shots} screenshot${shots > 1 ? 's' : ''} · ${r.nodeCount.toLocaleString('en-US')} nodes`,
        data: { captured: done, total: pages.length },
        patch: { pages: docPages.map((x) => ({ ...x })) },
      });
    }
  };

  // Two pages in flight at most (docs/specs/crawler.md, Politeness).
  let next = 0;
  // A failure stops both workers taking pages, and the run fails only once the other page has finished,
  // so no capture line lands after the run's last event.
  let failure: { error: unknown } | null = null;
  const worker = async () => {
    while (!failure && next < pages.length) {
      const i = next++;
      try {
        await one(i);
      } catch (error) {
        failure ??= { error };
      } finally {
        ledger.settle(i, ctx.config.viewports);
      }
    }
  };
  await Promise.all([worker(), worker()]);
  if (failure) throw (failure as { error: unknown }).error;

  const failed = results.filter((r) => r.status === 'failed');
  if (challenged > pages.length / 2) throw new BlockedError('bot', { attempts: failed.map((f) => ({ url: f.page.url, status: 0, retries: 0 })) });
  if (!results.some((r) => r.status === 'captured')) throw new BlockedError('unreachable', { reason: 'no page could be captured' });
  await ctx.emit({ stage: 'capture', message: `${results.length - failed.length} of ${results.length} pages captured`, patch: { pages: docPages } });

  const captured = results.filter((r) => r.status === 'captured');
  if (isLoginWalled(captured.map((r) => ({ finalUrl: r.finalUrl, looksLikeLogin: r.looksLikeLogin })))) {
    const first = captured.find((r) => loginPathPattern.test(new URL(r.finalUrl).pathname) || r.looksLikeLogin) ?? captured[0]!;
    return { pages: [first], frameworkHint: deps.frameworkHint, loginWall: { redirectedTo: first.finalUrl, pageId: first.page.id } };
  }
  return { pages: results, frameworkHint: deps.frameworkHint };
}
