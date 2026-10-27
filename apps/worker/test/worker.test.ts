import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Writable } from 'node:stream';
import type { Browser } from 'playwright';
import { describe, expect, it } from 'vitest';
import { capsFromEnv, createRedis } from '@dse/pipeline/queue';
import { BrowserPool, RESTART_EVERY_RUNS, RESTART_RSS_BYTES } from '../src/browser';
import { devMeterFor } from '../src/config';
import { RETENTION_PATTERN } from '../src/retention';
import { createLogger } from '../src/logger';

function fakeBrowser() {
  let open = true;
  return { isConnected: () => open, close: async () => void (open = false) } as unknown as Browser;
}

describe('the browser pool', () => {
  it('restarts Chromium every 25 runs', async () => {
    let launches = 0;
    const pool = new BrowserPool(async () => (launches++, fakeBrowser()), () => 100);
    for (let i = 1; i < RESTART_EVERY_RUNS; i++) {
      await pool.get();
      expect(await pool.afterRun()).toBe(false);
    }
    await pool.get();
    expect(await pool.afterRun()).toBe(true);
    await pool.get();
    expect(launches).toBe(2);
  });

  it('restarts when the worker passes 1.5 GB, and relaunches a browser that died', async () => {
    let rss = 100;
    let launches = 0;
    let last: Browser | null = null;
    const pool = new BrowserPool(async () => (launches++, (last = fakeBrowser())), () => rss);
    await pool.get();
    rss = RESTART_RSS_BYTES + 1;
    expect(await pool.afterRun()).toBe(true);
    rss = 100;
    await pool.get();
    await last!.close();
    await pool.get();
    expect(launches).toBe(3);
  });
});

describe('security · the worker log', () => {
  it('censors key fields if one is ever passed to it', () => {
    const lines: string[] = [];
    const log = createLogger(new Writable({ write: (c, _e, cb) => (lines.push(String(c)), cb()) }) as never);
    const key = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz';
    log.info({ byoKey: key, job: { data: { byoKeyCiphertext: 'sealed' } }, nested: { apiKey: key }, headers: { 'x-byo-key': key } }, 'x');
    log.child({ runId: 'abcdefghij' }).warn({ byoKeyCiphertext: 'sealed' }, 'y');
    const text = lines.join('');
    expect(text).not.toContain(key);
    expect(text).not.toContain('sealed');
    expect(text).toContain('"runId":"abcdefghij"');
  });
});

describe('worker settings', () => {
  it('ignores the build spend cap in production and keeps it elsewhere', () => {
    const root = mkdtempSync(join(tmpdir(), 'dse-devcap-'));
    expect(devMeterFor({ NODE_ENV: 'production', DSE_DEV_SPEND_CAP_USD: '20' }, root)).toBeUndefined();
    expect(devMeterFor({ NODE_ENV: 'development', DSE_DEV_SPEND_CAP_USD: '20' }, root)).toBeDefined();
  });

  it('runs retention daily at 03:00 in the budget time zone', () => {
    expect(RETENTION_PATTERN).toBe('0 3 * * *');
    expect(capsFromEnv({}).timezone).toBe('America/Boise');
    expect(readFileSync(resolve(import.meta.dirname, '../src/index.ts'), 'utf8')).toContain('upsertJobScheduler(RETENTION_JOB, { pattern: RETENTION_PATTERN, tz: capsFromEnv(env).timezone }');
  });

  it('speaks TLS to a rediss:// URL', () => {
    const r = createRedis('rediss://default:pw@example.upstash.io:6379', { lazyConnect: true });
    expect(r.options.tls).toBeDefined();
    r.disconnect();
    const plain = createRedis('redis://localhost:6379', { lazyConnect: true });
    expect(plain.options.tls).toBeUndefined();
    plain.disconnect();
  });
});
