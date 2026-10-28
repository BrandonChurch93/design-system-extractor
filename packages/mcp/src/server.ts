import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { passesAll, ComponentGroup, ComponentType, ExportSet, TokenKind, type RunDocumentPartial, type TokensJson } from '@dse/schema';
import { componentCss, exportTokens, generateExport, motionJson, tokensJson } from '@dse/pipeline/exports';

// The MCP server (docs/specs/exports-and-mcp.md): one run, read once, served over stdio. No network
// beyond the first fetch, nothing written to disk.

export const VERSION = '1.2.0';

const kindKeys: Record<TokenKind, (keyof TokensJson)[]> = {
  color: ['color'],
  type: ['type', 'font'],
  space: ['space'],
  radius: ['radius'],
  shadow: ['shadow'],
  breakpoint: ['breakpoints'],
  duration: ['duration'],
  easing: ['easing'],
};

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] });
const fail = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

export function createServer(doc: RunDocumentPartial, runUrl: string): McpServer {
  const server = new McpServer({ name: 'design-system-extractor', version: VERSION });
  const comps = doc.components ?? [];
  const find = (idOrName?: string) => comps.find((c) => c.id === idOrName || c.name.toLowerCase() === idOrName?.toLowerCase());
  // Code names the variables of the set get_tokens serves by default (D-083).
  const proposed = () => exportTokens(doc, 'proposed');

  server.registerTool(
    'get_tokens',
    { description: `The design tokens extracted from ${doc.host}, as tokens.json. The proposed clean set by default.`, inputSchema: { set: ExportSet.optional(), kind: TokenKind.optional() } },
    async ({ set, kind }) => {
      const all = tokensJson(doc, exportTokens(doc, set ?? 'proposed'));
      if (!kind) return json(all);
      return json({ $meta: all.$meta, ...Object.fromEntries(kindKeys[kind].map((k) => [k, all[k]])) });
    },
  );

  server.registerTool(
    'list_components',
    { description: 'The components found on the site, with their variant, state and check counts.', inputSchema: { group: ComponentGroup.optional(), type: ComponentType.optional() } },
    async ({ group, type }) =>
      json(
        comps
          .filter((c) => (!group || c.group === group) && (!type || c.type === type))
          .map((c) => {
            const applicable = c.checks.filter((r) => r.status !== 'na');
            return { id: c.id, name: c.name, type: c.type, group: c.group, tier: c.tier, variants: c.variants.length, states: c.states.filter((s) => s.captured).length, checksPassed: applicable.filter((r) => r.status === 'pass').length, checksApplicable: applicable.length, passedAll: passesAll(c.checks) };
          }),
      ),
  );

  server.registerTool(
    'get_component',
    { description: "One component's contract: variants, states with their style changes, tokens used, code, checks and where it was found.", inputSchema: { id: z.string().optional(), name: z.string().optional() } },
    async ({ id, name }) => {
      const c = find(id ?? name);
      if (!c) return fail(`No component ${id ?? name ?? ''}. list_components names them.`);
      return json({
        id: c.id,
        name: c.name,
        type: c.type,
        group: c.group,
        variants: c.variants.map((v) => ({ id: v.id, name: v.name, instances: v.instanceIds.length, delta: v.delta })),
        states: c.states.map((s) => ({ state: s.state, captured: s.captured, ...(s.reason ? { reason: s.reason } : {}), delta: s.delta })),
        tokensUsed: c.tokensUsed,
        unmapped: c.unmapped,
        code: { ...c.code, css: componentCss(c, proposed()) },
        motion: c.motion,
        checks: c.checks,
        provenance: c.provenance,
      });
    },
  );

  server.registerTool(
    'get_checks',
    { description: 'The automated check summary for the run, or one component’s results. The measurable subset of WCAG 2.2, not an audit.', inputSchema: { componentId: z.string().optional() } },
    async ({ componentId }) => {
      if (!componentId) return json(doc.checks ?? null);
      const c = find(componentId);
      return c ? json({ id: c.id, name: c.name, checks: c.checks }) : fail(`No component ${componentId}.`);
    },
  );

  server.registerTool('get_drift', { description: 'Where the system leaks: numbers, the proposed clean set, evidence and the narrative.', inputSchema: {} }, async () => {
    const d = doc.drift;
    return d ? json({ headline: d.headline, numbers: d.numbers, proposal: d.proposal, variantCollapses: d.variantCollapses, evidence: d.evidence, findingCount: d.findingCount, narrative: d.narrative }) : fail('This run has no drift report.');
  });

  server.registerTool(
    'get_prompt',
    { description: 'prompt.md: the system, or one component, as instructions for building matching interface.', inputSchema: { componentId: z.string().optional() } },
    async ({ componentId }) => {
      if (!componentId) return text(generateExport(doc, 'prompt.md', { runUrl }).body);
      const c = find(componentId);
      return c ? text(generateExport(doc, 'component-prompt.md', { runUrl, componentId: c.id }).body) : fail(`No component ${componentId}.`);
    },
  );

  server.registerTool(
    'get_motion',
    { description: "The run's motion: durations, easings, keyframes and the observed and declared patterns; or one component's transitions, animations and patterns.", inputSchema: { componentId: z.string().optional() } },
    async ({ componentId }) => {
      const all = motionJson(doc, proposed());
      if (!componentId) return json(all);
      const c = find(componentId);
      if (!c) return fail(`No component ${componentId}.`);
      return json({ id: c.id, name: c.name, slug: c.slug, motion: c.motion, patterns: all.patterns.filter((p) => c.motion?.patternIds.includes(p.id)) });
    },
  );

  server.registerResource('design-system.md', `dse://run/${doc.id}/design-system.md`, { title: `${doc.host} design system`, mimeType: 'text/markdown' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/markdown', text: generateExport(doc, 'design-system.md', { runUrl }).body }],
  }));
  server.registerResource('tokens.css', `dse://run/${doc.id}/tokens.css`, { title: `${doc.host} tokens`, mimeType: 'text/css' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/css', text: generateExport(doc, 'tokens.css', { runUrl }).body }],
  }));
  server.registerResource('motion.css', `dse://run/${doc.id}/motion.css`, { title: `${doc.host} motion`, mimeType: 'text/css' }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/css', text: generateExport(doc, 'motion.css', { runUrl }).body }],
  }));
  return server;
}
