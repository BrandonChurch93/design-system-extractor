// The library fixture (docs/evals.md, fixture 4): a site built on Bulma 1.0.4 (MIT), using its
// real class names for navbar, buttons, forms, cards, tables, tags and more.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const here = import.meta.dirname;
const dir = resolve(here, '../../sites/library');
const base = '/sites/library';
const origin = 'http://localhost:4100';

function write(file: string, content: string) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

const siteCss = `@import url('/fonts/inter/inter.css');
:root { --bulma-family-primary: 'Inter', system-ui, sans-serif; --bulma-family-code: ui-monospace, 'SFMono-Regular', Menlo, monospace; --bulma-control-height: 2.75em; }
.navbar-burger { width: 2.75rem; height: 2.75rem; }
:root { --bulma-control-padding-vertical: 8px; --bulma-control-padding-horizontal: 12px; }
.button { --bulma-button-padding-vertical: 8px; line-height: 1.75; min-width: 2.75em; min-height: 2.75em; }
.hero { --bulma-hero-body-padding-medium: 11rem 4.5rem; }
/* The site's brand layer on Bulma: one light gray, one border gray, one link blue, 4 px spacing. */
.button.is-light, .button.is-light[disabled] { background-color: #E6E8EC; border-color: #E6E8EC; }
.content pre { background-color: #E6E8EC; padding: 16px 24px; }
.navbar.has-shadow { box-shadow: 0 2px 0 0 #E6E8EC; }
.input:not(.is-danger), .textarea, .select select, .table td, .table th, .pagination-link, .pagination-next, .pagination-previous, .tabs ul, .card-footer, .card-footer-item { border-color: #C8CCD5; }
a, .breadcrumb a, .card-footer-item, .tabs li.is-active a { color: #4258FF; }
.tabs a { border-bottom-color: #C8CCD5; }
.tabs li.is-active a { border-bottom-color: #4258FF; }
.breadcrumb li.is-active a { color: #2E333D; }
.input, .textarea, .pagination-link, .pagination-next, .pagination-previous { box-shadow: none; }
.button.is-link, .pagination-link.is-current { color: #FFFFFF; }
.notification.is-info.is-light { color: #002433; padding: 16px 24px; }
.tag { padding-inline: 8px; }
.button:focus-visible, .input:focus-visible, .textarea:focus-visible, .select select:focus-visible, .pagination-link:focus-visible, .pagination-next:focus-visible, .pagination-previous:focus-visible, .tabs a:focus-visible, .navbar-burger:focus-visible, .navbar-item:focus-visible, .card-footer-item:focus-visible { outline: 2px solid #4258FF; outline-offset: 2px; }
body { font-family: var(--bulma-family-primary); }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
`;

const nav = `<nav class="navbar is-white has-shadow" aria-label="Main navigation">
  <div class="container">
    <div class="navbar-brand">
      <a class="navbar-item has-text-weight-bold" href="${base}/">Ledgerly</a>
      <a role="button" class="navbar-burger" aria-label="Open menu" aria-expanded="false" aria-controls="main-menu" data-target="main-menu"><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span></a>
    </div>
    <div id="main-menu" class="navbar-menu">
      <div class="navbar-start">
        <a class="navbar-item" href="${base}/pricing">Pricing</a>
        <a class="navbar-item" href="${base}/docs">Docs</a>
        <a class="navbar-item" href="${base}/contact">Contact</a>
      </div>
      <div class="navbar-end">
        <div class="navbar-item"><div class="buttons"><a class="button is-light" href="${base}/contact">Log in</a><a class="button is-primary" href="${base}/signup">Sign up</a></div></div>
      </div>
    </div>
  </div>
</nav>`;

const footer = `<footer class="footer">
  <div class="content has-text-centered">
    <p><strong>Ledgerly</strong> keeps small books in order.</p>
    <p class="is-size-7 has-text-grey-light">Made with Bulma.</p>
  </div>
</footer>`;

const script = `<script>
document.querySelectorAll('.navbar-burger').forEach((b) => b.addEventListener('click', () => {
  const t = document.getElementById(b.dataset.target);
  const open = !b.classList.contains('is-active');
  b.classList.toggle('is-active', open);
  t.classList.toggle('is-active', open);
  b.setAttribute('aria-expanded', String(open));
}));
</script>`;

