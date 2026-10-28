import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as labels from '@dse/schema/labels';
import { links } from '../copy/links';
import * as strings from '../copy/strings';

const web = resolve(import.meta.dirname, '..');
const root = resolve(web, '../..');
const copyMd = readFileSync(resolve(root, 'docs/design/copy.md'), 'utf8');

function walk(dir: string): string[] {
  return readdirSync(resolve(web, dir), { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return [];
    const p = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(p) : [p];
  });
}
const tsx = [...walk('app'), ...walk('components')].filter((f) => f.endsWith('.tsx')).sort();

function flatten(value: unknown, path: string, out: [string, string][]) {
  if (typeof value === 'string') out.push([path, value]);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) flatten(v, `${path}.${k}`, out);
}

describe('copy audit', () => {
  const all: [string, string][] = [];
  for (const [k, v] of Object.entries(strings)) flatten(v, k, all);

  it('has strings to audit', () => {
    expect(all.length).toBeGreaterThan(40);
  });

  it('takes every string in strings.ts verbatim from copy.md', () => {
    const missing = all.filter(([, v]) => !copyMd.includes(v)).map(([p, v]) => `${p}: ${v}`);
    expect(missing).toEqual([]);
  });

  it('has no em dash and no exclamation mark in any string', () => {
    for (const [p, v] of all) {
      expect(v.includes(String.fromCharCode(0x2014)), p).toBe(false);
      expect(v.includes('!'), p).toBe(false);
    }
  });
});

describe('copy audit · the other direction', () => {
  const placeholders = (v: string) => v.replace(/\$\{[^}\n]*\}/g, '{}').replace(/\{[\w ]+\}/g, '{}');
  // Lines the pipeline writes into the run document (drift headlines, worker failure details,
  // missing-state reasons); copy.md lists them with the rest of the visible copy.
  const pipeline = ['drift/report.ts', 'errors.ts', 'models/client.ts', 'run.ts', 'stages/components.ts', 'components/naming.ts', 'exports/documents.ts'].map((f) => readFileSync(resolve(root, 'packages/pipeline/src', f), 'utf8'));
  const implemented: string[] = [...Object.values(links)];
  collect(strings, implemented);
  collect(labels, implemented);
  const corpus = placeholders([...implemented, ...pipeline].join('\n'));
  // Examples that show a composed result rather than a string of their own.
  const examples = ['Primary small', 'Teal', 'Ghost rounded', 'Button (footer)', 'Button (footer, pricing)', 'Button (footer, second)', 'Six variants across four components where three would do. Nine spacing values, two of them off the 4 px grid.', 'Buttons, cards and 2 scroll reveals', 'Buttons and links', '1 entrance', '0.8×', '0.65×'];
  // Names quoted for reference: enum keys, an env var, a metadata value, the shadow bucket names from the run.
  const references = ['discover', 'invalid-url', 'private-address', 'summary_large_image', 'DSE_CONTACT_EMAIL', 'lg'];

  function collect(value: unknown, out: string[]) {
    if (typeof value === 'string') out.push(value);
    else if (value && typeof value === 'object') for (const v of Object.values(value)) collect(v, out);
  }

  it('implements every quoted string in copy.md, in strings.ts, labels.ts or the pipeline line that renders it', () => {
    const body = copyMd.slice(copyMd.indexOf('\n## Global'));
    const quoted = [...body.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]!);
    expect(quoted.length).toBeGreaterThan(400);
    const missing = new Set<string>();
    for (const q of quoted) {
      if (examples.includes(q)) continue;
      // Configured limits are rendered from the entitlements (rule 10), so a number stands for its placeholder.
      for (const part of q.split(' · ')) {
        const p = part.trim();
        if (!p || /^\{[^}]+\}$/.test(p) || references.includes(p) || /^[^\s]*\/[^\s]*$/.test(p)) continue;
        const norm = placeholders(p);
        if (!corpus.includes(norm) && !corpus.includes(norm.replace(/\d+/g, '{}'))) missing.add(q === p ? q : `${p} (in ${q})`);
      }
    }
    expect([...missing]).toEqual([]);
  });
});

