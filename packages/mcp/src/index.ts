import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { RunDocumentPartial } from '@dse/schema';
import { createServer } from './server';

// npx -y @design-system-extractor/mcp --run {id} | --url {runUrl} | --file ./run.json

export const DEFAULT_APP_URL = 'https://design-system-extractor.vercel.app';

export async function loadRun(argv: string[], env: NodeJS.ProcessEnv = process.env): Promise<{ doc: RunDocumentPartial; runUrl: string }> {
  const { values } = parseArgs({ args: argv, options: { run: { type: 'string' }, url: { type: 'string' }, file: { type: 'string' }, 'app-url': { type: 'string' } }, strict: true });
  if (values.file) {
    const doc = RunDocumentPartial.parse(JSON.parse(await readFile(values.file, 'utf8')));
    return { doc, runUrl: values.file };
  }
  let appUrl = (values['app-url'] ?? env.DSE_APP_URL ?? DEFAULT_APP_URL).replace(/\/$/, '');
  let id = values.run;
  if (values.url) {
    const u = new URL(values.url);
    const m = /\/r\/([0-9a-z]{10})/.exec(u.pathname);
    if (!m) throw new Error(`Not a run link: ${values.url}`);
    appUrl = u.origin;
    id = m[1];
  }
  if (!id) throw new Error('Give a run: --run {id}, --url {run link} or --file ./run.json');
  const res = await fetch(`${appUrl}/api/runs/${id}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`The run could not be read (${res.status}) from ${appUrl}`);
  const body = (await res.json()) as { document: unknown };
  return { doc: RunDocumentPartial.parse(body.document), runUrl: `${appUrl}/r/${id}` };
}

export async function main(argv: string[]): Promise<void> {
  const { doc, runUrl } = await loadRun(argv);
  await createServer(doc, runUrl).connect(new StdioServerTransport());
}
