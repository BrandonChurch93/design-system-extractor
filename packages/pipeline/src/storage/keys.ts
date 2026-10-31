import type { State, Viewport } from '@dse/schema';

// Every storage path (docs/specs/data-model.md, Storage keys).
const run = (runId: string) => `runs/${runId}`;
const component = (runId: string, componentId: string) => `${run(runId)}/components/${componentId}`;

export const keys = {
  runPrefix: (runId: string) => `${run(runId)}/`,
  pageScreenshot: (runId: string, pageId: string, viewport: Viewport) => `${run(runId)}/pages/${pageId}/${viewport}.png`,
  pageSnapshot: (runId: string, pageId: string, viewport: Viewport) => `${run(runId)}/pages/${pageId}/${viewport}.snapshot.json.gz`,
  pageCss: (runId: string, pageId: string, viewport: Viewport) => `${run(runId)}/pages/${pageId}/${viewport}.css.json.gz`,
  componentCrop: (runId: string, componentId: string, state: State) => `${component(runId, componentId)}/${state}.png`,
  componentSource: (runId: string, componentId: string, viewport: Viewport) => `${component(runId, componentId)}/source-${viewport}.png`,
  componentMobile: (runId: string, componentId: string) => `${component(runId, componentId)}/mobile.png`,
  variantCrop: (runId: string, componentId: string, variantId: string) => `${component(runId, componentId)}/variants/${variantId}/default.png`,
  componentPreview: (runId: string, componentId: string) => `${component(runId, componentId)}/preview.html`,
  /** The focus crop a component hidden until focus previews, apart from its focus state's crop (D-108, D-112). */
  componentPreviewFocus: (runId: string, componentId: string) => `${component(runId, componentId)}/preview-focus.png`,
  componentStatePreview: (runId: string, componentId: string, state: State) => `${component(runId, componentId)}/preview-${state}.html`,
  variantPreview: (runId: string, componentId: string, variantId: string) => `${component(runId, componentId)}/variants/${variantId}/preview.html`,
  variantStatePreview: (runId: string, componentId: string, variantId: string, state: State) =>
    `${component(runId, componentId)}/variants/${variantId}/preview-${state}.html`,
  componentFont: (runId: string, file: string) => `${run(runId)}/fonts/${file}`,
  og: (runId: string) => `${run(runId)}/og.png`,
  showcase: () => 'showcase/showcase.json',
};

/** Intermediate capture files, deleted after `done` unless DSE_KEEP_INTERMEDIATE=1. */
export function isIntermediateKey(key: string): boolean {
  return /\.(snapshot|css)\.json\.gz$/.test(key);
}

const contentTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.json.gz': 'application/gzip',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.zip': 'application/zip',
};

/** The content type for a key by its extension; unknown extensions are refused. */
export function contentTypeFor(key: string): string {
  const ext = Object.keys(contentTypes)
    .sort((a, b) => b.length - a.length)
    .find((e) => key.toLowerCase().endsWith(e));
  if (!ext) throw new Error(`no content type known for ${key}`);
  return contentTypes[ext]!;
}