describe('copy rules', () => {
  const all: [string, string][] = [];
  for (const [k, v] of Object.entries(strings)) flatten(v, k, all);
  for (const [k, v] of Object.entries(labels)) flatten(v, `labels.${k}`, all);

  it('never says "AI" in product copy (rule 6)', () => {
    const ai = /\bAI\b/;
    expect(all.filter(([, v]) => ai.test(v)).map(([p]) => p)).toEqual([]);
    expect(tsx.filter((f) => ai.test(readFileSync(resolve(web, f), 'utf8').replace(/\/\/.*$/gm, '')))).toEqual([]);
  });

  it('writes headings, labels, buttons and tags in sentence case (rule 2)', () => {
    // Proper nouns: the product, people, places, products and plans, and the pronoun I. Acronyms are not capitalized words.
    const proper = new Set('I Design System Extractor Brandon Church GitHub Anthropic Claude Code Desktop ChatGPT Tailwind Haiku Sonnet Chromium Chrome Mountain DesignSystemExtractorBot Idaho United States Pro Team Free Bootstrap Chakra CSS-in-JS'.split(' '));
    const bad: string[] = [];
    for (const [path, v] of all) {
      if (v.includes('\n') || /^(npx|claude|npm|dse) /.test(v)) continue;
      for (const segment of v.split(/(?<=[.?:;])\s+|\s+·\s+|\s+\/\s+|\s+→\s+/)) {
        const words = segment.split(/\s+/).slice(1);
        for (const w of words) {
          if (w.startsWith('{')) continue;
          const bare = /[\p{L}\p{N}-]+/u.exec(w)?.[0] ?? '';
          if (/^\p{Lu}/u.test(bare) && !proper.has(bare) && !/^[\p{Lu}\p{N}]{2,}$/u.test(bare)) bad.push(`${path}: ${bare} in "${v}"`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('shows run ids in mono (rule 11)', () => {
    const mono = (module: string, cls: string) => {
      const css = readFileSync(resolve(web, module), 'utf8');
      const block = new RegExp(`\\.${cls} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';
      return /composes: (meta|code|hex|tag) from '[./]+styles\/type\.module\.css'/.test(block) || /font-family: var\(--dse-(font-mono|type-(meta|code|hex|tag)-family)\)/.test(block);
    };
    const rendered = [
      { file: 'components/recent/RecentRunRow.tsx', expr: 'run.id', module: 'components/recent/RecentRunRow.module.css' },
      { file: 'components/compare/CompareView.tsx', expr: 'doc.id', module: 'components/compare/CompareView.module.css' },
      { file: 'components/run/RunView.tsx', expr: 'id', module: 'components/run/RunView.module.css' },
    ];
    for (const r of rendered) {
      const src = readFileSync(resolve(web, r.file), 'utf8');
      const cls = new RegExp(`className=\\{styles\\.(\\w+)\\}>\\{${r.expr.replace('.', '\\.')}\\}<`).exec(src)?.[1];
      expect(cls, r.file).toBeDefined();
      expect(mono(r.module, cls!), `${r.module} .${cls}`).toBe(true);
    }
    // The footer and the failed and cancelled bodies set the id through withRunId; nothing interpolates it bare.
    expect(readFileSync(resolve(web, 'components/run/RunView.tsx'), 'utf8')).not.toMatch(/\{ id \}|'\{id\}', id\)/);
  });
});

describe('copy audit · JSX reads its copy from strings.ts', () => {
  // The catalog's demos render sample run data (docs/design/pages.md, /catalog); the catalog's own
  // chrome (CatalogView) is held to the rule like every other surface.
  const sampleData = new Set(['components/catalog/demos.tsx', 'components/catalog/page-demos.tsx', 'components/catalog/v2-demos.tsx', 'components/catalog/MotionDemo.tsx']);
  const userFacing = new Set(['aria-label', 'aria-description', 'title', 'alt', 'placeholder', 'label', 'caption', 'eyebrow', 'body']);

  it('holds no literal copy in any component or route', () => {
    expect(tsx.length).toBeGreaterThan(80);
    const literal: string[] = [];
    for (const f of tsx) {
      if (sampleData.has(f)) continue;
      const sf = ts.createSourceFile(f, readFileSync(resolve(web, f), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const at = (n: ts.Node) => `${f}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
      const words = (t: string) => /\p{L}{2,}/u.test(t);
      const visit = (n: ts.Node) => {
        if (ts.isJsxText(n) && words(n.text)) literal.push(`${at(n)} ${n.text.trim()}`);
        if (ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer) && userFacing.has(n.name.getText(sf)) && words(n.initializer.text)) literal.push(`${at(n)} ${n.name.getText(sf)}="${n.initializer.text}"`);
        if (ts.isJsxExpression(n) && n.expression && !ts.isJsxAttribute(n.parent)) {
          const e = n.expression;
          const text = ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) ? e.text : ts.isTemplateExpression(e) ? [e.head.text, ...e.templateSpans.map((x) => x.literal.text)].join(' ') : '';
          if (words(text)) literal.push(`${at(n)} ${text}`);
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    expect(literal).toEqual([]);
  });
});
