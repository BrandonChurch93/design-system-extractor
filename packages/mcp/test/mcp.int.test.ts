import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Checks, Component, Drift, RunDocumentPartial, TokensJson } from '@dse/schema';

// A scripted MCP client over stdio against a local run (docs/specs/exports-and-mcp.md, Tests).

const runFile = resolve(import.meta.dirname, '../../pipeline/test/fixtures/runs/messy.json');
const doc = RunDocumentPartial.parse(JSON.parse(readFileSync(runFile, 'utf8')));
const bin = resolve(import.meta.dirname, '../src/bin.ts');

async function connect(args: string[], env: Record<string, string> = {}) {
  const client = new Client({ name: 'dse-test', version: '1.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ['--import', 'tsx', bin, ...args], env: { PATH: process.env.PATH ?? '', ...env }, stderr: 'pipe' }));
  return client;
}

const textOf = (r: unknown) => ((r as { content: { type: string; text: string }[] }).content[0]!.text);
const jsonOf = (r: unknown) => JSON.parse(textOf(r));

let client: Client;
beforeAll(async () => {
  client = await connect(['--file', runFile]);
}, 60_000);
afterAll(async () => {
  await client?.close();
});

describe('the MCP server over stdio', () => {
  it('lists every tool and the three resources', async () => {
    expect((await client.listTools()).tools.map((t) => t.name).sort()).toEqual(['get_checks', 'get_component', 'get_drift', 'get_motion', 'get_prompt', 'get_tokens', 'list_components']);
    expect((await client.listResources()).resources.map((r) => r.uri).sort()).toEqual([`dse://run/${doc.id}/design-system.md`, `dse://run/${doc.id}/motion.css`, `dse://run/${doc.id}/tokens.css`]);
  });

  it('get_motion returns motion.json for the run, or one component with its patterns, and get_component carries motion', async () => {
    const all = jsonOf(await client.callTool({ name: 'get_motion', arguments: {} }));
    expect(all.durations.length).toBeGreaterThan(0);
    expect(all.durations.length).toBeLessThanOrEqual(doc.tokens!.duration!.length);
    expect(all.patterns.length).toBe(doc.motion!.patterns.length);
    const moving = doc.components!.find((c) => c.motion?.transitions.length)!;
    const one = jsonOf(await client.callTool({ name: 'get_motion', arguments: { componentId: moving.id } }));
    expect(one.motion.transitions).toEqual(moving.motion!.transitions);
    expect(jsonOf(await client.callTool({ name: 'get_component', arguments: { id: moving.id } })).motion).toEqual(moving.motion);
    expect((await client.callTool({ name: 'get_motion', arguments: { componentId: 'nope' } })).isError).toBe(true);
  });

  it('get_tokens returns tokens.json, both sets, or one kind', async () => {
    const proposed = TokensJson.parse(jsonOf(await client.callTool({ name: 'get_tokens', arguments: {} })));
    const raw = TokensJson.parse(jsonOf(await client.callTool({ name: 'get_tokens', arguments: { set: 'raw' } })));
    expect(Object.keys(raw.color).length).toBeGreaterThan(Object.keys(proposed.color).length);
    const colorsOnly = jsonOf(await client.callTool({ name: 'get_tokens', arguments: { kind: 'color' } }));
    expect(Object.keys(colorsOnly).sort()).toEqual(['$meta', 'color']);
  });

  it('list_components, get_component and get_checks describe the components', async () => {
    const list = jsonOf(await client.callTool({ name: 'list_components', arguments: {} })) as { id: string; name: string; checksApplicable: number }[];
    expect(list).toHaveLength(doc.components!.length);
    const buttons = jsonOf(await client.callTool({ name: 'list_components', arguments: { type: 'button' } })) as { id: string }[];
    expect(buttons.length).toBeGreaterThan(1);
    const one = jsonOf(await client.callTool({ name: 'get_component', arguments: { id: list[0]!.id } }));
    Component.pick({ id: true, name: true, type: true, group: true, tokensUsed: true, code: true, checks: true, provenance: true }).parse(one);
    const byName = jsonOf(await client.callTool({ name: 'get_component', arguments: { name: list[0]!.name.toUpperCase() } }));
    expect(byName.id).toBe(list[0]!.id);
    Checks.parse(jsonOf(await client.callTool({ name: 'get_checks', arguments: {} })));
    expect(jsonOf(await client.callTool({ name: 'get_checks', arguments: { componentId: list[0]!.id } })).checks).toHaveLength(5);
    const missing = await client.callTool({ name: 'get_component', arguments: { id: 'nope' } });
    expect(missing.isError).toBe(true);
  });

  it('get_drift and get_prompt return the report and the prompts', async () => {
    const d = jsonOf(await client.callTool({ name: 'get_drift', arguments: {} }));
    Drift.pick({ headline: true, numbers: true, proposal: true, evidence: true, findingCount: true, narrative: true }).parse(d);
    expect(d.findingCount).toBe(16);
    const prompt = textOf(await client.callTool({ name: 'get_prompt', arguments: {} }));
    expect(prompt.startsWith('You are building an interface that must match this design system exactly.')).toBe(true);
    const one = textOf(await client.callTool({ name: 'get_prompt', arguments: { componentId: doc.components![0]!.id } }));
    expect(one.match(/^### /gm)).toHaveLength(1);
  });

  it('serves design-system.md, tokens.css and motion.css as resources', async () => {
    const md = await client.readResource({ uri: `dse://run/${doc.id}/design-system.md` });
    expect((md.contents[0] as { text: string }).text.startsWith('# localhost:4100 design system')).toBe(true);
    const css = await client.readResource({ uri: `dse://run/${doc.id}/tokens.css` });
    expect((css.contents[0] as { text: string }).text).toContain(':root {');
    const motion = await client.readResource({ uri: `dse://run/${doc.id}/motion.css` });
    expect((motion.contents[0] as { text: string }).text).toMatch(/@keyframes|transition/);
  });
});

describe('the MCP server reading a run from the app', () => {
  let server: Server;
  const hits: string[] = [];
  beforeAll(async () => {
    server = createServer((req, res) => {
      hits.push(req.url ?? '');
      if (req.url === `/api/runs/${doc.id}`) res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id: doc.id, status: 'complete', isShowcase: false, document: doc, events: [] }));
      else res.writeHead(404).end();
    });
    await new Promise<void>((ok) => server.listen(4410, ok));
  });
  afterAll(() => server?.close());

  it('fetches once with --run and the app URL, and once with --url', async () => {
    const byId = await connect(['--run', doc.id!, '--app-url', 'http://localhost:4410']);
    expect(jsonOf(await byId.callTool({ name: 'list_components', arguments: {} }))).toHaveLength(doc.components!.length);
    await byId.close();
    const byUrl = await connect(['--url', `http://localhost:4410/r/${doc.id}`]);
    expect(textOf(await byUrl.callTool({ name: 'get_prompt', arguments: {} })).trim().endsWith(`Source: http://localhost:4410/r/${doc.id}`)).toBe(true);
    await byUrl.close();
    expect(hits).toEqual([`/api/runs/${doc.id}`, `/api/runs/${doc.id}`]);
  }, 60_000);
});
