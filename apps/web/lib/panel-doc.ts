import type { RunDocumentPartial } from '@dse/schema';

/** What the page sends the browser: the stored markdown exports are regenerated there on demand. */
export function clientDocument(doc: RunDocumentPartial): RunDocumentPartial {
  if (!doc.exports) return doc;
  return { ...doc, exports: { designSystemIntro: doc.exports.designSystemIntro } };
}

export type Neighbor = { id: string; group: string };

/** The panel's slice of a run: one component, the tokens and pages it refers to, and its neighbors. */
export function panelDocument(doc: RunDocumentPartial, componentId: string): RunDocumentPartial | null {
  const component = doc.components?.find((c) => c.id === componentId);
  if (!component) return null;
  return {
    id: doc.id,
    url: doc.url,
    host: doc.host,
    status: doc.status,
    createdAt: doc.createdAt,
    pipelineVersion: doc.pipelineVersion,
    viewports: doc.viewports,
    frameworkHint: doc.frameworkHint,
    pages: doc.pages,
    tokens: doc.tokens,
    drift: doc.drift ? { ...doc.drift, evidence: [], narrative: '' } : undefined,
    exports: doc.exports ? { designSystemIntro: doc.exports.designSystemIntro } : undefined,
    components: [component],
  } as RunDocumentPartial;
}
