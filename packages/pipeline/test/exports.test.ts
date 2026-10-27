import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { RunDocumentPartial, TokensJson, type ExportFormat } from '@dse/schema';
import { allZip, crc32, generateExport, w3cShadow, zip } from '../src/exports';
import { PROMPT_CODE_BUDGET, shorten, SNIPPET_CAP } from '../src/exports/documents';

// Golden files for every format from two fixture runs (docs/specs/exports-and-mcp.md, Tests).
// `env DSE_UPDATE_GOLDENS=1 pnpm test` rewrites them; a change is a decision to review.

const here = import.meta.dirname;
const runs = ['clean', 'messy'] as const;
const formats: Exclude<ExportFormat, 'all.zip'>[] = ['tokens.css', 'tokens.json', 'tailwind.tokens.js', 'tokens.w3c.json', 'design-system.md', 'prompt.md'];
const load = (name: string) => RunDocumentPartial.parse(JSON.parse(readFileSync(join(here, 'fixtures/runs', `${name}.json`), 'utf8')));
const runUrl = (doc: RunDocumentPartial) => `https://design-system-extractor.vercel.app/r/${doc.id}`;
const goldens = join(here, 'goldens/exports');
const update = process.env.DSE_UPDATE_GOLDENS === '1';

function golden(file: string, body: string) {
  const path = join(goldens, file);
  if (update) {
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, body);
  }
  expect(body).toBe(readFileSync(path, 'utf8'));
}

