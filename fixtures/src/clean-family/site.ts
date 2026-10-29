// The clean family's pages, written once against semantic class names. Each implementation
// (clean, tailwind, css-in-js) supplies how a semantic name becomes a class attribute and,
// for css-in-js, which declarations move into inline style attributes.

export type Impl = {
  name: 'clean' | 'tailwind' | 'css-in-js' | 'messy' | 'messy-after';
  /** Extra markup at named points (the messy family plants its items this way). */
  extra?: (point: 'head' | 'body-end' | 'hero' | 'footer' | 'features' | 'contact' | 'signup' | 'home-end', base: string) => string;
  /** The class attribute for one or more semantic names. */
  c: (...names: string[]) => string;
  /** An inline style attribute value for a semantic name, or ''. */
  s: (name: string) => string;
  /** Extra markup for <head>: stylesheet links or style tags. */
  head: string;
};

export const origin = 'http://localhost:4100';

const icons = {
  chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/></svg>',
  copy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
};

export type Page = { path: string; file: string; title: string; body: (x: Impl, base: string) => string; /** A button that only this page's footer carries (v1.1). */ footerCta?: boolean };

/** The motion, site-variable and naming layer of v1.1 belongs to the clean family only (docs/evals.md). */
export const v11 = (x: Impl) => x.name === 'clean' || x.name === 'tailwind' || x.name === 'css-in-js';

function attrs(x: Impl, name: string, ...more: string[]): string {
  // Inline styles only on single-class elements, so a modifier class still wins as in clean.
  const style = more.length ? '' : x.s(name);
  return `class="${x.c(name, ...more)}"${style ? ` style="${style}"` : ''}`;
}

function header(x: Impl, base: string): string {
  const link = (href: string, label: string) => `<a ${attrs(x, 'nav-link')} href="${base}${href}">${label}</a>`;
  return `<header ${attrs(x, 'site-header')} data-header>
  <div ${attrs(x, 'container')}>
    <div ${attrs(x, 'header-inner')}>
      <a ${attrs(x, 'logo')} href="${base}/">Tidewater</a>
      <nav ${attrs(x, 'nav-links')} aria-label="Main">
        ${link('/features', 'Product')}
        ${link('/pricing', 'Pricing')}
        ${link('/docs', 'Docs')}
        ${link('/contact', 'Contact')}
        <div ${attrs(x, 'dropdown')} data-dropdown>
          <button type="button" ${attrs(x, 'dropdown-trigger')} aria-haspopup="menu" aria-expanded="false" aria-controls="resources-menu">Resources ${icons.chevron}</button>
          <div ${attrs(x, 'dropdown-menu')} id="resources-menu" role="menu" hidden>
            <a ${attrs(x, 'menu-item')} role="menuitem" href="${base}/docs">Guides</a>
            <a ${attrs(x, 'menu-item')} role="menuitem" href="${base}/docs/getting-started">API reference</a>
            <a ${attrs(x, 'menu-item')} role="menuitem" href="${base}/contact">Support</a>
          </div>
        </div>
      </nav>
      <div ${attrs(x, 'header-actions')}>
        <a ${attrs(x, 'btn', 'btn-ghost')} href="${base}/login">Sign in</a>
        <a ${attrs(x, 'btn', 'btn-primary')} href="${base}/signup">Start free</a>
      </div>
      <button type="button" ${attrs(x, 'menu-button')} aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icons.menu}</button>
    </div>
    <nav ${attrs(x, 'mobile-menu')} id="mobile-menu" aria-label="Mobile" hidden>
      <a ${attrs(x, 'mobile-link')} href="${base}/features">Product</a>
      <a ${attrs(x, 'mobile-link')} href="${base}/pricing">Pricing</a>
      <a ${attrs(x, 'mobile-link')} href="${base}/docs">Docs</a>
      <a ${attrs(x, 'mobile-link')} href="${base}/contact">Contact</a>
      <a ${attrs(x, 'mobile-link')} href="${base}/login">Sign in</a>
    </nav>
  </div>
</header>`;
}

