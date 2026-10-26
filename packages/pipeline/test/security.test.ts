import { describe, expect, it } from 'vitest';
import { buildPreview } from '../src/previews/build';
import { sanitizeDeclaration, sanitizeMarkup, sanitizeStyleAttribute } from '../src/previews/sanitize';
import { BEACON, hostileCases, hostilePreview } from './helpers/hostile';
import { snap } from './helpers/snap';

const storageBase = 'https://store.example/dse';
const policy = { storageBase };

describe('security · sanitized previews', () => {
  it.each(hostileCases.map((h) => [h.name, h] as const))('%s leaves nothing that runs or loads off the allowlist', (_name, h) => {
    const doc = hostilePreview(h, storageBase);
    const body = doc.html.slice(doc.html.indexOf('<body>'));
    expect(body).not.toMatch(/<script|<iframe|<object|<embed|<meta|<base|<foreignobject|<animate|<link/i);
    expect(body).not.toMatch(/\son[a-z]+=/i);
    expect(body).not.toMatch(/javascript:|vbscript:|data:text|srcdoc|formaction|action=|expression\(|@import/i);
    expect(doc.html).not.toContain(BEACON);
    expect(doc.css).not.toMatch(/position:\s*(fixed|sticky)/);
    expect(doc.report.secondPass).toEqual([]);
  });

  it('keeps https and data images, rewrites relative links, prefixes ids and drops capture marks', () => {
    const out = sanitizeMarkup('<a href="/pricing" target="_blank" id="buy" data-dse-id="e1" data-track="x">Buy</a><img src="https://cdn.example/a.png"><img src="data:image/png;base64,AAAA"><label for="buy">Buy</label>', policy).html;
    expect(out).toBe('<a href="#" id="dse-buy" data-track="x">Buy</a><img src="https://cdn.example/a.png"><img src="data:image/png;base64,AAAA"><label for="dse-buy">Buy</label>');
  });

  it('sees through control characters and spaces hidden in a scheme', () => {
    const out = sanitizeMarkup('<a href="java\tscript:alert(1)">a</a><a href=" javascript:alert(1)">b</a><img src="&#14;javascript:x">', policy).html;
    expect(out).toBe('<a>a</a><a>b</a><img>');
  });

  it('limits inputs and forms', () => {
    const out = sanitizeMarkup('<form action="https://x.example" method="post"><input name="q" type="file"><input type="checkbox" name="c"></form>', policy).html;
    expect(out).toBe('<form><input type="text"><input type="checkbox"></form>');
  });

  it('allows only the font hosts, the storage base and data images in CSS urls', () => {
    expect(sanitizeDeclaration('background', 'url(https://fonts.gstatic.com/s/a.woff2)', policy)).not.toBeNull();
    expect(sanitizeDeclaration('background', 'url("https://store.example/dse/runs/a/fonts/f.woff2")', policy)).not.toBeNull();
    expect(sanitizeDeclaration('background', "url('data:image/svg+xml,%3Csvg%3E')", policy)).not.toBeNull();
    for (const bad of ['url(https://evil.example/a.png)', 'url(//evil.example/a.png)', 'u\\72l(https://evil.example)', 'image-set("https://evil.example/a.png" 1x)', 'url(https://store.example.evil/x)']) expect(sanitizeDeclaration('background', bad, policy), bad).toBeNull();
    expect(sanitizeDeclaration('position', 'sticky', policy)).toEqual({ name: 'position', value: 'relative' });
    expect(sanitizeStyleAttribute('color: red; behavior: url(x.htc); -moz-binding: url(a); width: 10px', policy)).toBe('color: red; width: 10px');
  });

  it('marks a preview with 250 KB of CSS as too large', () => {
    const snapshot = snap([{ tag: 'body', box: [0, 0, 400, 300] }, { tag: 'div', parent: 0, box: [0, 0, 200, 100] }]);
    const declarations = Array.from({ length: 5000 }, (_, i) => ({ name: `--v${i}`, value: 'x'.repeat(40), important: false }));
    const doc = buildPreview({ markup: '<div data-dse-id="e1">x</div>', vars: {}, snapshot, root: snapshot.elements[1]!, matched: { e1: { rules: [{ selector: 'div', matched: ['div'], origin: 'regular', media: [], supports: [], declarations }], inline: [], pseudo: [] } }, ground: 'rgb(255, 255, 255)', imageColors: {}, fonts: { googleLinks: [], faces: [], mode: 'none' }, policy });
    expect(doc.bytes).toBeGreaterThan(200_000);
    expect(doc.tooLarge).toBe(true);
  });
});
