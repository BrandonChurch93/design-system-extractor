'use client';
import type { BlockedDetail, RunStatus, Stats } from '@dse/schema';

// What this browser remembers (docs/design/pages.md): recent runs, the visitor's key, and the
// detail of a pre-check block for its state page. Storage can be off or full; every access is
// guarded and a failure reads as empty.

export type RecentRun = { id: string; host: string; createdAt: string; status: RunStatus; stats?: Stats | null; palette?: { value: string; share: number }[]; blockedReason?: string };

const RECENT = 'dse_recent';
const KEY = 'dse_key';
const BLOCKED = 'dse_blocked';
const RECENT_CAP = 50;

function read<T>(store: () => Storage, key: string, fallback: T): T {
  try {
    const raw = store().getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(store: () => Storage, key: string, value: unknown): void {
  try {
    if (value === null) store().removeItem(key);
    else store().setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    // Storage unavailable: nothing is remembered.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export function recentRuns(): RecentRun[] {
  const list = read<unknown>(local, RECENT, []);
  return Array.isArray(list) ? (list.filter((r) => r && typeof r === 'object' && typeof (r as RecentRun).id === 'string') as RecentRun[]) : [];
}

/** Adds or updates a run, newest first, capped at 50. */
export function rememberRun(run: RecentRun): void {
  const rest = recentRuns().filter((r) => r.id !== run.id);
  const prev = recentRuns().find((r) => r.id === run.id);
  write(local, RECENT, [{ ...prev, ...run }, ...rest].slice(0, RECENT_CAP));
}

/** Updates a run already in the list; runs this browser never made are left out. */
export function updateRecent(id: string, patch: Partial<RecentRun>): void {
  const list = recentRuns();
  const i = list.findIndex((r) => r.id === id);
  if (i < 0) return;
  list[i] = { ...list[i]!, ...patch };
  write(local, RECENT, list);
}

export const isRecent = (id: string) => recentRuns().some((r) => r.id === id);

export function savedKey(): string | null {
  try {
    const v = local().getItem(KEY);
    return v && v.startsWith('sk-ant-') ? v : null;
  } catch {
    return null;
  }
}

export function saveKey(key: string | null): void {
  write(local, KEY, key);
}

export function storeBlocked(detail: BlockedDetail): void {
  write(session, BLOCKED, detail);
}

export function blockedDetail<T extends BlockedDetail>(): T | null {
  return read<T | null>(session, BLOCKED, null);
}
