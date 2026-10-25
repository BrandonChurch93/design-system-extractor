import type { CDPSession } from 'playwright';

// Matched CSS rules per element through CDP CSS.getMatchedStylesForNode
// (docs/specs/capture-and-states.md, step 7). Previews are rebuilt from these.

export type Declaration = { name: string; value: string; important: boolean };
export type MatchedRule = { selector: string; matched: string[]; origin: string; media: string[]; supports: string[]; declarations: Declaration[] };
export type MatchedStyles = { rules: MatchedRule[]; inline: Declaration[]; pseudo: { pseudo: string; rules: MatchedRule[] }[] };

type CdpProperty = { name: string; value: string; important?: boolean; disabled?: boolean; parsedOk?: boolean; range?: unknown; implicit?: boolean };
type CdpRule = {
  selectorList: { text: string; selectors: { text: string }[] };
  origin: string;
  style: { cssProperties: CdpProperty[] };
  media?: { text: string }[];
  supports?: { text: string }[];
};
type CdpRuleMatch = { rule: CdpRule; matchingSelectors: number[] };

function declarations(props: CdpProperty[]): Declaration[] {
  return props.filter((p) => p.range !== undefined && p.parsedOk !== false && !p.disabled).map((p) => ({ name: p.name, value: p.value, important: Boolean(p.important) }));
}

function rule(m: CdpRuleMatch): MatchedRule {
  return {
    selector: m.rule.selectorList.text,
    matched: m.matchingSelectors.map((i) => m.rule.selectorList.selectors[i]?.text ?? '').filter(Boolean),
    origin: m.rule.origin,
    media: (m.rule.media ?? []).map((x) => x.text),
    supports: (m.rule.supports ?? []).map((x) => x.text),
    declarations: declarations(m.rule.style.cssProperties),
  };
}

export async function openCssSession(session: CDPSession): Promise<number> {
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = (await session.send('DOM.getDocument', { depth: 0 })) as { root: { nodeId: number } };
  return root.nodeId;
}

/** Matched rules (author origins only, cascade order) for each data-dse-id. */
export async function matchedCss(session: CDPSession, rootId: number, dseIds: string[]): Promise<Record<string, MatchedStyles>> {
  const out: Record<string, MatchedStyles> = {};
  for (const d of dseIds) {
    try {
      const { nodeId } = (await session.send('DOM.querySelector', { nodeId: rootId, selector: `[data-dse-id="${d}"]` })) as { nodeId: number };
      if (!nodeId) continue;
      const res = (await session.send('CSS.getMatchedStylesForNode', { nodeId })) as {
        matchedCSSRules?: CdpRuleMatch[];
        inlineStyle?: { cssProperties: CdpProperty[] };
        pseudoElements?: { pseudoType: string; matches: CdpRuleMatch[] }[];
      };
      const author = (m: CdpRuleMatch) => m.rule.origin !== 'user-agent';
      out[d] = {
        rules: (res.matchedCSSRules ?? []).filter(author).map(rule),
        inline: declarations(res.inlineStyle?.cssProperties ?? []),
        pseudo: (res.pseudoElements ?? [])
          .filter((p) => ['before', 'after', 'placeholder', 'marker'].includes(p.pseudoType))
          .map((p) => ({ pseudo: p.pseudoType, rules: p.matches.filter(author).map(rule) }))
          .filter((p) => p.rules.length),
      };
    } catch {
      // the node left the document between the snapshot and this call
    }
  }
  return out;
}
