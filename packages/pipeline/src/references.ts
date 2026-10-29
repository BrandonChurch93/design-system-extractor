import type { RunDocumentPartial } from '@dse/schema';

/** Every id one part of a run document names that no other part defines (D-105). Empty when every reference resolves. */
export function unresolvedReferences(doc: RunDocumentPartial): string[] {
  const out: string[] = [];
  const components = doc.components ?? [];
  const componentIds = new Set(components.map((c) => c.id));
  const pageIds = new Set((doc.pages ?? []).map((p) => p.id));
  const t = doc.tokens;
  const tokenIds = new Set(
    t ? [t.colors, t.overlays, t.type, t.space, t.radius, t.shadow, t.duration, t.easing].flatMap((list) => (list ?? []).map((x) => x.id)) : [],
  );
  const patterns = doc.motion?.patterns ?? [];
  const patternIds = new Set(patterns.map((p) => p.id));
  for (const p of patterns) if (p.componentId && !componentIds.has(p.componentId)) out.push(`motion.patterns[${p.id}].componentId ${p.componentId}`);
  for (const c of components) {
    for (const id of c.motion?.patternIds ?? []) if (!patternIds.has(id)) out.push(`components[${c.id}].motion.patternIds ${id}`);
    if (t) for (const r of c.tokensUsed) if (!tokenIds.has(r.tokenId)) out.push(`components[${c.id}].tokensUsed ${r.tokenId}`);
    if (doc.pages) for (const i of c.instances) if (!pageIds.has(i.pageId)) out.push(`components[${c.id}].instances[${i.id}].pageId ${i.pageId}`);
  }
  for (const s of doc.checks?.byCheck ?? []) for (const f of s.failing) if (!componentIds.has(f.componentId)) out.push(`checks.byCheck[${s.check}].failing ${f.componentId}`);
  return out;
}