const doc = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${base}/vendor/bulma.min.css">
<link rel="stylesheet" href="${base}/site.css">
</head>
<body>
${nav}
${body}
${footer}
${script}
</body>
</html>
`;

const pages: { path: string; file: string; title: string; body: string }[] = [
  {
    path: '/',
    file: 'index.html',
    title: 'Ledgerly · Small books, kept in order',
    body: `<section class="hero is-primary is-medium">
  <div class="hero-body"><div class="container">
    <h1 class="title">Small books, kept in order.</h1>
    <p class="subtitle">Invoices, receipts and quarterly taxes for one-person companies.</p>
    <div class="buttons"><a class="button is-link" href="${base}/signup">Start free</a><a class="button is-light" href="${base}/pricing">See pricing</a></div>
  </div></div>
</section>
<section class="section"><div class="container">
  <div class="columns">
    <div class="column"><div class="card"><div class="card-content"><p class="title is-5">Invoices</p><p>Send a branded invoice in a minute and see when it was opened.</p></div><footer class="card-footer"><a class="card-footer-item" href="${base}/docs">Learn more</a></footer></div></div>
    <div class="column"><div class="card"><div class="card-content"><p class="title is-5">Receipts</p><p>Forward an email and the receipt files itself under the right month.</p></div><footer class="card-footer"><a class="card-footer-item" href="${base}/docs">Learn more</a></footer></div></div>
    <div class="column"><div class="card"><div class="card-content"><p class="title is-5">Taxes</p><p>A quarterly estimate that updates with every invoice you send.</p></div><footer class="card-footer"><a class="card-footer-item" href="${base}/docs">Learn more</a></footer></div></div>
  </div>
  <div class="tags"><span class="tag is-success">Bank sync</span><span class="tag is-info">CSV export</span><span class="tag is-warning">Beta</span></div>
</div></section>`,
  },
  {
    path: '/pricing',
    file: 'pricing/index.html',
    title: 'Pricing · Ledgerly',
    body: `<section class="section"><div class="container">
  <h1 class="title">Pricing</h1>
  <p class="subtitle">One plan, billed monthly or yearly.</p>
  <div class="columns">
    <div class="column"><div class="box"><p class="title is-4">Solo</p><p class="title is-2">$9</p><p>Unlimited invoices and receipts.</p><a class="button is-primary is-fullwidth" href="${base}/signup">Choose Solo</a></div></div>
    <div class="column"><div class="box"><p class="title is-4">Studio</p><p class="title is-2">$19</p><p>Everything in Solo, plus three seats.</p><a class="button is-link is-fullwidth" href="${base}/signup">Choose Studio</a></div></div>
  </div>
  <table class="table is-striped is-fullwidth">
    <thead><tr><th>Feature</th><th>Solo</th><th>Studio</th></tr></thead>
    <tbody>
      <tr><td>Invoices</td><td>Unlimited</td><td>Unlimited</td></tr>
      <tr><td>Seats</td><td>1</td><td>3</td></tr>
      <tr><td>Bank sync</td><td><span class="tag is-success">Included</span></td><td><span class="tag is-success">Included</span></td></tr>
    </tbody>
  </table>
</div></section>`,
  },
  {
    path: '/signup',
    file: 'signup/index.html',
    title: 'Sign up · Ledgerly',
    body: `<section class="section"><div class="container">
  <h1 class="title">Create your account</h1>
  <form action="#" method="post" style="max-width: 480px">
    <div class="field"><label class="label" for="name">Name</label><div class="control"><input class="input" id="name" type="text"></div></div>
    <div class="field"><label class="label" for="email">Email</label><div class="control"><input class="input is-danger" id="email" type="email" value="ana@" aria-invalid="true"></div><p class="help is-danger">This email is not complete.</p></div>
    <div class="field"><label class="label" for="plan">Plan</label><div class="control"><div class="select"><select id="plan"><option>Solo</option><option>Studio</option></select></div></div></div>
    <div class="field"><div class="control"><label class="checkbox"><input type="checkbox"> I agree to the terms</label></div></div>
    <div class="field is-grouped"><div class="control"><button type="submit" class="button is-primary">Create account</button></div><div class="control"><button type="button" class="button is-light" disabled>Use a passkey</button></div></div>
  </form>
