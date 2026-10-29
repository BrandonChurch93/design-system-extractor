import type { ExportFormat, ExportSet, RunDocumentPartial } from '@dse/schema';
import { designSystemMd, promptMd } from './documents';
import { exportTokens } from './model';
import { motionCss, motionJson } from './motion';
import { componentCss } from './substitute';
import { tailwindTokens, tokensCss, tokensJson, w3cTokens } from './tokens';
import { zip, type ZipEntry } from './zip';

// Every export, generated on request from the run document (docs/specs/exports-and-mcp.md). The web
// app, the MCP server, the CLI and /open all call this, so the files are byte-identical.

export { DISCLAIMER, PROMPT_OPENING, defaultLine, designSystemMd, motionLine, patternWords, promptMd } from './documents';
export { byTier, easingVar, exportTokens, headerLine, spaceName, tokenRef, undeclaredVars, type ExportTokens } from './model';
export { durationRef, easingRef, motionCss, motionJson, patternClasses, suggestedEasing, triggerWords } from './motion';
export { componentCss } from './substitute';
export { bezierOf, type Bezier } from '../tokens/easing-table';
export { keyframesObject, siteVariablesBlock, tailwindTokens, tokenBlock, tokensCss, tokensJson, w3cShadow, w3cTokens } from './tokens';
export { crc32, zip, type ZipEntry } from './zip';
export { withTokenVars } from './substitute';

export type ExportOptions = { set?: ExportSet; runUrl: string; componentId?: string };
export type ExportFile = { filename: string; contentType: string; body: string };

const types: Record<Exclude<ExportFormat, 'all.zip'>, string> = {
  'tokens.css': 'text/css; charset=utf-8',
  'tokens.json': 'application/json',
  'tailwind.tokens.js': 'text/javascript; charset=utf-8',
  'tokens.w3c.json': 'application/json',
  'design-system.md': 'text/markdown; charset=utf-8',
  'prompt.md': 'text/markdown; charset=utf-8',
  'component-prompt.md': 'text/markdown; charset=utf-8',
  'motion.css': 'text/css; charset=utf-8',
  'motion.json': 'application/json',
};

export function generateExport(doc: RunDocumentPartial, format: Exclude<ExportFormat, 'all.zip'>, opts: ExportOptions): ExportFile {
  const set = opts.set ?? 'proposed';
  const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
  const body = (() => {
    switch (format) {
      case 'tokens.css':
        return tokensCss(doc, exportTokens(doc, set));
      case 'tokens.json':
        return json(tokensJson(doc, exportTokens(doc, set)));
      case 'tailwind.tokens.js':
        return tailwindTokens(doc, exportTokens(doc, set));
      case 'tokens.w3c.json':
        return json(w3cTokens(doc, exportTokens(doc, set)));
      case 'design-system.md':
        return designSystemMd(doc, set);
      case 'prompt.md':
        return promptMd(doc, set, opts.runUrl);
      case 'component-prompt.md':
        if (!opts.componentId) throw new Error('component-prompt.md needs a component');
        return promptMd(doc, set, opts.runUrl, opts.componentId);
      case 'motion.css':
        return motionCss(doc, exportTokens(doc, set));
      case 'motion.json':
        return json(motionJson(doc, exportTokens(doc, set)));
    }
  })();
  const filename = format === 'component-prompt.md' ? `${opts.componentId}-prompt.md` : format;
  return { filename, contentType: types[format], body };
}

/** Reads a stored file (a preview or a crop) by its storage key, or null when it is not there. */
export type AssetReader = (key: string) => Promise<Uint8Array | null>;

/** all.zip: every export, live previews with their CSS, crops for captured components, a README. */
export async function allZip(doc: RunDocumentPartial, opts: ExportOptions, read: AssetReader): Promise<Uint8Array> {
  const set = opts.set ?? 'proposed';
  const entries: ZipEntry[] = (['tokens.css', 'tokens.json', 'tailwind.tokens.js', 'tokens.w3c.json', 'motion.css', 'motion.json', 'design-system.md', 'prompt.md'] as const).map((f) => ({ path: f, data: generateExport(doc, f, { ...opts, set }).body }));
  const tokens = exportTokens(doc, set);
  for (const c of doc.components ?? []) {
    if (c.preview.mode === 'live' && c.preview.htmlKey) {
      const html = await read(c.preview.htmlKey);
      if (html) entries.push({ path: `components/${c.id}/preview.html`, data: html });
      entries.push({ path: `components/${c.id}/preview.css`, data: componentCss(c, tokens) });
    } else if (c.preview.cropKey) {
      const crop = await read(c.preview.cropKey);
      if (crop) entries.push({ path: `crops/${c.id}.png`, data: crop });
    }
  }
  entries.push({ path: 'README.txt', data: `Design System Extractor · ${doc.host} · run ${doc.id} · ${set} set\n\nThe run: ${opts.runUrl}\n\ntokens.css, tokens.json, tailwind.tokens.js and tokens.w3c.json hold the tokens; motion.css and motion.json the motion.\npreview.css files name the variables tokens.css declares.\ndesign-system.md describes the system for a repository; prompt.md is for a model.\ncomponents/ holds the live previews and their CSS; crops/ holds the captured ones.\n` });
  return zip(entries);
}
