import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { RunDocumentPartial, TokensJson, type ExportFormat } from '@dse/schema';
import { allZip, crc32, generateExport, w3cShadow, zip } from '../src/exports';

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
