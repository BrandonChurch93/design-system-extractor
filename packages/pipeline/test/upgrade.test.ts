import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunDocumentComplete, RunDocumentPartial, TypeRole } from '@dse/schema';
import { describe, expect, it } from 'vitest';
import { upgradeRunDocument } from '../src/upgrade';

const read = (name: string) => JSON.parse(readFileSync(resolve(import.meta.dirname, 'fixtures/runs', name), 'utf8'));
const v10 = read('clean-v1-0.json');

describe('upgradeRunDocument (D-092)', () => {
  it('the v1.0 document fails the current schema as stored, which is the Compare error', () => {
    const r = RunDocumentPartial.safeParse(v10);
    expect(r.success).toBe(false);
    expect(r.error!.issues.some((i) => i.path[0] === 'tokens' && i.path[1] === 'type' && i.path[3] === 'role')).toBe(true);
  });

  it('brings a complete v1.0 document to the complete current shape and leaves its version', () => {
    const up = upgradeRunDocument(v10);
    const doc = RunDocumentComplete.parse(up);
    expect(doc.pipelineVersion).toBe('1.0.0');
    expect(doc.motion).toEqual({ patterns: [], truncatedPages: [], intersectionObservers: 0 });
    expect(doc.tokens.breakpoints).toEqual([{ value: 640, usage: 0 }, { value: 1024, usage: 0 }]);
    expect(doc.components.every((c) => c.tier === 'core' && c.motion === null)).toBe(true);
    expect(new Set(doc.components.map((c) => c.slug)).size).toBe(doc.components.length);
    expect(doc.stats.componentsPassing).toEqual({ passed: expect.any(Number), applicable: expect.any(Number) });
    expect(doc.stats.previews!.live).toBe(doc.components.filter((c) => c.preview.mode === 'live').length);
    expect(doc.drift.proposal.durations).toEqual([]);
  });

  it('is pure and idempotent: upgrading twice equals upgrading once', () => {
    const before = JSON.stringify(v10);
    const once = upgradeRunDocument(v10);
    expect(JSON.stringify(v10)).toBe(before);
    expect(upgradeRunDocument(once)).toEqual(once);
  });

  it('recomputes type roles and names by size against body, keeping ids so references resolve', () => {
    const doc = RunDocumentComplete.parse(upgradeRunDocument(v10));
    const byId = new Map(doc.tokens.type.map((t) => [t.id, t]));
    expect(doc.tokens.type.map((t) => t.id)).toEqual(v10.tokens.type.map((t: { id: string }) => t.id));
    expect(doc.tokens.type.every((t) => TypeRole.options.includes(t.role) && t.tags.length === 0 && typeof t.uppercase === 'boolean')).toBe(true);
    expect(new Set(doc.tokens.type.map((t) => t.name)).size).toBe(doc.tokens.type.length);
    // 36 px over a 16 px body is a title, not an h1.
    expect(byId.get('2wdzp9t5')).toMatchObject({ role: 'title', name: 'title' });
    expect(doc.tokens.type.find((t) => t.size === 16)!.role).toBe('body');
    const typeRefs = doc.components.flatMap((c) => c.tokensUsed).filter((r) => r.property === 'font');
    expect(typeRefs.length).toBeGreaterThan(0);
    for (const r of typeRefs) expect(byId.has(r.tokenId)).toBe(true);
    const names = new Set(doc.tokens.type.map((t) => t.name));
    for (const p of doc.drift.proposal.type) expect(TypeRole.options).toContain(p.role);
    expect(doc.drift.proposal.type.filter((p) => names.has(p.name)).length).toBe(doc.drift.proposal.type.length);
  });

  it('leaves a current document as it is', () => {
    const clean = read('clean.json');
    expect(upgradeRunDocument({ ...clean, pipelineVersion: '1.3.0' })).toEqual({ ...clean, pipelineVersion: '1.3.0' });
  });

  it('derives easing usage and the v1.2 stats on a v1.1 document', () => {
    const clean = read('clean.json');
    for (const e of clean.tokens.easing) delete e.usedBy;
    delete clean.stats.componentsPassing;
    delete clean.stats.previews;
    const doc = RunDocumentComplete.parse(upgradeRunDocument({ ...clean, pipelineVersion: '1.1.0' }));
    const quart = doc.tokens.easing.find((e) => e.name === 'ease-out-quart')!;
    expect(quart.usedBy.componentTypes.length + quart.usedBy.patternKinds.length).toBeGreaterThan(0);
    const counts = [...quart.usedBy.componentTypes.map((x) => x.count)];
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(doc.stats.componentsPassing!.applicable).toBeLessThanOrEqual(doc.components.length);
  });
});

describe('the 1.3 step (D-105, D-108, D-109)', () => {
  const v12 = read('clean-v1-2.json');

  it('brings the committed v1.2 document to the complete current shape with no fill read', () => {
    const doc = RunDocumentComplete.parse(upgradeRunDocument(v12));
    expect(doc.pipelineVersion).toBe('1.2.0');
    const previews = doc.components.flatMap((c) => [c.preview, ...c.variants.map((v) => v.preview)]);
    expect(previews.every((p) => p.fill === null)).toBe(true);
    expect(doc.components.flatMap((c) => c.instances).some((i) => 'hiddenAtCapture' in i)).toBe(false);
    expect(upgradeRunDocument(upgradeRunDocument(v12))).toEqual(upgradeRunDocument(v12));
  });

  it('turns a preview whose crop was never written into the no-crop form and recounts', () => {
    const src = structuredClone(v12);
    const c = src.components.find((x: { preview: { mode: string } }) => x.preview.mode === 'live');
    Object.assign(c.preview, { width: 0, height: 0 });
    const doc = RunDocumentComplete.parse(upgradeRunDocument(src));
    const p = doc.components.find((x) => x.id === c.id)!.preview;
    expect(p).toMatchObject({ mode: 'captured', capturedReason: 'no-crop' });
    expect(p.cropKey).toBeUndefined();
    expect(p.htmlKey).toBeUndefined();
    // Nothing in the document names the key that was never written.
    const upgraded = doc.components.find((x) => x.id === c.id)!;
    expect(upgraded.states.find((s) => s.state === 'default')!.cropKey).toBeUndefined();
    expect(JSON.stringify(upgraded)).not.toContain(c.preview.cropKey);
    expect(doc.stats.previews!['no-crop']).toBe(1);
    expect(doc.stats.previews!.live).toBe(v12.stats.previews.live - 1);
  });

  it('removes pattern references that resolve to nothing', () => {
    const src = structuredClone(v12);
    const [first] = src.motion.patterns;
    src.motion.patterns.push({ ...first, id: 'gone0000', componentId: 'nothere0' });
    const owner = src.components.find((x: { motion: unknown }) => x.motion);
    owner.motion.patternIds.push('missing0');
    const doc = RunDocumentComplete.parse(upgradeRunDocument(src));
    expect(doc.motion.patterns.find((p) => p.id === 'gone0000')!.componentId).toBeUndefined();
    expect(doc.components.find((x) => x.id === owner.id)!.motion!.patternIds).not.toContain('missing0');
  });
});