</div></section>`,
  },
  {
    path: '/docs',
    file: 'docs/index.html',
    title: 'Docs · Ledgerly',
    body: `<section class="section"><div class="container">
  <nav class="breadcrumb" aria-label="breadcrumbs"><ul><li><a href="${base}/">Home</a></li><li class="is-active"><a href="${base}/docs" aria-current="page">Docs</a></li></ul></nav>
  <h1 class="title">Documentation</h1>
  <div class="tabs"><ul role="tablist" aria-label="Docs sections"><li class="is-active" role="presentation"><a role="tab" aria-selected="true" href="${base}/docs">Guides</a></li><li role="presentation"><a role="tab" aria-selected="false" href="${base}/docs/api">API</a></li><li role="presentation"><a role="tab" aria-selected="false" href="${base}/contact">Support</a></li></ul></div>
  <div class="notification is-info is-light" role="status"><p><strong>New:</strong> receipts can now be forwarded from any address.</p></div>
  <div class="content"><p>Start with the API guide to connect your bank.</p><pre><code>curl https://api.ledgerly.dev/v1/invoices -H "Authorization: Bearer $TOKEN"</code></pre></div>
</div></section>`,
  },
  {
    path: '/docs/api',
    file: 'docs/api/index.html',
    title: 'API · Ledgerly docs',
    body: `<section class="section"><div class="container">
  <nav class="breadcrumb" aria-label="breadcrumbs"><ul><li><a href="${base}/docs">Docs</a></li><li class="is-active"><a href="${base}/docs/api" aria-current="page">API</a></li></ul></nav>
  <h1 class="title">API</h1>
  <div class="content"><pre><code>GET /v1/invoices
POST /v1/receipts</code></pre></div>
  <table class="table is-fullwidth"><thead><tr><th>Endpoint</th><th>Method</th></tr></thead><tbody><tr><td>/v1/invoices</td><td><span class="tag is-info">GET</span></td></tr><tr><td>/v1/receipts</td><td><span class="tag is-warning">POST</span></td></tr></tbody></table>
  <nav class="pagination" aria-label="pagination"><a class="pagination-previous" href="${base}/docs">Previous</a><a class="pagination-next" href="${base}/contact">Next</a><ul class="pagination-list"><li><a class="pagination-link" href="${base}/docs" aria-label="Page 1">1</a></li><li><a class="pagination-link is-current" href="${base}/docs/api" aria-label="Page 2" aria-current="page">2</a></li></ul></nav>
</div></section>`,
  },
  {
    path: '/contact',
    file: 'contact/index.html',
    title: 'Contact · Ledgerly',
    body: `<section class="section"><div class="container">
  <h1 class="title">Contact</h1>
  <div class="field has-addons"><div class="control"><input class="input" type="text" value="help@ledgerly.dev" readonly aria-label="Support email"></div><div class="control"><button type="button" class="button is-info"><span class="icon">⧉</span></button></div></div>
  <form action="#" method="post" style="max-width: 480px">
    <div class="field"><label class="label" for="msg">Message</label><div class="control"><textarea class="textarea" id="msg"></textarea></div></div>
    <div class="field"><div class="control"><button type="submit" class="button is-link">Send</button></div></div>
  </form>
</div></section>`,
  },
];

export function buildLibrary() {
  for (const p of pages) write(join(dir, p.file), doc(p.title, p.body));
  write(
    join(dir, '404.html'),
    doc('Not found · Ledgerly', `<section class="section"><div class="container has-text-centered"><h1 class="title">Page not found</h1><p class="subtitle">That page does not exist.</p><a class="button is-light" href="${base}/">Back home</a></div></section>`),
  );
  write(join(dir, 'site.css'), siteCss);
  mkdirSync(join(dir, 'vendor'), { recursive: true });
  copyFileSync(resolve(here, '../../vendor/bulma/bulma-no-dark-mode.min.css'), join(dir, 'vendor/bulma.min.css'));
  const urls = pages.map((p) => `  <url><loc>${origin}${base}${p.path === '/' ? '/' : p.path}</loc></url>`).join('\n');
  write(join(dir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}