function footer(x: Impl, base: string, page?: Page): string {
  const link = (href: string, label: string) => `<a ${attrs(x, 'footer-link')} href="${base}${href}">${label}</a>`;
  return `<footer ${attrs(x, 'site-footer')}>
  <div ${attrs(x, 'container')}>
    <div ${attrs(x, 'footer-inner')}>
      <div ${attrs(x, 'stack')}>
        <span ${attrs(x, 'logo')}>Tidewater</span>
        <p ${attrs(x, 'caption')}>Calm release notes for busy teams.</p>
      </div>
      <nav ${attrs(x, 'footer-links')} aria-label="Footer">
        ${link('/features', 'Product')}
        ${link('/pricing', 'Pricing')}
        ${link('/docs', 'Docs')}
        ${link('/contact', 'Contact')}
      </nav>
      ${x.extra?.('footer', base) ?? ''}
      ${page?.footerCta && v11(x) ? `<button type="button" ${attrs(x, 'footer-cta')}>Talk to sales ${icons.chevron}</button>` : ''}
    </div>
  </div>
</footer>`;
}

const script = `<script>
(() => {
  document.querySelectorAll('[data-dropdown]').forEach((dd) => {
    const t = dd.querySelector('[aria-haspopup]');
    const m = dd.querySelector('[role=menu]');
    const set = (open) => { t.setAttribute('aria-expanded', String(open)); m.hidden = !open; };
    t.addEventListener('click', () => set(t.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) set(false); });
  });
  const mb = document.querySelector('[aria-controls=mobile-menu]');
  const mm = document.getElementById('mobile-menu');
  if (mb && mm) mb.addEventListener('click', () => { const open = mb.getAttribute('aria-expanded') !== 'true'; mb.setAttribute('aria-expanded', String(open)); mm.hidden = !open; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mb && mm) { mb.setAttribute('aria-expanded', 'false'); mm.hidden = true; } });
  const h = document.querySelector('[data-header]');
  const onScroll = () => h && h.classList.toggle('${'{{scrolled}}'}', window.scrollY > 0);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  document.querySelectorAll('[role=tablist]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role=tab]')];
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); document.getElementById(t.getAttribute('aria-controls')).hidden = !on; });
    }));
  });
  document.querySelectorAll('[role=switch]').forEach((sw) => sw.addEventListener('click', () => sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'))));
  // Scroll reveals: a class toggled at 15% from the bottom, and one card moved frame by frame.
  const reveals = document.querySelectorAll('[data-reveal]');
  const lone = document.querySelector('[data-js-reveal]');
  if ('IntersectionObserver' in window && (reveals.length || lone)) {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      if (e.target.hasAttribute('data-reveal')) { e.target.classList.add('${'{{visible}}'}'); return; }
      const el = e.target;
      if (still) { el.style.opacity = '1'; el.style.transform = 'translateY(0px)'; return; }
      const t0 = performance.now();
      const step = (now) => { const k = Math.min(1, (now - t0) / 400); el.style.opacity = String(Math.round(k * 100) / 100); el.style.transform = 'translateY(' + Math.round((1 - k) * 160) / 10 + 'px)'; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { rootMargin: '0px 0px -15% 0px' });
    reveals.forEach((el) => io.observe(el));
    if (lone) io.observe(lone);
  }
})();
</script>`;

export function documentFor(x: Impl, page: Page, base: string, scrolledClass: string, visibleClass = 'is-visible'): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
${x.head}
${x.extra?.('head', base) ?? ''}
</head>
<body>
<a ${x.c('skip-link')} href="#main">Skip to content</a>
${header(x, base)}
<main id="main">
${page.body(x, base)}
</main>
${footer(x, base, page)}
${script.replace('{{scrolled}}', scrolledClass).replace('{{visible}}', visibleClass)}
${x.extra?.('body-end', base) ?? ''}
</body>
</html>
`;
}

const featureCards = (x: Impl, withTag: boolean, reveal = false) => {
  const r = reveal && v11(x) ? ' data-reveal' : '';
  return `
