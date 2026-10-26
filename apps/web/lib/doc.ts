import type { CheckResult, Component, RunDocumentPartial } from '@dse/schema';

// Lookups over a run document that several regions share.

/** A stored file's URL: the storage origin in the app, the `dse serve` base for a local run. */
export function fileUrl(base: string | undefined, key: string | undefined): string | undefined {
  if (!base || !key) return undefined;
  return `${base.replace(/\/$/, '')}/${key}`;
}

export type TokenRef = { kind: 'color' | 'type' | 'space' | 'radius' | 'shadow'; name: string; value: string };

/** Every token by id, with the name a Tag shows and the value a popover leads with. */
export function tokenIndex(doc: RunDocumentPartial): Map<string, TokenRef> {
  const m = new Map<string, TokenRef>();
  const t = doc.tokens;
  for (const c of t?.colors ?? []) m.set(c.id, { kind: 'color', name: c.name, value: c.value });
  for (const x of t?.type ?? []) m.set(x.id, { kind: 'type', name: x.name, value: `${x.size} / ${x.lineHeight} · ${x.weight}` });
  for (const s of t?.space ?? []) m.set(s.id, { kind: 'space', name: `space-${s.value}`, value: `${s.value} px` });
  for (const r of t?.radius ?? []) m.set(r.id, { kind: 'radius', name: r.isPill ? 'radius-pill' : `radius-${r.value}`, value: r.isPill ? '9999 px' : `${r.value} px` });
  for (const s of t?.shadow ?? []) m.set(s.id, { kind: 'shadow', name: `shadow-${s.name}`, value: s.value });
  return m;
}

export function pagePaths(doc: RunDocumentPartial): Map<string, string> {
  return new Map((doc.pages ?? []).map((p) => [p.id, p.path]));
}

export function checkCounts(checks: CheckResult[]): { passed: number; applicable: number; failed: number } {
  const applicable = checks.filter((c) => c.status !== 'na');
  const passed = applicable.filter((c) => c.status === 'pass').length;
  return { passed, applicable: applicable.length, failed: applicable.length - passed };
}

/** Components in grid order: by group in the enum's order, then as the document lists them. */
export function orderedComponents(doc: RunDocumentPartial, groups: readonly string[]): Component[] {
  const list = doc.components ?? [];
  return [...list].sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || list.indexOf(a) - list.indexOf(b));
}