describe.each(runs)('exports of the %s fixture run', (name) => {
  const doc = load(name);
  it.each(formats.flatMap((f) => (['proposed', 'raw'] as const).map((set) => [f, set] as const)))('%s, %s set, matches its golden', (format, set) => {
    golden(`${name}/${set}/${format}`, generateExport(doc, format, { set, runUrl: runUrl(doc) }).body);
  });

  it('writes a component prompt for one component only', () => {
    const c = doc.components![0]!;
    const out = generateExport(doc, 'component-prompt.md', { runUrl: runUrl(doc), componentId: c.id });
    expect(out.filename).toBe(`${c.id}-prompt.md`);
    golden(`${name}/proposed/component-prompt.md`, out.body);
    expect(out.body.match(/^### /gm)).toHaveLength(1);
    expect(out.body.trim().endsWith(`Source: ${runUrl(doc)}`)).toBe(true);
  });

  it('keeps the voice in its prose and the shapes of its data', () => {
    for (const f of formats) {
      const body = generateExport(doc, f, { runUrl: runUrl(doc) }).body;
      if (f.endsWith('.md')) expect(body.replace(/(`{3,4})[\s\S]*?\1/g, '')).not.toMatch(/[\u2013\u2014]|\b(accessible|compliant|a11y)\b/i);
    }
    TokensJson.parse(JSON.parse(generateExport(doc, 'tokens.json', { runUrl: runUrl(doc) }).body));
    expect(generateExport(doc, 'tokens.css', { runUrl: runUrl(doc) }).body.split('\n')[0]).toBe(`/* Design System Extractor · localhost:4100 · run ${doc.id} · proposed set · 2026-10-12 */`);
    expect(generateExport(doc, 'prompt.md', { runUrl: runUrl(doc) }).body.startsWith('You are building an interface that must match this design system exactly.')).toBe(true);
  });

  it('validates tokens.w3c.json against the vendored DTCG schema, both sets', () => {
    const schema = JSON.parse(readFileSync(resolve(here, '../../schema/vendor/w3c-tokens.schema.json'), 'utf8'));
    const validate = new Ajv({ allErrors: true }).compile(schema);
    for (const set of ['proposed', 'raw'] as const) {
      const ok = validate(JSON.parse(generateExport(doc, 'tokens.w3c.json', { set, runUrl: runUrl(doc) }).body));
      expect(ok, JSON.stringify(validate.errors?.slice(0, 3))).toBe(true);
    }
  });
});

/** The file names in a zip's central directory. */
function centralNames(bytes: Uint8Array): string[] {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  const count = v.getUint16(end + 10, true);
  let at = v.getUint32(end + 16, true);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const len = v.getUint16(at + 28, true);
    out.push(new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + len)));
    at += 46 + len + v.getUint16(at + 30, true) + v.getUint16(at + 32, true);
  }
  return out;
}

describe('the exports module', () => {
  it('has no Node-only imports, so the browser and the CLI make the same files', () => {
    const dir = resolve(here, '../src/exports');
    for (const f of readdirSync(dir)) expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/from 'node:|require\(/);
  });

  it('rejects a DTCG file the schema forbids', () => {
    const schema = JSON.parse(readFileSync(resolve(here, '../../schema/vendor/w3c-tokens.schema.json'), 'utf8'));
    const validate = new Ajv().compile(schema);
    expect(validate({ color: { bad: { $type: 'color', $value: 'navy' } } })).toBe(false);
    expect(validate({ space: { s: { $type: 'dimension', $value: '4' } } })).toBe(false);
    expect(validate({ $foo: {} })).toBe(false);
  });

  it('turns a normalized shadow into DTCG values', () => {
    expect(w3cShadow('0px 1px 2px 0px #0B1F3A1F')).toEqual({ color: '#0B1F3A1F', offsetX: '0px', offsetY: '1px', blur: '2px', spread: '0px' });
    expect(w3cShadow('0px 8px 16px -2px #090A0C1A, 0px 0px 0px 1px #090A0C05')).toHaveLength(2);
  });

  it('zips files that a reader can list, with stable bytes and CRCs', async () => {
    expect(crc32(new TextEncoder().encode('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339);
    const a = zip([{ path: 'a.txt', data: 'hello' }]);
    expect(zip([{ path: 'a.txt', data: 'hello' }])).toEqual(a);
    const doc = load('clean');
    const bytes = await allZip(doc, { runUrl: runUrl(doc) }, async () => new Uint8Array([1, 2, 3]));
    const names = centralNames(bytes);
    const dir = mkdtempSync(join(tmpdir(), 'dse-zip-'));
    writeFileSync(join(dir, 'all.zip'), bytes);
    expect(execFileSync('unzip', ['-t', join(dir, 'all.zip')]).toString()).toContain('No errors detected');
    expect(names).toEqual(expect.arrayContaining(['tokens.css', 'design-system.md', 'prompt.md', 'README.txt', expect.stringMatching(/^components\/\w+\/preview\.html$/), expect.stringMatching(/^crops\/\w+\.png$/)]));
  });
});

describe('component CSS with token variables (D-069)', () => {
  it('writes a value that maps as its token variable, by property, and leaves the rest', async () => {
    const { withTokenVars } = await import('../src/exports/substitute');
    const t = {
      colors: [{ name: 'teal-500', value: '#0F8A8A', group: 'brand' as const, usage: 1 }],
      space: [{ name: 'space-8', value: 8 }, { name: 'space-16', value: 16 }],
      radius: [{ name: 'radius-md', value: 8, pill: false }],
      shadow: [{ name: 'shadow-sm', value: '0 1px 2px rgba(0, 0, 0, 0.08)' }],
    };
    const css = '.tag { background: rgb(15, 138, 138); color: #fff; padding: 0 8px; border-radius: 8px; width: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08); --x: 8px; }\n@media (min-width: 8px) { .a { margin: 16px 12px; } }';
    expect(withTokenVars(css, t)).toBe(
      '.tag { background: var(--color-teal-500); color: #fff; padding: 0 var(--space-8); border-radius: var(--radius-md); width: 8px; box-shadow: var(--shadow-sm); --x: 8px; }\n@media (min-width: 8px) { .a { margin: var(--space-16) 12px; } }',
    );
  });
});

describe('code in the whole-system documents (D-069)', () => {
  const css = (rules: number) => Array.from({ length: rules }, (_, i) => `.c${i} { color: #0B1F3A; padding: 4px; }`).join('\n');
  const note = /^shortened · ([\d,]+) of ([\d,]+) characters · the component's own prompt has all of it$/;

  it('cuts CSS past 4,000 and HTML past 3,000 characters at a boundary, with a comment saying so', () => {
    const long = css(120);
    const cut = shorten(long, 'css');
    const [kept, comment] = cut.split('\n/* ');
    expect(long.startsWith(kept!)).toBe(true);
    expect(kept!.length).toBeLessThanOrEqual(SNIPPET_CAP.css);
    expect(kept).toMatch(/[;}]$/);
    const [, k, total] = note.exec(comment!.replace(/ \*\/$/, ''))!;
    expect([k, total]).toEqual([kept!.length.toLocaleString('en-US'), long.length.toLocaleString('en-US')]);

    const html = `<ul>${Array.from({ length: 200 }, (_, i) => `<li class="item">Item ${i}</li>`).join('')}</ul>`;
    const [keptHtml, commentHtml] = shorten(html, 'html').split('\n<!-- ');
    expect(keptHtml!.length).toBeLessThanOrEqual(SNIPPET_CAP.html);
    expect(keptHtml!.endsWith('>')).toBe(true);
    expect(commentHtml).toMatch(/^shortened · [\d,]+ of [\d,]+ characters · the component's own prompt has all of it -->$/);
    expect(shorten(css(10), 'css')).toBe(css(10));
  });

  it('shortens a long snippet in design-system.md while the component prompt keeps all of it', () => {
    const doc = structuredClone(load('clean'));
    const c = doc.components![0]!;
    c.code.css = css(120);
    expect(generateExport(doc, 'design-system.md', { runUrl: runUrl(doc) }).body).toContain(`/* shortened · ${shorten(c.code.css, 'css').split('\n/* ')[0]!.length.toLocaleString('en-US')} of ${c.code.css.length.toLocaleString('en-US')} characters`);
    const own = generateExport(doc, 'component-prompt.md', { runUrl: runUrl(doc), componentId: c.id }).body;
    expect(own).toContain(c.code.css);
    expect(own).not.toContain('shortened');
  });

  it('keeps component CSS in prompt.md within 48,000 characters, in order, and says where the rest is', () => {
    const doc = structuredClone(load('clean'));
    const block = css(105);
    for (const c of doc.components!) c.code.css = block;
    const body = generateExport(doc, 'prompt.md', { runUrl: runUrl(doc) }).body;
    const blocks = body.split('## Components')[1]!.match(/```css\n[\s\S]*?\n```/g) ?? [];
    const fit = Math.floor(PROMPT_CODE_BUDGET / block.length);
    expect(blocks).toHaveLength(fit);
    expect(blocks.reduce((n, b) => n + b.length - '```css\n\n```'.length, 0)).toBeLessThanOrEqual(PROMPT_CODE_BUDGET);
    const sections = body.split('\n### ').slice(1);
    expect(sections.map((sec) => sec.includes('```css'))).toEqual(doc.components!.map((_, i) => i < fit));
    expect(body).toContain("Code for the components above without a CSS block is in each component's own prompt.");
  });
});