<div ${attrs(x, 'grid')}>
  <article ${attrs(x, 'card')}${r}>
    <span ${attrs(x, 'feature-icon')}>${icons.zap}</span>
    ${withTag ? `<span ${attrs(x, 'tag-new')}>New</span>` : ''}
    <h3>Weekly digests</h3>
    <p ${attrs(x, 'text-sm')}>One email every Friday with what shipped, grouped by team.</p>
  </article>
  <article ${attrs(x, 'card')}${r}>
    <span ${attrs(x, 'feature-icon')}>${icons.layers}</span>
    <h3>Slack threads</h3>
    <p ${attrs(x, 'text-sm')}>Each release posts where the team already talks, with a link back.</p>
  </article>
  <article ${attrs(x, 'card')}${r}>
    <span ${attrs(x, 'feature-icon')}>${icons.globe}</span>
    <h3>Public pages</h3>
    <p ${attrs(x, 'text-sm')}>A changelog page on your own domain, updated on every merge.</p>
  </article>
</div>`;
};

export const featureCardsFor = featureCards;
export const attrsFor = attrs;
export { header as headerFor, icons };

export const pages: Page[] = [
  {
    path: '/',
    file: 'index.html',
    title: 'Tidewater · Release notes your team will read',
    body: (x, base) => `
<div ${attrs(x, 'container')}>
  <section ${attrs(x, 'hero')}>
    <h1 ${attrs(x, 'display')}>Release notes your team will actually read.</h1>
    <p>Tidewater turns merged pull requests into a calm weekly changelog for the whole company.</p>
    <div ${attrs(x, 'hero-actions')}>
      <a ${attrs(x, 'btn', 'btn-primary')} href="${base}/signup">Start free</a>
      <a ${attrs(x, 'btn', 'btn-secondary')} href="${base}/pricing">See pricing</a>
    </div>
    ${x.extra?.('hero', base) ?? ''}
  </section>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'stack')}>
      <h2>Everything ships with a note</h2>
      ${featureCards(x, true)}
    </div>
  </section>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'stack')}>
      <h2>Built for teams that ship every day</h2>
      <p>Release notes are the last step of a change and the first thing everyone else sees.</p>
      <p>Most teams skip them because writing them takes longer than the change did.</p>
      <p>Tidewater writes the draft from the pull request and leaves the last word to the author.</p>
      <p>The result is a short weekly note that people outside engineering actually open.</p>
    </div>
  </section>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'testimonial')}${v11(x) ? ' data-js-reveal' : ''}>
      <img ${attrs(x, 'avatar')} src="${base}/assets/avatar.svg" width="40" height="40" alt="Mara Ellis">
      <div>
        <p>“We stopped writing release emails by hand.”</p>
        <p ${attrs(x, 'caption')}>Mara Ellis, engineering lead</p>
      </div>
    </div>
  </section>
  ${x.extra?.('home-end', base) ?? ''}
</div>`,
  },
  {
    path: '/pricing',
    file: 'pricing/index.html',
    title: 'Pricing · Tidewater',
    footerCta: true,
    body: (x, base) => `
