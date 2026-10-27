import type * as ChildProcess from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extract, type Io } from '../src/index';

// The CLI's first run: Playwright's Chromium is installed after asking (docs/specs/exports-and-mcp.md,
// The CLI). The browser, the prompt and the installer are stood in.

const m = vi.hoisted(() => ({ launch: vi.fn(), answer: { value: '' }, install: vi.fn(() => ({ status: 0 })), run: vi.fn() }));
vi.mock('@dse/pipeline/crawl/browser', () => ({ launchBrowser: m.launch }));
vi.mock('@dse/pipeline/run', () => ({ PIPELINE_VERSION: '1.0.0', runPipeline: m.run }));
vi.mock('node:readline/promises', () => ({ createInterface: () => ({ question: async () => m.answer.value, close: () => {} }) }));
vi.mock('node:child_process', async (importOriginal) => ({ ...(await importOriginal<typeof ChildProcess>()), spawnSync: m.install }));

const missing = () => Promise.reject(new Error("browserType.launch: Executable doesn't exist at /ms-playwright/chromium"));
const browser = { close: async () => {} };
// The CLI's main prints a thrown message and exits 1; these call extract directly.
const io = (interactive: boolean) => ({ io: { out: () => {}, err: () => {}, env: {}, interactive } as Io });
const out = () => join(mkdtempSync(join(tmpdir(), 'dse-install-')), 'run');

beforeEach(() => {
  m.launch.mockReset();
  m.install.mockClear();
  m.run.mockReset().mockResolvedValue({ status: 'blocked', reason: 'robots', detail: { attempts: [] } });
});

describe('the first run without Chromium', () => {
  it('names the install command and runs nothing when it cannot ask', async () => {
    m.launch.mockImplementationOnce(missing);
    const t = io(false);
    await expect(extract(['https://example.com/', '--out', out()], t.io)).rejects.toThrow(/^Chromium for Playwright is not installed\. Run: npx playwright@\d+\.\d+\.\d+ install chromium$/);
    expect(m.install).not.toHaveBeenCalled();
    expect(m.run).not.toHaveBeenCalled();
  });

  it('asks, and runs nothing when the answer is no', async () => {
    m.launch.mockImplementationOnce(missing);
    m.answer.value = 'n';
    const t = io(true);
    await expect(extract(['https://example.com/', '--out', out()], t.io)).rejects.toThrow('Chromium is needed to crawl. Nothing was run.');
    expect(m.install).not.toHaveBeenCalled();
  });

  it('installs on yes, the default, and then crawls', async () => {
    m.launch.mockImplementationOnce(missing).mockResolvedValueOnce(browser);
    m.answer.value = '';
    const t = io(true);
    expect(await extract(['https://example.com/', '--out', out()], t.io)).toBe(2);
    expect(m.install).toHaveBeenCalledWith('npx', ['-y', expect.stringMatching(/^playwright@\d/), 'install', 'chromium'], { stdio: 'inherit' });
    expect(m.launch).toHaveBeenCalledTimes(2);
    expect(m.run).toHaveBeenCalledTimes(1);
  });
});
