// The matched CSS of an element (docs/specs/capture-and-states.md, step 6): its author rules in
// cascade order, its inline declarations and its pseudo-elements. Read from the page's CSSOM by
// `cssom-match.ts` (D-068). Previews are rebuilt from these.

export type Declaration = { name: string; value: string; important: boolean };
/** `layerRank`: the rule's cascade layer by its place in the page's layer order; absent when the rule is in no layer (D-098). */
/** `container`: the `@container` conditions the rule sat in, kept in the preview rather than flattened (D-098). */
export type MatchedRule = { selector: string; matched: string[]; origin: string; media: string[]; supports: string[]; declarations: Declaration[]; layerRank?: number; container?: string[] };
export type MatchedStyles = { rules: MatchedRule[]; inline: Declaration[]; pseudo: { pseudo: string; rules: MatchedRule[] }[] };