<div ${attrs(x, 'container')}>
  <div ${attrs(x, 'page-head')}>
    <h1>Pricing</h1>
    <p>Free for small teams. Pay when the changelog becomes part of how you work.</p>
  </div>
  <div ${attrs(x, 'toggle-row')}>
    <button type="button" ${attrs(x, 'toggle')} role="switch" aria-checked="false" aria-label="Bill yearly"></button>
    <span>Bill yearly</span>
  </div>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'grid', 'grid-2')}>
      <article ${attrs(x, 'card', 'pricing-card')}>
        <h3>Starter</h3>
        <p ${attrs(x, 'price')}>$0</p>
        <ul ${attrs(x, 'plan-features')}>
          <li ${v11(x) ? attrs(x, 'text-sm', 'plan-item') : attrs(x, 'text-sm')}>One public changelog</li>
          <li ${v11(x) ? attrs(x, 'text-sm', 'plan-item') : attrs(x, 'text-sm')}>Weekly digest</li>
          <li ${v11(x) ? attrs(x, 'text-sm', 'plan-item') : attrs(x, 'text-sm')}>Three integrations</li>
        </ul>
        <a ${attrs(x, 'btn', 'btn-secondary')} href="${base}/signup">Start free</a>
      </article>
      <article ${attrs(x, 'card', 'pricing-card', 'pricing-card--featured')}>
        <h3>Team</h3>
        <p ${attrs(x, 'price')}>$24</p>
        <ul ${attrs(x, 'plan-features')}>
          <li ${v11(x) ? attrs(x, 'text-sm', 'plan-item') : attrs(x, 'text-sm')}>Unlimited changelogs</li>
          <li ${v11(x) ? attrs(x, 'text-sm', 'plan-item') : attrs(x, 'text-sm')}>Slack and email digests</li>
          <li ${v11(x) ? attrs(x, 'text-sm', 'plan-item') : attrs(x, 'text-sm')}>Custom domain</li>
        </ul>
        <a ${attrs(x, 'btn', 'btn-primary', 'btn-on-dark')} href="${base}/signup">Start trial</a>
      </article>
    </div>
  </section>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'table-wrap')}>
      <table ${attrs(x, 'table')}>
        <thead><tr><th ${attrs(x, 'th')}>Feature</th><th ${attrs(x, 'th')}>Starter</th><th ${attrs(x, 'th')}>Team</th></tr></thead>
        <tbody>
          <tr><td ${attrs(x, 'td')}>Changelogs</td><td ${attrs(x, 'td')}>1</td><td ${attrs(x, 'td')}>Unlimited</td></tr>
          <tr><td ${attrs(x, 'td')}>Digests</td><td ${attrs(x, 'td')}>Weekly</td><td ${attrs(x, 'td')}>Daily or weekly</td></tr>
          <tr><td ${attrs(x, 'td')}>Custom domain</td><td ${attrs(x, 'td')}>No</td><td ${attrs(x, 'td')}>Yes</td></tr>
        </tbody>
      </table>
    </div>
  </section>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'stack')}>
      <h2>Questions</h2>
      <p>Every plan includes the weekly digest. Team adds Slack threads, more changelogs and a custom domain.</p>
      <p>Yearly billing is two months free. You can switch between monthly and yearly at any time.</p>
      <p>There is no limit on readers. Only the people who write notes count toward the plan.</p>
    </div>
  </section>
</div>`,
  },
  {
    path: '/features',
    file: 'features/index.html',
    title: 'Features · Tidewater',
    body: (x, base) => `
