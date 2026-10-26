// pnpm showcase [--remote] [--only host] [--alternates] [--refresh-links] [--dry-run] (docs/specs/showcase.md, D-063)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { pino } from 'pino';
import { allowedPrivateHosts, RunDocumentPartial, RunResponse, ShowcaseContent, type RunStatus, type ShowcaseEntry } from '@dse/schema';
import { closeDb, isTerminal, setShowcase, syncShowcase, tables } from '@dse/pipeline/db';
import { defaultRecordingsDir } from '@dse/pipeline/models/client';
import { DevSpendMeter } from '@dse/pipeline/models/meter';
import { BrowserPool } from '../../apps/worker/src/browser';
import { createRunWorker } from '../../apps/worker/src/worker';
import { admitRun } from '../../apps/web/lib/server/runs';
import { servicesFromEnv } from '../../apps/web/lib/server/services';
import { entryFor, nextAlternate, refreshLinks, toMultipleOfSix, unusable, withEntry, type Finished } from './plan';
import { alternates, roster, type Site } from './roster';

const root = resolve(import.meta.dirname, '../..');
const contentFile = resolve(root, 'apps/web/content/showcase.json');
const reportFile = resolve(root, '.dse/showcase-report.md');
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
const env = process.env;
const appUrl = (env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set');

type Outcome = Finished & { id: string; costUsd: number };
type Backend = {
  run(site: Site): Promise<Outcome | { id: null; reason: string }>;
  publish(content: ShowcaseContent): Promise<void>;
  /** Stops spending before a site, when the build meter says so (local live runs only). */
  stop(): Promise<string | null>;
  /** A run that was tried and not listed. */
  discard(id: string): Promise<void>;
  close(): Promise<void>;
};

const readContent = () => ShowcaseContent.parse(JSON.parse(readFileSync(contentFile, 'utf8')));
const writeContent = (c: ShowcaseContent) => writeFileSync(contentFile, `${JSON.stringify(c, null, 2)}\n`);

async function localBackend(): Promise<Backend> {
  if (env.NODE_ENV === 'production') throw new Error('the local showcase path is for development; use --remote');
  const svc = servicesFromEnv(env);
  const meter = DevSpendMeter.fromEnv(root, env);
  const viewer = { visitorId: 'showcaseowner000', userId: null, plan: 'free' as const, byoKey: false, ipHash: 'showcaseowner', cookieMissing: false };
  const age = await svc.counters.heartbeatAge();
  let own: { close(): Promise<void> } | null = null;
  if (age === null || age >= 45) {
    // No worker is running (pnpm dev): run one here, configured as the worker service is.
    const browsers = new BrowserPool();
    const connection = svc.redis.duplicate();
    const worker = createRunWorker({
      db: svc.db,
      connection,
      counters: svc.counters,
      storage: svc.storage,
      browsers,
      log: pino({ level: 'warn' }),
      config: {
        encryptionKey: svc.encryptionKey,
        modelMode: (env.DSE_MODEL_MODE as 'live' | 'record' | 'replay' | undefined) ?? 'live',
        apiKey: env.ANTHROPIC_API_KEY,
        recordingsDir: defaultRecordingsDir(root),
        strictReplay: false,
        userAgent: env.DSE_USER_AGENT ?? `DesignSystemExtractorBot/1.0 (+${appUrl}/how-it-works)`,
        appUrl,
        timeoutMs: Number(env.DSE_RUN_TIMEOUT_MS ?? 360_000),
        allowPrivateHosts: allowedPrivateHosts(env),
        keepIntermediate: false,
        devMeter: meter,
      },
    });
    own = {
      close: async () => {
        await worker.close();
        await browsers.close();
        connection.disconnect();
      },
    };
  }
  return {
    async run(site) {
      const result = await admitRun(svc, { body: { url: site.url }, viewer, showcase: true });
      if (result.kind === 'blocked') return { id: null, reason: `blocked · ${result.body.blocked}` };
      if (result.kind !== 'created') return { id: null, reason: result.kind };
      const id = result.body.id;
      for (;;) {
        const [row] = await svc.db.select().from(tables.runs).where(eq(tables.runs.id, id));
        if (row && isTerminal(row.status as RunStatus)) {
          const doc = RunDocumentPartial.parse(row.document);
          return { id, status: row.status as RunStatus, doc, costUsd: doc.cost?.usd ?? 0 };
        }
        await new Promise((ok) => setTimeout(ok, 3000));
      }
    },
    async publish(content) {
      const synced = await syncShowcase(svc.db, content.entries.map((e) => e.runId));
      if (!synced.ok) throw new Error(`not complete: ${synced.missing.join(', ')}`);
      writeContent(content);
    },
    async stop() {
      if ((env.DSE_MODEL_MODE ?? 'live') === 'replay') return null;
      const d = await meter.allowLive();
      return d.ok ? null : d.reason;
    },
    async discard(id) {
      await setShowcase(svc.db, id, false);
    },
    async close() {
      await own?.close();
      await svc.queue.close();
      svc.redis.disconnect();
      await closeDb(svc.db);
    },
  };
}

function remoteBackend(): Backend {
  const token = env.DSE_ADMIN_TOKEN;
  if (!token) throw new Error('DSE_ADMIN_TOKEN is not set');
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${appUrl}${path}`, { ...init, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`${path} answered ${res.status}`);
    return res.json() as Promise<unknown>;
  };
  return {
    async run(site) {
      const body = (await call('/api/admin/showcase/run', { method: 'POST', headers, body: JSON.stringify({ url: site.url }) })) as { id?: string; blocked?: string };
      if (!body.id) return { id: null, reason: `blocked · ${body.blocked ?? 'unknown'}` };
      for (;;) {
        await new Promise((ok) => setTimeout(ok, 5000));
        const r = RunResponse.parse(await call(`/api/runs/${body.id}`));
        if (isTerminal(r.status)) return { id: body.id, status: r.status, doc: r.document, costUsd: r.document.cost?.usd ?? 0 };
      }
    },
    async publish(content) {
      await call('/api/admin/showcase/content', { method: 'POST', headers, body: JSON.stringify(content) });
      writeContent(content);
    },
    stop: async () => null,
    // A run left out of the content is not listed; the content route takes it out of the showcase.
    discard: async () => {},
    close: async () => {},
  };
}

type Row = { order: number; host: string; result: string; doc?: RunDocumentPartial; costUsd: number; replacedBy?: string };

function table(rows: Row[]): string {
  const head = '| Order | Site | Result | Pages | Colors | Type styles | Spacing steps | Components | Checks passed | Duration | Cost |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const line = (r: Row) => {
    const s = r.doc?.stats;
    const dur = r.doc?.durationMs ? `${Math.floor(r.doc.durationMs / 60000)} min ${Math.round((r.doc.durationMs % 60000) / 1000)} s` : '';
    const result = r.replacedBy ? `${r.result} · replaced by ${r.replacedBy}` : r.result;
    return `| ${r.order} | ${r.host} | ${result} | ${r.doc?.pages?.length ?? ''} | ${s?.colors ?? ''} | ${s?.typeStyles ?? ''} | ${s?.spacingSteps ?? ''} | ${s?.components ?? ''} | ${s ? `${s.checksPassed} of ${s.checksApplicable}` : ''} | ${dur} | $${r.costUsd.toFixed(3)} |`;
  };
  const total = rows.reduce((t, r) => t + r.costUsd, 0);
  return `${head}\n${rows.map(line).join('\n')}\n\nTotal cost $${total.toFixed(3)}.`;
}

async function main() {
  if (flag('alternates')) {
    console.log('| Site | Category |\n| --- | --- |');
    for (const a of alternates) console.log(`| ${a.host} | ${a.category} |`);
    return;
  }
  const remote = flag('remote');
  if (flag('refresh-links')) {
    const content = refreshLinks(readContent(), appUrl);
    if (remote) await remoteBackend().publish(content);
    else writeContent(content);
    console.log(`showcase · ${content.entries.length} links now point at ${appUrl}`);
    return;
  }

  const dry = flag('dry-run');
  const backend = remote ? remoteBackend() : await localBackend();
  const rows: Row[] = [];
  const entries: ShowcaseEntry[] = [];
  const tried = new Set<string>([...roster.map((s) => s.host)]);
  let stopped: string | null = null;

  /** Runs a site, then its alternates while it blocks or comes back sparse. */
  async function place(first: Site, order: number): Promise<ShowcaseEntry | null> {
    let site: Site | null = first;
    let previous: Row | null = null;
    while (site) {
      stopped = await backend.stop();
      if (stopped) return null;
      console.log(`showcase · ${order} · ${site.host}`);
      const out = await backend.run(site);
      const row: Row = { order, host: site.host, result: 'complete', costUsd: out.id ? out.costUsd : 0 };
      if (previous) previous.replacedBy = site.host;
      rows.push(row);
      if (out.id === null) row.result = out.reason;
      else {
        row.doc = out.doc;
        const why = unusable(out);
        if (!why) {
          if (dry) await backend.discard(out.id);
          return entryFor(site, order, out.id, out.doc, appUrl);
        }
        row.result = why;
        await backend.discard(out.id);
      }
      previous = row;
      site = nextAlternate(site.category, tried);
      if (site) tried.add(site.host);
    }
    return null;
  }

  try {
    if (only) {
      const site = roster.find((s) => s.host === only) ?? alternates.find((s) => s.host === only);
      const current = readContent();
      const order = roster.find((s) => s.host === only)?.order ?? current.entries.find((e) => e.host === only)?.order;
      if (!site || !order) throw new Error(`--only takes a roster host or an alternate already listed: ${only}`);
      const out = await backend.run(site);
      const why = out.id === null ? out.reason : unusable(out);
      rows.push({ order, host: site.host, result: why ?? 'complete', doc: out.id ? out.doc : undefined, costUsd: out.id ? out.costUsd : 0 });
      if (!why && out.id && !dry) await backend.publish(withEntry(current, entryFor(site, order, out.id, out.doc, appUrl), new Date().toISOString()));
    } else {
      for (const s of roster) {
        const e = await place(s, s.order);
        if (e) entries.push(e);
        if (stopped) break;
      }
      const listed = toMultipleOfSix(entries);
      if (!dry) {
        if (!listed.length) throw new Error('no site completed; the showcase content is unchanged');
        await backend.publish(ShowcaseContent.parse({ generatedAt: new Date().toISOString(), appUrl, entries: listed }));
      }
      console.log(`showcase · ${listed.length} entries ${dry ? 'would be listed (dry run, nothing written)' : 'listed'}${listed.length < entries.length ? `; ${entries.length - listed.length} left out to keep a multiple of six` : ''}`);
    }
  } finally {
    await backend.close();
  }

  const report = `${table(rows)}${stopped ? `\n\nStopped: ${stopped}.` : ''}\n`;
  mkdirSync(dirname(reportFile), { recursive: true });
  writeFileSync(reportFile, report);
  console.log(`\n${report}\nshowcase · report written to .dse/showcase-report.md`);
}

await main();
