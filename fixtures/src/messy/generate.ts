// The messy fixture (docs/evals.md, fixture 2) and messy-after (fixture 6): the clean site rebuilt
// badly, then half fixed. Every planted item is listed in the comments beside it.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { PNG } from 'pngjs';
import { attrsFor, avatarSvg, documentFor, icons, notFoundPage, origin, pages as cleanPages, type Impl, type Page } from '../clean-family/site';

const here = import.meta.dirname;
const sitesDir = resolve(here, '../../sites');
const cleanCss = readFileSync(resolve(here, '../clean-family/clean.css'), 'utf8');

function write(file: string, content: string | Buffer) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

// 14 grays, OKLab lightness steps of 3 to 10 ΔE: several pairs sit within ΔE 6 of each other.
export const grays = ['#FFFFFF', '#F5F5F5', '#EBEBEB', '#E1E1E1', '#D1D1D1', '#C4C4C4', '#B1B1B1', '#9E9E9E', '#868686', '#737373', '#676767', '#505050', '#353535', '#1F1F1F'];
// messy-after keeps nine: these five fold into a neighbor.
const afterGrayMap: Record<string, string> = { '#F5F5F5': '#FFFFFF', '#EBEBEB': '#E1E1E1', '#C4C4C4': '#D1D1D1', '#9E9E9E': '#B1B1B1', '#676767': '#737373' };
// Three blues within ΔE 3 of a neighbor.
export const blues = ['#2458E6', '#1C4EDB', '#2E63ED'];

/** Longhands a reset dump would list; none of them changes how the share button looks. */
const resetProps = [
  'accent-color', 'animation-composition', 'animation-delay', 'animation-direction', 'animation-duration', 'animation-fill-mode', 'animation-iteration-count', 'animation-name', 'animation-play-state', 'animation-timing-function',
  'aspect-ratio', 'backdrop-filter', 'backface-visibility', 'background-attachment', 'background-blend-mode', 'background-clip', 'background-origin', 'background-position-x', 'background-position-y', 'background-repeat', 'background-size',
  'border-image-outset', 'border-image-repeat', 'border-image-slice', 'border-image-source', 'border-image-width', 'box-decoration-break', 'break-after', 'break-before', 'break-inside', 'caption-side', 'clear', 'clip-path',
  'column-count', 'column-fill', 'column-rule-color', 'column-rule-style', 'column-rule-width', 'column-span', 'column-width', 'contain', 'contain-intrinsic-block-size', 'contain-intrinsic-height', 'contain-intrinsic-inline-size', 'contain-intrinsic-width',
  'container-name', 'container-type', 'content-visibility', 'counter-increment', 'counter-reset', 'counter-set', 'empty-cells', 'filter', 'flex-basis', 'flex-grow', 'flex-shrink', 'float',
  'font-feature-settings', 'font-kerning', 'font-optical-sizing', 'font-palette', 'font-stretch', 'font-synthesis-small-caps', 'font-synthesis-style', 'font-synthesis-weight', 'font-variant-alternates', 'font-variant-caps', 'font-variant-east-asian', 'font-variant-ligatures', 'font-variant-numeric', 'font-variant-position', 'font-variation-settings',
  'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows', 'grid-column-end', 'grid-column-start', 'grid-row-end', 'grid-row-start', 'grid-template-areas', 'grid-template-columns', 'grid-template-rows',
  'hyphenate-character', 'hyphens', 'image-orientation', 'image-rendering', 'inset-block-end', 'inset-block-start', 'inset-inline-end', 'inset-inline-start', 'isolation', 'line-break', 'list-style-image', 'list-style-position', 'list-style-type',
  'mask-clip', 'mask-composite', 'mask-image', 'mask-mode', 'mask-origin', 'mask-position', 'mask-repeat', 'mask-size', 'mask-type', 'math-depth', 'math-shift', 'math-style', 'mix-blend-mode', 'object-fit', 'object-position',
  'offset-anchor', 'offset-distance', 'offset-path', 'offset-position', 'offset-rotate', 'orphans', 'overflow-anchor', 'overflow-clip-margin', 'overflow-wrap', 'overscroll-behavior-block', 'overscroll-behavior-inline', 'overscroll-behavior-x', 'overscroll-behavior-y',
  'page', 'perspective', 'perspective-origin', 'print-color-adjust', 'quotes', 'resize', 'rotate', 'ruby-position', 'scale', 'scroll-behavior',
  'scroll-margin-block-end', 'scroll-margin-block-start', 'scroll-margin-bottom', 'scroll-margin-inline-end', 'scroll-margin-inline-start', 'scroll-margin-left', 'scroll-margin-right', 'scroll-margin-top',
  'scroll-padding-block-end', 'scroll-padding-block-start', 'scroll-padding-bottom', 'scroll-padding-inline-end', 'scroll-padding-inline-start', 'scroll-padding-left', 'scroll-padding-right', 'scroll-padding-top',
  'scroll-snap-align', 'scroll-snap-stop', 'scroll-snap-type', 'scrollbar-gutter', 'shape-image-threshold', 'shape-margin', 'shape-outside', 'tab-size', 'table-layout', 'text-align-last', 'text-combine-upright', 'text-decoration-skip-ink',
  'text-emphasis-color', 'text-emphasis-position', 'text-emphasis-style', 'text-indent', 'text-orientation', 'text-overflow', 'text-rendering', 'text-shadow', 'text-underline-offset', 'text-underline-position',
  'touch-action', 'transform-box', 'transform-origin', 'transform-style', 'transition-behavior', 'transition-delay', 'transition-duration', 'transition-property', 'transition-timing-function', 'translate',
  'unicode-bidi', 'user-select', 'vertical-align', 'view-transition-name', 'white-space-collapse', 'widows', 'will-change', 'word-break', 'word-spacing', 'z-index',
];