<div ${attrs(x, 'container')}>
  <div ${attrs(x, 'page-head')}>
    <h1>Features</h1>
    <p>Three ways your release notes reach people.</p>
    ${v11(x) ? `<div ${attrs(x, 'hero-actions')}><a ${attrs(x, 'btn', 'btn-ghost', 'btn-pill')} href="${base}/docs">Read the guide</a><a ${attrs(x, 'btn', 'btn-ghost', 'btn-pill')} href="${base}/contact">Book a tour</a></div>` : ''}
  </div>
  <div ${attrs(x, 'tabs')} role="tablist" aria-label="Channels">
    <button type="button" ${attrs(x, 'tab')} role="tab" id="tab-digest" aria-selected="true" aria-controls="panel-digest">Digests</button>
    <button type="button" ${attrs(x, 'tab')} role="tab" id="tab-slack" aria-selected="false" aria-controls="panel-slack">Slack</button>
    <button type="button" ${attrs(x, 'tab')} role="tab" id="tab-pages" aria-selected="false" aria-controls="panel-pages">Pages</button>
  </div>
  <div ${attrs(x, 'tab-panel')} role="tabpanel" id="panel-digest" aria-labelledby="tab-digest"><p>A Friday email with every merged change, grouped by team and written in plain words.</p></div>
  <div ${attrs(x, 'tab-panel')} role="tabpanel" id="panel-slack" aria-labelledby="tab-slack" hidden><p>Release threads in the channels you pick, with a link to the full note.</p></div>
  <div ${attrs(x, 'tab-panel')} role="tabpanel" id="panel-pages" aria-labelledby="tab-pages" hidden><p>A public changelog on your own domain that updates itself.</p></div>
  <div ${attrs(x, 'alert', 'alert-success')} role="status">
    <span ${attrs(x, 'alert-icon', 'alert-icon-success')}>${icons.check}</span>
    <div ${attrs(x, 'stack')}>
      <p>Digests are included in every plan.</p>
      <div ${attrs(x, 'hero-actions')}><a ${attrs(x, 'btn', 'btn-primary', 'btn-sm')} href="${base}/pricing">Compare plans</a></div>
    </div>
  </div>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'stack')}>
      <h2>Why weekly</h2>
      <p>A week is long enough for a change to matter and short enough to remember why it happened.</p>
      <p>People skim a list of ten changes. They read a note that explains three of them.</p>
      <p>Tidewater groups merged pull requests by team, drops the ones marked internal, and asks the author for one sentence.</p>
      <p>The digest goes out on Friday morning, before the weekend, while the work is still fresh.</p>
    </div>
  </section>
  <section ${attrs(x, 'section')}>${featureCards(x, false, true)}</section>
  ${x.extra?.('features', base) ?? ''}
</div>`,
  },
  {
    path: '/signup',
    file: 'signup/index.html',
    title: 'Create your account · Tidewater',
    body: (x) => `
<div ${attrs(x, 'container')}>
  <div ${attrs(x, 'page-head')}>
    <h1>Create your account</h1>
    <p>Free for teams up to five people.</p>
    <p>No card needed. You can invite the rest of the team once the first note is out.</p>
  </div>
  <form ${attrs(x, 'form')} action="#" method="post" data-form>
    <div ${attrs(x, 'field')}>
      <label ${attrs(x, 'label')} for="name">Full name</label>
      <input ${attrs(x, 'input')} id="name" name="name" type="text" autocomplete="name">
    </div>
    <div ${attrs(x, 'field')}>
      <label ${attrs(x, 'label')} for="email">Work email</label>
      <input ${attrs(x, 'input')} id="email" name="email" type="email" value="mara@" aria-invalid="true" aria-describedby="email-error">
      <p ${attrs(x, 'field-error')} id="email-error">Enter a full work email address.</p>
    </div>
    <div ${attrs(x, 'field')}>
      <label ${attrs(x, 'label')} for="team">Team size</label>
      <select ${attrs(x, 'select')} id="team" name="team"><option>1 to 5</option><option>6 to 20</option><option>21 or more</option></select>
    </div>
    <div ${attrs(x, 'check-row')}>
      <input ${attrs(x, 'checkbox')} id="updates" name="updates" type="checkbox">
      <label for="updates">Send me product updates</label>
    </div>
    <div ${attrs(x, 'hero-actions')}>
      <button type="submit" ${attrs(x, 'btn', 'btn-primary')}>Create account</button>
      <button type="button" ${attrs(x, 'btn', 'btn-secondary')} disabled>Continue with SSO</button>
    </div>
  </form>
  ${x.extra?.('signup', '') ?? ''}
</div>`,
  },
  {
    path: '/login',
    file: 'login/index.html',
    title: 'Sign in · Tidewater',
    body: (x, base) => `
