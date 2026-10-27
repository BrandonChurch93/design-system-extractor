import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { global } from '../copy/strings';
import { blockedDetail, recentRuns, rememberRun, saveKey, savedKey, updateRecent, type RecentRun } from '../lib/browser-store';
import { submitRun } from '../lib/submit-run';

// What the browser remembers (docs/design/pages.md, /recent and Home) and how the visitor's key
// travels (docs/specs/caps-and-budget.md, BYO key). Storage that throws reads as empty.
// The unit project runs in node, so the window is a stand-in with in-memory storage.

const KEY = 'sk-ant-api03-test';
const run = (id: string, extra: Partial<RecentRun> = {}): RecentRun => ({ id, host: 'tidewater.app', createdAt: '2026-10-26T10:00:00.000Z', status: 'queued', ...extra });

class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(i: number) {
    return [...this.items.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
}

const localStorage = new MemoryStorage();
const sessionStorage = new MemoryStorage();
const win = { localStorage, sessionStorage } as Record<string, unknown>;

function breakStorage(which: 'localStorage' | 'sessionStorage') {
  Object.defineProperty(win, which, {
    configurable: true,
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  });
}

function answer(status: number, body: unknown = {}) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  for (const [k, v] of Object.entries({ localStorage, sessionStorage })) Object.defineProperty(win, k, { configurable: true, value: v });
  vi.stubGlobal('window', win);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dse_recent', () => {
  it('keeps the newest 50 runs, newest first, and replaces a run already in the list', () => {
    for (let i = 0; i < 55; i++) rememberRun(run(`run${String(i).padStart(7, '0')}`));
    const list = recentRuns();
    expect(list).toHaveLength(50);
    expect(list[0]!.id).toBe('run0000054');
    expect(list.at(-1)!.id).toBe('run0000005');
    rememberRun(run('run0000020', { status: 'running' }));
    expect(recentRuns()).toHaveLength(50);
    expect(recentRuns()[0]).toMatchObject({ id: 'run0000020', status: 'running' });
    expect(JSON.parse(localStorage.getItem('dse_recent')!)).toHaveLength(50);
  });

  it('updates a run on completion and leaves out runs this browser never made', () => {
    rememberRun(run('abcdefghij'));
    updateRecent('abcdefghij', { status: 'complete', stats: { colors: 23, typeStyles: 10, spacingSteps: 13, components: 31, checksPassed: 120, checksApplicable: 132 } });
    updateRecent('zzzzzzzzzz', { status: 'complete' });
    expect(recentRuns()).toEqual([expect.objectContaining({ id: 'abcdefghij', status: 'complete', stats: expect.objectContaining({ colors: 23 }) })]);
  });

  it('reads as the empty list when storage throws or holds something else', () => {
    localStorage.setItem('dse_recent', '{not json');
    expect(recentRuns()).toEqual([]);
    localStorage.setItem('dse_recent', '{"id":"x"}');
    expect(recentRuns()).toEqual([]);
    breakStorage('localStorage');
    expect(recentRuns()).toEqual([]);
    expect(() => rememberRun(run('abcdefghij'))).not.toThrow();
  });
});

describe('dse_key', () => {
  it('is stored in localStorage under dse_key and removed again', () => {
    saveKey(KEY);
    expect(localStorage.getItem('dse_key')).toBe(KEY);
    expect(savedKey()).toBe(KEY);
    saveKey(null);
    expect(localStorage.getItem('dse_key')).toBeNull();
    expect(savedKey()).toBeNull();
  });

  it('ignores a stored value that is not an Anthropic key', () => {
    localStorage.setItem('dse_key', 'hello');
    expect(savedKey()).toBeNull();
  });

  it('survives storage that throws: nothing saved, nothing read, nothing thrown', () => {
    breakStorage('localStorage');
    expect(() => saveKey(KEY)).not.toThrow();
    expect(savedKey()).toBeNull();
  });
});

describe('submitRun', () => {
  it('sends the saved key only as the x-byo-key header of POST /api/runs, never in the URL or body', async () => {
    saveKey(KEY);
    const fetchMock = answer(200, { id: 'abcdefghij', runsLeft: 1 });
    expect(await submitRun('https://www.tidewater.app/', ['https://tidewater.app/pricing'])).toEqual({ go: '/r/abcdefghij' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/runs');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['x-byo-key']).toBe(KEY);
    expect(JSON.parse(init.body as string)).toEqual({ url: 'https://www.tidewater.app/', include: ['https://tidewater.app/pricing'] });
    expect(`${url}${init.body as string}`).not.toContain(KEY);
  });

  it('sends no key header without a saved key, and remembers the created run', async () => {
    const fetchMock = answer(200, { id: 'abcdefghij', runsLeft: 1 });
    await submitRun('https://www.tidewater.app/', []);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers).not.toHaveProperty('x-byo-key');
    expect(JSON.parse(init.body as string)).toEqual({ url: 'https://www.tidewater.app/' });
    expect(recentRuns()).toEqual([expect.objectContaining({ id: 'abcdefghij', host: 'tidewater.app', status: 'queued' })]);
  });

  it('stores a blocked result in sessionStorage.dse_blocked and goes to its state route with the attempted URL', async () => {
    const detail = { resetsAt: '2026-10-27T06:00:00.000Z', used: 5, budget: 5, runsToday: 40 };
    answer(200, { blocked: 'budget', detail, runsLeft: 1 });
    expect(await submitRun('https://tidewater.app/', [])).toEqual({ go: `/state/budget?url=${encodeURIComponent('https://tidewater.app/')}` });
    expect(JSON.parse(sessionStorage.getItem('dse_blocked')!)).toEqual(detail);
    expect(blockedDetail()).toEqual(detail);
    expect(recentRuns()).toEqual([]);

    answer(200, { blocked: 'private-address', detail: { reason: 'private' }, runsLeft: 2 });
    expect(await submitRun('http://10.0.0.1/', [])).toEqual({ go: `/state/invalid?url=${encodeURIComponent('http://10.0.0.1/')}` });
  });

  it('still navigates on a blocked result when sessionStorage throws', async () => {
    breakStorage('sessionStorage');
    answer(200, { blocked: 'busy', detail: { queued: 21 }, runsLeft: 2 });
    expect(await submitRun('https://tidewater.app/', [])).toEqual({ go: `/state/busy?url=${encodeURIComponent('https://tidewater.app/')}` });
    expect(blockedDetail()).toBeNull();
  });

  it('answers 429 with the rate-limit line and 400 or a network failure with the validation line, inline', async () => {
    answer(429);
    expect(await submitRun('https://tidewater.app/', [])).toEqual({ error: global.rateLimit });
    answer(400, { error: 'invalid body' });
    expect(await submitRun('https://tidewater.app/', [])).toEqual({ error: global.validation });
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    expect(await submitRun('https://tidewater.app/', [])).toEqual({ error: global.validation });
    expect(recentRuns()).toEqual([]);
    expect(sessionStorage.getItem('dse_blocked')).toBeNull();
  });
});
