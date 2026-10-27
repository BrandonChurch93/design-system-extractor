import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PreviewFrame } from '../components/PreviewFrame';

// docs/design/components.md, PreviewFrame, and docs/specs/preview-fidelity.md, Serving.

const src = 'https://xyz.supabase.co/storage/v1/object/public/dse/runs/abcdefghij/components/c1/preview.html';
const render = (props: Partial<Parameters<typeof PreviewFrame>[0]> = {}) =>
  renderToStaticMarkup(createElement(PreviewFrame, { mode: 'live', src, title: 'Primary button preview', width: 320, height: 48, ...props }));

describe('security · PreviewFrame', () => {
  it('renders a live preview as an iframe with an empty sandbox and a src on the storage origin, never srcdoc', () => {
    const html = render();
    expect(html).toMatch(/^<iframe [^>]*><\/iframe>$/);
    expect(html).toContain(' sandbox=""');
    expect(html).toContain(` src="${src}"`);
    expect(html).toContain(' title="Primary button preview"');
    expect(html).toContain(' width="320"');
    expect(html).toContain(' height="48"');
    expect(html).not.toContain('srcdoc');
    expect(html).not.toMatch(/allow-scripts|allow-same-origin/);
  });

  it('loads lazily only when below the fold', () => {
    expect(render({ lazy: true })).toContain(' loading="lazy"');
    expect(render()).not.toContain('loading=');
  });

  it('shows a captured preview as an img with the same alt text instead of a frame', () => {
    const html = render({ mode: 'captured', src: 'https://xyz.supabase.co/storage/v1/object/public/dse/runs/abcdefghij/crops/c1.png', lazy: true });
    expect(html).toMatch(/^<img [^>]*\/>$/);
    expect(html).toContain(' alt="Primary button preview"');
    expect(html).toContain(' loading="lazy"');
  });
});