<div ${attrs(x, 'container')}>
  <div ${attrs(x, 'page-head')}>
    <h1>Sign in</h1>
    <p>Welcome back.</p>
    <p>Use the email your team invited. Single sign-on is coming later this year.</p>
  </div>
  <section ${attrs(x, 'auth-card')}>
  <form ${attrs(x, 'form')} action="#" method="post">
    <div ${attrs(x, 'field')}>
      <label ${attrs(x, 'label')} for="login-email">Email</label>
      <input ${attrs(x, 'input')} id="login-email" name="email" type="email" autocomplete="email">
    </div>
    <div ${attrs(x, 'field')}>
      <label ${attrs(x, 'label')} for="login-password">Password</label>
      <input ${attrs(x, 'input')} id="login-password" name="password" type="password" autocomplete="current-password">
    </div>
    <div ${attrs(x, 'hero-actions')}>
      <button type="submit" ${attrs(x, 'btn', 'btn-primary')}>Sign in</button>
      <a ${attrs(x, 'btn', 'btn-ghost', 'btn-sm')} href="${base}/contact">Forgot password</a>
    </div>
  </form>
  </section>
</div>`,
  },
  {
    path: '/docs',
    file: 'docs/index.html',
    title: 'Documentation · Tidewater',
    body: (x, base) => `
<div ${attrs(x, 'container')}>
  <div ${attrs(x, 'page-head')}>
    <nav aria-label="Breadcrumb"><ol ${attrs(x, 'breadcrumb')}><li><a ${attrs(x, 'crumb')} href="${base}/">Home</a></li><li aria-hidden="true">/</li><li ${attrs(x, 'crumb-current')} aria-current="page">Docs</li></ol></nav>
    <h1>Documentation</h1>
    <p>Connect a repository and publish your first changelog in a few minutes.</p>
  </div>
  <div ${attrs(x, 'status-list')}>
    <span ${attrs(x, 'badge', 'badge-success')}>API operational</span>
    <span ${attrs(x, 'badge', 'badge-warning')}>Webhooks delayed</span>
    <span ${attrs(x, 'badge', 'badge-danger')}>Exports down</span>
  </div>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'stack')}>
      <h2>Guides</h2>
      <ul ${attrs(x, 'doc-list')}>
        <li><a href="${base}/docs/getting-started">Getting started</a></li>
        <li><a href="${base}/docs/getting-started">Connecting GitHub</a></li>
        <li><a href="${base}/docs/getting-started">Writing good notes</a></li>
      </ul>
      <pre ${attrs(x, 'code-block')}><code>npm install @tidewater/cli
tidewater login
tidewater publish</code></pre>
      <div ${attrs(x, 'hero-actions')}><a ${attrs(x, 'btn', 'btn-secondary', 'btn-sm')} href="${base}/docs/getting-started">Read the quick start</a></div>
    </div>
  </section>
  <section ${attrs(x, 'section')}>
    <div ${attrs(x, 'stack')}>
      <h2>How it fits together</h2>
      <p>Tidewater reads merged pull requests from the repositories you connect. Nothing else in the repository is read.</p>
      <p>Each pull request becomes a draft line. The author can edit it, mark it internal, or leave it as it is.</p>
      <p>On publish, the drafts for the week are grouped by team and sent to every channel you have connected.</p>
      <p>Channels are email digests, Slack threads and a public page. Each can be turned off on its own.</p>
      <p>Everything Tidewater sends can be undone for one hour after it goes out.</p>
    </div>
  </section>
</div>`,
  },
  {
    path: '/docs/getting-started',
    file: 'docs/getting-started/index.html',
    title: 'Getting started · Tidewater',
    body: (x, base) => `
<div ${attrs(x, 'container')}>
  <div ${attrs(x, 'page-head')}>
    <nav aria-label="Breadcrumb"><ol ${attrs(x, 'breadcrumb')}><li><a ${attrs(x, 'crumb')} href="${base}/docs">Docs</a></li><li aria-hidden="true">/</li><li ${attrs(x, 'crumb-current')} aria-current="page">Getting started</li></ol></nav>
    <h1>Getting started</h1>
    <p>Install the command line tool, connect a repository, and publish.</p>
  </div>
  <article ${attrs(x, 'stack')}>
      <p>You need a GitHub account with access to the repository and about five minutes.</p>
      <p>The command line tool asks for a token once and keeps it in your system keychain.</p>
      <p>Run the two commands below from the root of the repository you want to publish.</p>
      <p>The first connects the repository. The second writes a note for everything merged since last Friday.</p>
    <pre ${attrs(x, 'code-block')}><code>tidewater init --repo acme/web