/** At least 7,000 characters of `unset` (docs/evals.md, messy); padded with reset variables a dump also carries. */
export function unsetReset(): string {
  const decls = resetProps.map((p) => `${p}: unset;`);
  for (let i = 1; decls.join(' ').length < 7000; i++) decls.push(`--reset-slot-${i}: unset;`);
  return decls.join(' ');
}

/** The bad edits, in the order a drifting codebase would make them. */
function messyCss(after: boolean): string {
  // The clean family's v1.1 layer is its own; messy carries its own motion below.
  let css = cleanCss.replace(/\n\/\* v1\.1 · [\s\S]*?\/\* end v1\.1 \*\/\n?/, '\n');
  if (css.includes('v1.1 ·')) throw new Error('the clean v1.1 block was not removed');
  const swap = (from: string, to: string) => {
    if (!css.includes(from)) throw new Error(`messy edit did not apply: ${from}`);
    css = css.replace(from, to);
  };
  swap("body { font-family: 'Inter', system-ui, sans-serif; font-size: 16px; line-height: 26px; font-weight: 400; color: #0B1F3A;", "body { font-family: 'Inter', system-ui, sans-serif; font-size: 16px; line-height: 26px; font-weight: 400; color: #1F1F1F;");
  swap('a { color: #2458E6; text-decoration: none; }', 'a { color: #1C4EDB; text-decoration: none; }');
  swap('.site-header { position: sticky; top: 0; z-index: 10; background: #FFFFFF; border-bottom: 1px solid #E2E8F0;', '.site-header { position: sticky; top: 0; z-index: 10; background: #FFFFFF; border-bottom: 1px solid #868686;');
  swap('.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: #0B1F3A; }', '.logo { font-size: 20px; line-height: 28px; font-weight: 600; color: #353535; }');
  swap('.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; }', '.nav-link { font-size: 14px; line-height: 20px; font-weight: 600; color: #505050; }');
  swap('.dropdown-menu { position: absolute; top: 48px; left: 0; z-index: 20; min-width: 224px; padding: 8px; background: #FFFFFF; border: 1px solid #E2E8F0;', '.dropdown-menu { position: absolute; top: 48px; left: 0; z-index: 20; min-width: 224px; padding: 8px; background: #FFFFFF; border: 1px solid #C4C4C4;');
  swap('.mobile-menu { border-top: 1px solid #E2E8F0;', '.mobile-menu { border-top: 1px solid #868686;');
  swap('.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid #E2E8F0;', '.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid #B1B1B1;');
  // Off-grid spacing: 18 px card padding; 10 px badge padding and header and check-row gaps.
  swap('.card { display: flex; flex-direction: column; gap: 12px; padding: 24px; background: #FFFFFF; border: 1px solid #E2E8F0;', '.card { display: flex; flex-direction: column; gap: 12px; padding: 18px; background: #FFFFFF; border: 1px solid #E1E1E1;');
  swap('.badge { display: inline-flex; align-items: center; height: 24px; padding: 0 8px;', '.badge { display: inline-flex; align-items: center; height: 24px; padding: 0 10px;');
  swap('.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0 8px;', '.tag-new { display: inline-flex; align-items: center; align-self: flex-start; height: 24px; padding: 0 10px;');
  swap('.check-row { display: flex; align-items: center; gap: 8px;', '.check-row { display: flex; align-items: center; gap: 10px;');
  swap('.header-actions { display: flex; align-items: center; gap: 12px; }', '.header-actions { display: flex; align-items: center; gap: 10px; }');
  // Planted contrast failure on a badge: white on amber, 2.15:1. messy-after fixes it.
  if (!after) swap('.badge-warning { background: #B45309; }', '.badge-warning { background: #F59E0B; }');
  swap('.label { font-size: 14px; line-height: 20px; font-weight: 600; color: #0B1F3A; }', '.label { font-size: 14px; line-height: 20px; font-weight: 600; color: #505050; }');
  swap('.input, .select, .textarea { width: 100%; height: 44px; padding: 8px 12px; border: 1px solid #E2E8F0;', '.input, .select, .textarea { width: 100%; height: 44px; padding: 8px 12px; border: 1px solid #D1D1D1;');
  swap('.th { padding: 12px 16px; border-bottom: 1px solid #E2E8F0;', '.th { padding: 12px 16px; background: #F5F5F5; border-bottom: 1px solid #EBEBEB;');
  swap('.td { padding: 12px 16px; border-bottom: 1px solid #E2E8F0; }', '.td { padding: 12px 16px; border-bottom: 1px solid #EBEBEB; }');
  swap('.crumb { color: #2458E6; }', '.crumb { color: #2E63ED; }');
  swap('.tabs { display: flex; gap: 4px; border-bottom: 1px solid #E2E8F0; }', '.tabs { display: flex; gap: 4px; border-bottom: 1px solid #9E9E9E; }');
  swap('.btn-secondary { background: #FFFFFF; color: #2458E6; border-color: #2458E6; }', '.btn-secondary { background: #FFFFFF; color: #1C4EDB; border-color: #1C4EDB; }');
  swap('.site-footer { border-top: 1px solid #E2E8F0; padding: 48px 0; }', '.site-footer { border-top: 1px solid #E1E1E1; padding: 48px 0; }');
  swap('.footer-link { font-size: 14px; line-height: 22px; color: #0B1F3A; }', '.footer-link { font-size: 14px; line-height: 22px; color: #676767; }');
  swap('.caption { font-size: 12px; line-height: 16px; }', '.caption { font-size: 12px; line-height: 16px; color: #737373; }');
  swap('.text-sm { font-size: 14px; line-height: 22px; }', '.text-sm { font-size: 14px; line-height: 22px; color: #505050; }');
  swap('.avatar { width: 40px; height: 40px; border-radius: 50%; background: #E2E8F0; }', '.avatar { width: 40px; height: 40px; border-radius: 50%; background: #EBEBEB; }');
  // Only the buttons get a reduced-motion rule; the live dot below does not.
  swap('@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { transition: none !important; animation: none !important; }\n}', '@media (prefers-reduced-motion: reduce) {\n  .btn { transition: none; }\n}');
  css = css.replaceAll('#E2E8F0', '#EBEBEB');

  css += `
/* Added later, by other hands. */
h3 { color: #353535; }
.card .text-sm { font-size: 15px; }
${after ? '' : '.hero .btn-primary, .pricing-card .btn-primary { padding: 0 21px; border-radius: 10px; }\n'}.link-pill { display: inline-flex; align-items: center; height: 44px; padding: 0 16px; border: 1px solid #D1D1D1; border-radius: 999px; color: #1F1F1F; font-size: 14px; line-height: 20px; font-weight: 600; }
.link-pill:focus, .link-pill:focus-visible { outline: none; }
/* A reset a component library pasted in: every property unset, ahead of the button's own rule (v1.1). */
.share-button { ${unsetReset()} }
.share-button { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 0; border-radius: 6px; background: transparent; color: #1F1F1F; cursor: pointer; }
.share-button:focus-visible { outline: 2px solid #2458E6; outline-offset: 2px; }
.badge-live { background: #15803D; }
.live-dot { display: inline-block; width: 8px; height: 8px; margin-right: 8px; border-radius: 999px; background: #FFFFFF; animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.newsletter { display: flex; gap: 8px; align-items: center; }
.newsletter-input { width: 240px; }
.newsletter-input::placeholder { color: #737373; }
.promo { display: flex; flex-direction: column; gap: 12px; padding: 32px; border-radius: 12px; background-image: url('/sites/${after ? 'messy-after' : 'messy'}/assets/promo.png'); background-size: cover; color: #FFFFFF; }
.cookie-banner { position: fixed; left: 24px; right: 24px; bottom: 24px; z-index: 50; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 24px; border-radius: 12px; background: #353535; color: #FFFFFF; }
.timeline { display: flex; flex-direction: column; gap: 24px; }
.release { display: flex; flex-direction: column; gap: 8px; padding-left: 16px; border-left: 2px solid #E1E1E1; }
.post-list { display: flex; flex-direction: column; gap: 16px; }
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 40; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; background: #1F1F1F; color: #FFFFFF; font-size: 14px; line-height: 22px; }
.stepper { display: flex; gap: 8px; }
.step { display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border: 1px solid #D1D1D1; border-radius: 999px; font-size: 14px; line-height: 22px; }
.step[aria-current='step'] { background: #1C4EDB; border-color: #1C4EDB; color: #FFFFFF; }${after ? `
.dark-band { display: flex; flex-wrap: wrap; align-items: center; gap: 24px; padding: 48px; border-radius: 16px; background: #0B0D10; }
.band-button { display: inline-flex; align-items: center; height: 44px; padding: 0 24px; border-radius: 999px; background: #FFFFFF; color: #1F1F1F; font-size: 16px; line-height: 24px; font-weight: 600; text-decoration: none; }
.band-card { display: flex; flex-direction: column; gap: 8px; max-width: 320px; padding: 24px; border-radius: 16px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #FFFFFF; }
.band-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; color: #FFFFFF; }
.band-card p { margin: 0; font-size: 16px; line-height: 26px; color: #FFFFFF; }` : ''}
@media (max-width: 640px) { .newsletter { flex-wrap: wrap; } .newsletter-input { width: 100%; } .cookie-banner { flex-wrap: wrap; } }
/* v1.1 · motion added by other hands: nine durations and seven easings in all (motion sprawl). */
.nav-link { transition: color 100ms ease; }
.footer-link { transition: color 120ms ease-out; }
.logo { transition: color 150ms linear; }
.crumb { transition: color 200ms cubic-bezier(0.25, 0.5, 0.45, 0.95); }
.tab { transition: color 250ms cubic-bezier(0.4, 0, 0.2, 1); }
.link-pill { transition: border-color 300ms ease; }
.card { transition: box-shadow 400ms ease-out; }
@media (prefers-reduced-motion: reduce) { .nav-link, .footer-link, .logo, .crumb, .tab, .link-pill, .card { transition: none; } }
/* Three translucent grays: overlays, never palette steps. */
.release { background: rgba(0, 0, 0, 0.04); border-left-color: rgba(51, 51, 51, 0.2); }
.link-pill { border-color: rgba(80, 80, 80, 0.3); }
`;
  if (after) for (const [from, to] of Object.entries(afterGrayMap)) css = css.replaceAll(from, to);
  return css;
}

function extras(after: boolean): Impl['extra'] {
  const x = { name: 'messy', c: (...n: string[]) => n.join(' '), s: () => '', head: '' } as Impl;
  const a = (name: string, ...more: string[]) => attrsFor(x, name, ...more);
  return (point, base) => {
    switch (point) {
      case 'head':
        // A third-party analytics script the crawler blocks.
        return '<script async src="https://www.googletagmanager.com/gtag/js?id=G-FIXTURE"></script>';
      case 'body-end':
        // A consent banner on load; the crawler dismisses it.
        return `<div id="cookie-consent" ${a('cookie-banner')} role="dialog" aria-label="Cookie consent"><p ${a('text-sm')} style="color: #FFFFFF">We use cookies to remember your settings.</p><button type="button" ${a('btn', 'btn-primary', 'btn-sm')} onclick="this.closest('#cookie-consent').remove()">Accept</button></div>${
          after ? `<div ${a('toast')} role="status">${icons.check.replace('<svg ', '<svg width="20" height="20" ')}<span>Draft saved</span></div>` : ''
        }`;
      case 'hero':
        // A link whose focus style is removed: outline none, nothing else.
        return `<a ${a('link-pill')} href="${base}/changelog">What changed this week</a>`;
      case 'footer':
        // A newsletter field with a placeholder and no label. messy-after adds the label.
        return `<form ${a('newsletter')} action="#" method="post">${after ? '<label class="label" for="newsletter-email">Newsletter</label>' : ''}<input ${a('input', 'newsletter-input')} type="email" ${after ? 'id="newsletter-email" ' : ''}placeholder="Your email"><button type="submit" ${a('btn', 'btn-primary', 'btn-sm')}>Subscribe</button></form>`;
      case 'features':
        // A card whose look depends on a background image that sanitization strips.
        return `<section ${a('promo')}><h3 style="color: #FFFFFF">Ship notes on Fridays</h3><p>Teams that publish weekly see twice the readers.</p></section>${
          after
            ? `<ol ${a('stepper')} aria-label="Setup progress"><li ${a('step')}>1 Connect</li><li ${a('step')} aria-current="step">2 Write</li><li ${a('step')}>3 Publish</li></ol>` +
              // The halo material (D-094): a rounded button and a card on a dark ground, previewed on that ground.
              `<section ${a('dark-band')} aria-label="Dark band"><a ${a('band-button')} href="${base}/signup">Start writing</a><article ${a('band-card')}><h3>Night mode digests</h3><p>Every digest reads on a dark ground too.</p></article></section>`
            : ''
        }`;
      case 'contact':
        // A button that calls confirm(); the crawler dismisses the dialog.
        return `<button type="button" ${a('btn', 'btn-ghost')} aria-haspopup="dialog" onclick="confirm('Discard this draft?')">Discard draft</button>`;
      case 'signup':
        // Submitting would set data-submitted; the crawler never submits.
        return `<script>document.querySelector('[data-form]').addEventListener('submit', (e) => e.currentTarget.setAttribute('data-submitted', '1'));</script>`;
      default:
        return '';
    }
  };
}

const posts = Array.from({ length: 12 }, (_, i) => ({
  slug: `release-notes-week-${i + 1}`,
  title: ['Faster digests', 'Slack threads', 'Custom domains', 'Team spaces', 'Better search', 'Dark emails', 'API tokens', 'Webhooks', 'Exports', 'Templates', 'Mentions', 'Archives'][i]!,
}));

function extraPages(after: boolean): Page[] {
  const x = { name: 'messy', c: (...n: string[]) => n.join(' '), s: () => '', head: '' } as Impl;
  const a = (name: string, ...more: string[]) => attrsFor(x, name, ...more);
  const share = (_base: string) => `<button type="button" ${a('share-button')} aria-label="Copy link to this page">${icons.copy.replace('width="20" height="20"', 'width="16" height="16"')}</button>`;
  void after;
  return [
    {
      path: '/changelog',
      file: 'changelog/index.html',
      title: 'Changelog · Tidewater',
      body: (_x, base) => `
<div ${a('container')}>
  <div ${a('page-head')}>
    <h1>Changelog</h1>
    <p>Everything we shipped, newest first.</p>
    <div ${a('status-list')}><span ${a('badge', 'badge-live')}><span ${a('live-dot')}></span>Live</span>${share(base)}</div>
  </div>
  <div ${a('timeline')}>
    ${posts
      .slice(0, 4)
      .map((p) => `<article ${a('release')}><span ${a('caption')}>Week ${posts.indexOf(p) + 1}</span><h3>${p.title}</h3><p ${a('text-sm')}>A short note about ${p.title.toLowerCase()}.</p></article>`)
      .join('\n    ')}
  </div>
</div>`,
    },
    {
      path: '/about',
      file: 'about/index.html',
      title: 'About · Tidewater',
      body: () => `
<div ${a('container')}>
  <div ${a('page-head')}>
    <h1>About Tidewater</h1>
    <p>Six people who got tired of writing release emails by hand.</p>
  </div>
  <p>We started Tidewater in 2024 to give every merged change a sentence a person would read.</p>
</div>`,
    },
    {
      path: '/careers',
      file: 'careers/index.html',
      title: 'Careers · Tidewater',
      body: () => `
<div ${a('container')}>
  <div ${a('page-head')}>
    <h1>Careers</h1>
    <p>We are not hiring right now.</p>
  </div>
  <p>Write to us anyway if you care about release notes as much as we do.</p>
</div>`,
    },
    {
      path: '/blog',
      file: 'blog/index.html',
      title: 'Blog · Tidewater',
      body: (_x, base) => `
<div ${a('container')}>
  <div ${a('page-head')}>
    <h1>Blog</h1>
    <p>Notes on shipping, writing, and calm teams.</p>
  </div>
  <ul ${a('post-list')}>
    ${posts.map((p) => `<li><a href="${base}/blog/${p.slug}">${p.title}</a></li>`).join('\n    ')}
  </ul>
</div>`,
    },
    ...posts.map(
      (p): Page => ({
        path: `/blog/${p.slug}`,
        file: `blog/${p.slug}/index.html`,
        title: `${p.title} · Tidewater blog`,
        body: (_x, base) => `
<div ${a('container')}>
  <article ${a('stack')}>
    <span ${a('caption')}>Release notes</span>
    <h1>${p.title}</h1>
    <p>This week we shipped ${p.title.toLowerCase()}. Here is what changed and why it matters for your team.</p>
    <div ${a('status-list')}>${share(base)}</div>
  </article>
</div>`,
      }),
    ),
  ];
}

function promoPng(): Buffer {
  const w = 600;
  const h = 240;
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const t = x / w;
      const stripe = (x + y) % 40 < 20 ? 0 : 10;
      png.data[i] = Math.round(11 + t * 20 + stripe);
      png.data[i + 1] = Math.round(31 + t * 40 + stripe);
      png.data[i + 2] = Math.round(58 + t * 80 + stripe);
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

export function buildMessy(after: boolean) {
  const site = after ? 'messy-after' : 'messy';
  const base = `/sites/${site}`;
  const dir = join(sitesDir, site);
  const impl: Impl = {
    name: after ? 'messy-after' : 'messy',
    // The hero and pricing calls to action get a near-copy of the primary button through a
    // descendant rule (1 px padding, 2 px radius apart). messy-after removes the rule.
    c: (...n) => n.join(' '),
    s: () => '',
    head: `<link rel="stylesheet" href="${base}/styles.css">`,
    extra: extras(after),
  };
  const all = [...cleanPages, ...extraPages(after)];
  for (const page of [...all, notFoundPage]) write(join(dir, page.file), documentFor(impl, page, base, 'is-scrolled'));
  const urls = all.map((p) => `  <url><loc>${origin}${base}${p.path === '/' ? '/' : p.path}</loc></url>`).join('\n');
  write(join(dir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  write(join(dir, 'styles.css'), messyCss(after));
  write(join(dir, 'assets/avatar.svg'), avatarSvg);
  write(join(dir, 'assets/promo.png'), promoPng());
}
