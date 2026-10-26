import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Every check detail the product may show, as patterns read from docs/specs/checks.md.

const doc = readFileSync(resolve(import.meta.dirname, '../../../../docs/specs/checks.md'), 'utf8');

const holes: Record<string, string> = {
  ratio: '\\d+\\.\\d:1',
  bgToken: '(?:[a-z]+(?:-[a-z0-9]+)*|#[0-9A-F]{6})',
  ground: '(?:[a-z]+(?:-[a-z0-9]+)*|#[0-9A-F]{6})',
  threshold: '(?:4\\.5|3):1',
  px: '\\d+',
  w: '\\d+',
  h: '\\d+',
  shortfall: '\\d+',
};

export function detailTemplates(): RegExp[] {
  const lines = doc.split('\n').filter((l) => l.startsWith('Detail strings:') || l.includes('`Not measured: capture cap`') || l.includes('`Not applicable`'));
  const strings = new Set<string>();
  for (const l of lines) for (const m of l.matchAll(/`([^`]+)`/g)) if (!/^\{[a-zA-Z]+\}$/.test(m[1]!) && !['na', 'aria-labelledby', 'title'].includes(m[1]!)) strings.add(m[1]!);
  return [...strings].map((t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\w+)\\\}/g, (_m, k: string) => holes[k] ?? '.+')}$`));
}

export const matchesTemplate = (detail: string) => detailTemplates().some((r) => r.test(detail));