tidewater publish --since last-friday</code></pre>
    <div ${attrs(x, 'alert', 'alert-warning')} role="status">
      <span ${attrs(x, 'alert-icon', 'alert-icon-warning')}>${icons.alert}</span>
      <p>Publishing posts to every connected channel. Try it on a test channel first.</p>
    </div>
    <div ${attrs(x, 'table-wrap')}>
      <table ${attrs(x, 'table')}>
        <thead><tr><th ${attrs(x, 'th')}>Option</th><th ${attrs(x, 'th')}>Default</th><th ${attrs(x, 'th')}>Meaning</th></tr></thead>
        <tbody>
          <tr><td ${attrs(x, 'td')}>--since</td><td ${attrs(x, 'td')}>last release</td><td ${attrs(x, 'td')}>Where the note starts</td></tr>
          <tr><td ${attrs(x, 'td')}>--channel</td><td ${attrs(x, 'td')}>all</td><td ${attrs(x, 'td')}>Where the note goes</td></tr>
        </tbody>
      </table>
    </div>
    <div ${attrs(x, 'hero-actions')}><a ${attrs(x, 'btn', 'btn-ghost')} href="${base}/contact">Edit this page</a></div>
  </article>
</div>`,
  },
  {
    path: '/contact',
    file: 'contact/index.html',
    title: 'Contact · Tidewater',
    body: (x) => `
<div ${attrs(x, 'container')}>
  <div ${attrs(x, 'page-head')}>
    <h1>Contact</h1>
    <p>We answer within one working day.</p>
    <p>Write about billing, a bug, or an idea. A person reads every message.</p>
    <p>For anything urgent, put urgent in the first line and we will look first.</p>
  </div>
  <p ${attrs(x, 'check-row')}>
    <span>hello@tidewater.app</span>
    <button type="button" ${attrs(x, 'icon-button')}>${icons.copy}</button>
  </p>
  <section ${attrs(x, 'section')}>
    <form ${attrs(x, 'form')} action="#" method="post">
      <div ${attrs(x, 'field')}>
        <label ${attrs(x, 'label')} for="contact-name">Name</label>
        <input ${attrs(x, 'input')} id="contact-name" name="name" type="text">
      </div>
      <div ${attrs(x, 'field')}>
        <label ${attrs(x, 'label')} for="contact-message">Message</label>
        <textarea ${attrs(x, 'textarea')} id="contact-message" name="message"></textarea>
      </div>
      <div ${attrs(x, 'hero-actions')}>
        <button type="submit" ${attrs(x, 'btn', 'btn-primary')}>Send message</button>
        ${x.extra?.('contact', '') ?? ''}
      </div>
    </form>
  </section>
</div>`,
  },
];

export const notFoundPage: Page = {
  path: '/404',
  file: '404.html',
  title: 'Not found · Tidewater',
  body: (x, base) => `
<div ${attrs(x, 'container')}>
  <section ${attrs(x, 'empty-state')}>
    <span ${attrs(x, 'empty-icon')}>${icons.search}</span>
    <h1>This page is not here.</h1>
    <p>It may have moved when the docs were reorganized.</p>
    <a ${attrs(x, 'btn', 'btn-ghost')} href="${base}/">Back to home</a>
  </section>
</div>`,
};

export const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#E2E8F0"/><text x="40" y="50" text-anchor="middle" font-family="Inter, sans-serif" font-size="28" font-weight="600" fill="#0B1F3A">ME</text></svg>`;

export function sitemap(base: string): string {
  const urls = pages.map((p) => `  <url><loc>${origin}${base}${p.path === '/' ? '/' : p.path}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
